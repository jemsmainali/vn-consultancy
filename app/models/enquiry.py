import enum
import secrets
import uuid
from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Index, String, Text, UniqueConstraint, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class EnquiryStatus(str, enum.Enum):
    new = "new"
    contacted = "contacted"
    counselling = "counselling"
    documents_pending = "documents_pending"
    application_in_progress = "application_in_progress"
    submitted = "submitted"
    decision_received = "decision_received"
    closed = "closed"


def _new_reference() -> str:
    return f"VN-{secrets.token_hex(7)[:13].upper()}"


class StudentEnquiry(Base):
    __tablename__ = "student_enquiries"
    __table_args__ = (
        CheckConstraint(
            "status IN ('new', 'contacted', 'counselling', 'documents_pending', "
            "'application_in_progress', 'submitted', 'decision_received', 'closed')",
            name="ck_student_enquiries_status",
        ),
        UniqueConstraint("submission_key", name="uq_student_enquiries_submission_key"),
        Index("ix_student_enquiries_status_created", "status", "created_at"),
        Index("ix_student_enquiries_assigned_to", "assigned_to_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_key: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    reference: Mapped[str] = mapped_column(String(16), unique=True, nullable=False, default=_new_reference)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    phone: Mapped[str] = mapped_column(String(32), nullable=False)
    preferred_destination: Mapped[str | None] = mapped_column(String(100), nullable=True)
    education_level: Mapped[str | None] = mapped_column(String(80), nullable=True)
    study_field: Mapped[str | None] = mapped_column(String(150), nullable=True)
    intended_intake: Mapped[str | None] = mapped_column(String(80), nullable=True)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    privacy_consent: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    consented_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    status: Mapped[str] = mapped_column(String(32), nullable=False, server_default="new")
    assigned_to_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    follow_up_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    internal_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
