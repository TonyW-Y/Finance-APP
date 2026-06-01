from sqlmodel import Field, SQLModel


class Goal(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    name: str
    target_amount: float
    saved_amount: float = Field(default=0.0)
