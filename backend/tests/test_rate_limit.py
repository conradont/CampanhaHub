from tests.conftest import client


def test_login_is_rate_limited():
    from app.rate_limit import limiter

    limiter.enabled = True
    try:
        payload = {"email": "rate-limit@campanhahub.dev", "password": "errada"}
        last = None
        for _ in range(6):
            last = client.post("/api/auth/login", json=payload)
        assert last is not None
        assert last.status_code == 429
        assert "Muitas tentativas" in last.json()["detail"]
        assert last.headers.get("retry-after") == "60"
    finally:
        limiter.enabled = False
