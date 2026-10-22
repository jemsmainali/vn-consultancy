from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import limiter
from app.api.deps import require_role
from app.core.database import get_db
from app.models.audit import AuditLog
from app.models.enquiry import EnquiryStatus, StudentEnquiry
from app.models.user import User, UserRole
from app.schemas.enquiry import EnquiryCreate, EnquiryReceipt, LeadOut, LeadPage, LeadSearch, LeadUpdate

router = APIRouter(prefix="/enquiries", tags=["enquiries"])


def _matches_existing_submission(enquiry: StudentEnquiry, payload: EnquiryCreate) -> bool:
    expected = {
        "full_name": payload.full_name,
        "email": str(payload.email).lower(),
        "phone": payload.phone,
        "preferred_destination": payload.preferred_destination or None,
        "education_level": payload.education_level or None,
        "study_field": payload.study_field or None,
        "intended_intake": payload.intended_intake or None,
        "message": payload.message or None,
        "privacy_consent": payload.privacy_consent,
    }
    return all(getattr(enquiry, field) == value for field, value in expected.items())


@router.post("", response_model=EnquiryReceipt, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def create_enquiry(
    request: Request,
    payload: EnquiryCreate,
    db: AsyncSession = Depends(get_db),
):
    """Persist a public enquiry; only return a reference after the transaction commits."""
    existing_result = await db.execute(
        select(StudentEnquiry).where(StudentEnquiry.submission_key == payload.submission_key)
    )
    existing = existing_result.scalar_one_or_none()
    if existing:
        if _matches_existing_submission(existing, payload):
            return existing
        raise HTTPException(409, "This submission reference was already used for different details")

    enquiry = StudentEnquiry(
        submission_key=payload.submission_key,
        full_name=payload.full_name,
        email=str(payload.email).lower(),
        phone=payload.phone,
        preferred_destination=payload.preferred_destination or None,
        education_level=payload.education_level or None,
        study_field=payload.study_field or None,
        intended_intake=payload.intended_intake or None,
        message=payload.message or None,
        privacy_consent=payload.privacy_consent,
        consented_at=datetime.now(timezone.utc),
    )
    db.add(enquiry)
    try:
        await db.commit()
    except IntegrityError:
        # A simultaneous retry can pass the initial lookup. The unique key is
        # the final guard; return its committed row if the payload matches.
        await db.rollback()
        existing_result = await db.execute(
            select(StudentEnquiry).where(StudentEnquiry.submission_key == payload.submission_key)
        )
        existing = existing_result.scalar_one_or_none()
        if existing and _matches_existing_submission(existing, payload):
            return existing
        raise
    await db.refresh(enquiry)
    return enquiry


@router.post("/staff/search", response_model=LeadPage)
async def list_enquiries(
    payload: LeadSearch,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_role(UserRole.consultancy_staff)),
    db: AsyncSession = Depends(get_db),
):
    filters = []
    if payload.status:
        filters.append(StudentEnquiry.status == payload.status.value)
    if payload.destination:
        filters.append(StudentEnquiry.preferred_destination.ilike(f"%{payload.destination}%"))
    if payload.assigned_to_id:
        filters.append(StudentEnquiry.assigned_to_id == payload.assigned_to_id)
    if payload.created_after:
        filters.append(StudentEnquiry.created_at >= payload.created_after)
    if payload.created_before:
        filters.append(StudentEnquiry.created_at < payload.created_before)
    if payload.search:
        term = f"%{payload.search}%"
        filters.append(or_(StudentEnquiry.full_name.ilike(term), StudentEnquiry.email.ilike(term), StudentEnquiry.phone.ilike(term)))

    query = select(StudentEnquiry).where(*filters)
    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
    result = await db.execute(
        query.order_by(StudentEnquiry.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return LeadPage(items=result.scalars().all(), total=total, page=page, page_size=page_size)


@router.get("/staff/{enquiry_id}", response_model=LeadOut)
async def get_enquiry(
    enquiry_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.consultancy_staff)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(StudentEnquiry).where(StudentEnquiry.id == enquiry_id))
    enquiry = result.scalar_one_or_none()
    if not enquiry:
        raise HTTPException(404, "Enquiry not found")
    return enquiry


@router.patch("/staff/{enquiry_id}", response_model=LeadOut)
async def update_enquiry(
    enquiry_id: uuid.UUID,
    payload: LeadUpdate,
    current_user: User = Depends(require_role(UserRole.consultancy_staff)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(StudentEnquiry).where(StudentEnquiry.id == enquiry_id))
    enquiry = result.scalar_one_or_none()
    if not enquiry:
        raise HTTPException(404, "Enquiry not found")

    updates = payload.model_dump(exclude_unset=True)
    if "assigned_to_id" in updates and updates["assigned_to_id"] is not None:
        assignee_result = await db.execute(select(User).where(User.id == updates["assigned_to_id"]))
        assignee = assignee_result.scalar_one_or_none()
        if not assignee or assignee.role != UserRole.consultancy_staff or not assignee.is_active or not assignee.is_approved:
            raise HTTPException(422, "Assignee must be an active, approved VN Group staff member")

    for field, value in updates.items():
        if field == "status" and value is not None:
            value = value.value
        setattr(enquiry, field, value)

    db.add(AuditLog(
        actor_id=current_user.id,
        action="enquiry_updated",
        target_id=enquiry.id,
        detail="Updated: " + ", ".join(sorted(updates.keys())),
    ))
    await db.commit()
    await db.refresh(enquiry)
    return enquiry
