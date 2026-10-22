import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, UniqueConstraint, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class GalleryItem(Base):
    __tablename__ = "gallery_items"
    __table_args__ = (UniqueConstraint("stored_filename", name="uq_gallery_items_stored_filename"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stored_filename: Mapped[str] = mapped_column(String(80), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(32), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    caption: Mapped[str] = mapped_column(String(180), nullable=False)
    alt_text: Mapped[str] = mapped_column(String(240), nullable=False)
    category: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default=text("0"), index=True)
    published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=text("false"), index=True)
    publication_authorized: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=text("false"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
