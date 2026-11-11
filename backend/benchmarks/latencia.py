"""Medicao local de latencia dos endpoints analiticos do CampanhaHub.

Uso (a partir da pasta backend/):
    SECRET_KEY=<chave com 43+ caracteres> python benchmarks/latencia.py

Usa SQLite temporario, o dataset mock e o TestClient (sem rede).
"""
import os
import sys
import tempfile
import time

TMP = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{TMP}/bench.db"
os.environ["RATE_LIMIT_ENABLED"] = "false"
sys.path.insert(0, os.getcwd())

from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.mock_data import load_mock_dataset  # noqa: E402
from app.models import User  # noqa: E402

REQUISICOES, AQUECIMENTO = 200, 5
ENDPOINTS = ["/api/dashboard", "/api/campaigns"]

Base.metadata.create_all(engine)
client = TestClient(app)
resp = client.post(
    "/api/auth/register",
    json={"name": "Benchmark", "email": "bench@campanhahub.dev",
          "password": "senha123"},
)
token, user_id = resp.json()["access_token"], resp.json()["user"]["id"]
db = SessionLocal()
load_mock_dataset(db, db.get(User, user_id))
db.commit()
db.close()
headers = {"Authorization": f"Bearer {token}"}

for endpoint in ENDPOINTS:
    for _ in range(AQUECIMENTO):
        client.get(endpoint, headers=headers)
    tempos = []
    for _ in range(REQUISICOES):
        inicio = time.perf_counter()
        r = client.get(endpoint, headers=headers)
        tempos.append((time.perf_counter() - inicio) * 1000)
        assert r.status_code == 200
    tempos.sort()
    p50 = tempos[int(0.50 * REQUISICOES)]
    p95 = tempos[int(0.95 * REQUISICOES) - 1]
    print(f"{endpoint}: n={REQUISICOES} p50={p50:.1f} ms p95={p95:.1f} ms")
