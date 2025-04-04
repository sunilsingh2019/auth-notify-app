#!/usr/bin/env python3
"""
Script to delete all users from the database.
Run this script from the backend container with: python /app/scripts/delete_all_users.py
"""

import asyncio
import sys
import sqlalchemy

# Add parent directory to path for imports
sys.path.insert(0, "/app")

from apps.users.models import users
from config.database import database

async def delete_all_users():
    """Delete all users from the database."""
    try:
        # Connect to the database
        await database.connect()
        
        # Get count of users before deletion
        count_query = "SELECT COUNT(*) FROM users"
        user_count = await database.fetch_val(count_query)
        print(f"Found {user_count} users in the database.")
        
        # Delete all users
        delete_query = "DELETE FROM users"
        await database.execute(delete_query)
        
        print(f"✅ Successfully deleted {user_count} users from the database.")
        
    except Exception as e:
        print(f"❌ Error deleting users: {e}")
    finally:
        # Close the database connection
        await database.disconnect()

if __name__ == "__main__":
    # Run the async function
    asyncio.run(delete_all_users()) 