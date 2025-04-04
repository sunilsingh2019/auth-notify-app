#!/usr/bin/env python3
"""
Script to drop all tables from the database.
Run this script from the backend container with: python /app/scripts/drop_all_tables.py
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

async def drop_all_tables():
    """Drop all tables from the database."""
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
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
        tables = cursor.fetchall()
        
        if not tables:
            logger.info("No tables found in the database.")
            conn.close()
            return
        
        # Drop each table
        logger.info(f"Found {len(tables)} tables to drop")
        
        # Disable foreign key constraints
        cursor.execute("PRAGMA foreign_keys = OFF;")
        
        for table in tables:
            table_name = table[0]
            logger.info(f"Dropping table: {table_name}")
            cursor.execute(f"DROP TABLE IF EXISTS {table_name};")
        
        # Commit the changes
        conn.commit()
        logger.info("✅ Successfully dropped all tables")
        
        # Close the connection
        conn.close()
        
    except Exception as e:
        logger.error(f"❌ Error dropping tables: {e}")

if __name__ == "__main__":
    # Run the async function
    asyncio.run(drop_all_tables()) 