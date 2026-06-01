from pydantic import BaseModel


class SubscriptionCreate(BaseModel):
    name: str
    amount: float
    frequency: str


class SubscriptionResponse(BaseModel):
    id: int
    name: str
    amount: float
    frequency: str
