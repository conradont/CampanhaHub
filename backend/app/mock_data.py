from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date

from sqlalchemy.orm import Session

from app.models import Campaign, Client, Content, Expense, Metric, Platform, User
from app.routers.auth import DEFAULT_PLATFORMS

DEMO_EMAIL = "conrado@campanhahub.dev"
DEMO_PASSWORD = "senha123"
DEMO_NAME = "Luiz Conrado"

MONTHLY_SERIES = [
    {"investment": 800, "conversions": 42, "clicks": 650, "impressions": 10000},
    {"investment": 1200, "conversions": 65, "clicks": 980, "impressions": 15000},
    {"investment": 1600, "conversions": 91, "clicks": 1320, "impressions": 20000},
    {"investment": 2100, "conversions": 143, "clicks": 2100, "impressions": 28000},
]

CAMPAIGN_SPECS = [
    {"name": "Black Friday", "platform": "Instagram", "client": "Padaria Central", "weight": 0.40, "status": "ativa", "objective": "Vendas", "budget": 2500},
    {"name": "Dia dos Pais", "platform": "Facebook", "client": "Padaria Central", "weight": 0.25, "status": "finalizada", "objective": "Tráfego", "budget": 1800},
    {"name": "Verão", "platform": "Google Ads", "client": "Oficina do Bairro", "weight": 0.22, "status": "ativa", "objective": "Conversões", "budget": 1600},
    {"name": "Reels de primavera", "platform": "TikTok", "client": "Oficina do Bairro", "weight": 0.13, "status": "pausada", "objective": "Alcance", "budget": 1100},
]

CLIENT_SPECS = [
    {"name": "Padaria Central", "segment": "Alimentação", "contact_email": "contato@padariacentral.dev", "contact_phone": "11988880001"},
    {"name": "Oficina do Bairro", "segment": "Serviços", "contact_email": "ola@oficinadobairro.dev", "contact_phone": "11988880002"},
]


@dataclass
class MockSeedResult:
    clients: dict[str, int] = field(default_factory=dict)
    campaigns: dict[str, int] = field(default_factory=dict)
    platforms: dict[str, int] = field(default_factory=dict)
    total_investment: float = 0
    total_conversions: int = 0
    total_clicks: int = 0
    total_impressions: int = 0
    month_dates: list[date] = field(default_factory=list)


def month_starts(count: int = 4) -> list[date]:
    today = date.today()
    year, month = today.year, today.month
    months: list[date] = []
    for _ in range(count):
        months.append(date(year, month, 1))
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    months.reverse()
    return months


def metric_date_for(month_start: date) -> date:
    today = date.today()
    if month_start.year == today.year and month_start.month == today.month:
        return today
    return date(month_start.year, month_start.month, min(12, 28))


def _split(total: float | int, weights: list[float]) -> list[int]:
    parts = [int(round(total * weight)) for weight in weights]
    parts[-1] = int(total) - sum(parts[:-1])
    return parts


def ensure_default_platforms(db: Session, user: User) -> dict[str, int]:
    existing = {platform.name: platform for platform in db.query(Platform).filter(Platform.user_id == user.id).all()}
    for name, description in DEFAULT_PLATFORMS:
        if name not in existing:
            platform = Platform(user_id=user.id, name=name, description=description)
            db.add(platform)
            db.flush()
            existing[name] = platform
    return {name: platform.id for name, platform in existing.items()}


def clear_business_data(db: Session, user: User) -> None:
    for campaign in db.query(Campaign).filter(Campaign.user_id == user.id).all():
        db.delete(campaign)
    db.flush()
    for client in db.query(Client).filter(Client.user_id == user.id).all():
        db.delete(client)
    db.flush()


def load_mock_dataset(db: Session, user: User) -> MockSeedResult:
    """Carrega o conjunto mockado usado pelos testes e pela conta de demonstração."""
    result = MockSeedResult()
    result.platforms = ensure_default_platforms(db, user)
    result.month_dates = [metric_date_for(start) for start in month_starts(4)]
    weights = [spec["weight"] for spec in CAMPAIGN_SPECS]

    for spec in CLIENT_SPECS:
        client = Client(
            user_id=user.id,
            name=spec["name"],
            segment=spec["segment"],
            description=f"Cliente mockado para testes — {spec['segment'].lower()}.",
            contact_email=spec["contact_email"],
            contact_phone=spec["contact_phone"],
            status="ativo",
        )
        db.add(client)
        db.flush()
        result.clients[client.name] = client.id

    campaigns: list[Campaign] = []
    for spec in CAMPAIGN_SPECS:
        start = result.month_dates[0]
        end = result.month_dates[-1] if spec["status"] == "finalizada" else None
        campaign = Campaign(
            user_id=user.id,
            client_id=result.clients[spec["client"]],
            platform_id=result.platforms[spec["platform"]],
            name=spec["name"],
            objective=spec["objective"],
            description=f"Campanha mockada em {spec['platform']}.",
            start_date=start,
            end_date=end,
            budget=spec["budget"],
            status=spec["status"],
        )
        db.add(campaign)
        db.flush()
        result.campaigns[campaign.name] = campaign.id
        campaigns.append(campaign)

    for month_index, series in enumerate(MONTHLY_SERIES):
        investments = _split(series["investment"], weights)
        conversions = _split(series["conversions"], weights)
        clicks = _split(series["clicks"], weights)
        impressions = _split(series["impressions"], weights)
        day = result.month_dates[month_index]
        for index, campaign in enumerate(campaigns):
            db.add(
                Metric(
                    campaign_id=campaign.id,
                    date=day,
                    reach=impressions[index],
                    impressions=impressions[index],
                    clicks=clicks[index],
                    likes=max(conversions[index] * 3, 0),
                    comments=max(conversions[index] // 2, 0),
                    shares=max(conversions[index] // 3, 0),
                    conversions=conversions[index],
                    investment=investments[index],
                )
            )
            result.total_investment += investments[index]
            result.total_conversions += conversions[index]
            result.total_clicks += clicks[index]
            result.total_impressions += impressions[index]

    db.add(
        Expense(
            campaign_id=result.campaigns["Black Friday"],
            description="Ajuste de mídia (mock)",
            amount=120,
            date=result.month_dates[-1],
            category="mídia",
        )
    )
    db.add(
        Expense(
            campaign_id=result.campaigns["Verão"],
            description="Produção de criativo (mock)",
            amount=80,
            date=result.month_dates[-2],
            category="produção",
        )
    )
    result.total_investment += 200

    db.add(
        Content(
            campaign_id=result.campaigns["Black Friday"],
            title="Carrossel de pães de festa",
            content_type="carrossel",
            scheduled_date=date.today(),
            status="publicado",
            notes="Peça mockada para o calendário.",
        )
    )
    db.add(
        Content(
            campaign_id=result.campaigns["Verão"],
            title="Reels revisão de freios",
            content_type="reels",
            scheduled_date=date.today(),
            status="planejado",
            notes="Peça mockada para o calendário.",
        )
    )
    db.flush()
    return result
