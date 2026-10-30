import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_role
from app.api.directory import directory_refs
from app.core.database import get_db
from app.models.study_plan import SavedItem, StudyPlan
from app.models.user import User, UserRole
from app.schemas.study_plan import SavedItemCreate, SavedItemOut, StudyPlanOut, StudyPlanUpdate, StudyPreferences

router = APIRouter(prefix="/study-plan", tags=["study-plan"])

# Every query below is filtered by the signed-in student's id; ids from the client are never trusted alone.
student_only = require_role(UserRole.student)


async def _plan(db: AsyncSession, user: User) -> StudyPlan | None:
    return (await db.execute(select(StudyPlan).where(StudyPlan.user_id == user.id))).scalar_one_or_none()


async def _saved(db: AsyncSession, user: User) -> list[SavedItem]:
    result = await db.execute(
        select(SavedItem).where(SavedItem.user_id == user.id).order_by(SavedItem.created_at.desc())
    )
    return list(result.scalars().all())


async def _out(db: AsyncSession, user: User, plan: StudyPlan | None) -> StudyPlanOut:
    return StudyPlanOut(
        preferred_countries=plan.preferred_countries if plan else [],
        preferences=StudyPreferences(**(plan.preferences if plan else {})),
        updated_at=plan.updated_at if plan else None,
        saved_items=[SavedItemOut.model_validate(item) for item in await _saved(db, user)],
    )


@router.get("/me", response_model=StudyPlanOut)
async def my_study_plan(current_user: User = Depends(student_only), db: AsyncSession = Depends(get_db)):
    return await _out(db, current_user, await _plan(db, current_user))


@router.patch("/me", response_model=StudyPlanOut)
async def update_my_study_plan(
    payload: StudyPlanUpdate,
    current_user: User = Depends(student_only),
    db: AsyncSession = Depends(get_db),
):
    plan = await _plan(db, current_user)
    if plan is None:
        plan = StudyPlan(user_id=current_user.id, preferred_countries=[], preferences={})
        db.add(plan)
    if payload.preferred_countries is not None:
        plan.preferred_countries = payload.preferred_countries
    if payload.preferences is not None:
        plan.preferences = payload.preferences.model_dump()
    await db.commit()
    await db.refresh(plan)
    return await _out(db, current_user, plan)


@router.post("/me/saved", response_model=SavedItemOut, status_code=status.HTTP_201_CREATED)
async def save_item(
    payload: SavedItemCreate,
    current_user: User = Depends(student_only),
    db: AsyncSession = Depends(get_db),
):
    if payload.ref not in directory_refs(payload.kind):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="That item is not in the directory")
    existing = await db.execute(
        select(SavedItem).where(
            SavedItem.user_id == current_user.id, SavedItem.kind == payload.kind, SavedItem.ref == payload.ref
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already saved to your plan")

    item = SavedItem(user_id=current_user.id, kind=payload.kind, ref=payload.ref)
    db.add(item)
    try:
        await db.commit()
    except IntegrityError:  # a parallel request saved the same item first
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already saved to your plan")
    await db.refresh(item)
    return item


@router.delete("/me/saved/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_saved_item(
    item_id: uuid.UUID,
    current_user: User = Depends(student_only),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(SavedItem).where(SavedItem.id == item_id, SavedItem.user_id == current_user.id))
    item = result.scalar_one_or_none()
    if item is None:  # same answer for "missing" and "someone else's", so ids can't be probed
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved item not found")
    await db.delete(item)
    await db.commit()
