from urllib.parse import quote_plus

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "CampanhaHub"
    secret_key: str = "campanhahub-dev-secret-altere-em-producao"
    access_token_expire_minutes: int = 60 * 12
    algorithm: str = "HS256"
    database_url: str = "sqlite:///./campanhahub.db"
    database_host: str = ""
    database_port: int = 5432
    database_name: str = "postgres"
    database_user: str = "postgres"
    database_password: str = ""
    supabase_url: str = ""
    supabase_publishable_key: str = ""
    supabase_secret_key: str = ""
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
    rate_limit_enabled: bool = True
    # Navegação: cada rota, por usuário. Acima de uma página que dispara várias req/s ao carregar.
    rate_limit_browse: str = "200/minute"
    # Login e cadastro: mais rígidos, por conta (e um teto por IP contra varredura).
    rate_limit_login: str = "20/minute"
    rate_limit_login_ip: str = "60/minute"
    rate_limit_register: str = "10/minute"
    rate_limit_register_ip: str = "30/minute"
    # Exportação pesa mais que listar.
    rate_limit_export: str = "30/minute"

    @property
    def sqlalchemy_database_url(self) -> str:
        if self.database_host and self.database_password:
            user = quote_plus(self.database_user)
            password = quote_plus(self.database_password)
            return (
                f"postgresql+psycopg://{user}:{password}@"
                f"{self.database_host}:{self.database_port}/{self.database_name}?sslmode=require"
            )

        url = self.database_url.strip()
        if url.startswith("postgres://"):
            return "postgresql+psycopg://" + url[len("postgres://") :]
        if url.startswith("postgresql://") and "+psycopg" not in url:
            return "postgresql+psycopg://" + url[len("postgresql://") :]
        return url


settings = Settings()
