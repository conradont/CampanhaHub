from sqlalchemy import create_engine, inspect, text
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


_COLUMN_PATCHES = [
    ("clients", "positioning", "TEXT NOT NULL DEFAULT ''"),
    ("clients", "swot_strengths", "TEXT NOT NULL DEFAULT ''"),
    ("clients", "swot_weaknesses", "TEXT NOT NULL DEFAULT ''"),
    ("clients", "swot_opportunities", "TEXT NOT NULL DEFAULT ''"),
    ("clients", "swot_threats", "TEXT NOT NULL DEFAULT ''"),
    ("clients", "audience_geo", "TEXT NOT NULL DEFAULT ''"),
    ("clients", "audience_demo", "TEXT NOT NULL DEFAULT ''"),
    ("clients", "audience_behavior", "TEXT NOT NULL DEFAULT ''"),
    ("clients", "audience_psycho", "TEXT NOT NULL DEFAULT ''"),
    ("clients", "persona", "TEXT NOT NULL DEFAULT ''"),
    ("campaigns", "goal_metric", "VARCHAR(40) NOT NULL DEFAULT ''"),
    ("campaigns", "goal_value", "DOUBLE PRECISION NOT NULL DEFAULT 0"),
    ("campaigns", "strategy", "VARCHAR(40) NOT NULL DEFAULT ''"),
    ("campaigns", "reference_notes", "TEXT NOT NULL DEFAULT ''"),
    ("contents", "owner", "VARCHAR(120) NOT NULL DEFAULT ''"),
    ("contents", "approach", "TEXT NOT NULL DEFAULT ''"),
    ("contents", "estimated_cost", "DOUBLE PRECISION NOT NULL DEFAULT 0"),
    ("metrics", "new_customers", "INTEGER NOT NULL DEFAULT 0"),
]


def ensure_columns() -> None:
    """Acrescenta colunas em bancos já criados. create_all não altera tabela existente."""
    existing_tables = set(inspect(engine).get_table_names())
    dialect = engine.dialect.name
    with engine.begin() as connection:
        for table, column, ddl in _COLUMN_PATCHES:
            if table not in existing_tables:
                continue
            if dialect == "sqlite":
                sqlite_ddl = ddl.replace("DOUBLE PRECISION", "REAL").replace("VARCHAR(40)", "TEXT").replace("VARCHAR(120)", "TEXT")
                names = {row[1] for row in connection.execute(text(f"PRAGMA table_info({table})"))}
                if column not in names:
                    connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {sqlite_ddl}"))
            else:
                connection.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {ddl}"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
