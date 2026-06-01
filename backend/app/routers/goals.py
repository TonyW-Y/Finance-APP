from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.dependencies import get_current_user
from app.models.goal import Goal
from app.models.user import User
from app.schemas.goal import GoalCreate, GoalResponse, GoalUpdate

router = APIRouter(prefix="/goals", tags=["goals"])


@router.get("", response_model=list[GoalResponse])
def list_goals(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    stmt = select(Goal).where(Goal.user_id == user.id)
    return session.exec(stmt).all()


@router.post("", response_model=GoalResponse, status_code=201)
def create_goal(
    body: GoalCreate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    goal = Goal(**body.model_dump(), user_id=user.id)
    session.add(goal)
    session.commit()
    session.refresh(goal)
    return goal


@router.patch("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: int,
    body: GoalUpdate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    goal = session.get(Goal, goal_id)
    if not goal or goal.user_id != user.id:
        raise HTTPException(status_code=404, detail="Goal not found")
    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(goal, key, value)
    session.add(goal)
    session.commit()
    session.refresh(goal)
    return goal


@router.delete("/{goal_id}")
def delete_goal(
    goal_id: int,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    goal = session.get(Goal, goal_id)
    if not goal or goal.user_id != user.id:
        raise HTTPException(status_code=404, detail="Goal not found")
    session.delete(goal)
    session.commit()
    return {"message": "Goal deleted"}
