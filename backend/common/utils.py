from typing import Any, Dict

def format_response(data: Any = None, message: str = "", success: bool = True) -> Dict:
    """Format a standard API response."""
    return {
        "success": success,
        "message": message,
        "data": data,
    }
