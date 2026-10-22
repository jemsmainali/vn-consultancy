import os
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_role
from app.core.config import settings
from app.core.database import get_db
from app.models.audit import AuditLog
from app.models.gallery import GalleryItem
from app.models.user import User, UserRole
from app.schemas.gallery import GALLERY_CATEGORIES, GalleryItemOut, GalleryItemUpdate, GalleryStaffItemOut
from app.utils.file_validation import validate_and_save_upload

router = APIRouter(prefix="/gallery", tags=["gallery"])
ALLOWED_IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp", "image/avif"]


def _path(filename: str) -> str:
    return os.path.join(settings.UPLOAD_DIR, "gallery", os.path.basename(filename))


def _out(item: GalleryItem, staff: bool = False) -> GalleryItemOut:
    return GalleryItemOut(
        id=item.id,
        caption=item.caption,
        alt_text=item.alt_text,
        category=item.category,
        position=item.position,
        published=item.published,
        image_url=f"/gallery/{'staff/' if staff else ''}{item.id}/image",
        created_at=item.created_at,
    )


def _staff_out(item: GalleryItem) -> GalleryStaffItemOut:
    return GalleryStaffItemOut(**_out(item, staff=True).model_dump(), publication_authorized=item.publication_authorized)


@router.get("", response_model=list[GalleryItemOut])
async def public_gallery(
    category: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    if category is not None and category not in GALLERY_CATEGORIES:
        raise HTTPException(status_code=422, detail="Unsupported gallery category")
    query = select(GalleryItem).where(GalleryItem.published.is_(True))
    if category:
        query = query.where(GalleryItem.category == category)
    rows = await db.execute(query.order_by(GalleryItem.position, GalleryItem.created_at.desc()).limit(100))
    return [_out(item) for item in rows.scalars().all()]


@router.get("/staff", response_model=list[GalleryStaffItemOut])
async def staff_gallery(
    current_user: User = Depends(require_role(UserRole.consultancy_staff)),
    db: AsyncSession = Depends(get_db),
):
    rows = await db.execute(select(GalleryItem).order_by(GalleryItem.position, GalleryItem.created_at.desc()).limit(300))
    return [_staff_out(item) for item in rows.scalars().all()]


@router.post("", response_model=GalleryStaffItemOut, status_code=status.HTTP_201_CREATED)
async def create_gallery_item(
    caption: str = Form(..., min_length=1, max_length=180),
    alt_text: str = Form(..., min_length=5, max_length=240),
    category: str = Form(...),
    position: int = Form(default=0, ge=0, le=10000),
    published: bool = Form(default=False),
    publication_authorized: bool = Form(default=False),
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(UserRole.consultancy_staff)),
    db: AsyncSession = Depends(get_db),
):
    caption, alt_text = caption.strip(), alt_text.strip()
    if not caption or len(alt_text) < 5:
        raise HTTPException(status_code=422, detail="Caption and descriptive alt text are required")
    if category not in GALLERY_CATEGORIES:
        raise HTTPException(status_code=422, detail="Choose a supported gallery category")
    if published and not publication_authorized:
        raise HTTPException(status_code=422, detail="Confirm permission to publish identifiable people and image rights")
    saved = await validate_and_save_upload(file, subfolder="gallery", allowed_mimes=ALLOWED_IMAGE_MIMES)
    item = GalleryItem(
        stored_filename=saved["stored_filename"], mime_type=saved["mime_type"], size_bytes=saved["size_bytes"],
        caption=caption, alt_text=alt_text, category=category, position=position, published=published,
        publication_authorized=publication_authorized,
    )
    db.add(item)
    try:
        await db.flush()
        db.add(AuditLog(actor_id=current_user.id, action="gallery_item_created", target_id=item.id, detail=f"{category}: {caption[:120]}"))
        await db.commit()
        await db.refresh(item)
    except Exception:
        await db.rollback()
        if os.path.isfile(saved["stored_path"]):
            os.remove(saved["stored_path"])
        raise
    return _staff_out(item)


@router.get("/{item_id}/image")
async def gallery_image(item_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(GalleryItem).where(GalleryItem.id == item_id, GalleryItem.published.is_(True)))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(404, "Gallery image not found")
    path = _path(item.stored_filename)
    if not os.path.isfile(path):
        raise HTTPException(404, "Gallery image is missing")
    return FileResponse(path, media_type=item.mime_type, headers={"Cache-Control": "no-store"})


@router.get("/staff/{item_id}/image")
async def staff_gallery_image(
    item_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.consultancy_staff)),
    db: AsyncSession = Depends(get_db),
):
    item = await db.get(GalleryItem, item_id)
    if not item:
        raise HTTPException(404, "Gallery image not found")
    path = _path(item.stored_filename)
    if not os.path.isfile(path):
        raise HTTPException(404, "Gallery image is missing")
    return FileResponse(path, media_type=item.mime_type, headers={"Cache-Control": "no-store"})


@router.patch("/{item_id}", response_model=GalleryStaffItemOut)
async def update_gallery_item(
    item_id: uuid.UUID,
    payload: GalleryItemUpdate,
    current_user: User = Depends(require_role(UserRole.consultancy_staff)),
    db: AsyncSession = Depends(get_db),
):
    item = await db.get(GalleryItem, item_id)
    if not item:
        raise HTTPException(404, "Gallery item not found")
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(422, "Provide at least one field to update")
    will_publish = changes.get("published", item.published)
    rights_confirmed = changes.get("publication_authorized", item.publication_authorized)
    if will_publish and not rights_confirmed:
        raise HTTPException(422, "Confirm permission and image rights before publishing")
    for field, value in changes.items():
        setattr(item, field, value)
    db.add(AuditLog(actor_id=current_user.id, action="gallery_item_updated", target_id=item.id, detail=", ".join(changes.keys())))
    await db.commit()
    await db.refresh(item)
    return _staff_out(item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_gallery_item(
    item_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.consultancy_staff)),
    db: AsyncSession = Depends(get_db),
):
    item = await db.get(GalleryItem, item_id)
    if not item:
        raise HTTPException(404, "Gallery item not found")
    path = _path(item.stored_filename)
    db.add(AuditLog(actor_id=current_user.id, action="gallery_item_deleted", target_id=item.id, detail=f"{item.category}: {item.caption[:120]}"))
    await db.delete(item)
    await db.commit()
    if os.path.isfile(path):
        os.remove(path)
