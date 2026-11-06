from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PROJECT_NAME: str = "Worthout Backend"
    VERSION: str = "0.1.0"

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    DATABASE_URL: str
    SQL_ECHO: bool = False

    CLERK_SECRET_KEY: str = ""
    CLERK_PUBLISHABLE_KEY: str = ""
    CLERK_ISSUER: str = ""
    CLERK_AUDIENCE: str = ""
    CLERK_JWKS_URL: str = ""
    CLERK_JWKS_CACHE_TTL_SECONDS: int = 3600
    CLERK_JWT_CLOCK_SKEW_SECONDS: int = 5

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("CLERK_ISSUER", "CLERK_JWKS_URL", mode="before")
    @classmethod
    def strip_trailing_slash(cls, value: object) -> object:
        if isinstance(value, str):
            return value.rstrip("/")
        return value

    @property
    def clerk_jwks_url(self) -> str:
        if self.CLERK_JWKS_URL:
            return self.CLERK_JWKS_URL
        if self.CLERK_ISSUER:
            return f"{self.CLERK_ISSUER}/.well-known/jwks.json"
        return ""


settings = Settings()
