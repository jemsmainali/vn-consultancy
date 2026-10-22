import uuid
from datetime import datetime, timezone
from typing import Annotated

import re

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.models.enquiry import EnquiryStatus


class EnquiryCreate(BaseModel):
    submission_key: uuid.UUID
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=32)
    preferred_destination: str | None = Field(default=None, max_length=100)
    education_level: str | None = Field(default=None, max_length=80)
    study_field: str | None = Field(default=None, max_length=150)
    intended_intake: str | None = Field(default=None, max_length=80)
    message: str | None = Field(default=None, max_length=2000)
    privacy_consent: bool

    @field_validator("full_name", "phone", "preferred_destination", "education_level", "study_field", "intended_intake", "message")
    @classmethod
    def trim_text(cls, value: str | None) -> str | None:
        return value.strip() if value is not None else None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        digits = sum(character.isdigit() for character in value)
        if not re.fullmatch(r"\+?[0-9().\-\s]+", value) or not 7 <= digits <= 15:
            raise ValueError("Enter a valid phone number")
        return value

    @field_validator("full_name")
    @classmethod
    def require_name(cls, value: str) -> str:
        if len(value.strip()) < 2:
            raise ValueError("Enter your full name")
        return value.strip()

    @field_validator("privacy_consent")
    @classmethod
    def require_consent(cls, value: bool) -> bool:
        if not value:
            raise ValueError("Consent is required before submitting an enquiry")
        return value


class EnquiryReceipt(BaseModel):
    reference: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LeadSearch(BaseModel):
    status: EnquiryStatus | None = None
    destination: str | None = Field(default=None, max_length=100)
    assigned_to_id: uuid.UUID | None = None
    created_after: datetime | None = None
    created_before: datetime | None = None
    search: str | None = Field(default=None, max_length=100)

    @field_validator("destination", "search")
    @classmethod
    def normalize_search_text(cls, value: str | None) -> str | None:
        return value.strip() or None if value is not None else None

    @field_validator("created_after", "created_before")
    @classmethod
    def normalize_date_filters(cls, value: datetime | None) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)


class LeadUpdate(BaseModel):
    status: EnquiryStatus | None = None
    assigned_to_id: uuid.UUID | None = None
    follow_up_at: datetime | None = None
    internal_notes: Annotated[str | None, Field(max_length=10000)] = None

    @model_validator(mode="after")
    def status_cannot_be_cleared(self):
        if "status" in self.model_fields_set and self.status is None:
            raise ValueError("Status cannot be empty")
        return self

    @field_validator("internal_notes")
    @classmethod
    def trim_notes(cls, value: str | None) -> str | None:
        return value.strip() if value is not None else None

    @field_validator("follow_up_at")
    @classmethod
    def normalize_follow_up(cls, value: datetime | None) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            raise ValueError("Follow-up time must include a timezone")
        return value.astimezone(timezone.utc)


class LeadOut(BaseModel):
    id: uuid.UUID
    reference: str
    full_name: str
    email: EmailStr
    phone: str
    preferred_destination: str | None
    education_level: str | None
    study_field: str | None
    intended_intake: str | None
    message: str | None
    privacy_consent: bool
    consented_at: datetime
    status: EnquiryStatus
    assigned_to_id: uuid.UUID | None
    follow_up_at: datetime | None
    internal_notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LeadPage(BaseModel):
    items: list[LeadOut]
    total: int
    page: int
    page_size: int
