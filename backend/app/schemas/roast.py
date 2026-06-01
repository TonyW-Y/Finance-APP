from pydantic import BaseModel

from app.schemas.transaction import TransactionResponse


class RoastRequest(BaseModel):
    transactions: list[TransactionResponse]
    budgets: list[dict] = []


class WeeklyRoastRequest(BaseModel):
    summary: dict


class RoastResponse(BaseModel):
    roast: str
