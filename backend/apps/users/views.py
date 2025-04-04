import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordRequestForm

from apps.notifications.websocket import broadcast_new_user
from apps.users import crud, schemas, services
from config.database import database
from services.email import send_verification_email

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post(
    "/register", 
    response_model=schemas.User, 
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="""
    Register a new user with email and password. 
    
    - The email must be a valid email format.
    - The password must be at least 8 characters long.
    - An email verification link will be sent to the provided email.
    - When a user is registered, a notification is sent to all connected users.
    """
)
async def register_user(user_data: schemas.UserCreate):
    """Register a new user."""
    logger.info(f"Registration request received for email: {user_data.email}")
    
    # Check if user already exists
    db_user = await crud.get_user_by_email(user_data.email)
    if db_user:
        logger.warning(f"Registration failed - email already registered: {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user (not verified)
    logger.info(f"Creating new user with email: {user_data.email}")
    user = await crud.create_user(user_data.email, user_data.password, is_verified=False)
    logger.info(f"User created successfully: {user['email']} (ID: {user['id']})")
    
    # Send verification email
    if user["verification_token"]:
        logger.info(f"Sending verification email to: {user['email']}")
        email_sent = await send_verification_email(user["email"], user["verification_token"])
        if email_sent:
            logger.info(f"Verification email sent successfully to: {user['email']}")
        else:
            logger.warning(f"Failed to send verification email to: {user['email']}")
    
    # Broadcast new user notification to all connected clients
    logger.info(f"Broadcasting new user notification for: {user['email']}")
    try:
        await broadcast_new_user(user["email"])
        logger.info("Notification broadcast completed successfully")
    except Exception as e:
        logger.error(f"Error broadcasting notification: {str(e)}")
    
    return user

@router.post(
    "/login", 
    response_model=schemas.Token,
    summary="Login and obtain access token",
    description="""
    Login with email and password to receive an access token.
    
    - Use the email as the username field in the form.
    - The email must be verified before login is allowed.
    - The returned token should be used in the Authorization header for protected endpoints.
    - Format: `Bearer {token}`
    """
)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login user and get access token."""
    # Authenticate user
    user = await crud.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password, or email not verified",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = await services.create_user_token(user["id"])
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get(
    "/me", 
    response_model=schemas.User,
    summary="Get current user information",
    description="""
    Retrieve information about the currently authenticated user.
    
    - Requires authentication via Bearer token.
    - Returns user details excluding the password.
    """
)
async def get_user_me(current_user: dict = Depends(services.get_current_user)):
    """Get current authenticated user."""
    return current_user

@router.get(
    "/verify-email", 
    response_model=schemas.VerificationResponse,
    summary="Verify email address",
    description="""
    Verify a user's email address using the token sent via email.
    
    - The token must be valid and not expired.
    - Once verified, the user can log in.
    """
)
async def verify_email(token: str = Query(..., description="Email verification token")):
    """Verify email address using token."""
    logger.info(f"Email verification request received for token: {token[:10]}...")
    
    success, message = await crud.verify_email(token)
    
    if not success:
        logger.warning(f"Email verification failed: {message}")
        return {"success": False, "message": message}
    
    logger.info(f"Email verification successful: {message}")
    return {"success": True, "message": message}

@router.post(
    "/resend-verification", 
    response_model=schemas.VerificationResponse,
    summary="Resend verification email",
    description="""
    Resend verification email to the user.
    
    - A new verification token will be generated.
    - The email must exist and not be already verified.
    """
)
async def resend_verification(email_data: schemas.UserBase):
    """Resend verification email."""
    logger.info(f"Resend verification request received for email: {email_data.email}")
    
    success, message, token = await crud.generate_new_verification_token(email_data.email)
    
    if not success:
        logger.warning(f"Resend verification failed: {message}")
        return {"success": False, "message": message}
    
    # Send verification email
    if token:
        logger.info(f"Sending verification email to: {email_data.email}")
        email_sent = await send_verification_email(email_data.email, token)
        if email_sent:
            logger.info(f"Verification email resent successfully to: {email_data.email}")
            return {"success": True, "message": "Verification email sent successfully."}
        else:
            logger.warning(f"Failed to resend verification email to: {email_data.email}")
            return {"success": False, "message": "Failed to send verification email. Please try again later."}
    
    return {"success": False, "message": "Failed to generate verification token."}
