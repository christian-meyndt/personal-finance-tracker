from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = f"sqlite:///{Path('data') / 'finance.db'}"
    jwt_secret: str = "change-me-in-env"
    jwt_algorithm: str = "HS256"
    access_token_ttl_minutes: int = 60 * 24 * 7

    cookie_name: str = "pft_session"
    cookie_secure: bool = False
    cookie_samesite: str = "lax"

    frontend_origin: str = "http://localhost:3000"

    paypal_client_id: str = ""
    paypal_client_secret: str = ""
    paypal_env: str = "sandbox"

    anthropic_api_key: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
