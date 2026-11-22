import asyncio
import io
import unittest
from contextlib import redirect_stdout
from unittest.mock import MagicMock, patch

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

    def test_resend_payload_escapes_name_and_never_hits_the_network(self):
        send = MagicMock()
        with patch.object(otp.settings, "EMAIL_ENABLED", True), patch.object(otp.settings, "RESEND_API_KEY", "re_test_key"),                 patch.object(otp.settings, "EMAIL_FROM", "VN Group <noreply@send.example.com>"),                 patch.object(otp.resend.Emails, "send", send):
            asyncio.run(otp.send_verification_email("a@example.com", "<b>x</b>", LINK, "123456"))
        params = send.call_args.args[0]
        self.assertEqual(params["from"], "VN Group <noreply@send.example.com>")
        self.assertEqual(params["to"], ["a@example.com"])
        self.assertIn("123456", params["html"])
        self.assertIn('href="https://vn.example.com/verify-email?token=abc.def&amp;x=1"', params["html"])
        self.assertNotIn("<b>x</b>", params["html"])

    def test_resend_failure_propagates_and_logs_no_code_or_key(self):
        with patch.object(otp.settings, "EMAIL_ENABLED", True), patch.object(otp.settings, "RESEND_API_KEY", "re_secret_key"),                 patch.object(otp.settings, "EMAIL_FROM", "VN <n@example.com>"),                 patch.object(otp.resend.Emails, "send", MagicMock(side_effect=OSError("down"))):
            with self.assertLogs("app.core.otp", "ERROR") as logs, self.assertRaises(OSError):
                asyncio.run(otp.send_password_reset_email("a@example.com", "654321", "A"))
        joined = "".join(logs.output)
        self.assertNotIn("654321", joined)
        self.assertNotIn("re_secret_key", joined)

    def test_enabled_without_key_refuses(self):
        with patch.object(otp.settings, "EMAIL_ENABLED", True), patch.object(otp.settings, "RESEND_API_KEY", ""),                 self.assertRaises(otp.EmailNotConfigured):
            asyncio.run(otp.send_plain_email("a@example.com", "s", "h", "b"))

    def test_production_settings_reject_unsafe_values(self):
        with self.assertRaises(ValueError):
            Settings(**PROD, COOKIE_SECURE=False, CORS_ORIGINS="http://localhost:5173")
        ok = dict(PROD, COOKIE_SECURE=True, EMAIL_ENABLED=True, RESEND_API_KEY="re_x",
                  EMAIL_FROM="VN <no-reply@example.com>", CORS_ORIGINS="https://example.com")
        Settings(**ok)
        for bad_url in ("http://example.com", "https://localhost:5173"):
            with self.subTest(frontend_url=bad_url), self.assertRaises(ValueError):
                Settings(**{**ok, "FRONTEND_URL": bad_url})

    def test_production_requires_smtp(self):
        with self.assertRaises(ValueError):
            Settings(**PROD, COOKIE_SECURE=True, CORS_ORIGINS="https://example.com")

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
