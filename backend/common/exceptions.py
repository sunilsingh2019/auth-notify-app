from fastapi import HTTPException, status

# Define common exceptions
AuthenticationException = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

PermissionDeniedException = HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="Permission denied",
)

NotFoundException = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Resource not found",
)
