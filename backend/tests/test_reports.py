import csv
from io import StringIO

from app.database import SessionLocal
from app.models import Campaign
from tests.conftest import client


def test_export_csv_neutralizes_formula_and_quotes_user_text(mock_user):
    campaign_id = mock_user["seeded"].campaigns["Black Friday"]
    malicious_name = ' =HYPERLINK("https://attacker.invalid";"click")\ncontinued'

    db = SessionLocal()
    try:
        campaign = db.get(Campaign, campaign_id)
        campaign.name = malicious_name
        db.commit()
    finally:
        db.close()

    response = client.get("/api/reports/export.csv", headers=mock_user["headers"])

    assert response.status_code == 200
    rows = list(csv.DictReader(StringIO(response.text), delimiter=";"))
    assert len(rows) == 4
    assert any(row["campanha"] == "'" + malicious_name for row in rows)
