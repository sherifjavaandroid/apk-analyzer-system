# backend/ai-service/app/core/security.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt.exceptions import PyJWTError
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from app.core.config import settings
from app.api.models import User

security = HTTPBearer()

def verify_token(token: str) -> Dict[str, Any]:
    """
    Verify and decode a JWT token.

    Args:
        token: JWT token string

    Returns:
        Decoded token payload

    Raises:
        HTTPException: If token is invalid
    """
    try:
        # The secret key should match the one used by the API Gateway
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload
    except PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """
    Get the current user from JWT token.

    Args:
        credentials: HTTP credentials containing the token

    Returns:
        User object

    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials
    payload = verify_token(token)

    # Extract user ID from token
    user_id = payload.get("sub") or payload.get("user_id") or payload.get("userId")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # In a real application, you would look up the user in a database
    # For this example, we'll create a dummy user based on the token
    username = payload.get("username", "user")
    email = payload.get("email", f"{user_id}@example.com")
    role = payload.get("role", "user")
    full_name = payload.get("full_name")

    user = User(
        id=user_id,
        username=username,
        email=email,
        role=role,
        full_name=full_name
    )

    return user

def verify_admin(user: User = Depends(get_current_user)) -> User:
    """
    Verify that the current user is an admin.

    Args:
        user: Current user

    Returns:
        User object if admin

    Raises:
        HTTPException: If user is not an admin
    """
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized. Admin privileges required.",
        )
    return user