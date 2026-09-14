"""Cria as tabelas no Postgres (Supabase) ou no SQLite local.

Uso:
    cd backend
    .\\.venv\\Scripts\\python.exe -m app.init_db
"""

from pathlib import Path

from sqlalchemy import inspect, text

from app.config import settings
from app.database import Base, engine
from app.supabase_api import supabase_get

SCHEMA_FILE = Path(__file__).resolve().parent.parent / "supabase" / "schema.sql"


def _check_http_api() -> None:
    if not settings.supabase_url or not settings.supabase_secret_key:
        return
    rest = supabase_get("/rest/v1/")
    print(f"API HTTP: {rest.status_code} ({settings.supabase_url})")
    users = supabase_get("/rest/v1/users?select=id&limit=1")
    if users.status_code == 200:
        print("Tabela public.users já existe no Supabase.")
    elif users.status_code == 404:
        print("Tabelas ainda não existem. Rode: npx supabase db push")
    else:
        print(f"REST /users: {users.status_code} {users.text[:160]}")


def _apply_postgres_schema() -> None:
    # psycopg trata % como placeholder; o CHECK bcrypt usa LIKE '$2a$%'.
    sql = SCHEMA_FILE.read_text(encoding="utf-8").replace("%", "%%")
    with engine.begin() as connection:
        connection.exec_driver_sql(sql)


def main() -> None:
    _check_http_api()

    url = settings.sqlalchemy_database_url
    host = url.split("@")[-1] if "@" in url else url
    print(f"Postgres: {host}")

    try:
        if url.startswith("sqlite"):
            Base.metadata.create_all(bind=engine)
            print("SQLite local: tabelas criadas pelo SQLAlchemy.")
        else:
            existing = inspect(engine).get_table_names()
            if "users" in existing:
                print("Schema já aplicado; pulando SQL.")
            else:
                if not SCHEMA_FILE.exists():
                    raise SystemExit(f"Arquivo não encontrado: {SCHEMA_FILE}")
                _apply_postgres_schema()
                print(f"Schema aplicado via Postgres: {SCHEMA_FILE.name}")
    except Exception as exc:
        message = str(exc)
        if "ENOTFOUND" in message or "tenant/user" in message or "getaddrinfo failed" in message:
            raise SystemExit(
                "Host do pooler errado (tenant not found) ou IPv6 indisponível.\n"
                "No dashboard: Connect → Session pooler. Copie o HOST exatamente\n"
                "(ex.: aws-0-ca-central-1.pooler.supabase.com) e a porta 5432."
            ) from None
        raise

    with engine.connect() as connection:
        connection.execute(text("select 1"))
        tables = inspect(engine).get_table_names()
    print("Tabelas Postgres:", ", ".join(sorted(tables)) or "(nenhuma)")
    if "users" in tables:
        print("Senhas: users.hashed_password (bcrypt).")


if __name__ == "__main__":
    main()
