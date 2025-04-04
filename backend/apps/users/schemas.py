from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

# Base User Schema
class UserBase(BaseModel):
    email: EmailStr = Field(..., description="User's email address, must be a valid email format")

# User Creation Schema
class UserCreate(UserBase):
    password: str = Field(
        ..., 
        min_length=8,
        description="User's password, must be at least 8 characters long"
    )

# User Return Schema
class User(UserBase):
    id: int = Field(..., description="Unique user identifier")
    created_at: datetime = Field(..., description="Timestamp when the user was created")
    is_verified: bool = Field(default=False, description="Whether the user's email has been verified")
    
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": 1,
                "email": "user@example.com",
                "created_at": "2023-06-01T12:00:00",
                "is_verified": False
            }
        }
    }

# Token Schema
class Token(BaseModel):
    access_token: str = Field(..., description="JWT access token for authentication")
    token_type: str = Field(..., description="Type of token, always 'bearer'")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer"
            }
        }
    }

# Token Payload Schema
class TokenPayload(BaseModel):
    sub: Optional[str] = Field(None, description="Subject identifier, usually the user ID")

# Login Schema
class UserLogin(BaseModel):
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., description="User's password")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "user@example.com",
                "password": "password123"
            }
        }
    }

# Verification Response Schema
class VerificationResponse(BaseModel):
    message: str = Field(..., description="Verification status message")
    success: bool = Field(..., description="Whether the verification was successful")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "message": "Email verification successful. You can now log in.",
                "success": True
            }
        }
    }
