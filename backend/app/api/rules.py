from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db import get_db
from app.models.category_rule import CategoryRule
from app.models.user import User
from app.schemas.category_rule import CategoryRuleCreate, CategoryRuleResponse

router = APIRouter(prefix="/rules", tags=["rules"])


@router.get("", response_model=list[CategoryRuleResponse])
async def list_rules(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> list[CategoryRuleResponse]:
    rules = db.query(CategoryRule).all()
    return [CategoryRuleResponse.model_validate(rule) for rule in rules]


@router.post("", response_model=CategoryRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_rule(
    rule_data: CategoryRuleCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> CategoryRuleResponse:
    rule = CategoryRule(**rule_data.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return CategoryRuleResponse.model_validate(rule)


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule(
    rule_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> None:
    rule = db.query(CategoryRule).filter(CategoryRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")

    db.delete(rule)
    db.commit()
