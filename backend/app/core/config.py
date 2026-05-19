from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Campus Canteen API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    MONGODB_URL: str = "mongodb://localhost:27017/campus_canteen"

    # Firebase
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_SERVICE_ACCOUNT_KEY: str = ""  # JSON string or path

    # Google AI
    GEMINI_API_KEY: str = ""

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "https://localhost:3000",
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
