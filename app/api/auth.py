import hmac
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, Form, File, UploadFile, Query
from fastapi.encoders import jsonable_encoder
from sqlalchemy import select, delete, func, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from app.core.client_ip import client_ip
from app.core.security import JWTError
from pydantic import ValidationError

from app.core.config import settings
from app.core.bank_data import encrypt_bank_account_number
from app.core.database import get_db
from app.core import login_throttle
from app.core.email_check import email_can_receive_mail
from app.core.otp import generate_otp, hash_otp, send_verification_email, send_plain_email, send_password_reset_email
from app.core.security import (
    hash_password,
    verify_password_or_dummy,
    create_access_token,
    create_refresh_token,
    create_email_verification_token,
    decode_token,
    hash_token,
)
from app.models.user import User, UserRole
from app.models.otp import EmailOTP
from app.models.revoked_token import RevokedToken
from app.models.email_verification import EmailVerificationToken
from app.models.audit import AuditLog
from app.models.bank_details import UserBankDetails
from app.schemas.user import (
    UserCreate, UserUpdate, UserOut, UserLogin, StaffOut, PendingUserOut,
    StaffUserOut, UserListPage,
    VerifyEmailRequest, VerifyEmailResponse, ResendRequest, ROLES_REQUIRING_BANK_DETAILS, RegisterResponse,
    ForgotPasswordRequest, ResetPasswordRequest,
)
from app.schemas.token import TokenPair
from app.api.deps import get_current_user, get_signed_in_user, require_role, session_is_revoked
from app.core.storage import StorageMissing, get_storage, guess_media_type
from app.utils.file_validation import validate_and_save_upload

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=client_ip)

# New principal and agent sign-ups wait for staff approval after verifying their email.
ROLES_AWAITING_APPROVAL_AT_SIGNUP = (UserRole.principal, UserRole.agent)
# Staff can approve or reject these. consultancy_staff stays for staff accounts created before STAFF_EMAILS.
ROLES_NEEDING_APPROVAL = (*ROLES_AWAITING_APPROVAL_AT_SIGNUP, UserRole.consultancy_staff)
RESEND_COOLDOWN_SECONDS = 60
PROFILE_PHOTO_MIMES = ["image/jpeg", "image/png"]
USER_LIST_PAGE_SIZE = 20


def _tokens(user: User) -> TokenPair:
    return TokenPair(
        access_token=create_access_token(str(user.id), user.role.value),
        refresh_token=create_refresh_token(str(user.id), user.role.value),
    )


def _set_auth_cookies(response: Response, t: TokenPair) -> None:
    """
    httpOnly cookies can't be read by JavaScript (unlike localStorage), which is
    what keeps these tokens safe even if an XSS bug ever runs attacker JS on the page.
    """
    response.set_cookie(
        key="access_token",
        value=t.access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=t.refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path=f"{settings.API_PATH_PREFIX}/auth",  # only ever sent back to /auth/* routes - narrows its exposure
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path=f"{settings.API_PATH_PREFIX}/auth")


async def _find_user(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(func.lower(User.email) == email.lower()))
    return result.scalar_one_or_none()


