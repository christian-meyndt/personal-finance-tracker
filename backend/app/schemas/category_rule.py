from pydantic import BaseModel


class CategoryRuleCreate(BaseModel):
    pattern: str
    category_id: int
    match_type: str  # contains | starts_with | exact


class CategoryRuleResponse(BaseModel):
    id: int
    pattern: str
    category_id: int
    match_type: str

    class Config:
        from_attributes = True
