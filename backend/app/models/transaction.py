from sqlmodel import Field, SQLModel


class Transaction(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    description: str
    amount: float
    type: str
    category: str
    date: str
    subscription_id: int | None = Field(default=None, foreign_key="subscription.id")
