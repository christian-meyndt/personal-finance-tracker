from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    DATABASE_URL: str = "sqlite:///./finance.db"
    SECRET_KEY: str
    ADMIN_USER: str = "admin"
    ADMIN_PASSWORD: str
    PAYPAL_CLIENT_ID: str = ""
    PAYPAL_CLIENT_SECRET: str = ""
    PAYPAL_ENV: str = "sandbox"
    ANTHROPIC_API_KEY: str = ""

    # JWT settings
    ACCESS_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"


settings = Settings()
