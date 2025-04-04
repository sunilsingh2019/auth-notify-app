#!/usr/bin/env python3
"""
Script to register a test user through the API to test notifications.
Run this script from the backend container with: python /app/scripts/test_notification.py [email]
"""

import asyncio
import sys
import random
import aiohttp
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# API URL - use backend service name in docker network
API_URL = "http://localhost:8000"

async def register_user_via_api(email=None, password="password123"):
    """Register a user through the API to trigger notification broadcasting."""
    try:
        # Generate random email if not provided
        if not email:
            if len(sys.argv) > 1:
                email = sys.argv[1]
            else:
                email = f"test{random.randint(1000, 9999)}@example.com"
        
        # Generate random email if "random" is specified
        if email == "random":
            email = f"test{random.randint(1000, 9999)}@example.com"
            
        logger.info(f"Registering user via API: {email}")
        
        # Prepare request data
        data = {
            "email": email,
            "password": password
        }
        
        logger.info(f"Using API endpoint: {API_URL}/api/auth/register")
        logger.info(f"Request data: {data}")
        
        # Make API request
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{API_URL}/api/auth/register", json=data) as response:
                status = response.status
                result = await response.text()
                
                try:
                    result_json = json.loads(result)
                except:
                    result_json = {"raw_text": result}
                
                if status == 201:
                    logger.info(f"✅ Successfully registered user via API: {email}")
                    logger.info(f"Response data: {result_json}")
                    logger.info(f"This should have triggered a notification broadcast.")
                else:
                    logger.error(f"❌ Failed to register user. Status: {status}")
                    logger.error(f"Error: {result_json}")
                
    except Exception as e:
        logger.error(f"❌ Error registering user via API: {e}")

if __name__ == "__main__":
    # Run the async function
    asyncio.run(register_user_via_api()) 