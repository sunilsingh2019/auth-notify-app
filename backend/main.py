from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from config.database import database, create_tables
from config.settings import ORIGINS
from routers import api_router

# Create FastAPI application with enhanced documentation
app = FastAPI(
    title="Auth Notification App API",
    description="""
    API for Authentication and Real-time Notifications.
    
    ## Features
    
    * **User Authentication** - Register, login, and retrieve user information.
    * **Real-time Notifications** - WebSocket-based notifications when users register.
    
    ## Authentication
    
    JWT-based authentication is used. To access protected endpoints:
    1. Log in using the `/api/auth/login` endpoint
    2. Use the returned token in the Authorization header: `Bearer {token}`
    """,
    version="1.0.0",
    openapi_tags=[
        {
            "name": "auth",
            "description": "Authentication operations including register, login, and user info",
        },
        {
            "name": "notifications",
            "description": "Real-time notification endpoints using WebSockets",
        },
    ],
    contact={
        "name": "API Support",
        "email": "support@example.com",
    },
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router)

# Create database tables on startup
create_tables()

@app.on_event("startup")
async def startup():
    """Connect to database on application startup."""
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    """Disconnect from database on application shutdown."""
    await database.disconnect()

@app.get("/", tags=["status"])
async def root():
    """Redirect to the API documentation."""
    return RedirectResponse(url="/docs")
