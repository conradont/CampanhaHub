from datetime import date
from io import StringIO

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import get_current_user
from app.indicators import build_indicators
from app.models import Campaign, Expense, Metric, User

router = APIRouter(prefix="/api/reports", tags=["Relatórios"])


def _campaign_rows(
    db: Session,
    user_id: int,
    client_id: int | None,
    status: str | None,
    start: date | None,
    end: date | None,
):
    query = (
        db.query(Campaign)
        .options(joinedload(Campaign.client), joinedload(Campaign.platform), joinedload(Campaign.metrics), joinedload(Campaign.expenses))
        .filter(Campaign.user_id == user_id)
    )
    if client_id:
        query = query.filter(Campaign.client_id == client_id)
    if status:
        query = query.filter(Campaign.status == status)
    if start:
        query = query.filter(Campaign.start_date >= start)
    if end:
        query = query.filter(Campaign.start_date <= end)

    rows = []
    for campaign in query.order_by(Campaign.start_date.desc()).all():
        metrics = campaign.metrics
        expenses = campaign.expenses
        totals = {
            "reach": sum(m.reach for m in metrics),
            "impressions": sum(m.impressions for m in metrics),
            "clicks": sum(m.clicks for m in metrics),
            "conversions": sum(m.conversions for m in metrics),
            "investment": sum(m.investment for m in metrics) + sum(e.amount for e in expenses),
        }
        indicators = build_indicators(
            totals["investment"],
            totals["clicks"],
            totals["impressions"],
            totals["conversions"],
        )
        rows.append(
            {
                "id": campaign.id,
                "name": campaign.name,
                "client": campaign.client.name if campaign.client else "",
                "platform": campaign.platform.name if campaign.platform else "",
                "status": campaign.status,
                "start_date": campaign.start_date.isoformat(),
                "end_date": campaign.end_date.isoformat() if campaign.end_date else "",
                "budget": campaign.budget,
                **totals,
                **indicators,
            }
        )
    return rows


@router.get("")
def reports(
    client_id: int | None = None,
    status: str | None = None,
    start: date | None = None,
    end: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = _campaign_rows(db, current_user.id, client_id, status, start, end)
    return {
        "total_campaigns": len(rows),
        "investment": sum(r["investment"] for r in rows),
        "clicks": sum(r["clicks"] for r in rows),
        "conversions": sum(r["conversions"] for r in rows),
        "rows": rows,
    }


@router.get("/export.csv")
def export_csv(
    client_id: int | None = None,
    status: str | None = Query(None),
    start: date | None = None,
    end: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = _campaign_rows(db, current_user.id, client_id, status, start, end)
    output = StringIO()
    headers = [
        "campanha",
        "cliente",
        "plataforma",
        "status",
        "inicio",
        "termino",
        "orcamento",
        "investimento",
        "alcance",
        "impressoes",
        "cliques",
        "conversoes",
        "cpc",
        "ctr",
        "taxa_conversao",
    ]
    output.write(";".join(headers) + "\n")
    for row in rows:
        values = [
            row["name"],
            row["client"],
            row["platform"],
            row["status"],
            row["start_date"],
            row["end_date"],
            row["budget"],
            row["investment"],
            row["reach"],
            row["impressions"],
            row["clicks"],
            row["conversions"],
            row["cpc"] if row["cpc"] is not None else "",
            row["ctr"] if row["ctr"] is not None else "",
            row["taxa_conversao"] if row["taxa_conversao"] is not None else "",
        ]
        output.write(";".join(str(v) for v in values) + "\n")
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=relatorio-campanhas.csv"},
    )
