from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str
    parent_id: int | None = None
    icon: str | None = None
    color: str | None = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    parent_id: int | None
    icon: str | None
    color: str | None

    class Config:
        from_attributes = True
