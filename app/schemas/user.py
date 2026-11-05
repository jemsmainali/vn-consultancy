import re
import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, ValidationInfo, field_validator

from app.models.user import UserRole

NID_PATTERN = re.compile(r"^\d{10}$")
BANK_ACCOUNT_NUMBER_MIN_LENGTH = 8
BANK_ACCOUNT_NUMBER_MAX_LENGTH = 24
ROLES_REQUIRING_BANK_DETAILS = frozenset({UserRole.other})


class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: UserRole = UserRole.student
    invite_code: Optional[str] = None
    bank_account_name: Optional[str] = Field(default=None, validate_default=True)
    bank_name: Optional[str] = Field(default=None, validate_default=True)
    bank_account_number: Optional[str] = Field(default=None, validate_default=True)
    bank_nominee_name: Optional[str] = Field(default=None, validate_default=True)

    national_id: Optional[str] = Field(
        default=None,
        description="Optional 10-digit National ID Card number",
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

    @field_validator("bank_account_name", "bank_nominee_name", mode="before")
    @classmethod
    def validate_bank_person_name(cls, value: str | None, info: ValidationInfo) -> str | None:
        if info.data.get("role", UserRole.student) not in ROLES_REQUIRING_BANK_DETAILS:
            return None
        label = "Account holder name" if info.field_name == "bank_account_name" else "Nominee name"
        if value is None or not str(value).strip():
            raise ValueError(f"{label} is required.")
        name = " ".join(str(value).split())
        if not 2 <= len(name) <= 100:
            raise ValueError(f"{label} must be 2 to 100 characters.")
        if not all(char.isalnum() or char in " .,'&-()" for char in name):
            raise ValueError("Use letters, numbers, spaces, periods, commas, apostrophes, ampersands, hyphens, and parentheses only.")
        return name

    @field_validator("bank_name", mode="before")
    @classmethod
    def validate_bank_name(cls, value: str | None, info: ValidationInfo) -> str | None:
        if info.data.get("role", UserRole.student) not in ROLES_REQUIRING_BANK_DETAILS:
            return None
        if value is None or not str(value).strip():
            raise ValueError("Bank name is required.")
        bank_name = str(value).strip()
        if not 2 <= len(bank_name) <= 100:
            raise ValueError("Bank name must be 2 to 100 characters.")
        if not all(char.isalnum() or char in " .&-()" for char in bank_name):
            raise ValueError("Use letters, numbers, spaces, periods, ampersands, hyphens, and parentheses only.")
        return bank_name

    @field_validator("bank_account_number", mode="before")
    @classmethod
    def validate_bank_account_number(cls, value: str | None, info: ValidationInfo) -> str | None:
        if info.data.get("role", UserRole.student) not in ROLES_REQUIRING_BANK_DETAILS:
            return None
        if value is None or not str(value).strip():
            raise ValueError("Bank account number is required.")
        number = re.sub(r"[ -]", "", str(value))
        if not number.isascii() or not number.isdigit():
            raise ValueError("Enter digits only; spaces and hyphens are allowed while typing.")
        if not BANK_ACCOUNT_NUMBER_MIN_LENGTH <= len(number) <= BANK_ACCOUNT_NUMBER_MAX_LENGTH:
            raise ValueError(f"Bank account number must be {BANK_ACCOUNT_NUMBER_MIN_LENGTH} to {BANK_ACCOUNT_NUMBER_MAX_LENGTH} digits.")
        return number

    @field_validator("national_id")
    @classmethod
    def validate_national_id(cls, v: str | None) -> str | None:
        # Blank means "not provided"; store NULL so the unique constraint allows many.
        v = (v or "").strip()
        if not v:
            return None
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
    # These columns are nullable in the database (older/incomplete accounts
    # can legitimately have no profile details yet; National ID is optional).
    national_id: Optional[str] = None
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
