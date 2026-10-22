import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.document import DocumentStatus


class DocumentOut(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    doc_type: str
    college_name: str
    university_name: str
    original_filename: str
    mime_type: str
    size_bytes: int
    status: DocumentStatus
    uploaded_at: datetime
    owner_name: str | None = None
    owner_role: str | None = None

    class Config:
        from_attributes = True


class DocumentStatusUpdate(BaseModel):
    status: DocumentStatus
    note: str | None = Field(default=None, max_length=500)

class DocumentPage(BaseModel):
    items: list[DocumentOut]
    total: int
    page: int
    page_size: int