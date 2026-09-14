"""Cliente HTTP do Supabase (chave secret no servidor; nunca no front)."""

import httpx

from app.config import settings


def supabase_headers() -> dict[str, str]:
    key = settings.supabase_secret_key or settings.supabase_publishable_key
    if not settings.supabase_url or not key:
        raise RuntimeError("Defina SUPABASE_URL e SUPABASE_SECRET_KEY no backend/.env")
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }


def supabase_get(path: str) -> httpx.Response:
    base = settings.supabase_url.rstrip("/")
    with httpx.Client(timeout=20.0) as client:
        return client.get(f"{base}{path}", headers=supabase_headers())
