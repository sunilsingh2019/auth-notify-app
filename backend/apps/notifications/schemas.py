from pydantic import BaseModel, Field
from typing import Dict, Any

class Notification(BaseModel):
    """Notification schema for sending real-time notifications."""
    type: str = Field(..., description="Type of notification, e.g., 'NEW_USER'")
    message: str = Field(..., description="Human-readable notification message")
    data: Dict[str, Any] = Field(..., description="Additional notification data")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "type": "NEW_USER",
                "message": "A new user has registered",
                "data": {
                    "email": "user@example.com"
                }
            }
        }
    }
