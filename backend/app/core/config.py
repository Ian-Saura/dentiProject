from functools import lru_cache
from typing import Any, Dict, Optional

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = Field(default="denti-backend")
    api_prefix: str = Field(default="/v1")

    database_url: str = Field(
        default="postgresql+asyncpg://user:password@localhost:5432/consultorio_db",
        alias="DATABASE_URL",
    )
    sync_database_url: str = Field(
        default="postgresql://user:password@localhost:5432/consultorio_db",
        alias="SYNC_DATABASE_URL",
    )

    jwt_secret_key: str = Field(default="super-secret-key", alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256")
    access_token_expire_minutes: int = Field(default=60)

    # Google OAuth - MUST be set via environment variables
    google_client_id: str = Field(
        default="",  # Set via GOOGLE_CLIENT_ID env var
        alias="GOOGLE_CLIENT_ID"
    )
    google_client_secret: str = Field(
        default="",  # Set via GOOGLE_CLIENT_SECRET env var
        alias="GOOGLE_CLIENT_SECRET"
    )
    google_redirect_uri: str = Field(
        default="http://localhost:8000/v1/auth/google/callback",
        alias="GOOGLE_REDIRECT_URI"
    )

    enable_gzip: bool = Field(default=True)

    log_level: str = Field(default="INFO")

    cors_origins: Optional[str] = Field(default="*", alias="CORS_ORIGINS")

    # Twilio Configuration
    twilio_account_sid: str = Field(
        default="",  # Set via TWILIO_ACCOUNT_SID env var
        alias="TWILIO_ACCOUNT_SID"
    )
    twilio_auth_token: str = Field(
        default="",  # Set via TWILIO_AUTH_TOKEN env var
        alias="TWILIO_AUTH_TOKEN"
    )
    twilio_whatsapp_from: str = Field(
        default="whatsapp:+14155238886",  # Twilio Sandbox WhatsApp number
        alias="TWILIO_WHATSAPP_FROM"
    )
    twilio_sms_from: str = Field(
        default="",  # Set via TWILIO_SMS_FROM env var (optional)
        alias="TWILIO_SMS_FROM"
    )

    class Config:
        env_file = ".env"
        case_sensitive = False

    def cors_origin_list(self) -> list[str]:
        if not self.cors_origins:
            return []
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    def to_dict(self) -> Dict[str, Any]:
        return self.model_dump()


@lru_cache
def get_settings() -> Settings:
    return Settings()
