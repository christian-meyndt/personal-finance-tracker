from pydantic import BaseModel


class BudgetCreate(BaseModel):
    category_id: int
    amount_cents: int
    period: str = "monthly"


class BudgetResponse(BaseModel):
    id: int
    category_id: int
    amount_cents: int
    period: str

    class Config:
        from_attributes = True
