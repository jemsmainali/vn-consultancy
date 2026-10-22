import enum
import uuid
from datetime import date, datetime

from sqlalchemy import String, Enum, Boolean, DateTime, Date, func, text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class UserRole(str, enum.Enum):
    student = "student"
    principal = "principal"
    parent = "parent"
    other = "other"
    consultancy_staff = "consultancy_staff"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False, default=UserRole.student)

    national_id: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)

    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    citizenship: Mapped[str | None] = mapped_column(String(100), nullable=True)
    passport_number: Mapped[str | None] = mapped_column(String(50), nullable=True)

    target_course_level: Mapped[str | None] = mapped_column(String(50), nullable=True)
    target_field: Mapped[str | None] = mapped_column(String(255), nullable=True)
    target_country: Mapped[str | None] = mapped_column(String(100), nullable=True)

    parent_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    parent_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    parent_email: Mapped[str | None] = mapped_column(String(255), nullable=True)

    profile_image: Mapped[str | None] = mapped_column(String(255), nullable=True)

    terms_accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("false"))
    is_approved: Mapped[bool] = mapped_column(Boolean, default=True, server_default=text("true"))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())