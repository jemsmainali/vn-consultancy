import datetime as dt
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

# Placeholder for content that has not been researched and verified yet.
# The frontend hides any value equal to this and shows "Details being verified".
TODO = "TODO"
Todo = Literal["TODO"]

FigureLabel = Literal["estimate", "official", "institution-specific"]
Amount = Annotated[float, Field(ge=0, strict=True)] | Todo


class GuideModel(BaseModel):
    # Guide files and API responses use camelCase keys (lastVerified, nprConversion, ...).
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="forbid")


class MoneyFigure(GuideModel):
    """An amount in the destination's local currency. Use min == max for a single figure."""

    min: Amount
    max: Amount
    label: FigureLabel | Todo


class FactFigure(GuideModel):
    """A non-monetary figure such as a duration, an hours limit or a processing estimate."""

    value: str
    label: FigureLabel | Todo


class Link(GuideModel):
    label: str
    url: str


class Source(Link):
    accessed: dt.date | Todo


class NprConversion(GuideModel):
    rate: Amount
    date: dt.date | Todo


class Overview(GuideModel):
    summary: str
    education_system: str


class CourseLevel(GuideModel):
    level: str
    typical_duration: FactFigure
    description: str


class Institution(GuideModel):
    name: str
    city: str
    url: str


class Universities(GuideModel):
    institutions: list[Institution]
    intakes: list[str]
    application_timeline: list[str]


class TuitionItem(GuideModel):
    level: str
    annual_fee: MoneyFigure


class CityLivingCost(GuideModel):
    """Monthly costs for one student city."""

    city: str
    accommodation: MoneyFigure
    food: MoneyFigure
    transport: MoneyFigure
    utilities: MoneyFigure
    personal: MoneyFigure


class Scholarship(GuideModel):
    name: str
    provider: str
    coverage: FactFigure
    eligibility: str
    deadline: str
    url: str


class FinancialEvidence(GuideModel):
    requirement: str
    amount: MoneyFigure


class Insurance(GuideModel):
    requirement: str
    annual_cost: MoneyFigure


class StudentVisa(GuideModel):
    category: str
    process: list[str]
    financial_evidence: FinancialEvidence
    insurance: Insurance
    documents: list[str]
    processing_estimate: FactFigure


class WorkRules(GuideModel):
    during_term: FactFigure
    during_breaks: FactFigure
    conditions: list[str]


class PostStudyRoute(GuideModel):
    name: str
    duration: FactFigure
    conditions: str


class LifestyleItem(GuideModel):
    topic: str
    text: str


class DestinationGuide(GuideModel):
    slug: str
    name: str
    currency: str = Field(pattern=r"^[A-Z]{3}$")
    last_verified: dt.date | Todo
    npr_conversion: NprConversion
    overview: Overview
    courses: list[CourseLevel]
    universities: Universities
    tuition: list[TuitionItem]
    living_costs: list[CityLivingCost]
    scholarships: list[Scholarship]
    student_visa: StudentVisa
    work_rules: WorkRules
    post_study_routes: list[PostStudyRoute]
    lifestyle: list[LifestyleItem]
    official_links: list[Link]
    sources: list[Source]


class DestinationPreview(GuideModel):
    """The only guide fields served without signing in."""

    slug: str
    name: str
    currency: str
    summary: str
    last_verified: dt.date | Todo

    @classmethod
    def from_guide(cls, guide: DestinationGuide) -> "DestinationPreview":
        return cls(
            slug=guide.slug,
            name=guide.name,
            currency=guide.currency,
            summary=guide.overview.summary,
            last_verified=guide.last_verified,
        )
