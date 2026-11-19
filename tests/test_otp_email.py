import asyncio
import io
import unittest
from contextlib import redirect_stdout
from unittest.mock import AsyncMock, patch

from app.core import otp
from app.core.config import Settings

LINK = "https://vn.example.com/verify-email?token=abc.def&x=1"
PROD = dict(_env_file=None, SECRET_KEY="x" * 40, DATABASE_URL="postgresql://x", ENVIRONMENT="production",
            FRONTEND_URL="https://example.com")


class OtpEmailTests(unittest.TestCase):
    def test_production_without_email_refuses_instead_of_printing_code(self):
        out = io.StringIO()
        with patch.object(otp.settings, "EMAIL_ENABLED", False), patch.object(otp.settings, "ENVIRONMENT", "production"):
            with redirect_stdout(out), self.assertRaises(otp.EmailNotConfigured):
                asyncio.run(otp.send_verification_email("a@example.com", "A", LINK, "123456"))
        self.assertNotIn("123456", out.getvalue())

    def test_smtp_uses_implicit_tls_on_465_and_escapes_name(self):
        send = AsyncMock()
        with patch.object(otp.settings, "EMAIL_ENABLED", True), patch.object(otp.settings, "SMTP_PORT", 465), \
                patch.object(otp.settings, "SMTP_FROM", "VN Group <no-reply@example.com>"), patch.object(otp.aiosmtplib, "send", send):
            asyncio.run(otp.send_verification_email("a@example.com", "<b>x</b>", LINK, "123456"))
        msg, kwargs = send.call_args.args[0], send.call_args.kwargs
        self.assertTrue(kwargs["use_tls"])
        self.assertFalse(kwargs["start_tls"])
        html = msg.get_body(("html",)).get_content()
        self.assertIn("123456", html)
        self.assertIn('href="https://vn.example.com/verify-email?token=abc.def&amp;x=1"', html)
        self.assertNotIn("<b>x</b>", html)

    def test_smtp_failure_propagates(self):
        with patch.object(otp.settings, "EMAIL_ENABLED", True), \
                patch.object(otp.aiosmtplib, "send", AsyncMock(side_effect=OSError("down"))):
            with self.assertLogs("app.core.otp", "ERROR") as logs, self.assertRaises(OSError):
                asyncio.run(otp.send_password_reset_email("a@example.com", "654321", "A"))
        self.assertNotIn("654321", "".join(logs.output))

    def test_production_settings_reject_unsafe_values(self):
        with self.assertRaises(ValueError):
            Settings(**PROD, COOKIE_SECURE=False, CORS_ORIGINS="http://localhost:5173")
        ok = dict(PROD, COOKIE_SECURE=True, EMAIL_ENABLED=True, SMTP_HOST="smtp.example.com",
                  SMTP_FROM="no-reply@example.com", CORS_ORIGINS="https://example.com")
        Settings(**ok)
        for bad_url in ("http://example.com", "https://localhost:5173"):
            with self.subTest(frontend_url=bad_url), self.assertRaises(ValueError):
                Settings(**{**ok, "FRONTEND_URL": bad_url})

    def test_demo_mode_runs_production_without_smtp_but_keeps_other_checks(self):
        Settings(**PROD, DEMO_MODE=True, COOKIE_SECURE=True, CORS_ORIGINS="https://example.com")
        with self.assertRaises(ValueError):
            Settings(**PROD, DEMO_MODE=True, COOKIE_SECURE=False, CORS_ORIGINS="https://example.com")

    def test_demo_mode_logs_email_in_production(self):
        out = io.StringIO()
        with patch.object(otp.settings, "EMAIL_ENABLED", False), patch.object(otp.settings, "ENVIRONMENT", "production"), \
                patch.object(otp.settings, "DEMO_MODE", True), redirect_stdout(out):
            asyncio.run(otp.send_verification_email("a@example.com", "A", LINK, "123456"))
        self.assertIn("123456", out.getvalue())

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
