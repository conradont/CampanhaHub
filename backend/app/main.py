from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import Base, engine, ensure_columns
from app.rate_limit import BrowseRateLimitMiddleware, limiter, rate_limit_handler
from app.routers import auth, campaigns, clients, contents, dashboard, expenses, experiments, keywords, metrics, platforms, reports


def init_db() -> None:
    try:
        Base.metadata.create_all(bind=engine)
        ensure_columns()
    except Exception as exc:
        raise SystemExit(
            "Falha ao conectar no Postgres. No backend/.env, preencha DATABASE_PASSWORD "
            "(Project Settings → Database). Sem a senha do banco a API não sobe."
        ) from exc


init_db()

app = FastAPI(
    title=settings.app_name,
    description="Sistema web para gerenciamento e monitoramento de campanhas de marketing digital.",
    version="1.0.0",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_handler)
app.add_middleware(BrowseRateLimitMiddleware)

origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Retry-After", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
)

app.include_router(auth.router)
app.include_router(clients.router)
app.include_router(platforms.router)
app.include_router(campaigns.router)
app.include_router(contents.router)
app.include_router(metrics.router)
app.include_router(expenses.router)
app.include_router(keywords.router)
app.include_router(experiments.router)
app.include_router(dashboard.router)
app.include_router(reports.router)


@app.get("/api/health")
@limiter.exempt
def health():
    return {"status": "ok", "app": settings.app_name}
