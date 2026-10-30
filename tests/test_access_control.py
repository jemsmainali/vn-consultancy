"""
End-to-end access-control tests against the real FastAPI app.

Runs uvicorn in a background thread and talks to it over HTTP with cookie jars,
so cookies, auth dependencies and role checks are exercised exactly as in the
browser. Data lives in a throwaway Postgres schema (dropped afterwards) and a
temporary upload folder, so existing records and uploads are never touched.

Run: venv/Scripts/python -m unittest tests.test_access_control -v
"""
import asyncio
import io
import json
import shutil
import socket
import tempfile
import threading
import time
import unittest
import uuid
import urllib.error
import urllib.request
from http.cookiejar import CookieJar
from unittest.mock import patch

import uvicorn
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

import app.models  # noqa: F401  (registers every table on Base.metadata)
from app.api import auth as auth_api
from app.api.auth import limiter
from app.core.config import settings
from app.core.database import Base, get_db
from app.main import app
from app.models.user import UserRole

SCHEMA = f"vn_test_{uuid.uuid4().hex[:10]}"
PASSWORD = "Correct-Horse-42"
PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde"
    b"\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82"
)
PDF = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"


def _engine():
    return create_async_engine(
        settings.DATABASE_URL,
        connect_args={"server_settings": {"search_path": SCHEMA}},
    )


async def _create_schema():
    engine = _engine()
    async with engine.begin() as conn:
        await conn.execute(text(f'CREATE SCHEMA "{SCHEMA}"'))
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()


async def _drop_schema():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        await conn.execute(text(f'DROP SCHEMA IF EXISTS "{SCHEMA}" CASCADE'))
    await engine.dispose()


def _multipart(fields: dict, files: dict) -> tuple[bytes, str]:
    boundary = uuid.uuid4().hex
    out = io.BytesIO()
    for name, value in fields.items():
        out.write(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode())
    for name, (filename, data, mime) in files.items():
        out.write(
            f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'
            f"Content-Type: {mime}\r\n\r\n".encode()
        )
        out.write(data + b"\r\n")
    out.write(f"--{boundary}--\r\n".encode())
    return out.getvalue(), f"multipart/form-data; boundary={boundary}"


class Client:
    """Tiny cookie-aware HTTP client (stdlib only)."""

    def __init__(self, base: str):
        self.base = base
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(CookieJar()))

    def request(self, method, path, json_body=None, fields=None, files=None):
        data, headers = None, {}
        if json_body is not None:
            data, headers["Content-Type"] = json.dumps(json_body).encode(), "application/json"
        elif fields is not None or files is not None:
            data, headers["Content-Type"] = _multipart(fields or {}, files or {})
        req = urllib.request.Request(self.base + path, data=data, method=method, headers=headers)
        try:
            with self.opener.open(req) as res:
                return res.status, res.read()
        except urllib.error.HTTPError as err:
            return err.code, err.read()

    def json(self, method, path, **kw):
        status, body = self.request(method, path, **kw)
        try:
            return status, json.loads(body) if body else None
        except ValueError:
            return status, body


