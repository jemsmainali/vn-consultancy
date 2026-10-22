import hashlib
import hmac
import secrets
from email.message import EmailMessage

import aiosmtplib

from app.core.config import settings


def generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def hash_otp(email: str, code: str) -> str:
    msg = f"{email.lower()}:{code}".encode()
    return hmac.new(settings.SECRET_KEY.encode(), msg, hashlib.sha256).hexdigest()


async def send_otp_email(to_email: str, code: str, name: str) -> None:
    if not settings.EMAIL_ENABLED:
        # Development only: show the code in the server terminal instead of emailing it.
        print(f"[DEV] Verification code for {to_email}: {code}")
        return

    msg = EmailMessage()
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to_email
    msg["Subject"] = "Your VN Group verification code"
    msg.set_content(
        f"Hi {name},\n\nYour verification code is {code}.\n"
        f"It expires in {settings.OTP_EXPIRE_MINUTES} minutes.\n\n"
        "If you didn't create an account with VN Group, you can ignore this email."
    )
    msg.add_alternative(
        f"""<div style="font-family:Segoe UI,Arial,sans-serif;background:#FAF6EC;padding:24px">
        <div style="max-width:420px;margin:auto;background:#fff;border-radius:12px;padding:24px;color:#14213D">
        <h2 style="font-family:Georgia,serif;margin:0 0 12px">VN Group</h2>
        <p>Hi {name}, your verification code is:</p>
        <p style="font-size:32px;letter-spacing:8px;font-weight:bold;margin:16px 0">{code}</p>
        <p style="color:#555;font-size:13px">It expires in {settings.OTP_EXPIRE_MINUTES} minutes.
        If you didn't create an account, ignore this email.</p></div></div>""",
        subtype="html",
    )

    await aiosmtplib.send(
        msg,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER,
        password=settings.SMTP_PASSWORD,
        start_tls=True,
    )


async def send_plain_email(to_email: str, subject: str, heading: str, body: str) -> None:
    if not settings.EMAIL_ENABLED:
        print(f"[DEV] Email to {to_email} — {subject}: {body}")
        return

    msg = EmailMessage()
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)
    msg.add_alternative(
        f"""<div style="font-family:Segoe UI,Arial,sans-serif;background:#FAF6EC;padding:24px">
        <div style="max-width:420px;margin:auto;background:#fff;border-radius:12px;padding:24px;color:#14213D">
        <h2 style="font-family:Georgia,serif;margin:0 0 12px">VN Group</h2>
        <p>{heading}</p>
        <p style="color:#555;font-size:14px">{body}</p></div></div>""",
        subtype="html",
    )
    await aiosmtplib.send(
        msg, hostname=settings.SMTP_HOST, port=settings.SMTP_PORT,
        username=settings.SMTP_USER, password=settings.SMTP_PASSWORD, start_tls=True,
    )


async def send_password_reset_email(to_email: str, code: str, name: str) -> None:
    if not settings.EMAIL_ENABLED:
        print(f"[DEV] Password reset code for {to_email}: {code}")
        return

    msg = EmailMessage()
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to_email
    msg["Subject"] = "Reset your VN Group password"
    msg.set_content(
        f"Hi {name},\n\nUse this code to reset your password: {code}\n"
        f"It expires in {settings.OTP_EXPIRE_MINUTES} minutes.\n\n"
        "If you didn't request this, you can safely ignore this email - your password won't change."
    )
    msg.add_alternative(
        f"""<div style="font-family:Segoe UI,Arial,sans-serif;background:#FAF6EC;padding:24px">
        <div style="max-width:420px;margin:auto;background:#fff;border-radius:12px;padding:24px;color:#14213D">
        <h2 style="font-family:Georgia,serif;margin:0 0 12px">VN Group</h2>
        <p>Hi {name}, use this code to reset your password:</p>
        <p style="font-size:32px;letter-spacing:8px;font-weight:bold;margin:16px 0">{code}</p>
        <p style="color:#555;font-size:13px">It expires in {settings.OTP_EXPIRE_MINUTES} minutes.
        If you didn't request this, ignore this email - your password stays the same.</p></div></div>""",
        subtype="html",
    )
    await aiosmtplib.send(
        msg, hostname=settings.SMTP_HOST, port=settings.SMTP_PORT,
        username=settings.SMTP_USER, password=settings.SMTP_PASSWORD, start_tls=True,
    )