from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Campaign, Expense, User
from app.schemas import ExpenseCreate, ExpenseOut

router = APIRouter(prefix="/api/expenses", tags=["Despesas"])


@router.get("", response_model=list[ExpenseOut])
def list_expenses(
    campaign_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Expense).join(Campaign).filter(Campaign.user_id == current_user.id)
    if campaign_id:
        query = query.filter(Expense.campaign_id == campaign_id)
    return query.order_by(Expense.date.desc()).all()


@router.post("", response_model=ExpenseOut, status_code=201)
def create_expense(
    payload: ExpenseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    campaign = db.query(Campaign).filter(Campaign.id == payload.campaign_id, Campaign.user_id == current_user.id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    expense = Expense(**payload.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.put("/{expense_id}", response_model=ExpenseOut)
def update_expense(
    expense_id: int,
    payload: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = (
        db.query(Expense).join(Campaign).filter(Expense.id == expense_id, Campaign.user_id == current_user.id).first()
    )
    if not expense:
        raise HTTPException(status_code=404, detail="Despesa não encontrada")
    campaign = db.query(Campaign).filter(Campaign.id == payload.campaign_id, Campaign.user_id == current_user.id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")
    for key, value in payload.model_dump().items():
        setattr(expense, key, value)
    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{expense_id}", status_code=204)
def delete_expense(expense_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    expense = (
        db.query(Expense).join(Campaign).filter(Expense.id == expense_id, Campaign.user_id == current_user.id).first()
    )
    if not expense:
        raise HTTPException(status_code=404, detail="Despesa não encontrada")
    db.delete(expense)
    db.commit()
