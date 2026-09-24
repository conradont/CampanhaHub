import os

os.environ["DATABASE_URL"] = "sqlite:///./test_campanhahub.db"
os.environ["RATE_LIMIT_ENABLED"] = "false"

import pytest
from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.mock_data import load_mock_dataset
from app.models import User

client = TestClient(app)


@pytest.fixture
def mock_user():
    email = "mock-dashboard@campanhahub.dev"
    password = "senha123"
    created = client.post(
        "/api/auth/register",
        json={"name": "Usuário Mock", "email": email, "password": password},
    )
    if created.status_code == 400:
        created = client.post("/api/auth/login", json={"email": email, "password": password})
    assert created.status_code in (200, 201)
    token = created.json()["access_token"]
    user_id = created.json()["user"]["id"]

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).one()
        from app.mock_data import clear_business_data

        clear_business_data(db, user)
        seeded = load_mock_dataset(db, user)
        db.commit()
    finally:
        db.close()

    return {
        "headers": {"Authorization": f"Bearer {token}"},
        "seeded": seeded,
    }
