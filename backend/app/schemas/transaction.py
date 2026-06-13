from datetime import date, datetime
from pydantic import BaseModel


class TransactionUpdate(BaseModel):
    category_id: int | None = None


class TransactionResponse(BaseModel):
    id: int
    account_id: int
    date: date
    amount_cents: int
    description: str | None
    counterparty: str | None
    category_id: int | None
    source: str | None
    created_at: datetime

    class Config:
        from_attributes = True