async def _latest_otp(db: AsyncSession, email: str, purpose: str = "verify") -> EmailOTP | None:
    result = await db.execute(
        select(EmailOTP)
        .where(EmailOTP.email == email, EmailOTP.purpose == purpose)
        .order_by(EmailOTP.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def _clear_verification(db: AsyncSession, user: User) -> None:
    await db.execute(delete(EmailVerificationToken).where(EmailVerificationToken.user_id == user.id))
    await db.execute(delete(EmailOTP).where(EmailOTP.email == user.email, EmailOTP.purpose == "verify"))


async def issue_verification(db: AsyncSession, user: User) -> None:
    """Emails a fresh 24-hour link (and a 6-digit fallback code), replacing any earlier ones.

    Skips silently if one was sent under a minute ago, so resend can't be used to flood an inbox.
    """
    last = (await db.execute(
        select(EmailVerificationToken.created_at)
        .where(EmailVerificationToken.user_id == user.id)
        .order_by(EmailVerificationToken.created_at.desc())
        .limit(1)
    )).scalar_one_or_none()
    if last and (datetime.now(timezone.utc) - last).total_seconds() < RESEND_COOLDOWN_SECONDS:
        return

    await _clear_verification(db, user)
    token = create_email_verification_token(str(user.id))
    code = generate_otp()
    now = datetime.now(timezone.utc)
    db.add(EmailVerificationToken(
        user_id=user.id,
        token_hash=hash_token(token),
        expires_at=now + timedelta(hours=settings.EMAIL_VERIFY_EXPIRE_HOURS),
    ))
    db.add(EmailOTP(
        email=user.email,
        purpose="verify",
        code_hash=hash_otp(user.email, code),
        expires_at=now + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
    ))
    await db.commit()

    link = f"{settings.FRONTEND_URL.rstrip('/')}/verify-email?token={token}"
    try:
        await send_verification_email(user.email, user.full_name, link, code)
    except Exception:
        # Drop the undelivered link and code so the user can request new ones straight away.
        await _clear_verification(db, user)
        await db.commit()
        raise HTTPException(502, "We couldn't send the verification email. Please use \"Resend email\" in a moment.")


REGISTER_MESSAGE = (
    "If this email can be used for a new account, we've sent a verification link and code to it. "
    "Check your inbox and spam folder. If nothing arrives, you may already have an account: try signing in or resetting your password."
)


async def _remove_profile_photo(stored_filename: str) -> None:
    await get_storage().delete("profile_photos", stored_filename)


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(
    request: Request,
    full_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    role: UserRole = Form(UserRole.student),
    invite_code: str | None = Form(None),
    national_id: str | None = Form(None),
    date_of_birth: str = Form(...),
    gender: str = Form(...),
    citizenship: str = Form(...),
    passport_number: str | None = Form(None),
    target_course_level: str | None = Form(None),
    target_field: str | None = Form(None),
    target_country: str | None = Form(None),
    parent_name: str | None = Form(None),
    parent_phone: str | None = Form(None),
    parent_email: str | None = Form(None),
    bank_account_name: str | None = Form(None),
    bank_name: str | None = Form(None),
    bank_account_number: str | None = Form(None),
    bank_nominee_name: str | None = Form(None),
    terms_accepted: bool = Form(...),
    photo: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    try:
        payload = UserCreate(
            full_name=full_name,
            email=email,
            password=password,
            role=role,
            invite_code=invite_code,
            national_id=national_id,
            date_of_birth=date_of_birth,
            gender=gender,
            citizenship=citizenship,
            passport_number=passport_number,
            target_course_level=target_course_level,
            target_field=target_field,
            target_country=target_country,
            parent_name=parent_name,
            parent_phone=parent_phone,
            parent_email=parent_email or None,
            bank_account_name=bank_account_name,
            bank_name=bank_name,
            bank_account_number=bank_account_number,
            bank_nominee_name=bank_nominee_name,
            terms_accepted=terms_accepted,
        )
    except ValidationError as e:
        # Custom validators put the raw ValueError in ctx; encode it like main.py's handler or this becomes a 500.
        raise HTTPException(422, jsonable_encoder(e.errors(include_input=False)))

    # No invite code: principal and staff accounts are gated by email verification plus approval
    # by existing VN Group staff (is_approved=False below). `invite_code` is still accepted and ignored.

    if not payload.terms_accepted:
        raise HTTPException(400, "You must accept the Terms and Conditions to register")

    # Staff accounts only for addresses VN Group listed in STAFF_EMAILS; checked before anything is stored.
    if payload.role == UserRole.consultancy_staff and payload.email not in settings.staff_emails:
        raise HTTPException(403, "VN Group staff accounts can only be created with an approved staff email address.")

    if not await email_can_receive_mail(payload.email):
        raise HTTPException(400, "Please use a real email address you can open. We'll send a code to it to confirm it's yours.")

    # Everything that can be wrong with the submitted details is reported before the duplicate checks,
    # and a duplicate gets the same answer as a new sign-up, so the form can't be used to discover accounts.
    bank_values = None
    if payload.role in ROLES_REQUIRING_BANK_DETAILS:
        try:
            encrypted_account_number = encrypt_bank_account_number(payload.bank_account_number)
        except ValueError:
            raise HTTPException(503, "Bank details registration is temporarily unavailable.") from None
        bank_values = {
            "account_name": payload.bank_account_name,
            "bank_name": payload.bank_name,
            "account_number_encrypted": encrypted_account_number,
            "account_last4": payload.bank_account_number[-4:],
            "nominee_name": payload.bank_nominee_name,
        }

    saved = await validate_and_save_upload(photo, subfolder="profile_photos", allowed_mimes=PROFILE_PHOTO_MIMES)
    try:
        hashed_password = hash_password(payload.password)  # done on every path, so timing doesn't reveal duplicates

        existing = await _find_user(db, payload.email)
        if existing and existing.is_active and not existing.is_verified:
            # Never confirmed, so it can't have been used: whoever registers again with this address
            # (most likely its real owner) replaces it. This stops a stranger holding someone else's email.
            old_photo = existing.profile_image
            try:
                await _clear_verification(db, existing)
                await db.delete(existing)
                await db.commit()
                existing = None
                if old_photo:
                    await _remove_profile_photo(old_photo)
            except IntegrityError:
                await db.rollback()
        nid_taken = bool(payload.national_id) and (
            await db.execute(select(User.id).where(User.national_id == payload.national_id))
        ).first() is not None
        if existing or nid_taken:
            await _remove_profile_photo(saved["stored_filename"])
            return RegisterResponse(message=REGISTER_MESSAGE)

        user = User(
            email=payload.email,
            hashed_password=hashed_password,
            full_name=payload.full_name,
            role=payload.role,
            national_id=payload.national_id,
            date_of_birth=payload.date_of_birth,
            gender=payload.gender,
            citizenship=payload.citizenship,
            passport_number=payload.passport_number,
            target_course_level=payload.target_course_level,
            target_field=payload.target_field,
            target_country=payload.target_country,
            parent_name=payload.parent_name,
            parent_phone=payload.parent_phone,
            parent_email=payload.parent_email,
            profile_image=saved["stored_filename"],
            terms_accepted_at=datetime.now(timezone.utc),
            is_verified=False,
            is_approved=payload.role not in ROLES_AWAITING_APPROVAL_AT_SIGNUP,
        )
        db.add(user)
        try:
            if bank_values:
                await db.flush()
                db.add(UserBankDetails(user_id=user.id, **bank_values))
            await db.commit()
        except IntegrityError:
            # A simultaneous sign-up took the same email or National ID first.
            await db.rollback()
            await _remove_profile_photo(saved["stored_filename"])
            return RegisterResponse(message=REGISTER_MESSAGE)
        await db.refresh(user)
    except Exception:
        # Don't leave the uploaded photo behind if the account could not be created.
        await _remove_profile_photo(saved["stored_filename"])
        raise

    await issue_verification(db, user)
    return RegisterResponse(message=REGISTER_MESSAGE)


PENDING_MESSAGE = (
    "Your email is verified. VN Group staff now need to approve your account. "
    "You can sign in, but you'll only see an \"awaiting approval\" page until they do. We'll email you once that happens."
)


async def _verify_with_token(db: AsyncSession, token: str) -> User:
    invalid = HTTPException(400, "This verification link is invalid, expired or already used. Request a new one below.")
    try:
        claims = decode_token(token, expected_type="verify_email")
    except JWTError:
        raise invalid
    now = datetime.now(timezone.utc)
    # Claim the token atomically so two clicks can't both use it.
    user_id = (await db.execute(
        update(EmailVerificationToken)
        .where(
            EmailVerificationToken.token_hash == hash_token(token),
            EmailVerificationToken.used_at.is_(None),
            EmailVerificationToken.expires_at > now,
        )
        .values(used_at=now)
        .returning(EmailVerificationToken.user_id)
    )).scalar_one_or_none()
    if user_id is None or str(user_id) != claims.get("sub"):
        await db.rollback()
        raise invalid
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user or not user.is_active:
        await db.rollback()
        raise invalid
    return user


async def _verify_with_code(db: AsyncSession, email: str, code: str) -> User:
    invalid = HTTPException(400, "Invalid or expired code")
    user = await _find_user(db, email)
    otp = await _latest_otp(db, user.email, purpose="verify") if user and user.is_active else None
    if not user or not otp:
        raise invalid
    if otp.expires_at < datetime.now(timezone.utc) or otp.attempts >= settings.OTP_MAX_ATTEMPTS:
        raise invalid
    if not hmac.compare_digest(otp.code_hash, hash_otp(user.email, code)):
        otp.attempts += 1
        await db.commit()
        raise invalid
    return user


@router.post("/verify-email", response_model=VerifyEmailResponse)
@limiter.limit("10/minute")
async def verify_email(request: Request, response: Response, payload: VerifyEmailRequest, db: AsyncSession = Depends(get_db)):
    if payload.token:
        user = await _verify_with_token(db, payload.token)
    else:
        user = await _verify_with_code(db, payload.email, payload.code)

    user.is_verified = True
    await _clear_verification(db, user)  # every other link and code for this account stops working
    await db.commit()

    pending = user.status == "pending"
    # The code is typed into the browser that registered, so that path signs in (as before).
    # A link can be opened anywhere, so it only verifies; the person then signs in with their password.
    signed_in = not payload.token
    if signed_in:
        _set_auth_cookies(response, _tokens(user))
    return VerifyEmailResponse(
        pending_approval=pending,
        message=PENDING_MESSAGE if pending else "Your email is verified.",
        signed_in=signed_in,
        status=user.status,
    )


async def _resend(db: AsyncSession, email: str) -> dict:
    user = await _find_user(db, email)
    if user and user.is_active and not user.is_verified:
        await issue_verification(db, user)
    # Same answer either way, so this can't be used to discover registered addresses.
    return {"message": "If that account still needs verification, a new email is on its way."}


@router.post("/resend-verification")
@limiter.limit("3/minute")
async def resend_verification(request: Request, payload: ResendRequest, db: AsyncSession = Depends(get_db)):
    return await _resend(db, payload.email)


@router.post("/resend-otp", include_in_schema=False)
@limiter.limit("3/minute")
async def resend_otp(request: Request, payload: ResendRequest, db: AsyncSession = Depends(get_db)):
    """Older name for /auth/resend-verification, kept so existing clients keep working."""
    return await _resend(db, payload.email)


@router.post("/forgot-password")
@limiter.limit("3/minute")
async def forgot_password(request: Request, payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    # Always return the same message, whether or not the email exists -
    # this is what stops someone from using this form to discover registered emails.
    generic = {"message": "If an account exists for that email, we've sent password reset instructions."}

    user = await _find_user(db, payload.email)
    if not user or not user.is_active:
        return generic

    last = await _latest_otp(db, user.email, purpose="reset")
    if last and (datetime.now(timezone.utc) - last.created_at).total_seconds() < 60:
        return generic  # already sent one recently - don't spam

    code = generate_otp()
    await db.execute(delete(EmailOTP).where(EmailOTP.email == user.email, EmailOTP.purpose == "reset"))
    db.add(EmailOTP(
        email=user.email,
        purpose="reset",
        code_hash=hash_otp(user.email, code),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
    ))
    await db.commit()

    try:
        await send_password_reset_email(user.email, code, user.full_name)
    except Exception:
        # Still return the generic message (no account enumeration); the failure is logged in otp._send.
        await db.execute(delete(EmailOTP).where(EmailOTP.email == user.email, EmailOTP.purpose == "reset"))
        await db.commit()

    return generic


@router.post("/reset-password")
@limiter.limit("5/minute")
async def reset_password(request: Request, payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    invalid = HTTPException(400, "Invalid or expired code")

    user = await _find_user(db, payload.email)
    otp = await _latest_otp(db, user.email, purpose="reset") if user else None
    if not user or not otp:
        raise invalid
    if otp.expires_at < datetime.now(timezone.utc) or otp.attempts >= settings.OTP_MAX_ATTEMPTS:
        raise invalid

    if not hmac.compare_digest(otp.code_hash, hash_otp(user.email, payload.code)):
        otp.attempts += 1
        await db.commit()
        raise invalid

    user.hashed_password = hash_password(payload.new_password)
    user.sessions_valid_after = datetime.now(timezone.utc)  # every session signed in with the old password ends
    await db.execute(delete(EmailOTP).where(EmailOTP.email == user.email, EmailOTP.purpose == "reset"))
    await db.commit()

    return {"message": "Your password has been reset. You can now sign in."}


@router.post("/login")
@limiter.limit("10/minute")
async def login(request: Request, response: Response, payload: UserLogin, db: AsyncSession = Depends(get_db)):
    wait = login_throttle.retry_after_seconds(payload.email)
    if wait:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "Too many failed sign-in attempts for this account. Please wait a few minutes and try again, or reset your password.",
            headers={"Retry-After": str(wait)},
        )
    user = await _find_user(db, payload.email)

    if not verify_password_or_dummy(payload.password, user.hashed_password if user else None):
        login_throttle.record_failure(payload.email)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    login_throttle.reset(payload.email)
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is disabled")
    if not user.is_verified:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Please verify your email to continue")
    # Pending principals and agents may sign in; get_current_user then limits them to the "awaiting approval" page.

    _set_auth_cookies(response, _tokens(user))
    return {"message": "Logged in", "status": user.status}


@router.post("/refresh")
@limiter.limit("20/minute")
async def refresh(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "No refresh token provided")
    try:
        data = decode_token(refresh_token, expected_type="refresh")
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired refresh token")

    result = await db.execute(select(User).where(User.id == data["sub"]))
    user = result.scalar_one_or_none()
    if not user or user.status in ("disabled", "unverified") or await session_is_revoked(db, user, data):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User no longer valid")

    _set_auth_cookies(response, _tokens(user))  # rotates both tokens on every refresh
    return {"message": "Refreshed"}


@router.post("/logout")
async def logout(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    # Revoke this browser's tokens server-side, so a copied cookie stops working too.
    # Other devices signed in to the same account are not affected.
    now = datetime.now(timezone.utc)
    for cookie, token_type in (("access_token", "access"), ("refresh_token", "refresh")):
        token = request.cookies.get(cookie)
        if not token:
            continue
        try:
            claims = decode_token(token, expected_type=token_type)
        except JWTError:
            continue
        if claims.get("jti"):
            await db.execute(
                pg_insert(RevokedToken)
                .values(jti=claims["jti"], expires_at=datetime.fromtimestamp(claims["exp"], tz=timezone.utc))
                .on_conflict_do_nothing()
            )
    await db.execute(delete(RevokedToken).where(RevokedToken.expires_at < now))  # entries for tokens that expired anyway
    await db.commit()
    _clear_auth_cookies(response)
    return {"message": "Logged out"}


@router.get("/staff", response_model=list[StaffOut])
async def list_staff(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Lets students, principals, parents and others see who at VN Group they can message."""
    result = await db.execute(
        select(User)
        .where(User.role == UserRole.consultancy_staff, User.is_active.is_(True), User.is_approved.is_(True))
        .order_by(User.full_name)
    )
    return result.scalars().all()


@router.get("/pending", response_model=list[PendingUserOut])
async def list_pending(
    current_user: User = Depends(require_role(UserRole.consultancy_staff)),
    db: AsyncSession = Depends(get_db),
):
    """Staff-only: verified principal and agent accounts waiting for approval."""
    result = await db.execute(
        select(User)
        .where(
            User.role.in_(ROLES_NEEDING_APPROVAL),
            User.is_approved.is_(False),
            User.is_verified.is_(True),
            User.is_active.is_(True),  # rejected accounts are disabled and drop off the list
        )
        .order_by(User.created_at)
    )
    return result.scalars().all()


@router.get("/users", response_model=UserListPage)
async def list_users(
    page: int = Query(1, ge=1),
    current_user: User = Depends(require_role(UserRole.consultancy_staff)),
    db: AsyncSession = Depends(get_db),
):
    """Staff-only: every account in the system, paginated, for the user-management screen."""
    total = (await db.execute(select(func.count()).select_from(select(User).subquery()))).scalar_one()
    result = await db.execute(
        select(User)
        .order_by(User.full_name)
        .offset((page - 1) * USER_LIST_PAGE_SIZE)
        .limit(USER_LIST_PAGE_SIZE)
    )
    items = result.scalars().all()
    return UserListPage(items=items, total=total, page=page, page_size=USER_LIST_PAGE_SIZE)


STAFF_PROTECTED = "Staff accounts can't be changed by other staff members. Ask whoever manages the VN Group database."


def _refuse_staff_target(user: User) -> None:
    if user.role == UserRole.consultancy_staff:
        raise HTTPException(status.HTTP_403_FORBIDDEN, STAFF_PROTECTED)


@router.post("/{user_id}/deactivate", response_model=StaffUserOut)
async def deactivate_user(
    user_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.consultancy_staff)),
    db: AsyncSession = Depends(get_db),
):
    """Staff-only: disables an account (is_active = False) instead of deleting it."""
    if user_id == current_user.id:
        raise HTTPException(400, "You can't deactivate your own account")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    _refuse_staff_target(user)

    user.is_active = False
    user.sessions_valid_after = datetime.now(timezone.utc)  # so reactivating later doesn't revive old sessions
    db.add(AuditLog(
        actor_id=current_user.id,
        action="user_deactivated",
        target_id=user.id,
        detail=user.email,
    ))
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/{user_id}/reactivate", response_model=StaffUserOut)
async def reactivate_user(
    user_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.consultancy_staff)),
    db: AsyncSession = Depends(get_db),
):
    """Staff-only: re-enables a previously deactivated account."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    _refuse_staff_target(user)

    user.is_active = True
    db.add(AuditLog(
        actor_id=current_user.id,
        action="user_reactivated",
        target_id=user.id,
        detail=user.email,
    ))
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/{user_id}/approve", response_model=StaffUserOut)
async def approve_user(
    user_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.consultancy_staff)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    if user.role not in ROLES_NEEDING_APPROVAL:
        raise HTTPException(400, "This account does not require approval")

    user.is_approved = True
    db.add(AuditLog(actor_id=current_user.id, action="user_approved", target_id=user.id, detail=user.email))
    await db.commit()
    await db.refresh(user)

    try:
        await send_plain_email(
            user.email,
            "Your VN Group account is approved",
            "Good news!",
            "Your account has been approved. Sign in to VN Group to start using it.",
        )
    except Exception:
        pass

    return user


@router.post("/{user_id}/reject", status_code=status.HTTP_200_OK)
async def reject_user(
    user_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.consultancy_staff)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    if user.role not in ROLES_NEEDING_APPROVAL:
        raise HTTPException(400, "This account does not require approval")
    if user.id == current_user.id:
        raise HTTPException(400, "You can't reject your own account")
    _refuse_staff_target(user)
    if user.is_approved:
        raise HTTPException(400, "This account is already approved. Use deactivate instead.")

    user.is_active = False
    db.add(AuditLog(actor_id=current_user.id, action="user_rejected", target_id=user.id, detail=user.email))
    await db.commit()

    try:
        await send_plain_email(
            user.email,
            "Your VN Group registration",
            "Update on your registration",
            "We were unable to approve your account. If you believe this is a mistake, please contact VN Group directly.",
        )
    except Exception:
        pass

    return {"message": "Account rejected"}


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_signed_in_user)):
    """Also answers for pending accounts, so the app can show them the "awaiting approval" page."""
    return current_user


@router.patch("/me", response_model=UserOut)
async def update_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.get("/me/photo")
async def get_my_photo(current_user: User = Depends(get_current_user)):
    if not current_user.profile_image:
        raise HTTPException(404, "No profile photo set")
    try:
        return await get_storage().response(
            "profile_photos", current_user.profile_image,
            media_type=guess_media_type(current_user.profile_image),
            headers={"Cache-Control": "private, no-store"},
        )
    except StorageMissing:
        raise HTTPException(404, "Photo file is missing on the server")


@router.post("/me/photo", response_model=UserOut)
async def update_my_photo(
    photo: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    saved = await validate_and_save_upload(photo, subfolder="profile_photos", allowed_mimes=PROFILE_PHOTO_MIMES)

    old_filename = current_user.profile_image
    current_user.profile_image = saved["stored_filename"]
    await db.commit()
    await db.refresh(current_user)

    if old_filename:
        await get_storage().delete("profile_photos", old_filename)

    return current_user
