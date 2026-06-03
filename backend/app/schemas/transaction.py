from pydantic import BaseModel


class TransactionCreate(BaseModel):
    description: str
    amount: float
    type: str
    category: str
    date: str


class TransactionResponse(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    description: str
    amount: float
    type: str
    category: str
    date: str
    subscription_id: int | None = None



