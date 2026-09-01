from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import get_current_user
from app.indicators import build_indicators
from app.models import Campaign, Client, Expense, Metric, Platform, User
from app.schemas import CampaignCreate, CampaignOut

router = APIRouter(prefix="/api/campaigns", tags=["Campanhas"])


def _owned_campaign(db: Session, campaign_id: int, user_id: int) -> Campaign:
    campaign = (
        db.query(Campaign)
        .options(joinedload(Campaign.client), joinedload(Campaign.platform))
        .filter(Campaign.id == campaign_id, Campaign.user_id == user_id)
        .first()
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    return campaign


@router.get("", response_model=list[CampaignOut])
def list_campaigns(
    status: str | None = None,
    client_id: int | None = None,
    include_history: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(Campaign)
        .options(joinedload(Campaign.client), joinedload(Campaign.platform))
        .filter(Campaign.user_id == current_user.id)
    )
    if status:
        query = query.filter(Campaign.status == status)
    if client_id:
        query = query.filter(Campaign.client_id == client_id)
    if not include_history:
        query = query.filter(Campaign.status != "finalizada")
    return query.order_by(Campaign.created_at.desc()).all()


@router.post("", response_model=CampaignOut, status_code=201)
def create_campaign(
    payload: CampaignCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    client = db.query(Client).filter(Client.id == payload.client_id, Client.user_id == current_user.id).first()
    platform = db.query(Platform).filter(Platform.id == payload.platform_id, Platform.user_id == current_user.id).first()
    if not client:
        raise HTTPException(status_code=400, detail="Cliente inválido")
    if not platform:
        raise HTTPException(status_code=400, detail="Plataforma inválida")
    campaign = Campaign(user_id=current_user.id, **payload.model_dump())
    db.add(campaign)
    db.commit()
    return _owned_campaign(db, campaign.id, current_user.id)


@router.get("/{campaign_id}", response_model=CampaignOut)
def get_campaign(campaign_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return _owned_campaign(db, campaign_id, current_user.id)


@router.put("/{campaign_id}", response_model=CampaignOut)
def update_campaign(
    campaign_id: int,
    payload: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    campaign = _owned_campaign(db, campaign_id, current_user.id)
    client = db.query(Client).filter(Client.id == payload.client_id, Client.user_id == current_user.id).first()
    platform = db.query(Platform).filter(Platform.id == payload.platform_id, Platform.user_id == current_user.id).first()
    if not client:
        raise HTTPException(status_code=400, detail="Cliente inválido")
    if not platform:
        raise HTTPException(status_code=400, detail="Plataforma inválida")
    for key, value in payload.model_dump().items():
        setattr(campaign, key, value)
    db.commit()
    return _owned_campaign(db, campaign.id, current_user.id)


@router.delete("/{campaign_id}", status_code=204)
def delete_campaign(campaign_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    campaign = _owned_campaign(db, campaign_id, current_user.id)
    db.delete(campaign)
    db.commit()


@router.get("/{campaign_id}/summary")
def campaign_summary(campaign_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    campaign = _owned_campaign(db, campaign_id, current_user.id)
    metrics = db.query(Metric).filter(Metric.campaign_id == campaign.id).all()
    expenses = db.query(Expense).filter(Expense.campaign_id == campaign.id).all()

    totals = {
        "reach": sum(m.reach for m in metrics),
        "impressions": sum(m.impressions for m in metrics),
        "clicks": sum(m.clicks for m in metrics),
        "likes": sum(m.likes for m in metrics),
        "comments": sum(m.comments for m in metrics),
        "shares": sum(m.shares for m in metrics),
        "conversions": sum(m.conversions for m in metrics),
        "investment": sum(m.investment for m in metrics) + sum(e.amount for e in expenses),
        "budget": campaign.budget,
    }
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
    return {
        "campaign": CampaignOut.model_validate(campaign),
        "totals": totals,
        "indicators": indicators,
        "budget_used_percent": round((totals["investment"] / campaign.budget) * 100, 2) if campaign.budget else None,
    }
