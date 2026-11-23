import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.storage import StorageMissing, get_storage
from app.models.document import Document, DocumentStatus
from app.models.message import Message
from app.models.audit import AuditLog
from app.models.user import User, UserRole
from app.schemas.document import DocumentOut, DocumentStatusUpdate, DocumentPage
from app.api.deps import get_current_user, require_role
from app.utils.file_validation import validate_and_save_upload

router = APIRouter(prefix="/documents", tags=["documents"])

OWNER_ROLES = (UserRole.student, UserRole.principal, UserRole.parent, UserRole.other, UserRole.agent)
PAGE_SIZE = 10


@router.post("/upload", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    doc_type: str = Form(..., min_length=1, max_length=100),
    college_name: str = Form(..., min_length=1, max_length=255),
    university_name: str = Form(..., min_length=1, max_length=255),
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(*OWNER_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    saved = await validate_and_save_upload(file)

    document = Document(
        owner_id=current_user.id,
        doc_type=doc_type,
        college_name=college_name,
        university_name=university_name,
        stored_filename=saved["stored_filename"],
        original_filename=saved["original_filename"],
        mime_type=saved["mime_type"],
        size_bytes=saved["size_bytes"],
    )
    db.add(document)
    await db.flush()  # get document.id before commit

    db.add(AuditLog(
        actor_id=current_user.id,
        action="document_uploaded",
        target_id=document.id,
        detail=f"{doc_type} from {college_name}",
    ))

    await db.commit()
    await db.refresh(document)
    return document


@router.get("/mine", response_model=DocumentPage)
async def my_documents(
    page: int = Query(1, ge=1),
    current_user: User = Depends(require_role(*OWNER_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    base = select(Document).where(Document.owner_id == current_user.id)

    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
    result = await db.execute(
        base.order_by(Document.uploaded_at.desc())
        .offset((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
    )
    items = result.scalars().all()
    return DocumentPage(items=items, total=total, page=page, page_size=PAGE_SIZE)


@router.get("", response_model=DocumentPage)
async def all_documents(
    page: int = Query(1, ge=1),
    current_user: User = Depends(require_role(UserRole.consultancy_staff)),
    db: AsyncSession = Depends(get_db),
):
    """Consultancy-only: every submitted document, with who sent it."""
    total = (await db.execute(select(func.count()).select_from(select(Document).subquery()))).scalar_one()

    result = await db.execute(
        select(Document, User)
        .join(User, User.id == Document.owner_id)
        .order_by(Document.uploaded_at.desc())
        .offset((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
    )
    items = []
    for doc, owner in result.all():
        item = DocumentOut.model_validate(doc)
        item.owner_name = owner.full_name
        item.owner_role = owner.role.value
        items.append(item)
    return DocumentPage(items=items, total=total, page=page, page_size=PAGE_SIZE)


@router.get("/{document_id}", response_model=DocumentOut)
async def get_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Document).where(Document.id == document_id))
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(404, "Document not found")

    if current_user.role != UserRole.consultancy_staff and document.owner_id != current_user.id:
        raise HTTPException(403, "Not authorized to view this document")

    return document


@router.post("/{document_id}/replace", response_model=DocumentOut)
async def replace_document(
    document_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(*OWNER_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Document).where(Document.id == document_id))
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(404, "Document not found")
    if document.owner_id != current_user.id:
        raise HTTPException(403, "Not authorized to replace this document")
    if document.status != DocumentStatus.pending:
        raise HTTPException(409, "Only pending documents can be replaced")

    saved = await validate_and_save_upload(file)
    old_name = document.stored_filename
    document.stored_filename = saved["stored_filename"]
    document.original_filename = saved["original_filename"]
    document.mime_type = saved["mime_type"]
    document.size_bytes = saved["size_bytes"]
    db.add(AuditLog(
        actor_id=current_user.id,
        action="document_replaced",
        target_id=document.id,
        detail=f"Replaced with {saved['original_filename']}",
    ))

    try:
        await db.commit()
        await db.refresh(document)
    except Exception:
        await db.rollback()
        await get_storage().delete("documents", saved["stored_filename"])
        raise

    await get_storage().delete("documents", old_name)
    return document


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: uuid.UUID,
    current_user: User = Depends(require_role(*OWNER_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Document).where(Document.id == document_id))
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(404, "Document not found")
    if document.owner_id != current_user.id:
        raise HTTPException(403, "Not authorized to delete this document")
    if document.status != DocumentStatus.pending:
        raise HTTPException(409, "Only pending documents can be deleted")

    stored_name = document.stored_filename
    db.add(AuditLog(
        actor_id=current_user.id,
        action="document_deleted",
        target_id=document.id,
        detail=f"Deleted {document.original_filename}",
    ))
    # Message.document_id is nullable but has no ON DELETE action, so detach
    # existing messages before removing the document row.
    await db.execute(
        update(Message).where(Message.document_id == document.id).values(document_id=None)
    )
    await db.delete(document)
    await db.commit()

    await get_storage().delete("documents", stored_name)


@router.patch("/{document_id}/status", response_model=DocumentOut)
async def update_document_status(
    document_id: uuid.UUID,
    payload: DocumentStatusUpdate,
    current_user: User = Depends(require_role(UserRole.consultancy_staff)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Document).where(Document.id == document_id))
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(404, "Document not found")

    document.status = payload.status
    db.add(AuditLog(
        actor_id=current_user.id,
        action="document_status_changed",
        target_id=document.id,
        detail=f"-> {payload.status.value}" + (f" ({payload.note})" if payload.note else ""),
    ))

    await db.commit()
    await db.refresh(document)
    return document


@router.get("/{document_id}/file")
async def download_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Document).where(Document.id == document_id))
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(404, "Document not found")

    # Staff can open any file; everyone else only their own.
    if current_user.role != UserRole.consultancy_staff and document.owner_id != current_user.id:
        raise HTTPException(403, "Not authorized to view this file")

    storage = get_storage()
    if not await storage.exists("documents", document.stored_filename):
        raise HTTPException(404, "File is missing on the server")

    db.add(AuditLog(actor_id=current_user.id, action="document_file_viewed", target_id=document.id))
    await db.commit()

    try:
        return await storage.response(
            "documents", document.stored_filename,
            media_type=document.mime_type,
            filename=document.original_filename,
            inline=True,
            headers={"Cache-Control": "private, no-store"},  # never keep other people's documents in a shared cache
        )
    except StorageMissing:
        raise HTTPException(404, "File is missing on the server")
