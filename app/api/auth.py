import hmac
import os
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, Form, File, UploadFile, Query
from fastapi.encoders import jsonable_encoder
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address
from jose import JWTError
from pydantic import ValidationError

from app.core.config import settings
from app.core.bank_data import encrypt_bank_account_number
from app.core.database import get_db
from app.core.otp import generate_otp, hash_otp, send_otp_email, send_plain_email, send_password_reset_email
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.models.user import User, UserRole
from app.models.otp import EmailOTP
from app.models.audit import AuditLog
from app.models.bank_details import UserBankDetails
from app.schemas.user import (
    UserCreate, UserUpdate, UserOut, UserLogin, StaffOut, PendingUserOut,
    StaffUserOut, UserListPage,
    VerifyEmailRequest, VerifyEmailResponse, ResendRequest, ROLES_REQUIRING_BANK_DETAILS,
    ForgotPasswordRequest, ResetPasswordRequest,
)
from app.schemas.token import TokenPair
from app.api.deps import get_current_user, require_role
from app.utils.file_validation import validate_and_save_upload

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)

ROLES_NEEDING_APPROVAL = (UserRole.principal, UserRole.consultancy_staff)
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
        path="/auth",  # only ever sent back to /auth/* routes - narrows its exposure
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/auth")


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


async def issue_otp(db: AsyncSession, user: User) -> None:
    """Creates a fresh code and emails it. Skips silently if one was sent under a minute ago."""
    last = await _latest_otp(db, user.email, purpose="verify")
    if last and (datetime.now(timezone.utc) - last.created_at).total_seconds() < 60:
        return

    code = generate_otp()
    await db.execute(delete(EmailOTP).where(EmailOTP.email == user.email, EmailOTP.purpose == "verify"))
    db.add(EmailOTP(
        email=user.email,
        purpose="verify",
        code_hash=hash_otp(user.email, code),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
    ))
    await db.commit()

    try:
        await send_otp_email(user.email, code, user.full_name)
    except Exception:
        # Drop the undelivered code so the user can request another one straight away.
        await db.execute(delete(EmailOTP).where(EmailOTP.email == user.email, EmailOTP.purpose == "verify"))
        await db.commit()
        raise HTTPException(502, "We couldn't send the verification email. Please use \"Resend code\" in a moment.")


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(
    request: Request,
    full_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    role: UserRole = Form(UserRole.student),
    invite_code: str | None = Form(None),
    national_id: str = Form(...),
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
    bank_name: str | None = Form(None),
    bank_account_number: str | None = Form(None),
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
            bank_name=bank_name,
            bank_account_number=bank_account_number,
            terms_accepted=terms_accepted,
        )
    except ValidationError as e:
        # Custom validators put the raw ValueError in ctx; encode it like main.py's handler or this becomes a 500.
        raise HTTPException(422, jsonable_encoder(e.errors(include_input=False)))

    if payload.role in (UserRole.consultancy_staff, UserRole.principal):
        expected = (
            settings.STAFF_INVITE_CODE
            if payload.role == UserRole.consultancy_staff
            else settings.PRINCIPAL_INVITE_CODE
        )
        given = payload.invite_code or ""
        if not expected or not hmac.compare_digest(given.encode(), expected.encode()):
            raise HTTPException(403, "Invalid invite code")

    if not payload.terms_accepted:
        raise HTTPException(400, "You must accept the Terms and Conditions to register")

    if await _find_user(db, payload.email):
        raise HTTPException(400, "Email already registered")

    existing_nid = await db.execute(select(User).where(User.national_id == payload.national_id))
    if existing_nid.scalar_one_or_none():
        raise HTTPException(400, "This National ID is already registered")

    bank_values = None
    if settings.REQUIRE_BANK_DETAILS_FOR_NON_STUDENTS and payload.role in ROLES_REQUIRING_BANK_DETAILS:
        try:
            encrypted_account_number = encrypt_bank_account_number(payload.bank_account_number)
        except ValueError:
            raise HTTPException(503, "Bank details registration is temporarily unavailable.") from None
        bank_values = {
            "bank_name": payload.bank_name,
            "account_number_encrypted": encrypted_account_number,
            "account_last4": payload.bank_account_number[-4:],
        }

    saved = await validate_and_save_upload(photo, subfolder="profile_photos", allowed_mimes=PROFILE_PHOTO_MIMES)

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
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
        is_approved=payload.role not in ROLES_NEEDING_APPROVAL,
    )
    db.add(user)
    if bank_values:
        await db.flush()
        db.add(UserBankDetails(user_id=user.id, **bank_values))
    await db.commit()
    await db.refresh(user)

    await issue_otp(db, user)
    return user


