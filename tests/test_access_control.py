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
from cryptography.fernet import Fernet
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
# Only these may register as staff during the tests (stands in for the STAFF_EMAILS env var).
STAFF_FIXTURE = "staff-fixture@example.com"
STAFF_ALLOWED = "staff-allowed@example.com"
STAFF_SECOND = "staff-second@example.com"
PASSWORD = "Correct-Horse-42"
PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde"
    b"\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82"
)
PDF = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"


def _engine():
    return create_async_engine(
        settings.async_database_url,
        connect_args={"server_settings": {"search_path": SCHEMA}},
    )


async def _create_schema():
    engine = _engine()
    async with engine.begin() as conn:
        await conn.execute(text(f'CREATE SCHEMA "{SCHEMA}"'))
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()


async def _drop_schema():
    engine = create_async_engine(settings.async_database_url)
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

    def cookie(self, name):
        jar = next(h for h in self.opener.handlers if isinstance(h, urllib.request.HTTPCookieProcessor)).cookiejar
        return next((c.value for c in jar if c.name == name), None)

    def request(self, method, path, json_body=None, fields=None, files=None, headers=None):
        data, headers = None, dict(headers or {})
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
    links: dict[str, str] = {}
    reset_codes: dict[str, str] = {}

    @staticmethod
    async def fake_email_check(email):
        # Offline stand-in for the DNS deliverability check (example.com publishes a null MX).
        return not email.endswith("@undeliverable-domain.com")

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

        async def capture_email(email, name, link, code):
            cls.otp_codes[email.lower()] = code
            cls.links[email.lower()] = link

        async def capture_reset(email, code, name):
            cls.reset_codes[email.lower()] = code

        cls.patches = [
            patch.object(auth_api, "send_password_reset_email", capture_reset),
            patch.object(settings, "UPLOAD_DIR", cls.upload_dir),
            patch.object(auth_api, "send_verification_email", capture_email),
            patch.object(settings, "STAFF_EMAILS", f"{STAFF_FIXTURE}, {STAFF_ALLOWED.upper()}, {STAFF_SECOND}"),
            patch.object(settings, "FRONTEND_URL", "https://vn.example.com"),
            patch.object(auth_api, "email_can_receive_mail", cls.fake_email_check),
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
        # proxy_headers=False mirrors the Dockerfile's --no-proxy-headers.
        cls.server = uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", port=port, log_level="warning", proxy_headers=False))
        cls.thread = threading.Thread(target=cls.server.run, daemon=True)
        cls.thread.start()
        cls.addClassCleanup(cls._stop_server)
        deadline = time.time() + 15
        while not cls.server.started:
            if time.time() > deadline:
                raise RuntimeError("test server did not start")
            time.sleep(0.05)
        cls.base = f"http://127.0.0.1:{port}"

        cls.staff = cls._register_and_login("staff", UserRole.consultancy_staff, email=STAFF_FIXTURE)
        cls.staff2 = cls._register_and_login("staff2", UserRole.consultancy_staff, email=STAFF_SECOND)
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
        fields.update(overrides)
        fields = {key: value for key, value in fields.items() if value is not None}
        status, body = client.json("POST", "/auth/register", fields=fields, files={"photo": ("p.png", PNG, "image/png")})
        return fields["email"], status, body

    @classmethod
    def _token(cls, email):
        link = cls.links[email.lower()]
        assert link.startswith("https://vn.example.com/verify-email?token="), link
        return link.split("token=", 1)[1]

    @classmethod
    def _register_and_login(cls, label, role, **overrides):
        client = Client(cls.base)
        email, status, body = cls._register(client, label, role, **overrides)
        assert status == 201, (status, body)
        status, body = client.json("POST", "/auth/verify-email", json_body={"token": cls._token(email)})
        assert status == 200, (status, body)
        status, body = client.json("POST", "/auth/login", json_body={"email": email, "password": PASSWORD})
        assert status == 200, (status, body)
        status, me = client.json("GET", "/auth/me")
        assert status == 200, (status, me)
        client.user = me
        client.email = email
        return client

    @staticmethod
    def _sql(statement, **params):
        async def run():
            engine = _engine()
            async with engine.begin() as conn:
                result = await conn.execute(text(statement), params)
                rows = result.all() if result.returns_rows else None
            await engine.dispose()
            return rows
        return asyncio.run(run())

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
        public = {"/health", "/auth/register", "/auth/verify-email", "/auth/resend-otp", "/auth/resend-verification",
                  "/auth/forgot-password",
                  "/auth/reset-password", "/auth/login", "/auth/logout", "/enquiries", "/gallery",
                  "/gallery/{item_id}/image", "/destinations/preview", "/docs", "/docs/oauth2-redirect", "/openapi.json"}
        source = open(__file__, encoding="utf-8").read()
        # The OpenAPI paths list every route whatever FastAPI's internal router layout is
        # (newer versions nest included routers, which hides them from app.routes).
        paths = sorted(app.openapi()["paths"])
        self.assertGreater(len(paths), 40, "route discovery found suspiciously few routes")
        for path in paths:
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

    def test_gallery_success_story_flag_is_staff_only_and_filters_public_list(self):
        def create(published):
            status, item = self.staff.json(
                "POST", "/gallery",
                fields={"caption": "Visa granted", "alt_text": "Student holding a visa letter", "category": "student-life",
                        "published": str(published).lower(), "publication_authorized": "true"},
                files={"file": ("s.png", PNG, "image/png")},
            )
            self.assertEqual(status, 201, item)
            self.assertFalse(item["is_success_story"])
            return item["id"]

        marked, unmarked, draft = create(True), create(True), create(False)
        self.assertEqual(self.student_a.json("PATCH", f"/gallery/{marked}", json_body={"is_success_story": True})[0], 403)
        for item_id in (marked, draft):
            status, body = self.staff.json("PATCH", f"/gallery/{item_id}", json_body={"is_success_story": True})
            self.assertEqual(status, 200, body)
            self.assertTrue(body["is_success_story"])
        self.assertEqual(self.staff.json("PATCH", f"/gallery/{marked}", json_body={"is_success_story": None})[0], 422)

        anon = self.anon()
        ids = lambda query: {item["id"] for item in anon.json("GET", f"/gallery{query}")[1]}
        self.assertEqual(ids("?success_story=true") & {marked, unmarked, draft}, {marked})
        self.assertEqual(ids("?success_story=false") & {marked, unmarked, draft}, {unmarked})
        self.assertEqual(ids("") & {marked, unmarked, draft}, {marked, unmarked})

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

    def test_register_rejects_duplicates_undeliverable_email_and_bad_photo(self):
        client = self.anon()
        email, status, _ = self._register(client, "dup", UserRole.student)
        self.assertEqual(status, 201)
        _, status, body = self._register(client, "nomail", UserRole.student, email="someone@undeliverable-domain.com")
        self.assertEqual(status, 400, body)
        self.assertIn("real email", body["detail"])
        self.assertNotIn("someone@undeliverable-domain.com", self.otp_codes, "no account or code for an undeliverable address")
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

    def test_principal_and_agent_sign_in_but_only_reach_pending_until_approved(self):
        for role in (UserRole.principal, UserRole.agent):
            with self.subTest(role=role):
                client = self.anon()
                email, status, body = self._register(client, f"pending-{role.value}", role)
                self.assertEqual(status, 201, body)
                self.assertEqual(body, {"message": body["message"]}, "sign-up never echoes account details")
                self.assertEqual(self._sql("SELECT is_approved, is_verified FROM users WHERE email = :e", e=email.lower())[0], (False, False))
                self.assertEqual(client.json("POST", "/auth/login", json_body={"email": email, "password": PASSWORD})[0], 403,
                                 "no sign-in before the email is verified")

                status, body = client.json("POST", "/auth/verify-email", json_body={"token": self._token(email)})
                self.assertEqual(status, 200, body)
                self.assertEqual((body["pending_approval"], body["status"], body["signed_in"]), (True, "pending", False))

                status, body = client.json("POST", "/auth/login", json_body={"email": email, "password": PASSWORD})
                self.assertEqual((status, body["status"]), (200, "pending"), "pending accounts may sign in")
                status, me = client.json("GET", "/auth/me")
                self.assertEqual((status, me["status"], me["role"]), (200, "pending", role.value))
                self.assertEqual(client.request("POST", "/auth/refresh")[0], 200)
                # ...but every other private API refuses them, enforced by the backend dependency.
                for method, path in (("GET", "/documents/mine"), ("GET", "/messages/contacts"), ("GET", "/auth/staff"),
                                     ("PATCH", "/auth/me"), ("GET", "/auth/me/photo"), ("GET", "/directory/universities"),
                                     ("GET", "/auth/pending")):
                    status, body = client.json(method, path, json_body={} if method == "PATCH" else None)
                    self.assertEqual(status, 403, f"{method} {path}")
                    self.assertIn("awaiting approval", body["detail"])

                status, pending = self.staff.json("GET", "/auth/pending")
                self.assertIn(email, [p["email"] for p in pending])
                me_id = me["id"]
                self.assertEqual(self.student_a.request("POST", f"/auth/{me_id}/approve")[0], 403, "students can't approve")
                self.assertEqual(client.request("POST", f"/auth/{me_id}/approve")[0], 403, "nobody approves themselves")
                status, body = self.staff.json("POST", f"/auth/{me_id}/approve")
                self.assertEqual(status, 200, body)
                self.assertEqual(client.json("GET", "/auth/me")[1]["status"], "active")
                self.assertEqual(client.request("GET", "/documents/mine")[0], 200, "approved accounts get full access")
                self.assertNotIn(email, [p["email"] for p in self.staff.json("GET", "/auth/pending")[1]])
                actions = [row[0] for row in self._sql("SELECT action FROM audit_logs WHERE target_id = :t", t=me_id)]
                self.assertIn("user_approved", actions)

    def test_rejected_agent_is_disabled_and_leaves_the_queue(self):
        client = self.anon()
        email, status, _ = self._register(client, "reject-agent", UserRole.agent)
        self.assertEqual(status, 201)
        client.json("POST", "/auth/verify-email", json_body={"token": self._token(email)})
        client.json("POST", "/auth/login", json_body={"email": email, "password": PASSWORD})
        user_id = client.json("GET", "/auth/me")[1]["id"]
        self.assertEqual(self.staff.json("POST", f"/auth/{user_id}/reject")[0], 200)
        self.assertNotIn(email, [p["email"] for p in self.staff.json("GET", "/auth/pending")[1]])
        self.assertEqual(client.request("GET", "/auth/me")[0], 401, "the existing session stops working")
        status, body = self.anon().json("POST", "/auth/login", json_body={"email": email, "password": PASSWORD})
        self.assertEqual((status, body["detail"]), (403, "Account is disabled"))

    def test_staff_signup_only_for_listed_emails(self):
        client = self.anon()
        email, status, body = self._register(client, "not-listed-staff", UserRole.consultancy_staff)
        self.assertEqual(status, 403, body)
        self.assertIn("approved staff email", body["detail"])
        self.assertNotIn(email.lower(), self.links, "no account or email for a refused staff sign-up")
        self.assertFalse(self._sql("SELECT 1 FROM users WHERE email = :e", e=email))

        # Listed (the list is case-insensitive): verify, then full staff access with no approval step.
        listed = self._register_and_login("listed-staff", UserRole.consultancy_staff, email="Staff-Allowed@Example.com")
        self.assertEqual((listed.user["email"], listed.user["status"], listed.user["role"]),
                         (STAFF_ALLOWED, "active", "consultancy_staff"))
        self.assertEqual(listed.request("GET", "/auth/pending")[0], 200)

    def test_student_is_active_right_after_verification(self):
        student = self._register_and_login("active-student", UserRole.student)
        self.assertEqual((student.user["status"], student.user["is_verified"]), ("active", True))
        self.assertEqual(student.request("GET", "/documents/mine")[0], 200)
        self.assertEqual(student.request("GET", "/study-plan/me")[0], 200)

    def test_verification_link_is_signed_single_use_and_expires(self):
        client = self.anon()
        email, status, _ = self._register(client, "link", UserRole.student)
        self.assertEqual(status, 201)
        token = self._token(email)
        stored = self._sql(
            "SELECT t.token_hash FROM email_verification_tokens t JOIN users u ON u.id = t.user_id WHERE u.email = :e", e=email)
        self.assertEqual(len(stored), 1)
        self.assertNotEqual(stored[0][0], token, "only a hash of the token is stored")
        self.assertEqual(len(stored[0][0]), 64)

        tampered = token[:-2] + ("AA" if token[-2:] != "AA" else "BB")
        for bad in (tampered, "not-a-token", self.staff.user["id"]):
            with self.subTest(bad=bad[:12]):
                self.assertEqual(client.json("POST", "/auth/verify-email", json_body={"token": bad})[0], 400)
        self.assertEqual(client.json("POST", "/auth/verify-email", json_body={})[0], 422)

        status, body = client.json("POST", "/auth/verify-email", json_body={"token": token})
        self.assertEqual((status, body["status"], body["signed_in"]), (200, "active", False))
        self.assertEqual(client.request("GET", "/auth/me")[0], 401, "a link verifies but does not sign in")
        self.assertEqual(client.json("POST", "/auth/verify-email", json_body={"token": token})[0], 400, "single use")

        # Expired: a valid signature is not enough once the stored expiry has passed.
        email2, _, _ = self._register(client, "expired-link", UserRole.student)
        self._sql("UPDATE email_verification_tokens SET expires_at = now() - interval '1 minute' "
                  "WHERE user_id = (SELECT id FROM users WHERE email = :e)", e=email2)
        self.assertEqual(client.json("POST", "/auth/verify-email", json_body={"token": self._token(email2)})[0], 400)
        self.assertEqual(client.json("POST", "/auth/login", json_body={"email": email2, "password": PASSWORD})[0], 403)

    def test_resend_verification_replaces_the_link_and_is_rate_limited(self):
        client = self.anon()
        email, status, _ = self._register(client, "resend", UserRole.student)
        self.assertEqual(status, 201)
        first = self._token(email)
        # Within the one-minute cooldown nothing new is sent.
        self.assertEqual(client.json("POST", "/auth/resend-verification", json_body={"email": email})[0], 200)
        self.assertEqual(self._token(email), first)
        self._sql("UPDATE email_verification_tokens SET created_at = now() - interval '2 minutes' "
                  "WHERE user_id = (SELECT id FROM users WHERE email = :e)", e=email)
        status, body = client.json("POST", "/auth/resend-verification", json_body={"email": email.upper()})
        self.assertEqual(status, 200, body)
        second = self._token(email)
        self.assertNotEqual(first, second)
        self.assertEqual(client.json("POST", "/auth/verify-email", json_body={"token": first})[0], 400, "old link revoked")
        self.assertEqual(client.json("POST", "/auth/verify-email", json_body={"token": second})[0], 200)

        # Same answer for unknown and already-verified addresses.
        for address in ("nobody-here@example.com", email):
            self.assertEqual(client.json("POST", "/auth/resend-verification", json_body={"email": address}),
                             (200, body))
        with patch.object(limiter, "enabled", True):
            limiter.reset()
            codes = [client.request("POST", "/auth/resend-verification", json_body={"email": "x@example.com"})[0]
                     for _ in range(4)]
            limiter.reset()
        self.assertEqual(codes, [200, 200, 200, 429])

    def test_email_is_stored_lowercase_and_unique_in_any_case(self):
        client = self.anon()
        mixed = f"Mixed.Case-{uuid.uuid4().hex[:6]}@Example.COM"
        _, status, body = self._register(client, "mixed", UserRole.student, email=mixed)
        self.assertEqual(status, 201)
        self.assertEqual(self._sql("SELECT email FROM users WHERE lower(email) = :e", e=mixed.lower()), [(mixed.lower(),)])
        status, _ = Client(self.base).json("POST", "/auth/verify-email", json_body={"token": self._token(mixed)})
        self.assertEqual(status, 200)
        for label, address in (("mixed2", mixed.lower()), ("mixed3", mixed.upper())):
            self.assertEqual(self._register(client, label, UserRole.student, email=address)[1], 201)
        self.assertEqual(self._sql("SELECT count(*) FROM users WHERE lower(email) = :e", e=mixed.lower())[0][0], 1)
        # The database itself refuses a case-variant duplicate.
        with self.assertRaises(Exception):
            self._sql("INSERT INTO users (id, email, hashed_password, full_name, role, is_active, is_verified, is_approved) "
                      "VALUES (gen_random_uuid(), :e, 'x', 'Dup', 'student', true, true, true)", e=mixed.upper())

    def test_register_without_national_id(self):
        client = self.anon()
        for label, nid in (("no-nid", None), ("blank-nid", "")):
            with self.subTest(nid=nid):
                _, status, body = self._register(client, label, UserRole.student, national_id=nid)
                self.assertEqual(status, 201, body)
                self.assertEqual(self._sql("SELECT national_id FROM users WHERE email = :e", e=_.lower())[0][0], None)

    def test_other_signup_stores_encrypted_bank_details(self):
        key = Fernet.generate_key()
        bank = {
            "bank_account_name": "Sita Sharma",
            "bank_name": "Example Bank",
            "bank_account_number": "0012 3456-7890",
            "bank_nominee_name": "Hari Sharma",
        }
        client = self.anon()
        with patch.object(settings, "BANK_DATA_ENCRYPTION_KEY", key.decode("ascii")):
            _, status, body = self._register(client, "other-nobank", UserRole.other)
            self.assertEqual(status, 422, body)
            self.assertNotIn("0012", json.dumps(body))

            _, status, body = self._register(client, "other-badbank", UserRole.other, **{**bank, "bank_account_name": "<b>"})
            self.assertEqual(status, 422, body)

            _, status, body = self._register(client, "parent-nobank", UserRole.parent)
            self.assertEqual(status, 201, body)

            email, status, body = self._register(client, "other-bank", UserRole.other, **bank)
        self.assertEqual(status, 201, body)
        self.assertFalse({"bank_account_name", "bank_name", "bank_account_number", "bank_nominee_name"} & set(body))
        self.assertNotIn("001234567890", json.dumps(body))

        async def stored():
            engine = _engine()
            async with engine.connect() as conn:
                row = (await conn.execute(text(
                    "SELECT b.account_name, b.bank_name, b.account_number_encrypted, b.account_last4, b.nominee_name "
                    "FROM user_bank_details b JOIN users u ON u.id = b.user_id WHERE u.email = :e"
                ), {"e": email})).one()
            await engine.dispose()
            return row

        account_name, bank_name, encrypted, last4, nominee = asyncio.run(stored())
        self.assertEqual((account_name, bank_name, last4, nominee), ("Sita Sharma", "Example Bank", "7890", "Hari Sharma"))
        self.assertNotIn("001234567890", encrypted)
        self.assertEqual(Fernet(key).decrypt(encrypted.encode("ascii")).decode("ascii"), "001234567890")

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

    # ---- hardening: small fixes ------------------------------------------------

    def test_documents_and_photos_are_not_cached_and_still_open_inline(self):
        doc = self.upload(self.student_a)
        for client, path in ((self.student_a, f"/documents/{doc['id']}/file"), (self.student_a, "/auth/me/photo")):
            req = urllib.request.Request(self.base + path)
            with client.opener.open(req) as res:
                self.assertEqual(res.status, 200)
                self.assertEqual(res.headers["Cache-Control"], "private, no-store")
                if "documents" in path:
                    self.assertTrue(res.headers["Content-Disposition"].startswith("inline"))

    def test_unknown_email_and_wrong_password_look_identical(self):
        anon = self.anon()
        wrong_pw = anon.json("POST", "/auth/login", json_body={"email": self.student_a.email, "password": "wrong-pass-1"})
        unknown = anon.json("POST", "/auth/login", json_body={"email": "never-registered@example.com", "password": "wrong-pass-1"})
        self.assertEqual(wrong_pw, unknown)

    def test_staff_search_treats_percent_and_underscore_literally(self):
        def enquire(name):
            status, body = self.anon().json("POST", "/enquiries", json_body={
                "submission_key": str(uuid.uuid4()), "full_name": name, "email": f"{uuid.uuid4().hex[:8]}@example.com",
                "phone": "+977 9800000000", "privacy_consent": True})
            self.assertEqual(status, 201, body)
        token = uuid.uuid4().hex[:6]
        enquire(f"Wild%{token} One"); enquire(f"Wild_{token} Two"); enquire(f"WildX{token} Three")
        def names(term):
            status, page = self.staff.json("POST", "/enquiries/staff/search", json_body={"search": term})
            self.assertEqual(status, 200, page)
            return sorted(item["full_name"] for item in page["items"])
        self.assertEqual(names(f"%{token}"), [f"Wild%{token} One"])
        self.assertEqual(names(f"_{token}"), [f"Wild_{token} Two"])
        self.assertEqual(len(names(f"{token}")), 3)

    def test_startup_warns_about_demo_mode_in_production(self):
        from app.core.config import Settings
        base = dict(_env_file=None, SECRET_KEY="s" * 40, DATABASE_URL="postgresql://x", COOKIE_SECURE=True,
                    CORS_ORIGINS="https://a.example.com", FRONTEND_URL="https://a.example.com")
        demo = Settings(ENVIRONMENT="production", DEMO_MODE=True, **base)
        self.assertTrue(any("DEMO_MODE=true in production" in w for w in demo.startup_warnings))
        live = Settings(ENVIRONMENT="production", DEMO_MODE=False, EMAIL_ENABLED=True, SMTP_HOST="h", SMTP_FROM="f@x.com", **base)
        self.assertEqual(live.startup_warnings, [])
        self.assertEqual(Settings(ENVIRONMENT="development", DEMO_MODE=True, **base).startup_warnings, [])

    # ---- hardening: per-IP rate limit keys ------------------------------------

    def _resend_statuses(self, headers_list):
        client = Client(self.base)
        with patch.object(limiter, "enabled", True):
            limiter.reset()
            try:
                return [client.request("POST", "/auth/resend-verification",
                                       json_body={"email": "x@example.com"}, headers=h)[0] for h in headers_list]
            finally:
                limiter.reset()

    def test_forged_x_forwarded_for_does_not_dodge_the_ip_limit(self):
        forged = [{"X-Forwarded-For": f"203.0.113.{n}"} for n in range(1, 6)]
        self.assertEqual(self._resend_statuses(forged), [200, 200, 200, 429, 429])

    def test_ip_limit_counts_per_cf_connecting_ip(self):
        same = [{"CF-Connecting-IP": "198.51.100.7"}] * 4
        self.assertEqual(self._resend_statuses(same), [200, 200, 200, 429])
        # A different visitor has their own allowance; so does one identified only by the socket.
        mixed = [{"CF-Connecting-IP": "198.51.100.7"}] * 3 + [{"CF-Connecting-IP": "198.51.100.8"}]
        self.assertEqual(self._resend_statuses(mixed), [200, 200, 200, 200])

    def test_client_ip_helper(self):
        from types import SimpleNamespace
        from app.core.client_ip import client_ip

        def request(headers=None, host="10.0.0.9"):
            return SimpleNamespace(headers={k.lower(): v for k, v in (headers or {}).items()},
                                   client=SimpleNamespace(host=host) if host else None)

        self.assertEqual(client_ip(request({"CF-Connecting-IP": " 203.0.113.5 "})), "203.0.113.5")
        self.assertEqual(client_ip(request({"CF-Connecting-IP": "2001:db8::1"})), "2001:db8::1")
        # Missing, empty or not-an-IP header: fall back to the connection address. X-Forwarded-For is never used.
        self.assertEqual(client_ip(request()), "10.0.0.9")
        self.assertEqual(client_ip(request({"CF-Connecting-IP": "not-an-ip"})), "10.0.0.9")
        self.assertEqual(client_ip(request({"X-Forwarded-For": "203.0.113.5"})), "10.0.0.9")
        self.assertEqual(client_ip(request(host=None)), "unknown")
        with patch.object(settings, "CLIENT_IP_HEADER", ""):
            self.assertEqual(client_ip(request({"CF-Connecting-IP": "203.0.113.5"})), "10.0.0.9")

    # ---- hardening: input limits ---------------------------------------------

    def test_oversized_text_fields_are_422_not_500(self):
        anon = self.anon()
        _, status, body = self._register(anon, "toolong", UserRole.student, gender="x" * 21)
        self.assertEqual(status, 422, body)
        _, status, body = self._register(anon, "toolong2", UserRole.student, target_country="y" * 101)
        self.assertEqual(status, 422, body)
        status, body = self.student_a.json("PATCH", "/auth/me", json_body={"target_field": "z" * 256})
        self.assertEqual(status, 422, body)
        status, body = self.student_a.json("POST", "/documents/upload",
                                           fields={"doc_type": "d", "college_name": "c" * 256, "university_name": "u"},
                                           files={"file": ("a.pdf", PDF, "application/pdf")})
        self.assertEqual(status, 422, body)
        self.assertEqual(anon.json("POST", "/auth/login", json_body={"email": "a@example.com", "password": "p" * 5000})[0], 422)
        self.assertEqual(anon.json("POST", "/auth/reset-password", json_body={
            "email": "a@example.com", "code": "1" * 50, "new_password": PASSWORD})[0], 422)
        # Values at the limit are still accepted.
        status, body = self.student_a.json("PATCH", "/auth/me", json_body={"target_field": "z" * 255, "gender": "g" * 20})
        self.assertEqual(status, 200, body)

    # ---- hardening: staff account actions --------------------------------------

    def test_staff_cannot_deactivate_reactivate_or_reject_other_staff_or_themselves(self):
        other = self.staff2.user["id"]
        for action in ("deactivate", "reactivate", "reject"):
            with self.subTest(action=action):
                status, body = self.staff.json("POST", f"/auth/{other}/{action}")
                self.assertEqual(status, 403, body)
        self.assertEqual(self.staff.request("POST", f"/auth/{self.staff.user['id']}/deactivate")[0], 400)
        self.assertEqual(self.staff.request("POST", f"/auth/{self.staff.user['id']}/reject")[0], 400)
        self.assertEqual(self.staff2.request("GET", "/auth/me")[0], 200, "the other staff account is untouched")

    def test_reject_only_applies_to_accounts_still_waiting_for_approval(self):
        client = self._register_and_login("approved-principal", UserRole.principal)
        self.assertEqual(self.staff.json("POST", f"/auth/{client.user['id']}/approve")[0], 200)
        status, body = self.staff.json("POST", f"/auth/{client.user['id']}/reject")
        self.assertEqual(status, 400, body)
        self.assertIn("already approved", body["detail"])

    def test_staff_actions_return_only_what_the_screen_needs(self):
        client = self._register_and_login("narrow", UserRole.agent)
        allowed = {"id", "full_name", "email", "role", "is_active", "is_approved", "created_at"}
        for action in ("approve", "deactivate", "reactivate"):
            with self.subTest(action=action):
                status, body = self.staff.json("POST", f"/auth/{client.user['id']}/{action}")
                self.assertEqual(status, 200, body)
                self.assertEqual(set(body), allowed)

    def test_malformed_user_ids_get_422_not_500(self):
        for action in ("approve", "reject", "deactivate", "reactivate"):
            with self.subTest(action=action):
                self.assertEqual(self.staff.request("POST", f"/auth/not-a-uuid/{action}")[0], 422)

    # ---- hardening: API schema and removed routes -----------------------------

    def test_openapi_and_docs_are_hidden_in_production_only(self):
        from app.main import api_doc_urls
        self.assertEqual(api_doc_urls("production"), {"docs_url": None, "openapi_url": None, "redoc_url": None})
        self.assertEqual(api_doc_urls("development")["openapi_url"], "/openapi.json")

    def test_bearer_token_endpoint_is_gone(self):
        status, _ = self.anon().request("POST", "/auth/token", fields={"username": self.student_a.email, "password": PASSWORD})
        self.assertIn(status, (404, 405))

    # ---- hardening: sign-up does not reveal existing accounts -----------------

    def test_signup_answers_the_same_for_new_and_registered_emails(self):
        anon = self.anon()
        fresh_email, fresh_status, fresh_body = self._register(anon, "same-new", UserRole.student)
        taken_email = self.student_a.email
        codes_before = dict(self.otp_codes)
        _, taken_status, taken_body = self._register(anon, "same-taken", UserRole.student, email=taken_email)
        self.assertEqual((fresh_status, taken_status), (201, 201))
        self.assertEqual(fresh_body, taken_body)
        self.assertIn("If this email can be used", fresh_body["message"])
        self.assertEqual(self.otp_codes, codes_before, "no email or code is sent for a registered address")
        self.assertEqual(self._sql("SELECT count(*) FROM users WHERE lower(email) = :e", e=taken_email.lower())[0][0], 1)
        # The registered account is untouched: its owner still signs in with the old password.
        self.assertEqual(Client(self.base).json("POST", "/auth/login", json_body={"email": taken_email, "password": PASSWORD})[0], 200)

    def test_signup_with_a_taken_national_id_creates_nothing_and_looks_normal(self):
        anon = self.anon()
        taken_nid = self._sql("SELECT national_id FROM users WHERE email = :e", e=self.student_a.email.lower())[0][0]
        email, status, body = self._register(anon, "nid-dup", UserRole.student, national_id=taken_nid)
        self.assertEqual(status, 201)
        self.assertIn("If this email can be used", body["message"])
        self.assertEqual(self._sql("SELECT count(*) FROM users WHERE email = :e", e=email.lower())[0][0], 0)

    def test_registering_again_replaces_a_never_verified_signup(self):
        anon = self.anon()
        email, status, _ = self._register(anon, "squat", UserRole.student, password="Squatter-Pass-1")
        self.assertEqual(status, 201)
        first_link = self.links[email.lower()]
        _, status, _ = self._register(anon, "squat", UserRole.student, email=email, password=PASSWORD)
        self.assertEqual(status, 201)
        self.assertEqual(self._sql("SELECT count(*) FROM users WHERE email = :e", e=email.lower())[0][0], 1)
        self.assertNotEqual(self.links[email.lower()], first_link, "the new sign-up gets its own link")
        owner = Client(self.base)
        self.assertEqual(owner.json("POST", "/auth/verify-email", json_body={"token": self._token(email)})[0], 200)
        self.assertEqual(owner.json("POST", "/auth/login", json_body={"email": email, "password": "Squatter-Pass-1"})[0], 401)
        self.assertEqual(owner.json("POST", "/auth/login", json_body={"email": email, "password": PASSWORD})[0], 200)

    def test_invalid_details_are_reported_the_same_for_taken_and_new_emails(self):
        anon = self.anon()
        fields = {"full_name": "X Y", "email": self.student_a.email, "password": PASSWORD, "role": "student",
                  "date_of_birth": "2000-01-01", "gender": "Other", "citizenship": "Nepali", "terms_accepted": "true"}
        status, _ = anon.json("POST", "/auth/register", fields=fields, files={"photo": ("p.png", PDF, "image/png")})
        self.assertEqual(status, 400, "a bad photo is refused even when the email is taken")

    # ---- hardening: session revocation -------------------------------------

    def test_logout_revokes_the_copied_tokens_but_not_other_devices(self):
        client = self._register_and_login("revoke", UserRole.student)
        stolen = {"Cookie": f"access_token={client.cookie('access_token')}; refresh_token={client.cookie('refresh_token')}"}
        other_device = Client(self.base)
        self.assertEqual(other_device.json("POST", "/auth/login", json_body={"email": client.email, "password": PASSWORD})[0], 200)
        self.assertEqual(self.anon().request("GET", "/auth/me", headers=stolen)[0], 200)
        self.assertEqual(client.request("POST", "/auth/logout")[0], 200)
        anon = self.anon()
        self.assertEqual(anon.request("GET", "/auth/me", headers=stolen)[0], 401, "copied access token must stop working")
        self.assertEqual(anon.request("POST", "/auth/refresh", headers=stolen)[0], 401, "copied refresh token must stop working")
        self.assertEqual(other_device.request("GET", "/auth/me")[0], 200, "other devices stay signed in")

    def test_password_reset_ends_older_sessions(self):
        client = self._register_and_login("resetter", UserRole.student)
        old = {"Cookie": f"access_token={client.cookie('access_token')}; refresh_token={client.cookie('refresh_token')}"}
        self.assertEqual(self.anon().json("POST", "/auth/forgot-password", json_body={"email": client.email})[0], 200)
        time.sleep(1.1)  # token times are whole seconds
        new_password = "Another-Passw0rd!"
        status, body = self.anon().json("POST", "/auth/reset-password", json_body={
            "email": client.email, "code": self.reset_codes[client.email.lower()], "new_password": new_password})
        self.assertEqual(status, 200, body)
        anon = self.anon()
        self.assertEqual(anon.request("GET", "/auth/me", headers=old)[0], 401)
        self.assertEqual(anon.request("POST", "/auth/refresh", headers=old)[0], 401)
        fresh = Client(self.base)
        self.assertEqual(fresh.json("POST", "/auth/login", json_body={"email": client.email, "password": new_password})[0], 200)
        self.assertEqual(fresh.request("GET", "/auth/me")[0], 200, "a sign-in after the reset works")

    def test_deactivation_ends_sessions_even_after_reactivation(self):
        victim = self._register_and_login("deact", UserRole.student)
        old = {"Cookie": f"access_token={victim.cookie('access_token')}"}
        time.sleep(1.1)
        self.assertEqual(self.staff.request("POST", f"/auth/{victim.user['id']}/deactivate")[0], 200)
        self.assertEqual(self.staff.request("POST", f"/auth/{victim.user['id']}/reactivate")[0], 200)
        self.assertEqual(self.anon().request("GET", "/auth/me", headers=old)[0], 401)
        self.assertEqual(Client(self.base).json("POST", "/auth/login", json_body={"email": victim.email, "password": PASSWORD})[0], 200)

    # ---- hardening: per-account login throttle ----------------------------

    def test_repeated_wrong_passwords_pause_sign_in_for_that_email_only(self):
        victim = self._register_and_login("throttle", UserRole.student)
        other = self.anon()
        for _ in range(settings.LOGIN_MAX_FAILURES):
            status, _ = other.json("POST", "/auth/login", json_body={"email": victim.email, "password": "wrong-pass-1"})
            self.assertEqual(status, 401)
        # Even the right password is refused while paused, whatever the IP.
        status, body = other.json("POST", "/auth/login", json_body={"email": victim.email, "password": PASSWORD})
        self.assertEqual(status, 429, body)
        # Someone else is unaffected, and so is an address that does not exist (same 401, no hint).
        self.assertEqual(self.anon().json("POST", "/auth/login", json_body={"email": self.student_a.email, "password": PASSWORD})[0], 200)
        for _ in range(settings.LOGIN_MAX_FAILURES + 1):
            status, _ = self.anon().json("POST", "/auth/login", json_body={"email": "ghost-nobody@example.com", "password": "wrong-pass-1"})
        self.assertEqual(status, 429)
        # A successful sign-in clears the count.
        from app.core import login_throttle
        login_throttle.reset(victim.email)
        self.assertEqual(self.anon().json("POST", "/auth/login", json_body={"email": victim.email, "password": PASSWORD})[0], 200)

    # ---- hardening: upload limits -----------------------------------------

    def test_oversized_uploads_are_refused(self):
        limit = settings.MAX_UPLOAD_MB * 1024 * 1024
        fields = {"doc_type": "passport", "college_name": "C", "university_name": "U"}
        # Just over the file limit but under the request cap: refused by the bounded read.
        big_file = PDF + b"0" * (limit - len(PDF) + 10)
        status, body = self.student_a.json("POST", "/documents/upload", fields=fields,
                                           files={"file": ("big.pdf", big_file, "application/pdf")})
        self.assertEqual(status, 400, body)
        self.assertIn("limit", body["detail"])
        # Far over: refused from the Content-Length header, before the body is processed.
        huge = PDF + b"0" * (limit + 2 * 1024 * 1024)
        try:
            status, body = self.anon().json("POST", "/auth/register", fields={"email": "x@example.com"},
                                            files={"photo": ("p.png", huge, "image/png")})
            self.assertEqual(status, 413, body)
        except (ConnectionError, urllib.error.URLError):
            pass  # the server answered 413 and hung up while the client was still sending: also a refusal
        # A file under the limit still works.
        self.upload(self.student_a)


if __name__ == "__main__":
    unittest.main()
