"""
Central settings object. Pulls everything from environment variables (.env)
so no secret ever lives inside the source code itself.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 20
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    DATABASE_URL: str

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

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def allowed_mime_list(self) -> list[str]:
        return [m.strip() for m in self.ALLOWED_MIME_TYPES.split(",") if m.strip()]


settings = Settings()