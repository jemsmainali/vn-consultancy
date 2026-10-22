"""
Never trust a client-supplied filename or Content-Type header.
This module sniffs the actual file bytes to determine what a file really is,
and generates a safe random name to store it under.
"""
import os
import uuid

import magic
from fastapi import UploadFile, HTTPException

from app.core.config import settings


async def validate_and_save_upload(
    file: UploadFile,
    subfolder: str = "documents",
    allowed_mimes: list[str] | None = None,
) -> dict:
    """
    Reads the file into memory, verifies size + real MIME type, and writes it
    to disk under a randomly generated name. Returns metadata to store in the DB.

    `allowed_mimes` overrides settings.allowed_mime_list for this call
    (e.g. profile photos should only ever accept images, never PDFs).

    Raises HTTPException(400) if the file fails validation.
    """
    allowed = allowed_mimes if allowed_mimes is not None else settings.allowed_mime_list
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024

    contents = await file.read()
    size = len(contents)

    if size == 0:
        raise HTTPException(400, "Uploaded file is empty")
    if size > max_bytes:
        raise HTTPException(400, f"File exceeds {settings.MAX_UPLOAD_MB}MB limit")

    # Sniff real content type from bytes - ignore whatever the client claims.
    detected_mime = magic.from_buffer(contents, mime=True)
    if detected_mime not in allowed:
        raise HTTPException(
            400,
            f"File type '{detected_mime}' is not allowed. "
            f"Allowed: {', '.join(allowed)}",
        )

    ext_map = {
        "application/pdf": ".pdf",
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/avif": ".avif",
    }
    ext = ext_map.get(detected_mime, "")

    # Random filename - never derive the stored name from user input. This is
    # what prevents path traversal (e.g. "../../etc/passwd") and collisions.
    stored_filename = f"{uuid.uuid4().hex}{ext}"

    upload_dir = os.path.join(settings.UPLOAD_DIR, subfolder)
    os.makedirs(upload_dir, exist_ok=True)
    full_path = os.path.join(upload_dir, stored_filename)

    with open(full_path, "wb") as f:
        f.write(contents)

    return {
        "stored_filename": stored_filename,
        "stored_path": full_path,
        "original_filename": os.path.basename(file.filename or "unnamed"),
        "mime_type": detected_mime,
        "size_bytes": size,
    }