@router.post("/verify-email", response_model=VerifyEmailResponse)
@limiter.limit("10/minute")
async def verify_email(request: Request, response: Response, payload: VerifyEmailRequest, db: AsyncSession = Depends(get_db)):
    invalid = HTTPException(400, "Invalid or expired code")

    user = await _find_user(db, payload.email)
    otp = await _latest_otp(db, user.email, purpose="verify") if user else None
    if not user or not otp:
        raise invalid
    if otp.expires_at < datetime.now(timezone.utc) or otp.attempts >= settings.OTP_MAX_ATTEMPTS:
        raise invalid

    if not hmac.compare_digest(otp.code_hash, hash_otp(user.email, payload.code)):
        otp.attempts += 1
        await db.commit()
        raise invalid

    user.is_verified = True
    await db.execute(delete(EmailOTP).where(EmailOTP.email == user.email, EmailOTP.purpose == "verify"))
    await db.commit()

    if user.role in ROLES_NEEDING_APPROVAL and not user.is_approved:
        return VerifyEmailResponse(
            pending_approval=True,
            message="Your email is verified. Your account now needs approval from VN Group staff before you can sign in. We'll email you once that happens.",
        )

    _set_auth_cookies(response, _tokens(user))
    return VerifyEmailResponse(pending_approval=False)


@router.post("/resend-otp")
@limiter.limit("3/minute")
async def resend_otp(request: Request, payload: ResendRequest, db: AsyncSession = Depends(get_db)):
    user = await _find_user(db, payload.email)
    if user and not user.is_verified:
        await issue_otp(db, user)
    return {"message": "If that account needs verification, a new code has been sent."}


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
    await db.execute(delete(EmailOTP).where(EmailOTP.email == user.email, EmailOTP.purpose == "reset"))
    await db.commit()

    return {"message": "Your password has been reset. You can now sign in."}


@router.post("/login")
@limiter.limit("10/minute")
async def login(request: Request, response: Response, payload: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await _find_user(db, payload.email)

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is disabled")
    if not user.is_verified:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Please verify your email to continue")
    if user.role in ROLES_NEEDING_APPROVAL and not user.is_approved:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Your account is awaiting approval from VN Group staff")

    _set_auth_cookies(response, _tokens(user))
    return {"message": "Logged in"}


@router.post("/token", response_model=TokenPair, include_in_schema=False)
@limiter.limit("10/minute")
async def login_for_swagger(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """Kept only for API testing tools (Postman, curl) that want a raw bearer token."""
    user = await _find_user(db, form_data.username)

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is disabled")
    if not user.is_verified:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Please verify your email to continue")
    if user.role in ROLES_NEEDING_APPROVAL and not user.is_approved:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Your account is awaiting approval from VN Group staff")

    return _tokens(user)


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
    if (
        not user
        or not user.is_active
        or not user.is_verified
        or (user.role in ROLES_NEEDING_APPROVAL and not user.is_approved)
    ):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User no longer valid")

    _set_auth_cookies(response, _tokens(user))  # rotates both tokens on every refresh
    return {"message": "Refreshed"}


@router.post("/logout")
async def logout(response: Response):
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
    """Staff-only: principal and staff accounts waiting for approval."""
    result = await db.execute(
        select(User)
        .where(User.role.in_(ROLES_NEEDING_APPROVAL), User.is_approved.is_(False), User.is_verified.is_(True))
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


@router.post("/{user_id}/deactivate", response_model=UserOut)
async def deactivate_user(
    user_id: str,
    current_user: User = Depends(require_role(UserRole.consultancy_staff)),
    db: AsyncSession = Depends(get_db),
):
    """Staff-only: disables an account (is_active = False) instead of deleting it."""
    if user_id == str(current_user.id):
        raise HTTPException(400, "You can't deactivate your own account")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")

    user.is_active = False
    db.add(AuditLog(
        actor_id=current_user.id,
        action="user_deactivated",
        target_id=user.id,
        detail=user.email,
    ))
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/{user_id}/reactivate", response_model=UserOut)
async def reactivate_user(
    user_id: str,
    current_user: User = Depends(require_role(UserRole.consultancy_staff)),
    db: AsyncSession = Depends(get_db),
):
    """Staff-only: re-enables a previously deactivated account."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")

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


@router.post("/{user_id}/approve", response_model=UserOut)
async def approve_user(
    user_id: str,
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
    await db.commit()
    await db.refresh(user)

    try:
        await send_plain_email(
            user.email,
            "Your VN Group account is approved",
            "Good news!",
            "Your account has been approved. You can now sign in at VN Group.",
        )
    except Exception:
        pass

    return user


@router.post("/{user_id}/reject", status_code=status.HTTP_200_OK)
async def reject_user(
    user_id: str,
    current_user: User = Depends(require_role(UserRole.consultancy_staff)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    if user.role not in ROLES_NEEDING_APPROVAL:
        raise HTTPException(400, "This account does not require approval")

    user.is_active = False
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
async def me(current_user: User = Depends(get_current_user)):
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
    path = os.path.join(settings.UPLOAD_DIR, "profile_photos", current_user.profile_image)
    if not os.path.isfile(path):
        raise HTTPException(404, "Photo file is missing on the server")
    return FileResponse(path)


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
        old_path = os.path.join(settings.UPLOAD_DIR, "profile_photos", old_filename)
        if os.path.isfile(old_path):
            os.remove(old_path)

    return current_user
