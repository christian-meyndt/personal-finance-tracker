from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db import get_db
from app.models.budget import Budget
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetResponse

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.get("", response_model=list[BudgetResponse])
async def list_budgets(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> list[BudgetResponse]:
    budgets = db.query(Budget).all()
    return [BudgetResponse.model_validate(budget) for budget in budgets]


@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def create_budget(
    budget_data: BudgetCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> BudgetResponse:
    # Check if budget already exists for this category
    existing = (
        db.query(Budget)
        .filter(
            Budget.category_id == budget_data.category_id,
            Budget.period == budget_data.period,
        )
        .first()
    )

    if existing:
        # Update existing budget
        existing.amount_cents = budget_data.amount_cents
        db.commit()
        db.refresh(existing)
        return BudgetResponse.model_validate(existing)
    else:
        # Create new budget
        budget = Budget(**budget_data.model_dump())
        db.add(budget)
        db.commit()
        db.refresh(budget)
        return BudgetResponse.model_validate(budget)
