import hashlib
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core import config
from app.core.errors import ApiError

_bearer = HTTPBearer(auto_error=False)


def hash_password(plain: str) -> str:
    return hashlib.sha256((config.PASSWORD_SALT + plain).encode()).hexdigest()


def verify_password(plain: str, hashed: str) -> bool:
    return hash_password(plain) == hashed


def create_token(user: dict) -> str:
    payload = {
        "sub": user["id"],
        "role": user["role"],
        "name": user["name"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=config.JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, config.JWT_SECRET, algorithm=config.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, config.JWT_SECRET, algorithms=[config.JWT_ALGORITHM])
    except jwt.ExpiredSignatureError as exc:
        raise ApiError(401, "TOKEN_EXPIRED", "Your session has expired. Please log in again.") from exc
    except jwt.InvalidTokenError as exc:
        raise ApiError(401, "UNAUTHORIZED", "Invalid authentication token.") from exc


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> dict:
    if credentials is None:
        raise ApiError(401, "UNAUTHORIZED", "Authentication required. Send a Bearer token.")
    payload = decode_token(credentials.credentials)
    user = request.app.state.store.users.get(payload["sub"])
    if user is None:
        raise ApiError(401, "UNAUTHORIZED", "User for this token no longer exists.")
    return user


def get_optional_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> dict | None:
    if credentials is None:
        return None
    payload = decode_token(credentials.credentials)
    return request.app.state.store.users.get(payload["sub"])


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user["role"] != "admin":
        raise ApiError(403, "FORBIDDEN", "This endpoint requires the admin role.")
    return user
