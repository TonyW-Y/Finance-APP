from pydantic import BaseModel


class GoalCreate(BaseModel):
    name: str
    target_amount: float
    saved_amount: float = 0.0


class GoalUpdate(BaseModel):
    name: str | None = None
    target_amount: float | None = None
    saved_amount: float | None = None


class GoalResponse(BaseModel):
    id: int
    name: str
    target_amount: float
    saved_amount: float
