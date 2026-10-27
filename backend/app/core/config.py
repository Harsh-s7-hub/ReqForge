from pydantic_settings import BaseSettings, SettingsConfigDict
from urllib.parse import quote_plus

class Settings(BaseSettings):
    APP_NAME:str
    ENVIRONMENT:str
    DEBUG:bool

    DB_USER:str
    DB_PASSWORD:str
    DB_HOST:str
    DB_PORT:int
    DB_NAME:str

    ENCRYPTION_KEY: str

    GITHUB_OAUTH_CLIENT_ID: str
    GITHUB_OAUTH_CLIENT_SECRET: str
    GITHUB_OAUTH_REDIRECT_URI: str
    FRONTEND_URL: str 

    SESSION_EXPIRY_DAYS : int
    
    GITHUB_APP_SLUG: str
    GITHUB_APP_ID: int
    GITHUB_APP_CLIENT_ID: str
    GITHUB_APP_CLIENT_SECRET: str
    GITHUB_APP_PRIVATE_KEY_PATH: str

    GITHUB_WEBHOOK_SECRET: str

    QDRANT_URL:str
    QDRANT_COLLECTION: str

    REDIS_URL: str = "redis://localhost:6379/0"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen2.5-coder:7b"
    OLLAMA_GENERATION_TIMEOUT_SECONDS: int = 900

    model_config = SettingsConfigDict(
        env_file = ".env",
        env_file_encoding = "utf-8",
        extra="ignore"
    )

    @property
    def DATABASE_URL(self)->str:
        ENCODED_DB_USER = quote_plus(self.DB_USER)
        ENCODED_DB_PASSWORD = quote_plus(self.DB_PASSWORD)

        return (
            f"postgresql+psycopg://"
            f"{ENCODED_DB_USER}:{ENCODED_DB_PASSWORD}@"
            f"{self.DB_HOST}:{self.DB_PORT}/"
            f"{self.DB_NAME}"
        )


settings = Settings()



