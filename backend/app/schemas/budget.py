from pydantic import BaseModel


class BudgetCreate(BaseModel):
    category: str
    limit: float


class BudgetResponse(BaseModel):
    id: int
    category: str
    limit: float
    spent: float
