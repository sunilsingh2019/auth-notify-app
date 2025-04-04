import json
import logging
from typing import Dict, List

from fastapi import WebSocket, WebSocketDisconnect

from apps.notifications.schemas import Notification

# Set up logging
logger = logging.getLogger(__name__)

# Connected WebSocket clients
connected_clients: List[WebSocket] = []

class ConnectionManager:
    """WebSocket connection manager."""
    
    async def connect(self, websocket: WebSocket):
        """Connect a new client."""
        logger.info(f"New WebSocket client connected. Total clients: {len(connected_clients) + 1}")
        await websocket.accept()
        connected_clients.append(websocket)
    
    async def disconnect(self, websocket: WebSocket):
        """Disconnect a client."""
        if websocket in connected_clients:
            connected_clients.remove(websocket)
            logger.info(f"WebSocket client disconnected. Remaining clients: {len(connected_clients)}")
    
    async def broadcast(self, notification: Notification):
        """Broadcast a message to all connected clients."""
        logger.info(f"Broadcasting notification to {len(connected_clients)} clients: {notification.dict()}")
        
        if not connected_clients:
            logger.warning("No connected clients to broadcast to!")
            return
            
        for client in connected_clients:
            try:
                data = notification.dict()
                logger.info(f"Sending notification data to client: {data}")
                await client.send_json(data)
                logger.info("Successfully sent notification to client")
            except Exception as e:
                logger.error(f"Error broadcasting to client: {str(e)}")
                # Remove client if sending fails
                await self.disconnect(client)

# Create connection manager instance
manager = ConnectionManager()

async def broadcast_new_user(email: str):
    """Broadcast a notification about a new user."""
    logger.info(f"========== BROADCAST NEW USER ==========")
    logger.info(f"Broadcasting new user notification for email: {email}")
    logger.info(f"Current number of connected WebSocket clients: {len(connected_clients)}")
    
    # Debug: print client details
    if connected_clients:
        for i, client in enumerate(connected_clients):
            logger.info(f"Connected client {i+1}: {client}")
    else:
        logger.warning("No WebSocket clients are currently connected!")
    
    notification = Notification(
        type="NEW_USER",
        message="A new user has registered",
        data={"email": email}
    )
    
    logger.info(f"Created notification object: {notification.dict()}")
    await manager.broadcast(notification)
    logger.info("Broadcast operation completed")
    logger.info(f"========== END BROADCAST ==========")
