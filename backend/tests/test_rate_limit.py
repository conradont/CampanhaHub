from contextlib import contextmanager

from limits import parse
from limits.strategies import MovingWindowRateLimiter
from slowapi.wrappers import LimitGroup

from app.config import settings
from app.rate_limit import limiter, rate_limit_identity
from tests.conftest import client


@contextmanager
def limits_enabled():
    limiter.reset()
    limiter.enabled = True
    try:
        yield
    finally:
        limiter.enabled = False
        limiter.reset()


def test_strategy_is_moving_window():
    assert isinstance(limiter.limiter, MovingWindowRateLimiter)


def test_successful_login_returns_token_when_rate_limit_is_on():
    with limits_enabled():
        created = client.post(
            "/api/auth/register",
            json={
                "name": "Conta Limite",
                "email": "login-ok@campanhahub.dev",
                "password": "senha123",
            },
        )
        if created.status_code == 400:
            created = client.post(
                "/api/auth/login",
                json={"email": "login-ok@campanhahub.dev", "password": "senha123"},
            )
        assert created.status_code in (200, 201)
        assert created.json()["access_token"]
        assert created.headers.get("x-ratelimit-limit")


def test_login_limit_is_per_account_and_explains_the_wait():
    account_limit = parse(settings.rate_limit_login).amount
    with limits_enabled():
        payload = {"email": "rate-limit@campanhahub.dev", "password": "errada"}
        last = None
        for _ in range(account_limit + 1):
            last = client.post("/api/auth/login", json=payload)
        assert last is not None
        assert last.status_code == 429
        assert "Espere" in last.json()["detail"]
        assert "segundo" in last.json()["detail"]
        retry_after = int(last.headers["retry-after"])
        assert retry_after >= 1

        other = client.post(
            "/api/auth/login",
            json={"email": "outra-conta@campanhahub.dev", "password": "errada"},
        )
        assert other.status_code == 401


def test_browse_quota_is_per_user_not_shared_ip():
    original = list(limiter._default_limits)
    limiter._default_limits = [
        LimitGroup("2/minute", rate_limit_identity, None, False, None, None, None, 1, False)
    ]
    try:
        with limits_enabled():
            def token_for(name: str, email: str) -> str:
                created = client.post(
                    "/api/auth/register",
                    json={"name": name, "email": email, "password": "senha123"},
                )
                if created.status_code == 400:
                    created = client.post(
                        "/api/auth/login",
                        json={"email": email, "password": "senha123"},
                    )
                assert created.status_code in (200, 201)
                return created.json()["access_token"]

            headers_a = {"Authorization": f"Bearer {token_for('Pessoa A', 'cota-a@campanhahub.dev')}"}
            headers_b = {"Authorization": f"Bearer {token_for('Pessoa B', 'cota-b@campanhahub.dev')}"}

            assert client.get("/api/auth/me", headers=headers_a).status_code == 200
            assert client.get("/api/auth/me", headers=headers_a).status_code == 200
            blocked = client.get("/api/auth/me", headers=headers_a)
            assert blocked.status_code == 429
            assert "requisições" in blocked.json()["detail"]
            assert client.get("/api/auth/me", headers=headers_b).status_code == 200
    finally:
        limiter._default_limits = original


def test_normal_browsing_stays_under_the_generous_cap():
    with limits_enabled():
        created = client.post(
            "/api/auth/register",
            json={"name": "Navegação", "email": "navega@campanhahub.dev", "password": "senha123"},
        )
        if created.status_code == 400:
            created = client.post(
                "/api/auth/login",
                json={"email": "navega@campanhahub.dev", "password": "senha123"},
            )
        token = created.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        for _ in range(25):
            response = client.get("/api/clients", headers=headers)
            assert response.status_code == 200
