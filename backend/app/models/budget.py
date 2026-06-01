from sqlmodel import Field, SQLModel


class Budget(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    category: str
    limit: float
