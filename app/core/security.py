"""
All password hashing and JWT logic lives here, in one place, so it's easy
to audit. Nothing else in the app should touch jose/passlib directly.
"""
from datetime import datetime, timedelta, timezone
from typing import Literal
import uuid

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def _create_token(subject: str, role: str, expires_delta: timedelta, token_type: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "role": role,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
        "jti": str(uuid.uuid4()),  # unique id, needed if you add token revocation later
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(subject: str, role: str) -> str:
    return _create_token(
        subject, role,
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        token_type="access",
    )


def create_refresh_token(subject: str, role: str) -> str:
    return _create_token(
        subject, role,
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        token_type="refresh",
    )


def decode_token(token: str, expected_type: Literal["access", "refresh"] = "access") -> dict:
    """Raises JWTError on any invalid, expired, or mismatched-type token."""
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    if payload.get("type") != expected_type:
        raise JWTError("Wrong token type")
    return payload
