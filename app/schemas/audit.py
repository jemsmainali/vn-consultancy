import uuid
from datetime import datetime

from pydantic import BaseModel


class AuditLogOut(BaseModel):
    id: uuid.UUID
    actor_id: uuid.UUID
    actor_name: str | None = None
    action: str
    target_id: uuid.UUID | None
    detail: str | None
    timestamp: datetime

    class Config:
        from_attributes = True