import json
import time

from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.routing import _IncludedRouter
from jwt import InvalidTokenError
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import _should_exempt, sync_check_limits
from slowapi.util import get_remote_address
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response
from starlette.routing import Match
from starlette.types import Scope

from app.config import settings
from app.security import decode_access_token


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)


def _user_id_from_token(request: Request) -> str | None:
    auth = request.headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        return None
    token = auth.split(" ", 1)[1].strip()
    if not token:
        return None
    try:
        subject = decode_access_token(token).get("sub")
    except (InvalidTokenError, ValueError, TypeError):
        return None
    if subject is None:
        return None
    return str(subject)


def rate_limit_identity(request: Request) -> str:
    """Cota da navegação: usuário do token, ou IP quando não há sessão."""
    user_id = _user_id_from_token(request)
    if user_id is not None:
        return f"user:{user_id}"
    return f"ip:{client_ip(request)}"


def _email_from_body(request: Request) -> str:
    raw = getattr(request, "_body", None)
    if not raw:
        return ""
    try:
        payload = json.loads(raw)
    except (json.JSONDecodeError, UnicodeDecodeError, TypeError):
        return ""
    if not isinstance(payload, dict):
        return ""
    email = payload.get("email")
    return str(email).strip().lower() if email else ""


def login_account_key(request: Request) -> str:
    """Força bruta mira a conta, não o Wi-Fi compartilhado."""
    email = _email_from_body(request)
    if email:
        return f"account:{email}"
    return f"ip:{client_ip(request)}"


def client_ip_key(request: Request) -> str:
    return f"ip:{client_ip(request)}"


limiter = Limiter(
    key_func=rate_limit_identity,
    default_limits=[settings.rate_limit_browse],
    enabled=settings.rate_limit_enabled,
    headers_enabled=True,
    strategy="moving-window",
    retry_after="delta-seconds",
)


def _retry_after_seconds(request: Request) -> int:
    current = getattr(request.state, "view_rate_limit", None)
    if not current:
        return 1
    try:
        window_stats = limiter.limiter.get_window_stats(current[0], *current[1])
        wait = int(window_stats[0] - time.time()) + 1
    except Exception:
        return 1
    return max(1, wait)


def _friendly_detail(path: str, wait: int) -> str:
    pause = "1 segundo" if wait == 1 else f"{wait} segundos"
    if path.endswith("/login") or path.endswith("/register"):
        lead = "Muitas tentativas de entrada."
    elif path.endswith("/export.csv"):
        lead = "Muitas exportações em sequência."
    else:
        lead = "Muitas requisições em sequência."
    return f"{lead} Espere {pause} e tente de novo."


def resolve_endpoint(routes, scope: Scope):
    """Acha o endpoint real. O middleware do slowapi para no _IncludedRouter do FastAPI."""
    for route in routes:
        if isinstance(route, _IncludedRouter):
            match, _child_scope, selected, _context = route._match(scope)
            if match != Match.FULL or selected is None:
                continue
            if isinstance(selected, _IncludedRouter):
                nested = resolve_endpoint([selected], scope)
                if nested is not None:
                    return nested
                continue
            endpoint = getattr(selected, "endpoint", None)
            if endpoint is not None:
                return endpoint
            continue
        match, _child_scope = route.matches(scope)
        if match == Match.FULL:
            endpoint = getattr(route, "endpoint", None)
            if endpoint is not None:
                return endpoint
    return None


class BrowseRateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if not limiter.enabled:
            return await call_next(request)

        handler = resolve_endpoint(request.app.routes, request.scope)
        if _should_exempt(limiter, handler):
            return await call_next(request)

        error_response, should_inject_headers = sync_check_limits(
            limiter, request, handler, request.app
        )
        if error_response is not None:
            return error_response

        response = await call_next(request)
        if should_inject_headers:
            response = limiter._inject_headers(response, request.state.view_rate_limit)
        return response


def rate_limit_handler(request: Request, _exc: RateLimitExceeded) -> JSONResponse:
    wait = _retry_after_seconds(request)
    response = JSONResponse(
        status_code=429,
        content={"detail": _friendly_detail(request.url.path, wait)},
        headers={"Retry-After": str(wait)},
    )
    current = getattr(request.state, "view_rate_limit", None)
    if current is not None:
        try:
            limiter._inject_headers(response, current)
        except Exception:
            pass
    response.headers["Retry-After"] = str(wait)
    return response
