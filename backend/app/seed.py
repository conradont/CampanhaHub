"""Carrega dados mockados na conta de demonstração.

Uso:
    cd backend
    python -m app.seed
"""

from app.database import Base, SessionLocal, engine
from app.mock_data import DEMO_EMAIL, DEMO_NAME, DEMO_PASSWORD, clear_business_data, load_mock_dataset
from app.models import User
from app.security import hash_password


def seed_demo_user() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == DEMO_EMAIL).first()
        if user is None:
            user = User(name=DEMO_NAME, email=DEMO_EMAIL, hashed_password=hash_password(DEMO_PASSWORD))
            db.add(user)
            db.flush()
        clear_business_data(db, user)
        result = load_mock_dataset(db, user)
        db.commit()
        print(f"Dados mockados carregados para {DEMO_EMAIL}")
        print(f"Senha: {DEMO_PASSWORD}")
        print(f"Campanhas: {len(result.campaigns)} | Investimento: R$ {result.total_investment:.2f} | Conversões: {result.total_conversions}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_user()
