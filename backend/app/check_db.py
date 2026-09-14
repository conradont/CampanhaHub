"""Confere a conexão com o banco (SQLite local ou Supabase).

Uso:
    cd backend
    python -m app.check_db
"""

from sqlalchemy import inspect, text

from app.config import settings
from app.database import Base, engine


def main() -> None:
    url = settings.sqlalchemy_database_url
    host = url.split("@")[-1] if "@" in url else url
    print(f"Conectando em {host}")
    Base.metadata.create_all(bind=engine)
    with engine.connect() as connection:
        connection.execute(text("select 1"))
        tables = inspect(engine).get_table_names()
    print("Conexão ok.")
    print("Tabelas:", ", ".join(sorted(tables)) or "(nenhuma)")
    if "users" in tables:
        print("Senhas: coluna users.hashed_password (bcrypt, irreversível).")


if __name__ == "__main__":
    main()
