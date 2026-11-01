import asyncio
import io
import unittest
from contextlib import redirect_stdout
from unittest.mock import AsyncMock, patch

from app.core import otp
from app.core.config import Settings


class OtpEmailTests(unittest.TestCase):
    def test_production_without_email_refuses_instead_of_printing_code(self):
        out = io.StringIO()
        with patch.object(otp.settings, "EMAIL_ENABLED", False), patch.object(otp.settings, "ENVIRONMENT", "production"):
            with redirect_stdout(out), self.assertRaises(otp.EmailNotConfigured):
                asyncio.run(otp.send_otp_email("a@example.com", "123456", "A"))
        self.assertNotIn("123456", out.getvalue())

    def test_smtp_uses_implicit_tls_on_465_and_escapes_name(self):
        send = AsyncMock()
        with patch.object(otp.settings, "EMAIL_ENABLED", True), patch.object(otp.settings, "SMTP_PORT", 465), \
                patch.object(otp.settings, "SMTP_FROM", "VN Group <no-reply@example.com>"), patch.object(otp.aiosmtplib, "send", send):
            asyncio.run(otp.send_otp_email("a@example.com", "123456", "<b>x</b>"))
        msg, kwargs = send.call_args.args[0], send.call_args.kwargs
        self.assertTrue(kwargs["use_tls"])
        self.assertFalse(kwargs["start_tls"])
        html = msg.get_body(("html",)).get_content()
        self.assertIn("123456", html)
        self.assertNotIn("<b>x</b>", html)

    def test_smtp_failure_propagates(self):
        with patch.object(otp.settings, "EMAIL_ENABLED", True), \
                patch.object(otp.aiosmtplib, "send", AsyncMock(side_effect=OSError("down"))):
            with self.assertLogs("app.core.otp", "ERROR") as logs, self.assertRaises(OSError):
                asyncio.run(otp.send_password_reset_email("a@example.com", "654321", "A"))
        self.assertNotIn("654321", "".join(logs.output))

    def test_production_settings_reject_unsafe_values(self):
        with self.assertRaises(ValueError):
            Settings(_env_file=None, SECRET_KEY="x" * 40, DATABASE_URL="postgresql://x", ENVIRONMENT="production",
                     COOKIE_SECURE=False, CORS_ORIGINS="http://localhost:5173")
        Settings(_env_file=None, SECRET_KEY="x" * 40, DATABASE_URL="postgresql://x", ENVIRONMENT="production",
                 COOKIE_SECURE=True, EMAIL_ENABLED=True, SMTP_HOST="smtp.example.com",
                 SMTP_FROM="no-reply@example.com", CORS_ORIGINS="https://example.com")


if __name__ == "__main__":
    unittest.main()
