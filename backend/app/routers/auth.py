from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.deps import get_current_user
from app.models import Platform, User
from app.rate_limit import limiter
from app.schemas import TokenOut, UserCreate, UserLogin, UserOut
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["Autenticação"])

DEFAULT_PLATFORMS = [
    ("Instagram", "Rede social visual"),
    ("Facebook", "Rede social e anúncios Meta"),
    ("Google Ads", "Anúncios de busca e display"),
    ("LinkedIn", "Rede profissional"),
    ("TikTok", "Vídeos curtos"),
    ("YouTube", "Vídeo e anúncios"),
    ("E-mail", "E-mail marketing"),
]


def _seed_platforms(db: Session, user: User) -> None:
    for name, description in DEFAULT_PLATFORMS:
        db.add(Platform(user_id=user.id, name=name, description=description))


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.rate_limit_register)
def register(request: Request, payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")

    user = User(
        name=payload.name.strip(),
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.flush()
    _seed_platforms(db, user)
    db.commit()
    db.refresh(user)
    return TokenOut(access_token=create_access_token(str(user.id)), user=user)


@router.post("/login", response_model=TokenOut)
@limiter.limit(settings.rate_limit_auth)
def login(request: Request, payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos")
    return TokenOut(access_token=create_access_token(str(user.id)), user=user)


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
