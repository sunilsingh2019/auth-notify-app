from fastapi import APIRouter

from apps.users.views import router as user_router

# Create a router for user routes
router = APIRouter()

# Include user endpoints
router.include_router(user_router, prefix="/auth", tags=["auth"])
