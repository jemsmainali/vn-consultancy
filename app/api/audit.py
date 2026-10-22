from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.audit import AuditLog
from app.models.user import User, UserRole
from app.schemas.audit import AuditLogOut
from app.api.deps import require_role

router = APIRouter(prefix="/audit-logs", tags=["audit"])


@router.get("", response_model=list[AuditLogOut])
async def list_audit_logs(
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(require_role(UserRole.consultancy_staff)),
    db: AsyncSession = Depends(get_db),
):
    """Staff-only: the most recent actions across the system, newest first."""
    result = await db.execute(
        select(AuditLog, User)
        .join(User, User.id == AuditLog.actor_id, isouter=True)  # isouter: keep the log row even if the actor was later deleted
        .order_by(AuditLog.timestamp.desc())
        .limit(limit)
    )
    out = []
    for log, actor in result.all():
        item = AuditLogOut.model_validate(log)
        item.actor_name = actor.full_name if actor else "(deleted user)"
        out.append(item)
    return out