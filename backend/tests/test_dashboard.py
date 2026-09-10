from app.indicators import calc_cpc, calc_ctr
from tests.conftest import client


def test_dashboard_uses_mock_dataset(mock_user):
    headers = mock_user["headers"]
    seeded = mock_user["seeded"]

    dashboard = client.get("/api/dashboard?period=all", headers=headers)
    assert dashboard.status_code == 200
    body = dashboard.json()

    assert body["overview"]["total_campaigns"] == 4
    assert body["overview"]["total_investment"] == seeded.total_investment
    assert body["overview"]["total_conversions"] == seeded.total_conversions
    assert body["overview"]["total_clicks"] == seeded.total_clicks
    assert body["overview"]["average_ctr"] == calc_ctr(seeded.total_clicks, seeded.total_impressions)
    assert body["overview"]["average_cpc"] == calc_cpc(seeded.total_investment, seeded.total_clicks)
    assert [row["campaign"] for row in body["by_campaign"]][0] == "Black Friday"
    assert {row["platform"] for row in body["by_platform"]} >= {"Instagram", "Facebook", "Google Ads", "TikTok"}
    assert len(body["evolution"]) == 4
    assert body["evolution"][0]["investment"] == 800
    assert body["evolution"][-1]["conversions"] == 143
    assert body["evolution"][-1]["ctr"] == calc_ctr(2100, 28000)

    bakery = client.get(
        f"/api/dashboard?period=all&client_id={seeded.clients['Padaria Central']}",
        headers=headers,
    )
    assert bakery.status_code == 200
    bakery_names = {row["campaign"] for row in bakery.json()["by_campaign"]}
    assert bakery_names == {"Black Friday", "Dia dos Pais"}

    instagram = client.get(
        f"/api/dashboard?period=all&platform_id={seeded.platforms['Instagram']}",
        headers=headers,
    )
    assert instagram.status_code == 200
    assert instagram.json()["overview"]["total_campaigns"] == 1
    assert instagram.json()["by_campaign"][0]["campaign"] == "Black Friday"

    empty = client.get("/api/dashboard?period=all&client_id=999999", headers=headers)
    assert empty.status_code == 200
    assert empty.json()["overview"]["total_campaigns"] == 0

    overview = client.get("/api/dashboard/overview?period=all", headers=headers)
    assert overview.status_code == 200
    assert overview.json()["total_conversions"] == seeded.total_conversions
    assert overview.json()["comparison"] is None


def test_dashboard_compares_previous_period(mock_user):
    headers = mock_user["headers"]
    body = client.get("/api/dashboard?period=30d", headers=headers).json()

    assert body["filters"]["period"] == "30d"
    assert body["overview"]["comparison"] is not None
    comparison = body["overview"]["comparison"]
    assert "delta_percent" in comparison["total_investment"]
    assert "previous" in comparison["average_ctr"]
    assert "previous" in comparison["average_cpc"]

    ninety = client.get("/api/dashboard?period=90d", headers=headers).json()
    assert ninety["overview"]["comparison"] is not None
    assert ninety["overview"]["total_investment"] >= body["overview"]["total_investment"]


def test_metric_indicators_from_mock_payload(mock_user):
    headers = mock_user["headers"]
    campaign_id = mock_user["seeded"].campaigns["Verão"]
    response = client.post(
        "/api/metrics",
        headers=headers,
        json={
            "campaign_id": campaign_id,
            "date": "2026-05-01",
            "impressions": 1000,
            "clicks": 50,
            "conversions": 5,
            "investment": 100,
        },
    )
    assert response.status_code == 201
    indicators = response.json()["indicators"]
    assert indicators["cpc"] == 2
    assert indicators["ctr"] == 5
    assert indicators["taxa_conversao"] == 10
