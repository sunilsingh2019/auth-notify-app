#!/usr/bin/env python3
"""
Script to test the WebSocket connection and broadcast a notification.
Run this script from the backend container with: python /app/scripts/test_websocket.py
"""

import asyncio
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, "/app")

from apps.notifications.websocket import manager, connected_clients
from apps.notifications.schemas import Notification

async def test_websocket_broadcast():
    """Test websocket broadcast functionality."""
    try:
        print(f"Current number of connected clients: {len(connected_clients)}")
        
        for i, client in enumerate(connected_clients):
            print(f"Client {i+1}: {client}")
        
        # Create a test notification
        notification = Notification(
            type="TEST",
            message="This is a test notification",
            data={"timestamp": "now", "test": True}
        )
        
        # Broadcast the notification
        print(f"Broadcasting test notification: {notification.dict()}")
        await manager.broadcast(notification)
        print("✅ Test notification broadcast attempted")
        
    except Exception as e:
        print(f"❌ Error during test: {e}")

if __name__ == "__main__":
    # Run the async function
    asyncio.run(test_websocket_broadcast()) 