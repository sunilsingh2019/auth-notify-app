import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(os.path.join(BASE_DIR, ".env"))

# Environment settings
DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")

# Security settings
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Database settings
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./auth_notify.db")

# CORS settings
ORIGINS = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://frontend:5173",
]

# Email settings
EMAIL_ENABLED = os.getenv("EMAIL_ENABLED", "False").lower() in ("true", "1", "t")
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USERNAME = os.getenv("EMAIL_USERNAME", "")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "noreply@example.com")
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "Auth Notify App")

# Frontend URL for email verification
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Token expiration settings
VERIFICATION_TOKEN_EXPIRE_HOURS = 24
