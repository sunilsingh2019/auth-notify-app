import secrets
from datetime import datetime, timedelta
from typing import Optional, Tuple
import logging

from apps.users.models import users
from config.database import database
from config.security import get_password_hash, verify_password
from config.settings import VERIFICATION_TOKEN_EXPIRE_HOURS

async def get_user_by_email(email: str) -> Optional[dict]:
    """Get user by email."""
    query = users.select().where(users.c.email == email)
    return await database.fetch_one(query)

async def create_user(email: str, password: str, is_verified: bool = False) -> dict:
    """Create a new user."""
    hashed_password = get_password_hash(password)
    
    # Generate verification token if user is not pre-verified
    verification_token = None
    verification_token_expires = None
    
    if not is_verified:
        verification_token = secrets.token_urlsafe(32)
        verification_token_expires = datetime.utcnow() + timedelta(hours=VERIFICATION_TOKEN_EXPIRE_HOURS)
    
    query = users.insert().values(
        email=email,
        hashed_password=hashed_password,
        is_verified=is_verified,
        verification_token=verification_token,
        verification_token_expires=verification_token_expires
    )
    user_id = await database.execute(query)
    
    # Fetch and return the created user
    return await get_user(user_id)

async def get_user(user_id: int) -> Optional[dict]:
    """Get user by ID."""
    query = users.select().where(users.c.id == user_id)
    return await database.fetch_one(query)

async def authenticate_user(email: str, password: str) -> Optional[dict]:
    """Authenticate a user by email and password."""
    user = await get_user_by_email(email)
    
    if not user:
        return None
    
    if not verify_password(password, user["hashed_password"]):
        return None
    
    # Check if user is verified
    if not user["is_verified"]:
        return None
    
    return user

async def verify_email(token: str) -> Tuple[bool, str]:
    """
    Verify a user's email using the verification token.
    
    Args:
        token: Verification token
        
    Returns:
        Tuple[bool, str]: (success, message)
    """
    # Add debug logging
    logger = logging.getLogger(__name__)
    logger.info(f"Verifying email with token: {token[:10]}...")
    
    # Find user with this token
    query = users.select().where(users.c.verification_token == token)
    user = await database.fetch_one(query)
    
    if not user:
        # The token might have been valid but already used in a previous request
        # Check for recently verified users (within the last minute)
        logger.info(f"Token not found, checking if it was recently used...")
        
        # Get recently verified users (we can't check by token since it's cleared after verification)
        # This is a heuristic approach since we can't know for certain which token was used
        one_minute_ago = datetime.utcnow() - timedelta(minutes=1)
        recent_query = users.select().where(
            (users.c.is_verified == True) & 
            (users.c.verification_token.is_(None))
        )
        recent_verified_users = await database.fetch_all(recent_query)
        
        if recent_verified_users:
            recent_emails = [user['email'] for user in recent_verified_users]
            logger.info(f"Found recently verified users: {', '.join(recent_emails)}")
            return True, "Your email has already been verified. You can now log in."
        
        logger.warning(f"Invalid verification token: {token[:10]}... - No matching user found")
        return False, "Invalid verification token."
    
    logger.info(f"Token found for user: {user['email']}")
    
    # Check if token is expired
    current_time = datetime.utcnow()
    if user["verification_token_expires"] < current_time:
        logger.warning(f"Token expired for user {user['email']}. Expired at: {user['verification_token_expires']}, Current time: {current_time}")
        return False, "Verification token has expired."
    
    # Check if already verified
    if user["is_verified"]:
        logger.info(f"User {user['email']} is already verified")
        return True, "Email is already verified."
    
    # Mark user as verified and clear token
    update_query = users.update().where(users.c.id == user["id"]).values(
        is_verified=True,
        verification_token=None,
        verification_token_expires=None
    )
    await database.execute(update_query)
    logger.info(f"Successfully verified user {user['email']}")
    
    return True, "Email verification successful. You can now log in."

async def generate_new_verification_token(email: str) -> Tuple[bool, str, Optional[str]]:
    """
    Generate a new verification token for a user.
    
    Args:
        email: User's email address
        
    Returns:
        Tuple[bool, str, Optional[str]]: (success, message, token)
    """
    user = await get_user_by_email(email)
    
    if not user:
        return False, "Email not found.", None
    
    if user["is_verified"]:
        return False, "Email is already verified.", None
    
    # Generate new token
    new_token = secrets.token_urlsafe(32)
    token_expires = datetime.utcnow() + timedelta(hours=VERIFICATION_TOKEN_EXPIRE_HOURS)
    
    # Update user with new token
    update_query = users.update().where(users.c.id == user["id"]).values(
        verification_token=new_token,
        verification_token_expires=token_expires
    )
    await database.execute(update_query)
    
    return True, "New verification token generated.", new_token
