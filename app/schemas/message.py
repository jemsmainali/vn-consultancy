from app.models.user import UserRole
import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class MessageCreate(BaseModel):
    receiver_id: uuid.UUID
    document_id: uuid.UUID | None = None
    body: str = Field(min_length=1, max_length=4000)


class MessageOut(BaseModel):
    id: uuid.UUID
    sender_id: uuid.UUID
    receiver_id: uuid.UUID
    document_id: uuid.UUID | None
    body: str
    read: bool
    sent_at: datetime

    class Config:
        from_attributes = True


class ContactOut(BaseModel):
    id: uuid.UUID
    full_name: str
    role: UserRole