import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


GALLERY_CATEGORIES = {
    "student-life",
    "counselling",
    "events",
    "workshops",
    "team",
    "campus",
}


class GalleryItemOut(BaseModel):
    id: uuid.UUID
    caption: str
    alt_text: str
    category: str
    position: int
    published: bool
    is_success_story: bool = False
    image_url: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GalleryStaffItemOut(GalleryItemOut):
    publication_authorized: bool


class GalleryItemUpdate(BaseModel):
    caption: str | None = Field(default=None, min_length=1, max_length=180)
    alt_text: str | None = Field(default=None, min_length=5, max_length=240)
    category: str | None = None
    position: int | None = Field(default=None, ge=0, le=10000)
    published: bool | None = None
    publication_authorized: bool | None = None
    is_success_story: bool | None = None

    @model_validator(mode="after")
    def disallow_null_updates(self):
        for field in self.model_fields_set:
            if getattr(self, field) is None:
                raise ValueError(f"{field} cannot be cleared")
        return self

    @field_validator("caption", "alt_text")
    @classmethod
    def trim_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank")
        return value

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str | None) -> str | None:
        if value is not None and value not in GALLERY_CATEGORIES:
            raise ValueError("Choose a supported gallery category")
        return value
