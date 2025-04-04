#!/usr/bin/env python3
"""
Script to delete all users from the database.
Run this script from the backend container with: python /app/scripts/delete_all_users.py
"""

import asyncio
import sys
import os
import logging
import sqlite3

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add parent directory to path for imports
sys.path.insert(0, "/app")

from config.settings import DATABASE_URL

async def delete_all_users():
    """Delete all users from the database."""
    try:
        logger.info("Connecting to database...")
        
        # Get the SQLite file path from DATABASE_URL
        if DATABASE_URL.startswith('sqlite:///'):
            db_path = DATABASE_URL.replace('sqlite:///', '')
            logger.info(f"Using SQLite database at {db_path}")
        else:
            raise ValueError(f"Unsupported database type: {DATABASE_URL}")
        
        # Connect directly to SQLite
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if users table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users';")
        table_exists = cursor.fetchone()
        
        if not table_exists:
            logger.info("Users table does not exist, nothing to delete")
            conn.close()
            return
        
        # Get count of users before deletion
        cursor.execute("SELECT COUNT(*) FROM users")
        count = cursor.fetchone()[0]
        logger.info(f"Found {count} users in the database")
        
        # Delete all users
        if count > 0:
            logger.info("Deleting all users...")
            cursor.execute("DELETE FROM users")
            conn.commit()
            logger.info(f"✅ Successfully deleted {count} users from the database")
        else:
            logger.info("No users to delete")
        
        # Close the connection
        conn.close()
        
    except Exception as e:
        logger.error(f"❌ Error deleting users: {e}")

if __name__ == "__main__":
    # Run the async function
    asyncio.run(delete_all_users()) 