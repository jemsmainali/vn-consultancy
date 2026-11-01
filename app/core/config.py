"""
Central settings object. Pulls everything from environment variables (.env)
so no secret ever lives inside the source code itself.
"""
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 20
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    DATABASE_URL: str
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

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

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
        if not self.EMAIL_ENABLED or not (self.SMTP_HOST and self.SMTP_FROM):
            problems.append("EMAIL_ENABLED, SMTP_HOST and SMTP_FROM must be set")
        if any(o == "*" or "localhost" in o or "127.0.0.1" in o or o.startswith("http://") for o in self.cors_origins_list):
            problems.append("CORS_ORIGINS must list only https:// production origins")
        if problems:
            raise ValueError("Unsafe production configuration: " + "; ".join(problems))
        return self

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def allowed_mime_list(self) -> list[str]:
        return [m.strip() for m in self.ALLOWED_MIME_TYPES.split(",") if m.strip()]


settings = Settings()
