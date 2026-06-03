from pydantic import BaseModel


class SubscriptionCreate(BaseModel):
    name: str
    amount: float
    frequency: str


class SubscriptionResponse(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    name: str
    amount: float
    frequency: str
    last_generated: str | None = None


class GenerateResponse(BaseModel):
    transactions: list["TransactionResponse"]


from app.schemas.transaction import TransactionResponse
GenerateResponse.model_rebuild()
