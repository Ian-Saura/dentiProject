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

    # Google OAuth
    google_client_id: str = Field(
        default="your-google-client-id-here",
        alias="GOOGLE_CLIENT_ID"
    )
    google_client_secret: str = Field(
        default="your-google-client-secret-here",
        alias="GOOGLE_CLIENT_SECRET"
    )
    google_redirect_uri: str = Field(
        default="http://localhost:8000/v1/auth/google/callback",
        alias="GOOGLE_REDIRECT_URI"
    )

    enable_gzip: bool = Field(default=True)

    log_level: str = Field(default="INFO")

    cors_origins: Optional[str] = Field(default="*", alias="CORS_ORIGINS")

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
