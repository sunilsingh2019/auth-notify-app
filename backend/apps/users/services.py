from datetime import timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from apps.users import crud
from apps.users.schemas import TokenPayload, User
from config.security import create_access_token
from config.settings import SECRET_KEY, JWT_ALGORITHM

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Get current user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        
        if user_id is None:
            raise credentials_exception
        
        token_data = TokenPayload(sub=user_id)
    except JWTError:
        raise credentials_exception
    
    # Get user from database
    user = await crud.get_user(int(token_data.sub))
    
    if user is None:
        raise credentials_exception
    
    return user

async def create_user_token(user_id: int, expires_delta: Optional[timedelta] = None) -> str:
    """Create access token for user."""
    return create_access_token(
        data={"sub": str(user_id)},
        expires_delta=expires_delta
    )
