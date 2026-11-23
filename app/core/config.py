"""
Central settings object. Pulls everything from environment variables (.env)
so no secret ever lives inside the source code itself.
"""
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url


def asyncpg_url(url: str) -> str:
    """Make a plain postgres:// URL (e.g. from `neon env pull`) usable by SQLAlchemy + asyncpg.

    asyncpg takes `ssl=` instead of libpq's `sslmode=` and has no `channel_binding` option.
    URLs already written for asyncpg pass through unchanged.
    """
    u = make_url(url)
    if u.drivername in ("postgres", "postgresql"):
        u = u.set(drivername="postgresql+asyncpg")
    sslmode = u.query.get("sslmode")
    u = u.difference_update_query(["sslmode", "channel_binding"])
    if sslmode:
        u = u.update_query_dict({"ssl": sslmode})
    return u.render_as_string(hide_password=False)


class Settings(BaseSettings):
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 20
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    DATABASE_URL: str
    # Neon's direct (non-pooler) connection, written by `neon env pull`. Used for Alembic migrations.
    DATABASE_URL_UNPOOLED: str = ""
    # No longer read: "other" signups always need bank details. Kept so existing .env files still load.
    REQUIRE_BANK_DETAILS_FOR_NON_STUDENTS: bool = False
    BANK_DATA_ENCRYPTION_KEY: str = ""

    CORS_ORIGINS: str = "http://localhost:3000"

    # "local" = files under UPLOAD_DIR (development, tests). "r2" = private Cloudflare R2 bucket (required in production).
    STORAGE_BACKEND: str = "local"
    UPLOAD_DIR: str = "./uploads"
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET: str = ""
    MAX_UPLOAD_MB: int = 10
    ALLOWED_MIME_TYPES: str = "application/pdf,image/jpeg,image/png"

    ENVIRONMENT: str = "development"

    STAFF_INVITE_CODE: str = ""
    PRINCIPAL_INVITE_CODE: str = ""

    EMAIL_ENABLED: bool = False
    # Brevo transactional HTTPS API (Render's free plan blocks SMTP ports).
    BREVO_API_KEY: str = ""
    EMAIL_FROM_NAME: str = ""
    EMAIL_FROM_ADDRESS: str = ""  # e.g. noreply@send.example.com
    OTP_EXPIRE_MINUTES: int = 10
    OTP_MAX_ATTEMPTS: int = 5

    # Public address of the React app. Verification links in emails point here.
    FRONTEND_URL: str = "http://localhost:5173"
    EMAIL_VERIFY_EXPIRE_HOURS: int = 24
    # Comma-separated addresses that may register as VN Group staff. Anyone else is refused.
    STAFF_EMAILS: str = ""

    # Wrong passwords allowed per email address before sign-in pauses (any IP), and for how long.
    LOGIN_MAX_FAILURES: int = 5
    LOGIN_LOCKOUT_MINUTES: int = 15

    # Request header that carries the visitor's real IP for per-IP rate limits. Render puts Cloudflare in
    # front of the API and Cloudflare sets this one itself. Set it empty if the API is ever reachable
    # without Cloudflare in front, otherwise a client could forge it.
    CLIENT_IP_HEADER: str = "cf-connecting-ip"

    COOKIE_SECURE: bool = False  # set True in production — cookies only sent over HTTPS then

    # Prefix a reverse proxy adds in front of the API (e.g. "/api" behind the static-site rewrite).
    # Keeps the refresh cookie's path matching what the browser actually requests.
    API_PATH_PREFIX: str = ""

    # extra="ignore": `neon env pull` also writes PG* and other Neon keys the app does not read.
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @model_validator(mode="after")
    def check_production(self):
        """Refuse to start a production server with development-only settings."""
        if self.STORAGE_BACKEND not in ("local", "r2"):
            raise ValueError("STORAGE_BACKEND must be 'local' or 'r2'")
        if self.ENVIRONMENT != "production":
            return self
        problems = []
        if len(self.SECRET_KEY) < 32 or self.SECRET_KEY.startswith("changeme"):
            problems.append("SECRET_KEY must be a random value of at least 32 characters")
        if not self.COOKIE_SECURE:
            problems.append("COOKIE_SECURE must be true")
        if not self.EMAIL_ENABLED or not (self.BREVO_API_KEY and self.EMAIL_FROM_NAME and self.EMAIL_FROM_ADDRESS):
            problems.append("EMAIL_ENABLED=true, BREVO_API_KEY, EMAIL_FROM_NAME and EMAIL_FROM_ADDRESS must be set")
        if self.STORAGE_BACKEND != "r2" or not (
            self.R2_ACCOUNT_ID and self.R2_ACCESS_KEY_ID and self.R2_SECRET_ACCESS_KEY and self.R2_BUCKET
        ):
            problems.append(
                "STORAGE_BACKEND=r2 with R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET must be set"
            )
        if any(o == "*" or "localhost" in o or "127.0.0.1" in o or o.startswith("http://") for o in self.cors_origins_list):
            problems.append("CORS_ORIGINS must list only https:// production origins")
        if not self.FRONTEND_URL.startswith("https://") or "localhost" in self.FRONTEND_URL:
            problems.append("FRONTEND_URL must be the https:// address of the live site")
        if problems:
            raise ValueError("Unsafe production configuration: " + "; ".join(problems))
        return self

    @property
    def startup_warnings(self) -> list[str]:
        """Settings that are allowed but deserve a loud note in the server log."""
        return []

    @property
    def async_database_url(self) -> str:
        return asyncpg_url(self.DATABASE_URL)

    @property
    def migration_database_url(self) -> str:
        """Migrations need a direct connection, not Neon's transaction-mode pooler."""
        return asyncpg_url(self.DATABASE_URL_UNPOOLED or self.DATABASE_URL)

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def staff_emails(self) -> frozenset[str]:
        return frozenset(e.strip().lower() for e in self.STAFF_EMAILS.split(",") if e.strip())

    @property
    def allowed_mime_list(self) -> list[str]:
        return [m.strip() for m in self.ALLOWED_MIME_TYPES.split(",") if m.strip()]


settings = Settings()
