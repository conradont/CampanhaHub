from app.indicators import calc_cac, calc_cpc
from tests.conftest import client


def test_brand_plan_roundtrip(mock_user):
    headers = mock_user["headers"]
    created = client.post(
        "/api/clients",
        headers=headers,
        json={
            "name": "Marca Plano",
            "description": "Padaria de bairro",
            "positioning": "A padaria da esquina",
            "swot_strengths": "Forno próprio",
            "audience_geo": "Centro",
            "persona": "Ana, 38 anos",
        },
    )
    assert created.status_code == 201
    body = created.json()
    assert body["positioning"] == "A padaria da esquina"
    assert body["swot_strengths"] == "Forno próprio"
    assert body["swot_weaknesses"] == ""


def test_cac_is_not_cpc(mock_user):
    headers = mock_user["headers"]
    campaign_id = mock_user["seeded"].campaigns["Verão"]
    response = client.post(
        "/api/metrics",
        headers=headers,
        json={
            "campaign_id": campaign_id,
            "date": "2026-06-01",
            "clicks": 50,
            "new_customers": 2,
            "investment": 100,
        },
    )
    assert response.status_code == 201
    indicators = response.json()["indicators"]
    assert indicators["cpc"] == calc_cpc(100, 50)
    assert indicators["cac"] == calc_cac(100, 2)
    assert indicators["cac"] != indicators["cpc"]


def test_keyword_and_experiment(mock_user):
    headers = mock_user["headers"]
    campaign_id = mock_user["seeded"].campaigns["Black Friday"]
    keyword = client.post(
        "/api/keywords",
        headers=headers,
        json={"campaign_id": campaign_id, "term": "pão de fermentação natural", "intent": "comprar"},
    )
    experiment = client.post(
        "/api/experiments",
        headers=headers,
        json={
            "campaign_id": campaign_id,
            "hypothesis": "Oferta na primeira arte aumenta o clique",
            "metric_name": "CTR",
            "status": "ideia",
        },
    )
    assert keyword.status_code == 201
    assert experiment.status_code == 201
    listed = client.get(f"/api/keywords?campaign_id={campaign_id}", headers=headers)
    assert any(item["term"] == "pão de fermentação natural" for item in listed.json())
