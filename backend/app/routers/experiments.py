from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Campaign, Experiment, User
from app.schemas import ExperimentCreate, ExperimentOut

router = APIRouter(prefix="/api/experiments", tags=["Experimentos"])

ALLOWED_STATUS = {"ideia", "em_teste", "aprendido"}


def _owned_campaign(db: Session, campaign_id: int, user_id: int) -> Campaign:
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == user_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    return campaign


@router.get("", response_model=list[ExperimentOut])
def list_experiments(
    campaign_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Experiment).join(Campaign).filter(Campaign.user_id == current_user.id)
    if campaign_id:
        query = query.filter(Experiment.campaign_id == campaign_id)
    return query.order_by(Experiment.created_at.desc()).all()


@router.post("", response_model=ExperimentOut, status_code=201)
def create_experiment(
    payload: ExperimentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    if payload.status not in ALLOWED_STATUS:
        raise HTTPException(status_code=400, detail="Status de experimento inválido")
    _owned_campaign(db, payload.campaign_id, current_user.id)
    experiment = Experiment(**payload.model_dump())
    db.add(experiment)
    db.commit()
    db.refresh(experiment)
    return experiment


@router.delete("/{experiment_id}", status_code=204)
def delete_experiment(
    experiment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    experiment = (
        db.query(Experiment)
        .join(Campaign)
        .filter(Experiment.id == experiment_id, Campaign.user_id == current_user.id)
        .first()
    )
    if not experiment:
        raise HTTPException(status_code=404, detail="Experimento não encontrado")
    db.delete(experiment)
    db.commit()
