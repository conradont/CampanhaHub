from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import auth, campaigns, clients, contents, dashboard, expenses, metrics, platforms, reports

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.app_name,
    description="Sistema web para gerenciamento e monitoramento de campanhas de marketing digital.",
    version="1.0.0",
)

origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(clients.router)
app.include_router(platforms.router)
app.include_router(campaigns.router)
app.include_router(contents.router)
app.include_router(metrics.router)
app.include_router(expenses.router)
app.include_router(dashboard.router)
app.include_router(reports.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "app": settings.app_name}
