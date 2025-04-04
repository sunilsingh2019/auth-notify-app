#!/usr/bin/env python3
"""
Script to clear all users from the database.
Run this script from the backend container with: python /app/scripts/clear_users.py
"""

import asyncio
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, "/app")

from apps.users.models import users
from config.database import database

async def clear_users():
    """Delete all users from the database."""
    try:
        # Connect to the database
        await database.connect()
        
        # Delete all users
        delete_query = users.delete()
        result = await database.execute(delete_query)
        
        print(f"✅ Successfully cleared all users from the database.")
        print(f"Deleted rows: {result if result is not None else 'unknown'}")
        
    except Exception as e:
        print(f"❌ Error clearing users: {e}")
    finally:
        # Close the database connection
        await database.disconnect()

if __name__ == "__main__":
    # Run the async function
    asyncio.run(clear_users()) 