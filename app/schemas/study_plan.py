import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.directory import DESTINATION_SLUGS, StudyLevel


class StudyPreferences(BaseModel):
    model_config = ConfigDict(extra="forbid")

    study_level: StudyLevel | None = None
    fields_of_study: list[str] = Field(default=[], max_length=5)
    intake: str | None = Field(default=None, max_length=40)
    notes: str | None = Field(default=None, max_length=500)

    @field_validator("fields_of_study")
    @classmethod
    def clean_fields(cls, values: list[str]) -> list[str]:
        cleaned = [value.strip() for value in values if value.strip()]
        if any(len(value) > 80 for value in cleaned):
            raise ValueError("Each field of study must be 80 characters or fewer")
        return list(dict.fromkeys(cleaned))


class StudyPlanUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    preferred_countries: list[str] | None = Field(default=None, max_length=len(DESTINATION_SLUGS))
    preferences: StudyPreferences | None = None

    @field_validator("preferred_countries")
    @classmethod
    def known_countries(cls, values: list[str] | None) -> list[str] | None:
        if values is None:
            return None
        unknown = [value for value in values if value not in DESTINATION_SLUGS]
        if unknown:
            raise ValueError(f"Unknown destination: {', '.join(unknown)}")
        return list(dict.fromkeys(values))


class SavedItemCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: Literal["university", "course"]
    ref: str = Field(min_length=1, max_length=160)


class SavedItemOut(BaseModel):
    id: uuid.UUID
    kind: str
    ref: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StudyPlanOut(BaseModel):
    preferred_countries: list[str]
    preferences: StudyPreferences
    updated_at: datetime | None
    saved_items: list[SavedItemOut]
