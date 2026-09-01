from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "CampanhaHub"
    secret_key: str = "campanhahub-dev-secret-altere-em-producao"
    access_token_expire_minutes: int = 60 * 12
    algorithm: str = "HS256"
    database_url: str = "sqlite:///./campanhahub.db"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"


settings = Settings()
