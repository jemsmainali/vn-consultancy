import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class AuditLog(Base):
    """
    Immutable trail of every meaningful action. Never update or delete rows here -
    this is what makes the consultancy's records trustworthy and gives you a
    real answer if someone later asks "who saw my document and when".
    """
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)   # "document_uploaded", "document_reviewed", etc.
    target_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    detail: Mapped[str | None] = mapped_column(String(500), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
