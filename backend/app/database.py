from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings


def _engine_kwargs(database_url: str) -> dict:
    url = make_url(database_url)
    if url.get_backend_name() == "sqlite":
        return {"connect_args": {"check_same_thread": False}}

    connect_args: dict = {}
    host = url.host or ""
    if "sslmode" not in url.query and "supabase" in host:
        connect_args["sslmode"] = "require"
    if url.port == 6543 or "pooler.supabase.com" in host:
        connect_args["prepare_threshold"] = None
    return {
        "connect_args": connect_args,
        "pool_pre_ping": True,
        "pool_size": 5,
        "max_overflow": 10,
    }


engine = create_engine(settings.sqlalchemy_database_url, **_engine_kwargs(settings.sqlalchemy_database_url))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
