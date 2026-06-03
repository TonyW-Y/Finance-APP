from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from app.database import get_session
from app.dependencies import get_current_user
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionResponse

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("", response_model=list[TransactionResponse])
def list_transactions(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
    search: str | None = Query(None),
    type: str | None = Query(None),
    category: str | None = Query(None),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
):
    stmt = select(Transaction).where(Transaction.user_id == user.id)
    if type:
        stmt = stmt.where(Transaction.type == type)
    if category:
        stmt = stmt.where(Transaction.category == category)
    if start_date:
        stmt = stmt.where(Transaction.date >= start_date)
    if end_date:
        stmt = stmt.where(Transaction.date <= end_date)
    if search:
        stmt = stmt.where(Transaction.description.ilike(f"%{search}%"))
    stmt = stmt.order_by(Transaction.date.desc(), Transaction.id.desc())
    return session.exec(stmt).all()


@router.post("", response_model=TransactionResponse, status_code=201)
def create_transaction(
    body: TransactionCreate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    txn = Transaction(**body.model_dump(), user_id=user.id)
    session.add(txn)
    session.commit()
    session.refresh(txn)
    return txn


@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    txn = session.get(Transaction, transaction_id)
    if not txn or txn.user_id != user.id:
        raise HTTPException(status_code=404, detail="Transaction not found")
    session.delete(txn)
    session.commit()
    return {"message": "Transaction deleted"}
