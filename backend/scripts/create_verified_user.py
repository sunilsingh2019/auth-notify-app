#!/usr/bin/env python3
"""
Script to create a test user in the database that is already verified.
Run this script from the backend container with: python /app/scripts/create_verified_user.py [email]
"""

import asyncio
import sys
import os
import random

# Add parent directory to path for imports
sys.path.insert(0, "/app")

from apps.users.models import users
from apps.users.crud import create_user, get_user_by_email
from apps.notifications.websocket import broadcast_new_user
from config.database import database

# Test user credentials - can be overridden by command line arg
DEFAULT_EMAIL = "verified@example.com"
TEST_PASSWORD = "password123"

async def create_verified_user(email=None, password=None):
    """Create a test user in the database if it doesn't exist, with verification already complete."""
    try:
        # Use provided email or default
        test_email = email or DEFAULT_EMAIL
        test_password = password or TEST_PASSWORD

        # If no email provided as arg but command line arg exists, use that
        if not email and len(sys.argv) > 1:
            test_email = sys.argv[1]
            
        # Generate random email if "random" is specified
        if test_email == "random":
            test_email = f"verified{random.randint(1000, 9999)}@example.com"
            
        print(f"Attempting to create verified test user with email: {test_email}")
            
        # Connect to the database
        await database.connect()
        
        # Check if user already exists
        user = await get_user_by_email(test_email)
        
        if user:
            print(f"✅ Test user already exists: {test_email}")
            
            # If user exists but is not verified, update it to be verified
            if not user["is_verified"]:
                update_query = users.update().where(users.c.id == user["id"]).values(
                    is_verified=True,
                    verification_token=None,
                    verification_token_expires=None
                )
                await database.execute(update_query)
                print(f"✅ Updated user to verified status: {test_email}")
            return
        
        # Create the test user with is_verified=True
        user = await create_user(test_email, test_password, is_verified=True)
        
        # Broadcast notification for the new user
        print(f"Broadcasting notification for new verified user: {test_email}")
        try:
            await broadcast_new_user(test_email)
            print("✅ Notification broadcast successfully")
        except Exception as e:
            print(f"❌ Error broadcasting notification: {e}")
        
        print(f"✅ Successfully created verified test user: {test_email}")
        print(f"Password: {test_password}")
        print("This user is already verified and can log in immediately.")
        
    except Exception as e:
        print(f"❌ Error creating verified test user: {e}")
    finally:
        # Close the database connection
        await database.disconnect()

if __name__ == "__main__":
    # Run the async function
    asyncio.run(create_verified_user()) 