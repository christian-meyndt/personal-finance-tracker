from pydantic import BaseModel


class AccountCreate(BaseModel):
    name: str
    type: str  # checking | savings | credit | paypal
    currency: str = "EUR"
    is_active: bool = True


class AccountUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    currency: str | None = None
    is_active: bool | None = None


class AccountResponse(BaseModel):
    id: int
    name: str
    type: str
    currency: str
    is_active: bool

    class Config:
        from_attributes = True
