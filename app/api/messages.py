import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.document import Document
from app.models.message import Message
from app.models.user import User, UserRole
from app.schemas.message import MessageCreate, MessageOut, ContactOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/messages", tags=["messages"])


@router.post("", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
async def send_message(
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if payload.receiver_id == current_user.id:
        raise HTTPException(400, "Cannot message yourself")

    recipient_result = await db.execute(select(User).where(User.id == payload.receiver_id))
    recipient = recipient_result.scalar_one_or_none()
    if not recipient or not recipient.is_active:
        raise HTTPException(404, "Recipient not found")
    if current_user.role != UserRole.consultancy_staff and (
        recipient.role != UserRole.consultancy_staff or not recipient.is_approved
    ):
        raise HTTPException(403, "You can only message active, approved VN Group staff")
    if payload.document_id is not None:
        document = (await db.execute(select(Document).where(Document.id == payload.document_id))).scalar_one_or_none()
        if not document:
            raise HTTPException(404, "Document not found")
        # Students can only attach their own documents; staff may reference any.
        if current_user.role != UserRole.consultancy_staff and document.owner_id != current_user.id:
            raise HTTPException(403, "You can only attach your own documents")

    message = Message(
        sender_id=current_user.id,
        receiver_id=payload.receiver_id,
        document_id=payload.document_id,
        body=payload.body,
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message


@router.get("/contacts", response_model=list[ContactOut])
async def contacts(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """People the current user has exchanged messages with, most recent first."""
    result = await db.execute(
        select(Message)
        .where(or_(Message.sender_id == current_user.id, Message.receiver_id == current_user.id))
        .order_by(Message.sent_at.desc())
    )
    ids = []
    for m in result.scalars().all():
        other = m.receiver_id if m.sender_id == current_user.id else m.sender_id
        if other not in ids:
            ids.append(other)
    if not ids:
        return []
    users = (await db.execute(select(User).where(User.id.in_(ids)))).scalars().all()
    by_id = {u.id: u for u in users}
    return [
        {"id": i, "full_name": by_id[i].full_name, "role": by_id[i].role}
        for i in ids if i in by_id
    ]

@router.get("/thread/{other_user_id}", response_model=list[MessageOut])
async def get_thread(
    other_user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """All messages between the current user and one other user, oldest first."""
    result = await db.execute(
        select(Message)
        .where(
            or_(
                and_(Message.sender_id == current_user.id, Message.receiver_id == other_user_id),
                and_(Message.sender_id == other_user_id, Message.receiver_id == current_user.id),
            )
        )
        .order_by(Message.sent_at.asc())
    )
    return result.scalars().all()


@router.patch("/{message_id}/read", response_model=MessageOut)
async def mark_read(
    message_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Message).where(Message.id == message_id))
    message = result.scalar_one_or_none()
    if not message:
        raise HTTPException(404, "Message not found")
    if message.receiver_id != current_user.id:
        raise HTTPException(403, "Only the receiver can mark a message as read")

    message.read = True
    await db.commit()
    await db.refresh(message)
    return message
