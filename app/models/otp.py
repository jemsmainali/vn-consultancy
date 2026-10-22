import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, Integer, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from email.message import EmailMessage
import aiosmtplib
from app.core.config import settings
from app.core.database import Base


class EmailOTP(Base):
    __tablename__ = "email_otps"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    purpose: Mapped[str] = mapped_column(String(20), nullable=False, server_default="verify")
    code_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    
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