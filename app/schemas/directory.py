from datetime import date
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, model_validator


# Destination slugs used by the public site (vn-frontend/src/data/destinations/registry.js).
DESTINATION_SLUGS = {
    "australia", "canada", "france", "germany", "ireland",
    "japan", "new-zealand", "south-korea", "united-kingdom", "united-states",
}
StudyLevel = Literal["foundation", "diploma", "bachelor", "master", "doctorate"]
Slug = Annotated[str, Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", max_length=70)]


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class Sourced(_Strict):
    """Every published fact must point at the official page it was checked against."""
    source_url: HttpUrl
    checked_on: date


class Requirement(Sourced):
    text: str = Field(min_length=3, max_length=600)


class Tuition(Sourced):
    amount: int = Field(gt=0)
    currency: str = Field(pattern=r"^[A-Z]{3}$")
    period: Literal["year", "semester", "course", "credit"]


class Deadline(Sourced):
    intake: str = Field(min_length=3, max_length=40)
    deadline: date


class Course(_Strict):
    id: Slug
    name: str = Field(min_length=3, max_length=160)
    level: StudyLevel
    official_url: HttpUrl
    tuition: Tuition | None = None
    deadlines: list[Deadline] = []


class University(_Strict):
    id: Slug
    name: str = Field(min_length=3, max_length=160)
    country: str
    city: str = Field(min_length=2, max_length=80)
    official_url: HttpUrl
    levels: list[StudyLevel] = Field(min_length=1)
    admission_requirements: Requirement | None = None
    english_requirements: Requirement | None = None
    courses: list[Course] = []
    # Only set after VN Group confirms a current written agreement; the badge is hidden otherwise.
    vn_partner_verified: bool = False
    partner_verified_on: date | None = None

    @model_validator(mode="after")
    def check_consistency(self):
        if self.country not in DESTINATION_SLUGS:
            raise ValueError(f"Unknown country slug: {self.country}")
        if self.vn_partner_verified and self.partner_verified_on is None:
            raise ValueError("vn_partner_verified requires partner_verified_on")
        course_ids = [course.id for course in self.courses]
        if len(course_ids) != len(set(course_ids)):
            raise ValueError("Duplicate course id")
        if any(course.level not in self.levels for course in self.courses):
            raise ValueError("Course level missing from university levels")
        return self


class Directory(_Strict):
    universities: list[University] = []

    @model_validator(mode="after")
    def unique_ids(self):
        ids = [university.id for university in self.universities]
        if len(ids) != len(set(ids)):
            raise ValueError("Duplicate university id")
        return self
