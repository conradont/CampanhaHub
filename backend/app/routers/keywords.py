from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Campaign, Keyword, User
from app.schemas import KeywordCreate, KeywordOut

router = APIRouter(prefix="/api/keywords", tags=["Palavras-chave"])


def _owned_campaign(db: Session, campaign_id: int, user_id: int) -> Campaign:
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id, Campaign.user_id == user_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    return campaign


@router.get("", response_model=list[KeywordOut])
def list_keywords(
    campaign_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Keyword).join(Campaign).filter(Campaign.user_id == current_user.id)
    if campaign_id:
        query = query.filter(Keyword.campaign_id == campaign_id)
    return query.order_by(Keyword.created_at.desc()).all()


@router.post("", response_model=KeywordOut, status_code=201)
def create_keyword(
    payload: KeywordCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    _owned_campaign(db, payload.campaign_id, current_user.id)
    keyword = Keyword(**payload.model_dump())
    db.add(keyword)
    db.commit()
    db.refresh(keyword)
    return keyword


@router.delete("/{keyword_id}", status_code=204)
def delete_keyword(keyword_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    keyword = (
        db.query(Keyword).join(Campaign).filter(Keyword.id == keyword_id, Campaign.user_id == current_user.id).first()
    )
    if not keyword:
        raise HTTPException(status_code=404, detail="Palavra-chave não encontrada")
    db.delete(keyword)
    db.commit()
