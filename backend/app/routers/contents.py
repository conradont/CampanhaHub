from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import get_current_user
from app.models import Campaign, Content, User
from app.schemas import ContentCreate, ContentOut

router = APIRouter(prefix="/api/contents", tags=["Conteúdos"])


def _owned_campaign(db: Session, campaign_id: int, user_id: int) -> Campaign:
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == user_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    return campaign


@router.get("", response_model=list[ContentOut])
def list_contents(
    campaign_id: int | None = None,
    start: date | None = None,
    end: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(Content)
        .join(Campaign)
        .filter(Campaign.user_id == current_user.id)
        .options(joinedload(Content.campaign))
    )
    if campaign_id:
        query = query.filter(Content.campaign_id == campaign_id)
    if start:
        query = query.filter(Content.scheduled_date >= start)
    if end:
        query = query.filter(Content.scheduled_date <= end)
    return query.order_by(Content.scheduled_date).all()


@router.post("", response_model=ContentOut, status_code=201)
def create_content(
    payload: ContentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    _owned_campaign(db, payload.campaign_id, current_user.id)
    content = Content(**payload.model_dump())
    db.add(content)
    db.commit()
    db.refresh(content)
    return content


@router.put("/{content_id}", response_model=ContentOut)
def update_content(
    content_id: int,
    payload: ContentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    content = (
        db.query(Content)
        .join(Campaign)
        .filter(Content.id == content_id, Campaign.user_id == current_user.id)
        .first()
    )
    if not content:
        raise HTTPException(status_code=404, detail="Conteúdo não encontrado")
    _owned_campaign(db, payload.campaign_id, current_user.id)
    for key, value in payload.model_dump().items():
        setattr(content, key, value)
    db.commit()
    db.refresh(content)
    return content


@router.delete("/{content_id}", status_code=204)
def delete_content(content_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    content = (
        db.query(Content)
        .join(Campaign)
        .filter(Content.id == content_id, Campaign.user_id == current_user.id)
        .first()
    )
    if not content:
        raise HTTPException(status_code=404, detail="Conteúdo não encontrado")
    db.delete(content)
    db.commit()
