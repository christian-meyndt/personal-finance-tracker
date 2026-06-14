from typing import Annotated
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db import get_db
from app.models.user import User
from app.services.analytics import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
async def get_summary(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    account_id: int | None = Query(None),
) -> dict:
    """
    Get financial summary (income, expenses, net) for a date range.
    """
    analytics = AnalyticsService(db)
    return analytics.get_summary(start_date, end_date, account_id)


@router.get("/by-category")
async def get_by_category(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    account_id: int | None = Query(None),
) -> list[dict]:
    """
    Get spending breakdown by category.
    """
    analytics = AnalyticsService(db)
    return analytics.get_by_category(start_date, end_date, account_id)


@router.get("/monthly-trend")
async def get_monthly_trend(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    months: int = Query(6, ge=1, le=24),
    account_id: int | None = Query(None),
) -> list[dict]:
    """
    Get monthly income/expense trend.
    """
    analytics = AnalyticsService(db)
    return analytics.get_monthly_trend(months, account_id)


@router.get("/budget-progress")
async def get_budget_progress(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    year: int | None = Query(None),
    month: int | None = Query(None),
) -> list[dict]:
    """
    Get budget progress for all categories (current month by default).
    """
    analytics = AnalyticsService(db)
    return analytics.get_budget_progress(year, month)


@router.get("/recent")
async def get_recent_transactions(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    limit: int = Query(10, ge=1, le=50),
    account_id: int | None = Query(None),
) -> list[dict]:
    """
    Get recent transactions with category info.
    """
    analytics = AnalyticsService(db)
    return analytics.get_recent_transactions(limit, account_id)
