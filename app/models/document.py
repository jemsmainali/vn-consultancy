import enum
import uuid
from datetime import datetime

from sqlalchemy import String, Enum, DateTime, ForeignKey, func, Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class DocumentStatus(str, enum.Enum):
    pending = "pending"
    under_review = "under_review"
    reviewed = "reviewed"
    rejected = "rejected"


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    doc_type: Mapped[str] = mapped_column(String(100), nullable=False)       # e.g. transcript, certificate, LOR
    college_name: Mapped[str] = mapped_column(String(255), nullable=False)
    university_name: Mapped[str] = mapped_column(String(255), nullable=False)

    # Stored filename on disk/S3 key - NEVER the original filename, to avoid path traversal
    # and collisions. Original name kept separately just for display.
    stored_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)

    status: Mapped[DocumentStatus] = mapped_column(
        Enum(DocumentStatus), nullable=False, default=DocumentStatus.pending
    )

    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
