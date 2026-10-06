from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.indicators import build_indicators
from app.models import Campaign, Metric, User
from app.schemas import MetricCreate, MetricOut

router = APIRouter(prefix="/api/metrics", tags=["Métricas"])


def with_indicators(metric: Metric) -> MetricOut:
    data = MetricOut.model_validate(metric)
    data.indicators = build_indicators(
        metric.investment,
        metric.clicks,
        metric.impressions,
        metric.conversions,
        metric.likes,
        metric.comments,
        metric.shares,
        metric.reach,
        metric.new_customers,
    )
    return data


@router.get("", response_model=list[MetricOut])
def list_metrics(
    campaign_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Metric).join(Campaign).filter(Campaign.user_id == current_user.id)
    if campaign_id:
        query = query.filter(Metric.campaign_id == campaign_id)
    metrics = query.order_by(Metric.date.desc()).all()
    return [with_indicators(m) for m in metrics]


@router.post("", response_model=MetricOut, status_code=201)
def create_metric(
    payload: MetricCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    campaign = db.query(Campaign).filter(Campaign.id == payload.campaign_id, Campaign.user_id == current_user.id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    metric = Metric(**payload.model_dump())
    db.add(metric)
    db.commit()
    db.refresh(metric)
    return with_indicators(metric)


@router.put("/{metric_id}", response_model=MetricOut)
def update_metric(
    metric_id: int,
    payload: MetricCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    metric = (
        db.query(Metric).join(Campaign).filter(Metric.id == metric_id, Campaign.user_id == current_user.id).first()
    )
    if not metric:
        raise HTTPException(status_code=404, detail="Métrica não encontrada")
    campaign = db.query(Campaign).filter(Campaign.id == payload.campaign_id, Campaign.user_id == current_user.id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    for key, value in payload.model_dump().items():
        setattr(metric, key, value)
    db.commit()
    db.refresh(metric)
    return with_indicators(metric)


@router.delete("/{metric_id}", status_code=204)
def delete_metric(metric_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    metric = (
        db.query(Metric).join(Campaign).filter(Metric.id == metric_id, Campaign.user_id == current_user.id).first()
    )
    if not metric:
        raise HTTPException(status_code=404, detail="Métrica não encontrada")
    db.delete(metric)
    db.commit()
