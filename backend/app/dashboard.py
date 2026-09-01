from collections import defaultdict
from datetime import date, timedelta

from sqlalchemy.orm import Session, joinedload

from app.indicators import build_indicators, calc_cpc, calc_ctr
from app.models import Campaign, Expense, Metric, User

MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]


def resolve_period(period: str, start: date | None, end: date | None) -> tuple[date | None, date | None]:
    if start or end:
        return start, end
    today = date.today()
    if period == "30d":
        return today - timedelta(days=29), today
    if period == "90d":
        return today - timedelta(days=89), today
    if period == "12m":
        try:
            start_date = today.replace(year=today.year - 1)
        except ValueError:
            start_date = date(today.year - 1, 2, 28)
        return start_date, today
    return None, None


def _in_range(day: date, start: date | None, end: date | None) -> bool:
    if start and day < start:
        return False
    if end and day > end:
        return False
    return True


def _grain(start: date | None, end: date | None) -> str:
    if start and end and (end - start).days <= 45:
        return "day"
    return "month"


def _bucket_key(day: date, grain: str) -> str:
    if grain == "day":
        return day.isoformat()
    return f"{day.year:04d}-{day.month:02d}"


def _bucket_label(key: str, grain: str) -> str:
    if grain == "day":
        year, month, day = key.split("-")
        return f"{day}/{month}"
    year, month = key.split("-")
    return f"{MONTH_LABELS[int(month) - 1]} {year}"


