"""
Where uploaded files live.

`local` keeps them under UPLOAD_DIR (development and tests). `r2` keeps them in a private Cloudflare R2
bucket (S3-compatible), so they survive Render redeploys and restarts. Files are never served from a
public bucket URL: every download goes through the API route that checks who is asking and writes the audit
log, then the bytes are streamed back from here.

Stored names are random (see app/utils/file_validation.py); every call still reduces them to a basename.
"""
import asyncio
import logging
import mimetypes
import os
from functools import lru_cache
from urllib.parse import quote

from fastapi.responses import FileResponse, Response

from app.core.config import settings

logger = logging.getLogger(__name__)


class StorageMissing(Exception):
    """The file is not in storage."""


def _safe(name: str) -> str:
    return os.path.basename(name)


def _content_disposition(disposition: str, filename: str) -> str:
    try:
        filename.encode("ascii")
        return f'{disposition}; filename="{filename.replace(chr(34), "")}"'
    except UnicodeEncodeError:
        return f"{disposition}; filename*=utf-8''{quote(filename)}"


class LocalStorage:
    def _path(self, subfolder: str, name: str) -> str:
        return os.path.join(settings.UPLOAD_DIR, subfolder, _safe(name))

    async def save(self, subfolder: str, name: str, data: bytes, content_type: str) -> None:
        folder = os.path.join(settings.UPLOAD_DIR, subfolder)
        os.makedirs(folder, exist_ok=True)
        with open(self._path(subfolder, name), "wb") as f:
            f.write(data)

    async def exists(self, subfolder: str, name: str) -> bool:
        return os.path.isfile(self._path(subfolder, name))

    async def delete(self, subfolder: str, name: str) -> None:
        path = self._path(subfolder, name)
        if os.path.isfile(path):
            os.remove(path)

    async def response(self, subfolder, name, media_type=None, filename=None, inline=False, headers=None):
        path = self._path(subfolder, name)
        if not os.path.isfile(path):
            raise StorageMissing(name)
        kwargs = {"headers": headers}
        if filename:
            kwargs["filename"] = filename
            kwargs["content_disposition_type"] = "inline" if inline else "attachment"
        return FileResponse(path, media_type=media_type, **kwargs)


class R2Storage:
    def __init__(self):
        import boto3
        from botocore.config import Config

        self.bucket = settings.R2_BUCKET
        self.client = boto3.client(
            "s3",
            endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            region_name="auto",
            config=Config(signature_version="s3v4", retries={"max_attempts": 3, "mode": "standard"},
                          connect_timeout=5, read_timeout=20),
        )

    @staticmethod
    def _key(subfolder: str, name: str) -> str:
        return f"{subfolder}/{_safe(name)}"

    async def save(self, subfolder: str, name: str, data: bytes, content_type: str) -> None:
        try:
            await asyncio.to_thread(
                self.client.put_object, Bucket=self.bucket, Key=self._key(subfolder, name), Body=data,
                ContentType=content_type,
            )
        except Exception as exc:
            logger.error("Storage write failed (%s) in %s", type(exc).__name__, subfolder)  # never the key or bytes
            raise

    async def exists(self, subfolder: str, name: str) -> bool:
        try:
            await asyncio.to_thread(self.client.head_object, Bucket=self.bucket, Key=self._key(subfolder, name))
            return True
        except Exception as exc:
            if _is_not_found(exc):
                return False
            logger.error("Storage lookup failed (%s) in %s", type(exc).__name__, subfolder)
            raise

    async def delete(self, subfolder: str, name: str) -> None:
        # Best effort: by the time this runs the database row is already gone, so a failure here only
        # leaves an unreferenced object behind. Log the type and carry on.
        try:
            await asyncio.to_thread(self.client.delete_object, Bucket=self.bucket, Key=self._key(subfolder, name))
        except Exception as exc:
            logger.error("Storage delete failed (%s) in %s", type(exc).__name__, subfolder)

    async def response(self, subfolder, name, media_type=None, filename=None, inline=False, headers=None):
        try:
            obj = await asyncio.to_thread(self.client.get_object, Bucket=self.bucket, Key=self._key(subfolder, name))
            body = await asyncio.to_thread(obj["Body"].read)
        except Exception as exc:
            if _is_not_found(exc):
                raise StorageMissing(name) from None
            logger.error("Storage read failed (%s) in %s", type(exc).__name__, subfolder)
            raise
        out = dict(headers or {})
        if filename:
            out["Content-Disposition"] = _content_disposition("inline" if inline else "attachment", filename)
        return Response(content=body, media_type=media_type or obj.get("ContentType"), headers=out)


def _is_not_found(exc: Exception) -> bool:
    code = getattr(exc, "response", {}).get("Error", {}).get("Code", "")
    return code in ("404", "NoSuchKey", "NotFound")


@lru_cache(maxsize=1)
def _backend_for(name: str):
    return R2Storage() if name == "r2" else LocalStorage()


def get_storage():
    return _backend_for(settings.STORAGE_BACKEND)


def guess_media_type(name: str) -> str | None:
    return mimetypes.guess_type(name)[0]
