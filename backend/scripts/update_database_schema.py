#!/usr/bin/env python3
"""
Script to update the database schema to add verification fields to the users table.
Run this script from the backend container with: python /app/scripts/update_database_schema.py
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

from config.database import database
from config.settings import DATABASE_URL

async def update_database_schema():
    """Add verification fields to users table."""
    try:
        logger.info("Connecting to database...")
        
        # Get the SQLite file path from DATABASE_URL
        if DATABASE_URL.startswith('sqlite:///'):
            db_path = DATABASE_URL.replace('sqlite:///', '')
            logger.info(f"Using SQLite database at {db_path}")
        else:
            raise ValueError(f"Unsupported database type: {DATABASE_URL}")
        
        # Connect directly to SQLite for schema changes
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        logger.info("Checking if is_verified column exists...")
        cursor.execute("PRAGMA table_info(users)")
        columns = cursor.fetchall()
        column_names = [column[1] for column in columns]
        
        if 'is_verified' in column_names:
            logger.info("Verification columns already exist, skipping")
            conn.close()
            return
        
        logger.info("Adding verification columns to users table...")
        
        # Add the verification columns using SQLite syntax
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0")
            cursor.execute("ALTER TABLE users ADD COLUMN verification_token TEXT")
            cursor.execute("ALTER TABLE users ADD COLUMN verification_token_expires TIMESTAMP")
            
            # Commit the changes
            conn.commit()
            logger.info("✅ Successfully updated database schema")
        except sqlite3.Error as e:
            logger.error(f"SQLite error: {e}")
            conn.rollback()
        
        # Close the connection
        conn.close()
        
    except Exception as e:
        logger.error(f"❌ Error updating database schema: {e}")

if __name__ == "__main__":
    # Run the async function
    asyncio.run(update_database_schema()) 