class AccessControlTests(unittest.TestCase):
    otp_codes: dict[str, str] = {}

    @classmethod
    def setUpClass(cls):
        # Class cleanups run even when setUpClass fails part-way, unlike tearDownClass.
        cls.addClassCleanup(lambda: asyncio.run(_drop_schema()))
        asyncio.run(_create_schema())
        cls.upload_dir = tempfile.mkdtemp(prefix="vn-test-uploads-")
        cls.addClassCleanup(shutil.rmtree, cls.upload_dir, ignore_errors=True)

        engine = _engine()
        sessions = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

        async def test_db():
            async with sessions() as session:
                yield session

        async def capture_otp(email, code, name):
            cls.otp_codes[email.lower()] = code

        cls.patches = [
            patch.object(settings, "UPLOAD_DIR", cls.upload_dir),
            patch.object(settings, "STAFF_INVITE_CODE", "test-staff-invite"),
            patch.object(settings, "REQUIRE_BANK_DETAILS_FOR_NON_STUDENTS", False),
            patch.object(auth_api, "send_otp_email", capture_otp),
            patch.object(limiter, "enabled", False),
        ]
        for p in cls.patches:
            p.start()
            cls.addClassCleanup(p.stop)
        app.dependency_overrides[get_db] = test_db
        cls.addClassCleanup(app.dependency_overrides.pop, get_db, None)

        with socket.socket() as s:
            s.bind(("127.0.0.1", 0))
            port = s.getsockname()[1]
        cls.server = uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", port=port, log_level="warning"))
        cls.thread = threading.Thread(target=cls.server.run, daemon=True)
        cls.thread.start()
        cls.addClassCleanup(cls._stop_server)
        deadline = time.time() + 15
        while not cls.server.started:
            if time.time() > deadline:
                raise RuntimeError("test server did not start")
            time.sleep(0.05)
        cls.base = f"http://127.0.0.1:{port}"

        cls.staff = cls._register_and_login("staff", UserRole.consultancy_staff)
        cls.student_a = cls._register_and_login("student-a", UserRole.student)
        cls.student_b = cls._register_and_login("student-b", UserRole.student)

    @classmethod
    def _stop_server(cls):
        cls.server.should_exit = True
        cls.thread.join(timeout=10)

    # ---- helpers ---------------------------------------------------------

    @classmethod
    def _register(cls, client, label, role, **overrides):
        email = f"{label}-{uuid.uuid4().hex[:6]}@example.com"
        fields = {
            "full_name": f"Test {label}",
            "email": email,
            "password": PASSWORD,
            "role": role.value,
            "national_id": f"{uuid.uuid4().int % 10**10:010d}",
            "date_of_birth": "2000-01-01",
            "gender": "Other",
            "citizenship": "Nepali",
            "terms_accepted": "true",
        }
        if role == UserRole.consultancy_staff:
            fields["invite_code"] = "test-staff-invite"
        fields.update(overrides)
        status, body = client.json("POST", "/auth/register", fields=fields, files={"photo": ("p.png", PNG, "image/png")})
        return email, status, body

    @classmethod
    def _register_and_login(cls, label, role):
        client = Client(cls.base)
        email, status, body = cls._register(client, label, role)
        assert status == 201, (status, body)
        status, body = client.json("POST", "/auth/verify-email", json_body={"email": email, "code": cls.otp_codes[email.lower()]})
        assert status == 200, (status, body)
        if role == UserRole.consultancy_staff:
            # Staff need approval; approve directly in the throwaway schema.
            async def approve():
                engine = _engine()
                async with engine.begin() as conn:
                    await conn.execute(text("UPDATE users SET is_approved = true WHERE email = :e"), {"e": email})
                await engine.dispose()
            asyncio.run(approve())
        status, body = client.json("POST", "/auth/login", json_body={"email": email, "password": PASSWORD})
        assert status == 200, (status, body)
        status, me = client.json("GET", "/auth/me")
        assert status == 200, (status, me)
        client.user = me
        return client

    def anon(self):
        return Client(self.base)

    def upload(self, client):
        status, doc = client.json(
            "POST", "/documents/upload",
            fields={"doc_type": "passport", "college_name": "Test College", "university_name": "Test University"}, files={"file": ("passport.pdf", PDF, "application/pdf")},
        )
        self.assertEqual(status, 201, doc)
        return doc

    # ---- anonymous -------------------------------------------------------

    def test_anonymous_blocked_from_every_private_api(self):
        some_id = uuid.uuid4()
        private = [
            ("GET", "/auth/me"), ("PATCH", "/auth/me"), ("GET", "/auth/me/photo"), ("POST", "/auth/me/photo"),
            ("GET", "/auth/staff"), ("GET", "/auth/pending"), ("GET", "/auth/users"),
            ("POST", f"/auth/{some_id}/approve"), ("POST", f"/auth/{some_id}/reject"),
            ("POST", f"/auth/{some_id}/deactivate"), ("POST", f"/auth/{some_id}/reactivate"),
            ("POST", "/documents/upload"), ("GET", "/documents/mine"), ("GET", "/documents"),
            ("GET", f"/documents/{some_id}"), ("GET", f"/documents/{some_id}/file"),
            ("POST", f"/documents/{some_id}/replace"), ("DELETE", f"/documents/{some_id}"),
            ("PATCH", f"/documents/{some_id}/status"),
            ("POST", "/messages"), ("GET", "/messages/contacts"), ("GET", f"/messages/thread/{some_id}"),
            ("PATCH", f"/messages/{some_id}/read"),
            ("GET", "/audit-logs"),
            ("POST", "/enquiries/staff/search"), ("GET", f"/enquiries/staff/{some_id}"),
            ("PATCH", f"/enquiries/staff/{some_id}"),
            ("GET", "/gallery/staff"), ("POST", "/gallery"), ("GET", f"/gallery/staff/{some_id}/image"),
            ("PATCH", f"/gallery/{some_id}"), ("DELETE", f"/gallery/{some_id}"),
            ("GET", "/study-plan/me"), ("PATCH", "/study-plan/me"), ("POST", "/study-plan/me/saved"),
            ("DELETE", f"/study-plan/me/saved/{some_id}"),
            ("GET", "/destinations/australia"), ("GET", "/destinations/compare?slugs=australia,canada"),
            ("GET", "/directory/universities"),
            ("POST", "/auth/refresh"),
        ]
        client = self.anon()
        for method, path in private:
            with self.subTest(route=f"{method} {path}"):
                status, _ = client.request(method, path, json_body={} if method in ("POST", "PATCH") else None)
                self.assertEqual(status, 401, f"{method} {path} returned {status}")

    def test_every_registered_route_is_covered(self):
        public = {"/health", "/auth/register", "/auth/verify-email", "/auth/resend-otp", "/auth/forgot-password",
                  "/auth/reset-password", "/auth/login", "/auth/token", "/auth/logout", "/enquiries", "/gallery",
                  "/gallery/{item_id}/image", "/destinations/preview", "/docs", "/docs/oauth2-redirect", "/openapi.json"}
        source = open(__file__, encoding="utf-8").read()
        for route in app.routes:
            path = getattr(route, "path", "")
            if path in public:
                continue
            probe = path.split("{")[0]
            with self.subTest(route=path):
                self.assertTrue(f'"{probe}' in source, f"{path} has no anonymous-access check")

    def test_public_apis_work_without_login(self):
        client = self.anon()
        self.assertEqual(client.request("GET", "/health")[0], 200)
        status, items = client.json("GET", "/gallery")
        self.assertEqual(status, 200)
        self.assertIsInstance(items, list)
        status, previews = client.json("GET", "/destinations/preview")
        self.assertEqual(status, 200)
        self.assertTrue(previews)

    # ---- enquiry ---------------------------------------------------------

    def test_enquiry_submit_anonymous_and_idempotent(self):
        client = self.anon()
        payload = {
            "submission_key": str(uuid.uuid4()), "full_name": "Asha Test", "email": "Asha@Example.com",
            "phone": "+977 980-0000000", "preferred_destination": "Australia", "privacy_consent": True,
        }
        status, first = client.json("POST", "/enquiries", json_body=payload)
        self.assertEqual(status, 201, first)
        self.assertTrue(first["reference"])
        self.assertEqual(set(first), {"reference", "created_at"}, "receipt must not echo personal data")
        status, again = client.json("POST", "/enquiries", json_body=payload)
        self.assertEqual((status, again["reference"]), (201, first["reference"]))
        status, _ = client.json("POST", "/enquiries", json_body={**payload, "phone": "+977 981-1111111"})
        self.assertEqual(status, 409)
        status, _ = client.json("POST", "/enquiries", json_body={**payload, "submission_key": str(uuid.uuid4()), "privacy_consent": False})
        self.assertEqual(status, 422)
        status, _ = client.json("POST", "/enquiries", json_body={**payload, "submission_key": str(uuid.uuid4()), "phone": "abc"})
        self.assertEqual(status, 422)
        # Students cannot read leads; staff can.
        self.assertEqual(self.student_a.request("POST", "/enquiries/staff/search", json_body={})[0], 403)
        status, page = self.staff.json("POST", "/enquiries/staff/search", json_body={})
        self.assertEqual(status, 200, page)
        self.assertTrue(any(i["email"] == "asha@example.com" for i in page["items"]))

    # ---- auth / OTP ------------------------------------------------------

    def test_register_otp_login_logout_flow(self):
        client = self.anon()
        email, status, body = self._register(client, "flow", UserRole.student)
        self.assertEqual(status, 201, body)
        self.assertNotIn("hashed_password", body)

        status, _ = client.json("POST", "/auth/login", json_body={"email": email, "password": PASSWORD})
        self.assertEqual(status, 403, "unverified users must not log in")

        code = self.otp_codes[email.lower()]
        wrong = "000000" if code != "000000" else "111111"
        self.assertEqual(client.json("POST", "/auth/verify-email", json_body={"email": email, "code": wrong})[0], 400)
        self.assertEqual(client.json("POST", "/auth/verify-email", json_body={"email": email, "code": code})[0], 200)
        self.assertEqual(client.json("POST", "/auth/verify-email", json_body={"email": email, "code": code})[0], 400,
                         "an OTP must not be reusable")

        self.assertEqual(client.json("POST", "/auth/login", json_body={"email": email, "password": "wrong-pass-1"})[0], 401)
        self.assertEqual(client.json("POST", "/auth/login", json_body={"email": email, "password": PASSWORD})[0], 200)
        status, me = client.json("GET", "/auth/me")
        self.assertEqual((status, me["email"], me["role"]), (200, email, "student"))
        self.assertEqual(client.request("POST", "/auth/refresh")[0], 200)
        self.assertEqual(client.request("POST", "/auth/logout")[0], 200)
        self.assertEqual(client.request("GET", "/auth/me")[0], 401)

    def test_register_rejects_duplicates_bad_invite_and_bad_photo(self):
        client = self.anon()
        email, status, _ = self._register(client, "dup", UserRole.student)
        self.assertEqual(status, 201)
        self.assertEqual(self._register(client, "dup2", UserRole.student, email=email)[1], 400)
        self.assertEqual(self._register(client, "fake-staff", UserRole.consultancy_staff, invite_code="nope")[1], 403)
        for bad in ({"terms_accepted": "false"}, {"national_id": "12-34"}):
            with self.subTest(bad=bad):
                _, status, body = self._register(client, "bad-field", UserRole.student, **bad)
                self.assertEqual(status, 422, body)
                self.assertEqual(body["detail"][0]["loc"][-1], next(iter(bad)))
        fields = {"full_name": "X Y", "email": "pdfphoto@example.com", "password": PASSWORD, "role": "student",
                  "national_id": f"{uuid.uuid4().int % 10**10:010d}", "date_of_birth": "2000-01-01", "gender": "Other",
                  "citizenship": "Nepali", "terms_accepted": "true"}
        status, _ = client.json("POST", "/auth/register", fields=fields, files={"photo": ("p.png", PDF, "image/png")})
        self.assertEqual(status, 400, "photo content must be sniffed, not trusted")

    def test_staff_signup_needs_approval_before_login(self):
        client = self.anon()
        email, status, _ = self._register(client, "pending-staff", UserRole.consultancy_staff)
        self.assertEqual(status, 201)
        client.json("POST", "/auth/verify-email", json_body={"email": email, "code": self.otp_codes[email.lower()]})
        status, _ = client.json("POST", "/auth/login", json_body={"email": email, "password": PASSWORD})
        self.assertEqual(status, 403)
        self.assertEqual(client.request("GET", "/auth/me")[0], 401)

    def test_forged_role_in_cookie_is_rejected(self):
        client = self.anon()
        req = urllib.request.Request(self.base + "/audit-logs", headers={"Cookie": "access_token=not-a-jwt"})
        try:
            urllib.request.urlopen(req)
            status = 200
        except urllib.error.HTTPError as err:
            status = err.code
        self.assertEqual(status, 401)

    # ---- student vs staff ------------------------------------------------

    def test_student_blocked_from_staff_apis(self):
        some_id = uuid.uuid4()
        staff_only = [
            ("GET", "/auth/pending"), ("GET", "/auth/users"), ("POST", f"/auth/{some_id}/approve"),
            ("POST", f"/auth/{some_id}/reject"), ("POST", f"/auth/{some_id}/deactivate"),
            ("POST", f"/auth/{some_id}/reactivate"), ("GET", "/documents"),
            ("PATCH", f"/documents/{some_id}/status"), ("GET", "/audit-logs"),
            ("POST", "/enquiries/staff/search"), ("GET", f"/enquiries/staff/{some_id}"),
            ("PATCH", f"/enquiries/staff/{some_id}"), ("GET", "/gallery/staff"), ("POST", "/gallery"),
            ("GET", f"/gallery/staff/{some_id}/image"), ("PATCH", f"/gallery/{some_id}"),
            ("DELETE", f"/gallery/{some_id}"),
        ]
        for method, path in staff_only:
            with self.subTest(route=f"{method} {path}"):
                status, _ = self.student_a.request(method, path, json_body={} if method in ("POST", "PATCH") else None)
                self.assertEqual(status, 403, f"{method} {path} returned {status}")

    def test_logged_in_reader_routes(self):
        for client in (self.student_a, self.staff):
            self.assertEqual(client.request("GET", "/destinations/australia")[0], 200)
            self.assertEqual(client.request("GET", "/destinations/compare?slugs=australia,canada")[0], 200)
            self.assertEqual(client.request("GET", "/directory/universities")[0], 200)
        # The study plan is a student-only feature.
        self.assertEqual(self.staff.request("GET", "/study-plan/me")[0], 403)

    def test_staff_can_use_staff_apis(self):
        for path in ("/auth/pending", "/auth/users", "/documents", "/audit-logs", "/gallery/staff"):
            with self.subTest(path=path):
                self.assertEqual(self.staff.request("GET", path)[0], 200)

    def test_student_cannot_change_own_role_or_approval(self):
        status, me = self.student_a.json("PATCH", "/auth/me", json_body={"role": "consultancy_staff", "is_approved": True, "citizenship": "Nepali"})
        self.assertIn(status, (200, 422))
        status, me = self.student_a.json("GET", "/auth/me")
        self.assertEqual(me["role"], "student")
        self.assertEqual(self.student_a.request("GET", "/audit-logs")[0], 403)

    # ---- student A vs student B -----------------------------------------

    def test_student_cannot_read_or_change_another_students_documents(self):
        doc_b = self.upload(self.student_b)
        a = self.student_a
        self.assertEqual(a.request("GET", f"/documents/{doc_b['id']}")[0], 403)
        self.assertEqual(a.request("GET", f"/documents/{doc_b['id']}/file")[0], 403)
        self.assertEqual(a.request("POST", f"/documents/{doc_b['id']}/replace",
                                   files={"file": ("x.pdf", PDF, "application/pdf")})[0], 403)
        self.assertEqual(a.request("DELETE", f"/documents/{doc_b['id']}")[0], 403)
        self.assertEqual(a.request("PATCH", f"/documents/{doc_b['id']}/status", json_body={"status": "reviewed"})[0], 403)
        status, mine = a.json("GET", "/documents/mine")
        self.assertEqual(status, 200)
        self.assertNotIn(doc_b["id"], [d["id"] for d in mine["items"]])
        # Owner and staff still can.
        self.assertEqual(self.student_b.request("GET", f"/documents/{doc_b['id']}/file")[0], 200)
        self.assertEqual(self.staff.request("GET", f"/documents/{doc_b['id']}/file")[0], 200)

    def test_student_cannot_read_another_students_messages(self):
        staff_id = self.staff.user["id"]
        status, msg_b = self.student_b.json("POST", "/messages", json_body={"receiver_id": staff_id, "body": "B private note"})
        self.assertEqual(status, 201, msg_b)
        b_id = self.student_b.user["id"]

        # A asking for "B's thread" or "staff's thread" only ever returns A's own messages.
        for other in (b_id, staff_id):
            status, thread = self.student_a.json("GET", f"/messages/thread/{other}")
            self.assertEqual(status, 200)
            self.assertFalse(any(m["body"] == "B private note" for m in thread))
        status, contacts = self.student_a.json("GET", "/messages/contacts")
        self.assertNotIn(b_id, [c["id"] for c in contacts])
        self.assertEqual(self.student_a.request("PATCH", f"/messages/{msg_b['id']}/read")[0], 403)
        # Students may only message staff, never each other.
        self.assertEqual(self.student_a.request("POST", "/messages", json_body={"receiver_id": b_id, "body": "hi"})[0], 403)
        # Staff sees it.
        status, thread = self.staff.json("GET", f"/messages/thread/{b_id}")
        self.assertTrue(any(m["body"] == "B private note" for m in thread))

    def test_student_cannot_attach_another_students_document_to_a_message(self):
        doc_b = self.upload(self.student_b)
        status, _ = self.student_a.json("POST", "/messages", json_body={
            "receiver_id": self.staff.user["id"], "body": "see attached", "document_id": doc_b["id"]})
        self.assertEqual(status, 403)
        status, _ = self.student_a.json("POST", "/messages", json_body={
            "receiver_id": self.staff.user["id"], "body": "see attached", "document_id": str(uuid.uuid4())})
        self.assertEqual(status, 404)
        doc_a = self.upload(self.student_a)
        status, _ = self.student_a.json("POST", "/messages", json_body={
            "receiver_id": self.staff.user["id"], "body": "my passport", "document_id": doc_a["id"]})
        self.assertEqual(status, 201)

    def test_student_cannot_read_or_change_another_students_study_plan(self):
        b, a = self.student_b, self.student_a
        status, plan = b.json("PATCH", "/study-plan/me", json_body={
            "preferred_countries": ["japan"], "preferences": {"notes": "B private plan"}})
        self.assertEqual(status, 200, plan)
        with patch("app.api.study_plan.directory_refs", return_value={"test-university"}):
            status, saved = b.json("POST", "/study-plan/me/saved", json_body={"kind": "university", "ref": "test-university"})
        self.assertEqual(status, 201, saved)

        status, plan_a = a.json("GET", "/study-plan/me")
        self.assertEqual(status, 200)
        self.assertNotIn("japan", plan_a["preferred_countries"])
        self.assertNotEqual(plan_a["preferences"].get("notes"), "B private plan")
        self.assertNotIn(saved["id"], [i["id"] for i in plan_a["saved_items"]])
        # A cannot delete B's saved item, and gets the same answer as for a missing id.
        self.assertEqual(a.request("DELETE", f"/study-plan/me/saved/{saved['id']}")[0], 404)
        # A editing "their" plan never touches B's.
        self.assertEqual(a.request("PATCH", "/study-plan/me", json_body={"preferred_countries": ["canada"]})[0], 200)
        status, plan_b = b.json("GET", "/study-plan/me")
        self.assertEqual(plan_b["preferred_countries"], ["japan"])
        self.assertIn(saved["id"], [i["id"] for i in plan_b["saved_items"]])
        # No user_id smuggling.
        self.assertEqual(a.request("PATCH", "/study-plan/me", json_body={"user_id": b.user["id"]})[0], 422)

    def test_profile_is_own_only(self):
        status, me_a = self.student_a.json("GET", "/auth/me")
        self.assertEqual(me_a["id"], self.student_a.user["id"])
        self.assertNotEqual(me_a["id"], self.student_b.user["id"])
        self.assertEqual(self.student_a.request("GET", "/auth/me/photo")[0], 200)


if __name__ == "__main__":
    unittest.main()
