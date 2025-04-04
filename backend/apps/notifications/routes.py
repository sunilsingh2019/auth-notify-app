from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, HTTPException, status
from jose import jwt, JWTError

from apps.notifications.websocket import manager
from config.settings import SECRET_KEY, JWT_ALGORITHM
from apps.users import crud

# Create a router for notification routes
router = APIRouter()

@router.websocket(
    "/ws",
    name="notifications_websocket",
)
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(None)
):
    """
    WebSocket endpoint for real-time notifications.
    
    Connect to this endpoint to receive real-time notifications about new user registrations.
    The notifications are sent to all connected clients.
    
    Example notification format:
    ```json
    {
        "type": "NEW_USER",
        "message": "A new user has registered",
        "data": {
            "email": "user@example.com"
        }
    }
    ```
    
    To connect, use the WebSocket protocol: `ws://localhost:8000/api/notifications/ws?token=your_jwt_token`
    """
    # Validate the token
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Missing authentication token")
        return
    
    try:
        # Decode JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        
        if not user_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token payload")
            return
        
        # Optionally verify user exists in database
        # Note: Skip DB check for performance if not needed
        # user = await crud.get_user(int(user_id))
        # if not user:
        #     await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="User not found")
        #     return
        
    except JWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid authentication token")
        return
        
    # Connect the authenticated client
    await manager.connect(websocket)
    
    try:
        while True:
            # Wait for any messages (client ping)
            await websocket.receive_text()
    except WebSocketDisconnect:
        # Disconnect the client when websocket is closed
        await manager.disconnect(websocket)
