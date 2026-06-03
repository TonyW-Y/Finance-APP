from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.dependencies import get_current_user
from app.models.subscription import Subscription
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.subscription import SubscriptionCreate, SubscriptionResponse, GenerateResponse
from app.schemas.transaction import TransactionResponse

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


def _next_date(from_date: str, frequency: str) -> str:
    d = datetime.strptime(from_date, "%Y-%m-%d")
    if frequency == "weekly":
        d += timedelta(weeks=1)
    elif frequency == "biweekly":
        d += timedelta(weeks=2)
    elif frequency == "monthly":
        month = d.month + 1
        year = d.year + (month - 1) // 12
        month = (month - 1) % 12 + 1
        d = d.replace(year=year, month=month)
    elif frequency == "yearly":
        d = d.replace(year=d.year + 1)
    return d.strftime("%Y-%m-%d")


@router.get("", response_model=list[SubscriptionResponse])
def list_subscriptions(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    stmt = select(Subscription).where(Subscription.user_id == user.id)
    return session.exec(stmt).all()


@router.post("", response_model=SubscriptionResponse, status_code=201)
def create_subscription(
    body: SubscriptionCreate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    sub = Subscription(**body.model_dump(), user_id=user.id)
    session.add(sub)
    session.commit()
    session.refresh(sub)
    return sub


@router.delete("/{subscription_id}")
def delete_subscription(
    subscription_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    sub = session.get(Subscription, subscription_id)
    if not sub or sub.user_id != user.id:
        raise HTTPException(status_code=404, detail="Subscription not found")
    session.delete(sub)
    session.commit()
    return {"message": "Subscription deleted"}


@router.post("/generate", response_model=GenerateResponse)
def generate_transactions(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    subs = session.exec(
        select(Subscription).where(Subscription.user_id == user.id)
    ).all()
    today = datetime.now().strftime("%Y-%m-%d")
    created = []

    for sub in subs:
        last = sub.last_generated
        due = _next_date(last, sub.frequency) if last else today

        if due > today:
            continue

        exists = session.exec(
            select(Transaction).where(
                Transaction.subscription_id == sub.id,
                Transaction.date == due,
                Transaction.user_id == user.id,
            )
        ).first()
        if exists:
            continue

        txn = Transaction(
            user_id=user.id,
            description=f"{sub.name} (auto)",
            amount=sub.amount,
            type="expense",
            category="Other",
            date=due,
            subscription_id=sub.id,
        )
        session.add(txn)

        sub.last_generated = due
        session.add(sub)

        created.append(txn)

    session.commit()
    for txn in created:
        session.refresh(txn)

    return GenerateResponse(transactions=[TransactionResponse.model_validate(t) for t in created])
