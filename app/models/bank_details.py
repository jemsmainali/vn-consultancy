import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class UserBankDetails(Base):
    __tablename__ = "user_bank_details"
    __table_args__ = (UniqueConstraint("user_id", name="uq_user_bank_details_user_id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    account_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    bank_name: Mapped[str] = mapped_column(Text, nullable=False)
    account_number_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    account_last4: Mapped[str] = mapped_column(String(4), nullable=False)
    nominee_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
