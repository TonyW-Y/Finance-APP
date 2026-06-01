from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, func

from app.database import get_session
from app.dependencies import get_current_user
from app.models.budget import Budget
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetResponse

router = APIRouter(prefix="/budgets", tags=["budgets"])


def compute_spent(session: Session, user_id: int, category: str) -> float:
    stmt = select(func.coalesce(func.sum(Transaction.amount), 0.0)).where(
        Transaction.user_id == user_id,
        Transaction.category == category,
        Transaction.type == "expense",
    )
    result = session.exec(stmt).one()
    return float(result)


@router.get("", response_model=list[BudgetResponse])
def list_budgets(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    budgets = session.exec(
        select(Budget).where(Budget.user_id == user.id)
    ).all()
    return [
        BudgetResponse(
            id=b.id,
            category=b.category,
            limit=b.limit,
            spent=compute_spent(session, user.id, b.category),
        )
        for b in budgets
    ]


@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_budget(
    body: BudgetCreate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    existing = session.exec(
        select(Budget).where(
            Budget.user_id == user.id, Budget.category == body.category
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Budget already exists for this category")
    budget = Budget(**body.model_dump(), user_id=user.id)
    session.add(budget)
    session.commit()
    session.refresh(budget)
    return BudgetResponse(
        id=budget.id,
        category=budget.category,
        limit=budget.limit,
        spent=compute_spent(session, user.id, budget.category),
    )


@router.delete("/{category}")
def delete_budget(
    category: str,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    budget = session.exec(
        select(Budget).where(
            Budget.user_id == user.id, Budget.category == category
        )
    ).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    session.delete(budget)
    session.commit()
    return {"message": "Budget deleted"}
