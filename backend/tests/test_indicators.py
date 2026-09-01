from app.indicators import build_indicators, calc_cpc, calc_ctr, calc_taxa_conversao
from app.mock_data import MONTHLY_SERIES


def test_indicators_from_mock_monthly_series():
    investment = sum(row["investment"] for row in MONTHLY_SERIES)
    clicks = sum(row["clicks"] for row in MONTHLY_SERIES)
    impressions = sum(row["impressions"] for row in MONTHLY_SERIES)
    conversions = sum(row["conversions"] for row in MONTHLY_SERIES)

    assert investment == 5700
    assert conversions == 341
    assert calc_cpc(investment, clicks) == calc_cpc(5700, 5050)
    assert calc_ctr(clicks, impressions) == calc_ctr(5050, 73000)
    assert calc_taxa_conversao(conversions, clicks) == calc_taxa_conversao(341, 5050)

    indicators = build_indicators(investment, clicks, impressions, conversions)
    assert indicators["cpc"] == round(5700 / 5050, 4)
    assert indicators["ctr"] == round(5050 * 100 / 73000, 2)
    assert indicators["taxa_conversao"] == round(341 * 100 / 5050, 2)
