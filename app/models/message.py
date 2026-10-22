import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, func, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sender_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    receiver_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    document_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True
    )

    body: Mapped[str] = mapped_column(String(4000), nullable=False)
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
