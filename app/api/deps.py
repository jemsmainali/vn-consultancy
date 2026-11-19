import uuid

from fastapi import Depends, HTTPException, status, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import JWTError, decode_token
from app.models.revoked_token import RevokedToken
from app.models.user import User, UserRole


async def session_is_revoked(db: AsyncSession, user: User, claims: dict) -> bool:
    """True if this token was signed out, or was issued before the account's sessions were invalidated."""
    jti = claims.get("jti")
    if jti and (await db.execute(select(RevokedToken.jti).where(RevokedToken.jti == jti))).first():
        return True
    valid_after = user.sessions_valid_after
    return bool(valid_after and claims.get("iat", 0) < int(valid_after.timestamp()))


async def get_signed_in_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Any verified, active account, including ones still awaiting staff approval.

    Only for the few routes a pending account needs (who am I, refresh). Everything else uses get_current_user.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    token = request.cookies.get("access_token")
    if not token:
        raise credentials_exception
    try:
        payload = decode_token(token, expected_type="access")
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active or not user.is_verified:
        raise credentials_exception
    if await session_is_revoked(db, user, payload):
        raise credentials_exception
    return user


async def get_current_user(user: User = Depends(get_signed_in_user)) -> User:
    """A signed-in account that is fully active. Pending principals and agents get 403 on every private API."""
    if user.status == "pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is awaiting approval from VN Group staff",
        )
    return user


def require_role(*allowed_roles: UserRole):
    """Usage: Depends(require_role(UserRole.consultancy_staff))"""

    async def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )
        return user

    return checker