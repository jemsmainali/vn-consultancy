import asyncio
import io
import unittest
from contextlib import redirect_stdout
from unittest.mock import AsyncMock, patch

import httpx

from app.core import otp
from app.core.config import Settings

LINK = "https://vn.example.com/verify-email?token=abc.def&x=1"
PROD = dict(_env_file=None, SECRET_KEY="x" * 40, DATABASE_URL="postgresql://x", ENVIRONMENT="production",
            FRONTEND_URL="https://example.com")


def configured(key="brevo_test_key"):
    """Patches that turn email on with a sender; no real request is ever made (httpx is always mocked)."""
    return (
        patch.object(otp.settings, "EMAIL_ENABLED", True),
        patch.object(otp.settings, "BREVO_API_KEY", key),
        patch.object(otp.settings, "EMAIL_FROM_NAME", "VN Group"),
        patch.object(otp.settings, "EMAIL_FROM_ADDRESS", "noreply@send.example.com"),
    )


class OtpEmailTests(unittest.TestCase):
    def test_production_without_email_refuses_instead_of_printing_code(self):
        out = io.StringIO()
        with patch.object(otp.settings, "EMAIL_ENABLED", False), patch.object(otp.settings, "ENVIRONMENT", "production"):
            with redirect_stdout(out), self.assertRaises(otp.EmailNotConfigured):
                asyncio.run(otp.send_verification_email("a@example.com", "A", LINK, "123456"))
        self.assertNotIn("123456", out.getvalue())

    def test_brevo_request_has_correct_url_payload_headers_and_escapes_name(self):
        post = AsyncMock(return_value=httpx.Response(201, json={"messageId": "x"}))
        p1, p2, p3, p4 = configured()
        with p1, p2, p3, p4, patch.object(httpx.AsyncClient, "post", post):
            asyncio.run(otp.send_verification_email("a@example.com", "<b>x</b>", LINK, "123456"))
        self.assertEqual(post.call_args.args[0], "https://api.brevo.com/v3/smtp/email")
        kwargs = post.call_args.kwargs
        self.assertEqual(kwargs["headers"], {"api-key": "brevo_test_key", "accept": "application/json",
                                             "content-type": "application/json"})
        body = kwargs["json"]
        self.assertEqual(body["sender"], {"name": "VN Group", "email": "noreply@send.example.com"})
        self.assertEqual(body["to"], [{"email": "a@example.com"}])
        self.assertEqual(body["subject"], "Verify your VN Group email address")
        self.assertIn("123456", body["htmlContent"])
        self.assertIn('href="https://vn.example.com/verify-email?token=abc.def&amp;x=1"', body["htmlContent"])
        self.assertNotIn("<b>x</b>", body["htmlContent"])

    def test_timeout_is_ten_seconds(self):
        created = {}
        real = httpx.AsyncClient

        def spy(*args, **kwargs):
            created.update(kwargs)
            return real(*args, **kwargs)

        post = AsyncMock(return_value=httpx.Response(201))
        p1, p2, p3, p4 = configured()
        with p1, p2, p3, p4, patch.object(otp.httpx, "AsyncClient", spy), patch.object(real, "post", post):
            asyncio.run(otp.send_plain_email("a@example.com", "s", "h", "b"))
        self.assertEqual(created["timeout"], 10)

    def test_non_2xx_is_a_failure_and_logs_no_code_key_or_body(self):
        post = AsyncMock(return_value=httpx.Response(401, text='{"message":"bad key brevo_secret_key 654321"}'))
        p1, p2, p3, p4 = configured("brevo_secret_key")
        with p1, p2, p3, p4, patch.object(httpx.AsyncClient, "post", post):
            with self.assertLogs("app.core.otp", "ERROR") as logs, self.assertRaises(otp.EmailDeliveryError):
                asyncio.run(otp.send_password_reset_email("a@example.com", "654321", "A"))
        joined = "".join(logs.output)
        self.assertIn("401", joined)
        self.assertIn("Reset your VN Group password", joined)
        self.assertNotIn("654321", joined)
        self.assertNotIn("brevo_secret_key", joined)
        self.assertNotIn("a@example.com", joined)

    def test_network_error_propagates_and_logs_only_the_type(self):
        post = AsyncMock(side_effect=httpx.ConnectTimeout("timed out"))
        p1, p2, p3, p4 = configured("brevo_secret_key")
        with p1, p2, p3, p4, patch.object(httpx.AsyncClient, "post", post):
            with self.assertLogs("app.core.otp", "ERROR") as logs, self.assertRaises(httpx.ConnectTimeout):
                asyncio.run(otp.send_password_reset_email("a@example.com", "654321", "A"))
        joined = "".join(logs.output)
        self.assertIn("ConnectTimeout", joined)
        self.assertNotIn("654321", joined)
        self.assertNotIn("brevo_secret_key", joined)

    def test_enabled_without_key_or_sender_is_refused_without_a_request(self):
        post = AsyncMock()
        for field in ("BREVO_API_KEY", "EMAIL_FROM_NAME", "EMAIL_FROM_ADDRESS"):
            with self.subTest(missing=field):
                p1, p2, p3, p4 = configured()
                with p1, p2, p3, p4, patch.object(otp.settings, field, ""), \
                        patch.object(httpx.AsyncClient, "post", post), self.assertRaises(otp.EmailNotConfigured):
                    asyncio.run(otp.send_plain_email("a@example.com", "s", "h", "b"))
        post.assert_not_called()

    def test_production_settings_reject_unsafe_values(self):
        with self.assertRaises(ValueError):
            Settings(**PROD, COOKIE_SECURE=False, CORS_ORIGINS="http://localhost:5173")
        ok = dict(PROD, COOKIE_SECURE=True, EMAIL_ENABLED=True, BREVO_API_KEY="k", EMAIL_FROM_NAME="VN Group",
                  EMAIL_FROM_ADDRESS="no-reply@example.com", CORS_ORIGINS="https://example.com")
        Settings(**ok)
        for bad_url in ("http://example.com", "https://localhost:5173"):
            with self.subTest(frontend_url=bad_url), self.assertRaises(ValueError):
                Settings(**{**ok, "FRONTEND_URL": bad_url})

    def test_production_requires_all_three_brevo_settings(self):
        base = dict(PROD, COOKIE_SECURE=True, EMAIL_ENABLED=True, BREVO_API_KEY="k", EMAIL_FROM_NAME="VN Group",
                    EMAIL_FROM_ADDRESS="no-reply@example.com", CORS_ORIGINS="https://example.com")
        Settings(**base)
        for field in ("BREVO_API_KEY", "EMAIL_FROM_NAME", "EMAIL_FROM_ADDRESS"):
            with self.subTest(missing=field), self.assertRaises(ValueError):
                Settings(**{**base, field: ""})
        with self.assertRaises(ValueError):
            Settings(**{**base, "EMAIL_ENABLED": False})

    def test_production_never_prints_codes_when_email_is_off(self):
        out = io.StringIO()
        with patch.object(otp.settings, "EMAIL_ENABLED", False), patch.object(otp.settings, "ENVIRONMENT", "production"), \
                redirect_stdout(out), self.assertRaises(otp.EmailNotConfigured):
            asyncio.run(otp.send_verification_email("a@example.com", "A", LINK, "123456"))
        self.assertNotIn("123456", out.getvalue())

    def test_development_prints_the_verification_link_to_the_console(self):
        out = io.StringIO()
        with patch.object(otp.settings, "EMAIL_ENABLED", False), patch.object(otp.settings, "ENVIRONMENT", "development"), \
                redirect_stdout(out):
            asyncio.run(otp.send_verification_email("a@example.com", "A", LINK, "123456"))
        self.assertIn(LINK, out.getvalue())

    def test_staff_emails_are_parsed_case_insensitively(self):
        s = Settings(_env_file=None, SECRET_KEY="x" * 40, DATABASE_URL="postgresql://x",
                     STAFF_EMAILS=" Pawan@Example.com,ops@example.com ,, ")
        self.assertEqual(s.staff_emails, frozenset({"pawan@example.com", "ops@example.com"}))


if __name__ == "__main__":
    unittest.main()
