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

    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_MB: int = 10
    ALLOWED_MIME_TYPES: str = "application/pdf,image/jpeg,image/png"

    ENVIRONMENT: str = "development"

    STAFF_INVITE_CODE: str = ""
    PRINCIPAL_INVITE_CODE: str = ""

    EMAIL_ENABLED: bool = False
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""
    OTP_EXPIRE_MINUTES: int = 10
    OTP_MAX_ATTEMPTS: int = 5

    COOKIE_SECURE: bool = False  # set True in production — cookies only sent over HTTPS then

    # Public demo with synthetic data only. Allows production without SMTP (Render's free tier
    # blocks outbound mail ports); OTP emails are then written to the private server log.
    DEMO_MODE: bool = False
    # Prefix a reverse proxy adds in front of the API (e.g. "/api" behind the static-site rewrite).
    # Keeps the refresh cookie's path matching what the browser actually requests.
    API_PATH_PREFIX: str = ""

    # extra="ignore": `neon env pull` also writes PG* and other Neon keys the app does not read.
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @model_validator(mode="after")
    def check_production(self):
        """Refuse to start a production server with development-only settings."""
        if self.ENVIRONMENT != "production":
            return self
        problems = []
        if len(self.SECRET_KEY) < 32 or self.SECRET_KEY.startswith("changeme"):
            problems.append("SECRET_KEY must be a random value of at least 32 characters")
        if not self.COOKIE_SECURE:
            problems.append("COOKIE_SECURE must be true")
        if not self.DEMO_MODE and (not self.EMAIL_ENABLED or not (self.SMTP_HOST and self.SMTP_FROM)):
            problems.append("EMAIL_ENABLED, SMTP_HOST and SMTP_FROM must be set")
        if any(o == "*" or "localhost" in o or "127.0.0.1" in o or o.startswith("http://") for o in self.cors_origins_list):
            problems.append("CORS_ORIGINS must list only https:// production origins")
        if problems:
            raise ValueError("Unsafe production configuration: " + "; ".join(problems))
        return self

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
    def allowed_mime_list(self) -> list[str]:
        return [m.strip() for m in self.ALLOWED_MIME_TYPES.split(",") if m.strip()]


settings = Settings()