def build_dashboard(
    db: Session,
    user: User,
    period: str = "all",
    client_id: int | None = None,
    campaign_id: int | None = None,
    platform_id: int | None = None,
    start: date | None = None,
    end: date | None = None,
) -> dict:
    start_date, end_date = resolve_period(period, start, end)
    grain = _grain(start_date, end_date)

    query = (
        db.query(Campaign)
        .options(joinedload(Campaign.platform), joinedload(Campaign.client))
        .filter(Campaign.user_id == user.id)
    )
    if client_id:
        query = query.filter(Campaign.client_id == client_id)
    if campaign_id:
        query = query.filter(Campaign.id == campaign_id)
    if platform_id:
        query = query.filter(Campaign.platform_id == platform_id)

    campaigns = query.all()
    campaign_ids = [campaign.id for campaign in campaigns]
    campaign_map = {campaign.id: campaign for campaign in campaigns}

    metrics = db.query(Metric).filter(Metric.campaign_id.in_(campaign_ids)).all() if campaign_ids else []
    expenses = db.query(Expense).filter(Expense.campaign_id.in_(campaign_ids)).all() if campaign_ids else []
    metrics = [metric for metric in metrics if _in_range(metric.date, start_date, end_date)]
    expenses = [expense for expense in expenses if _in_range(expense.date, start_date, end_date)]

    totals = {
        "reach": sum(metric.reach for metric in metrics),
        "impressions": sum(metric.impressions for metric in metrics),
        "clicks": sum(metric.clicks for metric in metrics),
        "likes": sum(metric.likes for metric in metrics),
        "comments": sum(metric.comments for metric in metrics),
        "shares": sum(metric.shares for metric in metrics),
        "conversions": sum(metric.conversions for metric in metrics),
        "investment_metrics": sum(metric.investment for metric in metrics),
        "investment_expenses": sum(expense.amount for expense in expenses),
    }
    totals["investment"] = totals["investment_metrics"] + totals["investment_expenses"]
    indicators = build_indicators(
        totals["investment"],
        totals["clicks"],
        totals["impressions"],
        totals["conversions"],
        totals["likes"],
        totals["comments"],
        totals["shares"],
        totals["reach"],
    )

    by_platform: dict[str, dict] = defaultdict(
        lambda: {"investment": 0.0, "clicks": 0, "conversions": 0, "impressions": 0}
    )
    for metric in metrics:
        name = campaign_map[metric.campaign_id].platform.name if campaign_map[metric.campaign_id].platform else "Outros"
        by_platform[name]["investment"] += metric.investment
        by_platform[name]["clicks"] += metric.clicks
        by_platform[name]["conversions"] += metric.conversions
        by_platform[name]["impressions"] += metric.impressions
    for expense in expenses:
        name = campaign_map[expense.campaign_id].platform.name if campaign_map[expense.campaign_id].platform else "Outros"
        by_platform[name]["investment"] += expense.amount

    platform_rows = []
    for name, values in sorted(by_platform.items(), key=lambda item: item[1]["investment"], reverse=True):
        share = round((values["investment"] / totals["investment"]) * 100, 1) if totals["investment"] else 0
        platform_rows.append({"platform": name, "share_percent": share, **values})

    buckets: dict[str, dict] = defaultdict(
        lambda: {"investment": 0.0, "conversions": 0, "clicks": 0, "impressions": 0}
    )
    for metric in metrics:
        key = _bucket_key(metric.date, grain)
        buckets[key]["investment"] += metric.investment
        buckets[key]["conversions"] += metric.conversions
        buckets[key]["clicks"] += metric.clicks
        buckets[key]["impressions"] += metric.impressions
    for expense in expenses:
        key = _bucket_key(expense.date, grain)
        buckets[key]["investment"] += expense.amount

    evolution = []
    for key in sorted(buckets):
        values = buckets[key]
        evolution.append(
            {
                "month": key,
                "date": key,
                "label": _bucket_label(key, grain),
                "investment": values["investment"],
                "conversions": values["conversions"],
                "clicks": values["clicks"],
                "impressions": values["impressions"],
                "ctr": calc_ctr(values["clicks"], values["impressions"]),
            }
        )

    by_campaign_acc: dict[int, dict] = defaultdict(
        lambda: {"investment": 0.0, "conversions": 0, "clicks": 0, "impressions": 0}
    )
    for metric in metrics:
        by_campaign_acc[metric.campaign_id]["investment"] += metric.investment
        by_campaign_acc[metric.campaign_id]["conversions"] += metric.conversions
        by_campaign_acc[metric.campaign_id]["clicks"] += metric.clicks
        by_campaign_acc[metric.campaign_id]["impressions"] += metric.impressions
    for expense in expenses:
        by_campaign_acc[expense.campaign_id]["investment"] += expense.amount

    campaign_rows = []
    for campaign_pk, values in by_campaign_acc.items():
        campaign = campaign_map[campaign_pk]
        campaign_rows.append(
            {
                "id": campaign.id,
                "campaign": campaign.name,
                "investment": values["investment"],
                "conversions": values["conversions"],
                "clicks": values["clicks"],
                "impressions": values["impressions"],
                "cpc": calc_cpc(values["investment"], values["clicks"]),
                "ctr": calc_ctr(values["clicks"], values["impressions"]),
            }
        )
    campaign_rows.sort(key=lambda row: row["conversions"], reverse=True)

    overview = {
        "total_campaigns": len(campaigns),
        "total_investment": totals["investment"],
        "total_conversions": totals["conversions"],
        "total_clicks": totals["clicks"],
        "average_ctr": indicators["ctr"],
        "average_cpc": indicators["cpc"],
    }

    return {
        "filters": {
            "period": period,
            "start": start_date.isoformat() if start_date else None,
            "end": end_date.isoformat() if end_date else None,
            "grain": grain,
            "client_id": client_id,
            "campaign_id": campaign_id,
            "platform_id": platform_id,
        },
        "overview": overview,
        "campaigns_total": len(campaigns),
        "campaigns_active": sum(1 for campaign in campaigns if campaign.status == "ativa"),
        "campaigns_finished": sum(1 for campaign in campaigns if campaign.status == "finalizada"),
        "campaigns_paused": sum(1 for campaign in campaigns if campaign.status == "pausada"),
        "campaigns_draft": sum(1 for campaign in campaigns if campaign.status == "rascunho"),
        "totals": totals,
        "indicators": indicators,
        "evolution": evolution,
        "by_platform": platform_rows,
        "by_campaign": campaign_rows,
    }
