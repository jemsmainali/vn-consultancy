import hashlib
import hmac
import logging
import secrets
from email.message import EmailMessage
from email.utils import formatdate, make_msgid
from html import escape

import aiosmtplib

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailNotConfigured(RuntimeError):
    pass


def generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def hash_otp(email: str, code: str) -> str:
    msg = f"{email.lower()}:{code}".encode()
    return hmac.new(settings.SECRET_KEY.encode(), msg, hashlib.sha256).hexdigest()


def _html(heading: str, body_html: str, code: str | None = None, note: str = "") -> str:
    code_block = (
        f'<p style="margin:20px 0;padding:14px 0;border:1px solid #E3D3B0;border-radius:10px;background:#FBF7EE;'
        f'text-align:center;font-size:32px;font-weight:700;letter-spacing:10px;color:#102544">{code}</p>'
        if code else ""
    )
    note_block = f'<p style="margin:0;font-size:13px;color:#5B6576">{note}</p>' if note else ""
    return f"""<!doctype html><html><body style="margin:0;background:#F6F8FC;padding:24px 12px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#202938">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#FFFFFF;border-radius:12px;overflow:hidden">
<tr><td style="background:#102544;padding:18px 24px;color:#FFFFFF;font-size:18px;font-weight:700">VN Group <span style="color:#C9A45C">Study Abroad</span></td></tr>
<tr><td style="padding:24px;font-size:15px;line-height:1.6">
<p style="margin:0 0 12px;font-weight:600;color:#102544">{heading}</p>{body_html}{code_block}{note_block}
</td></tr>
<tr><td style="padding:14px 24px;border-top:1px solid #E9EEF5;font-size:12px;color:#5B6576">This is an automated message from VN Group. Please do not reply to it.</td></tr>
</table></td></tr></table></body></html>"""


async def _send(to_email: str, subject: str, text: str, html: str) -> None:
    if not settings.EMAIL_ENABLED:
        if settings.ENVIRONMENT == "production" and not settings.DEMO_MODE:
            # Never fall back to printing codes on a live server.
            raise EmailNotConfigured("EMAIL_ENABLED is false in production")
        # Development / synthetic-data demo only: show the email in the server log instead of sending it.
        print(f"[DEV] Email to {to_email} - {subject}\n{text}", flush=True)
        return

    msg = EmailMessage()
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to_email
    msg["Subject"] = subject
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid(domain=settings.SMTP_FROM.rsplit("@", 1)[-1].strip("> ") or None)
    msg.set_content(text)
    msg.add_alternative(html, subtype="html")

    implicit_tls = settings.SMTP_PORT == 465
    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER or None,
            password=settings.SMTP_PASSWORD or None,
            use_tls=implicit_tls,
            start_tls=not implicit_tls,
            timeout=20,
        )
    except Exception as exc:
        # Log the failure type only - never the message body, which contains the code.
        logger.error("Email delivery to SMTP failed (%s): %s", type(exc).__name__, subject)
        raise


async def send_otp_email(to_email: str, code: str, name: str) -> None:
    minutes = settings.OTP_EXPIRE_MINUTES
    await _send(
        to_email,
        "Your VN Group verification code",
        f"Hi {name},\n\nYour VN Group verification code is {code}.\n"
        f"Enter it on the verification page within {minutes} minutes.\n\n"
        "Never share this code. VN Group staff will never ask for it.\n"
        "If you didn't create an account with VN Group, you can ignore this email.",
        _html(
            f"Hi {escape(name)}, verify your email address",
            "<p style=\"margin:0\">Enter this code on the verification page to finish creating your account.</p>",
            code,
            f"The code expires in {minutes} minutes. Never share it - VN Group staff will never ask for it. "
            "If you didn't create an account, ignore this email.",
        ),
    )


async def send_password_reset_email(to_email: str, code: str, name: str) -> None:
    minutes = settings.OTP_EXPIRE_MINUTES
    await _send(
        to_email,
        "Reset your VN Group password",
        f"Hi {name},\n\nUse this code to reset your VN Group password: {code}\n"
        f"It expires in {minutes} minutes.\n\n"
        "If you didn't request this, ignore this email - your password won't change.",
        _html(
            f"Hi {escape(name)}, reset your password",
            "<p style=\"margin:0\">Enter this code on the reset password page to choose a new password.</p>",
            code,
            f"The code expires in {minutes} minutes. If you didn't request this, ignore this email - your password stays the same.",
        ),
    )


async def send_plain_email(to_email: str, subject: str, heading: str, body: str) -> None:
    await _send(
        to_email,
        subject,
        f"{heading}\n\n{body}",
        _html(escape(heading), f"<p style=\"margin:0;color:#5B6576\">{escape(body)}</p>"),
    )
