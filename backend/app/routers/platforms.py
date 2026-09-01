from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Campaign, Platform, User
from app.schemas import PlatformCreate, PlatformOut

router = APIRouter(prefix="/api/platforms", tags=["Plataformas"])


@router.get("", response_model=list[PlatformOut])
def list_platforms(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(Platform)
        .filter(Platform.user_id == current_user.id)
        .order_by(Platform.name)
        .all()
    )


@router.post("", response_model=PlatformOut, status_code=201)
def create_platform(
    payload: PlatformCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    existing = (
        db.query(Platform)
        .filter(Platform.user_id == current_user.id, Platform.name == payload.name.strip())
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Plataforma já cadastrada")
    platform = Platform(user_id=current_user.id, name=payload.name.strip(), description=payload.description)
    db.add(platform)
    db.commit()
    db.refresh(platform)
    return platform


@router.put("/{platform_id}", response_model=PlatformOut)
def update_platform(
    platform_id: int,
    payload: PlatformCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    platform = db.query(Platform).filter(Platform.id == platform_id, Platform.user_id == current_user.id).first()
    if not platform:
        raise HTTPException(status_code=404, detail="Plataforma não encontrada")
    platform.name = payload.name.strip()
    platform.description = payload.description
    db.commit()
    db.refresh(platform)
    return platform


@router.delete("/{platform_id}", status_code=204)
def delete_platform(platform_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    platform = db.query(Platform).filter(Platform.id == platform_id, Platform.user_id == current_user.id).first()
    if not platform:
        raise HTTPException(status_code=404, detail="Plataforma não encontrada")
    has_campaigns = db.query(Campaign).filter(Campaign.platform_id == platform.id).first()
    if has_campaigns:
        raise HTTPException(status_code=400, detail="Plataforma possui campanhas vinculadas")
    db.delete(platform)
    db.commit()
