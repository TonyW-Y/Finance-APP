from pydantic import BaseModel


class TransactionCreate(BaseModel):
    description: str
    amount: float
    type: str
    category: str
    date: str


class TransactionResponse(BaseModel):
    id: int
    description: str
    amount: float
    type: str
    category: str
    date: str
