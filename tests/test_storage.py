import asyncio
import os
import tempfile
import unittest
from unittest.mock import MagicMock, patch

from app.core import storage
from app.core.config import Settings, settings
from app.core.storage import LocalStorage, R2Storage, StorageMissing

PROD = dict(_env_file=None, SECRET_KEY="x" * 40, DATABASE_URL="postgresql://x", ENVIRONMENT="production",
            FRONTEND_URL="https://example.com", COOKIE_SECURE=True, CORS_ORIGINS="https://example.com",
            EMAIL_ENABLED=True, BREVO_API_KEY="k", EMAIL_FROM_NAME="VN", EMAIL_FROM_ADDRESS="n@example.com")
R2 = dict(STORAGE_BACKEND="r2", R2_ACCOUNT_ID="acct", R2_ACCESS_KEY_ID="id", R2_SECRET_ACCESS_KEY="secret",
          R2_BUCKET="vn-uploads")


def run(coro):
    return asyncio.run(coro)


class FakeClientError(Exception):
    def __init__(self, code):
        self.response = {"Error": {"Code": code}}


def r2_with(client):
    with patch("boto3.client", return_value=client), \
            patch.object(settings, "R2_BUCKET", "vn-uploads"), patch.object(settings, "R2_ACCOUNT_ID", "acct"):
        return R2Storage()


class R2StorageTests(unittest.TestCase):
    def test_save_writes_under_subfolder_with_content_type_and_strips_path_tricks(self):
        client = MagicMock()
        store = r2_with(client)
        run(store.save("documents", "../../evil/abc.pdf", b"data", "application/pdf"))
        kwargs = client.put_object.call_args.kwargs
        self.assertEqual(kwargs["Bucket"], "vn-uploads")
        self.assertEqual(kwargs["Key"], "documents/abc.pdf")
        self.assertEqual(kwargs["Body"], b"data")
        self.assertEqual(kwargs["ContentType"], "application/pdf")

    def test_response_returns_bytes_with_inline_disposition_and_headers(self):
        client = MagicMock()
        client.get_object.return_value = {"Body": MagicMock(read=lambda: b"%PDF"), "ContentType": "application/pdf"}
        store = r2_with(client)
        resp = run(store.response("documents", "abc.pdf", media_type="application/pdf", filename="My CV.pdf",
                                  inline=True, headers={"Cache-Control": "private, no-store"}))
        self.assertEqual(resp.body, b"%PDF")
        self.assertEqual(resp.headers["content-type"], "application/pdf")
        self.assertEqual(resp.headers["cache-control"], "private, no-store")
        self.assertEqual(resp.headers["content-disposition"], 'inline; filename="My CV.pdf"')

    def test_non_ascii_filename_uses_rfc5987_form(self):
        client = MagicMock()
        client.get_object.return_value = {"Body": MagicMock(read=lambda: b"x"), "ContentType": "image/png"}
        resp = run(r2_with(client).response("documents", "a.png", filename="फोटो.png", inline=True))
        self.assertTrue(resp.headers["content-disposition"].startswith("inline; filename*=utf-8''"))

    def test_missing_object_maps_to_storage_missing(self):
        client = MagicMock()
        client.get_object.side_effect = FakeClientError("NoSuchKey")
        client.head_object.side_effect = FakeClientError("404")
        store = r2_with(client)
        with self.assertRaises(StorageMissing):
            run(store.response("documents", "gone.pdf"))
        self.assertFalse(run(store.exists("documents", "gone.pdf")))

    def test_other_errors_are_raised_and_logged_without_the_key(self):
        client = MagicMock()
        client.get_object.side_effect = FakeClientError("AccessDenied")
        store = r2_with(client)
        with self.assertLogs("app.core.storage", "ERROR") as logs, self.assertRaises(FakeClientError):
            run(store.response("documents", "secret-name.pdf"))
        self.assertNotIn("secret-name", "".join(logs.output))

    def test_delete_failure_is_swallowed_and_logged(self):
        client = MagicMock()
        client.delete_object.side_effect = OSError("down")
        store = r2_with(client)
        with self.assertLogs("app.core.storage", "ERROR"):
            run(store.delete("documents", "abc.pdf"))  # must not raise
        self.assertEqual(client.delete_object.call_args.kwargs["Key"], "documents/abc.pdf")


class LocalStorageTests(unittest.TestCase):
    def test_roundtrip_exists_delete_and_missing(self):
        with tempfile.TemporaryDirectory() as tmp, patch.object(settings, "UPLOAD_DIR", tmp):
            store = LocalStorage()
            run(store.save("documents", "a.pdf", b"hello", "application/pdf"))
            self.assertTrue(run(store.exists("documents", "../a.pdf")))
            resp = run(store.response("documents", "a.pdf", media_type="application/pdf"))
            self.assertEqual(resp.path, os.path.join(tmp, "documents", "a.pdf"))
            run(store.delete("documents", "a.pdf"))
            self.assertFalse(run(store.exists("documents", "a.pdf")))
            with self.assertRaises(StorageMissing):
                run(store.response("documents", "a.pdf"))


class StorageSettingsTests(unittest.TestCase):
    def test_backend_selection(self):
        storage._backend_for.cache_clear()
        with patch.object(settings, "STORAGE_BACKEND", "local"):
            self.assertIsInstance(storage.get_storage(), LocalStorage)
        storage._backend_for.cache_clear()

    def test_production_requires_r2_and_all_four_values(self):
        Settings(**PROD, **R2)
        with self.assertRaises(ValueError):
            Settings(**PROD)  # local backend in production
        for field in ("R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"):
            with self.subTest(missing=field), self.assertRaises(ValueError):
                Settings(**PROD, **{**R2, field: ""})

    def test_unknown_backend_is_rejected_everywhere(self):
        with self.assertRaises(ValueError):
            Settings(_env_file=None, SECRET_KEY="x" * 40, DATABASE_URL="postgresql://x", STORAGE_BACKEND="s3")


if __name__ == "__main__":
    unittest.main()
