import re
import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.user import UserRole

NID_PATTERN = re.compile(r"^\d{10}$")


class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: UserRole = UserRole.student
    invite_code: Optional[str] = None

    national_id: str = Field(
        min_length=10,
        max_length=10,
        description="10-digit National ID Card number",
    )
    date_of_birth: date
    gender: str
    citizenship: str = Field(min_length=2, max_length=100)
    passport_number: Optional[str] = Field(default=None, max_length=50)

    target_course_level: Optional[str] = None
    target_field: Optional[str] = None
    target_country: Optional[str] = None

    parent_name: Optional[str] = Field(default=None, max_length=150)
    parent_phone: Optional[str] = Field(default=None, max_length=50)
    parent_email: Optional[EmailStr] = None

    terms_accepted: bool

    @field_validator("national_id")
    @classmethod
    def validate_national_id(cls, v: str) -> str:
        v = v.strip()
        if not NID_PATTERN.match(v):
            raise ValueError(
                "National ID must be the 10-digit number on your National ID Card "
                "(numbers only, no spaces or dashes)."
            )
        return v

    @field_validator("terms_accepted")
    @classmethod
    def validate_terms(cls, v: bool) -> bool:
        if not v:
            raise ValueError("You must accept the Terms and Conditions to register.")
        return v


class UserUpdate(BaseModel):
    gender: Optional[str] = None
    citizenship: Optional[str] = Field(default=None, max_length=100)
    passport_number: Optional[str] = Field(default=None, max_length=50)
    target_course_level: Optional[str] = None
    target_field: Optional[str] = None
    target_country: Optional[str] = None
    parent_name: Optional[str] = Field(default=None, max_length=150)
    parent_phone: Optional[str] = Field(default=None, max_length=50)
    parent_email: Optional[EmailStr] = None


class UserOut(BaseModel):
    id: uuid.UUID
    full_name: str
    email: EmailStr
    role: UserRole
    national_id: str
    # These columns are nullable in the database (older/incomplete accounts
    # can legitimately have no profile details yet).
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    citizenship: Optional[str] = None
    passport_number: Optional[str] = None
    target_course_level: Optional[str] = None
    target_field: Optional[str] = None
    target_country: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_email: Optional[EmailStr] = None
    is_active: bool
    is_verified: bool
    is_approved: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class StaffOut(BaseModel):
    id: uuid.UUID
    full_name: str
    email: EmailStr

    class Config:
        from_attributes = True


class PendingUserOut(BaseModel):
    id: uuid.UUID
    full_name: str
    email: EmailStr
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True


class StaffUserOut(BaseModel):
    id: uuid.UUID
    full_name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    is_approved: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserListPage(BaseModel):
    items: list[StaffUserOut]
    total: int
    page: int
    page_size: int


class VerifyEmailResponse(BaseModel):
    pending_approval: bool = False
    message: Optional[str] = None


class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str


class ResendRequest(BaseModel):
    email: EmailStr


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str = Field(min_length=8, max_length=128)
