import asyncio
import hashlib
import hmac
import logging
import secrets
from html import escape

import resend

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
        if settings.ENVIRONMENT == "production":
            # Never fall back to printing codes on a live server.
            raise EmailNotConfigured("EMAIL_ENABLED is false in production")
        # Development only: show the email in the server log instead of sending it.
        print(f"[DEV] Email to {to_email} - {subject}\n{text}", flush=True)
        return

    if not (settings.RESEND_API_KEY and settings.EMAIL_FROM):
        raise EmailNotConfigured("RESEND_API_KEY and EMAIL_FROM must be set when EMAIL_ENABLED is true")

    params = {"from": settings.EMAIL_FROM, "to": [to_email], "subject": subject, "text": text, "html": html}
    try:
        # The Resend SDK is blocking; run it off the event loop. The key is passed per request, never logged.
        await asyncio.to_thread(_resend_send, params)
    except Exception as exc:
        # Log the failure type only - never the message body (it contains the code) or the API key.
        logger.error("Email delivery via Resend failed (%s): %s", type(exc).__name__, subject)
        raise


def _resend_send(params: dict) -> None:
    resend.api_key = settings.RESEND_API_KEY
    resend.Emails.send(params)


async def send_verification_email(to_email: str, name: str, link: str, code: str) -> None:
    """One email with the 24-hour verification link and, as a fallback, the short-lived 6-digit code."""
    hours = settings.EMAIL_VERIFY_EXPIRE_HOURS
    minutes = settings.OTP_EXPIRE_MINUTES
    button = (
        f'<p style="margin:20px 0"><a href="{escape(link, quote=True)}" style="display:inline-block;background:#102544;'
        'color:#FFFFFF;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px">Verify my email</a></p>'
        '<p style="margin:0 0 4px;font-size:13px;color:#5B6576">Or enter this code on the verification page:</p>'
    )
    await _send(
        to_email,
        "Verify your VN Group email address",
        f"Hi {name},\n\nConfirm your email address for VN Group by opening this link within {hours} hours:\n{link}\n\n"
        f"Or enter this code on the verification page within {minutes} minutes: {code}\n\n"
        "Never share this link or code. VN Group staff will never ask for them.\n"
        "If you didn't create an account with VN Group, you can ignore this email.",
        _html(
            f"Hi {escape(name)}, verify your email address",
            "<p style=\"margin:0\">Confirm this is your email address to finish creating your VN Group account.</p>" + button,
            code,
            f"The button works for {hours} hours and only once. The code expires in {minutes} minutes. "
            "Never share either - VN Group staff will never ask for them. If you didn't create an account, ignore this email.",
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
