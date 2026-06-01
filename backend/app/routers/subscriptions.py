from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.dependencies import get_current_user
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.subscription import SubscriptionCreate, SubscriptionResponse

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


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
