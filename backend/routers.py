from fastapi import APIRouter

from apps.notifications.routes import router as notification_router
from apps.users.routes import router as user_router

# Create main API router
api_router = APIRouter()

# Include all application routers
api_router.include_router(user_router, prefix="/api")
api_router.include_router(notification_router, prefix="/api/notifications")
