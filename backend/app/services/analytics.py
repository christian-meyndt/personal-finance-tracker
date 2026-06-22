"""
Analytics service for financial summaries and insights.
"""

import logging
from datetime import date, datetime, timedelta
from typing import Optional

from sqlalchemy import select, func, and_, extract
from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.models.category import Category
from app.models.budget import Budget

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Service for financial analytics and summaries."""

    def __init__(self, db: Session):
        self.db = db
        self._transfer_category_id = self._get_transfer_category_id()

    def _get_transfer_category_id(self) -> Optional[int]:
        """Get the Transfer category ID to exclude from analytics."""
        transfer_cat = self.db.execute(
            select(Category).where(Category.name == "Transfer")
        ).scalar_one_or_none()
        return transfer_cat.id if transfer_cat else None

    def get_summary(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        account_id: Optional[int] = None
    ) -> dict:
        """
        Get financial summary for a date range.

        Returns:
            {
                "total_income": 500000,  # cents
                "total_expenses": 300000,  # cents
                "net": 200000,  # cents
                "transaction_count": 25,
                "start_date": "2026-01-01",
                "end_date": "2026-01-31"
            }
        """
        query = select(Transaction)

        if start_date:
            query = query.where(Transaction.date >= start_date)
        if end_date:
            query = query.where(Transaction.date <= end_date)
        if account_id:
            query = query.where(Transaction.account_id == account_id)
        # Exclude transfers from financial summaries
        if self._transfer_category_id:
            query = query.where(Transaction.category_id != self._transfer_category_id)

        transactions = self.db.execute(query).scalars().all()

        total_income = sum(t.amount_cents for t in transactions if t.amount_cents > 0)
        total_expenses = sum(abs(t.amount_cents) for t in transactions if t.amount_cents < 0)
        net = total_income - total_expenses
        count = len(transactions)

        return {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "net": net,
            "transaction_count": count,
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
        }

    def get_by_category(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        account_id: Optional[int] = None
    ) -> list[dict]:
        """
        Get spending breakdown by category.

        Returns:
            [
                {
                    "category_id": 3,
                    "category_name": "Groceries",
                    "category_icon": "🛒",
                    "total": 45000,  # cents (absolute value)
                    "transaction_count": 8,
                    "percentage": 30.5
                },
                ...
            ]
        """
        query = select(Transaction)

        if start_date:
            query = query.where(Transaction.date >= start_date)
        if end_date:
            query = query.where(Transaction.date <= end_date)
        if account_id:
            query = query.where(Transaction.account_id == account_id)
        # Exclude transfers from category breakdown
        if self._transfer_category_id:
            query = query.where(Transaction.category_id != self._transfer_category_id)

        transactions = self.db.execute(query).scalars().all()

        # Group by category
        category_totals = {}
        total_expenses = 0

        for txn in transactions:
            if txn.amount_cents >= 0:  # Skip income
                continue

            total_expenses += abs(txn.amount_cents)
            cat_id = txn.category_id or 0  # 0 = uncategorized

            if cat_id not in category_totals:
                category_totals[cat_id] = {
                    "total": 0,
                    "count": 0
                }

            category_totals[cat_id]["total"] += abs(txn.amount_cents)
            category_totals[cat_id]["count"] += 1

        # Get category details
        result = []
        for cat_id, data in category_totals.items():
            if cat_id == 0:
                category_name = "Uncategorized"
                category_icon = "❓"
            else:
                category = self.db.get(Category, cat_id)
                category_name = category.name if category else "Unknown"
                category_icon = category.icon if category else ""

            percentage = (data["total"] / total_expenses * 100) if total_expenses > 0 else 0

            result.append({
                "category_id": cat_id if cat_id != 0 else None,
                "category_name": category_name,
                "category_icon": category_icon,
                "total": data["total"],
                "transaction_count": data["count"],
                "percentage": round(percentage, 1)
            })

        # Sort by total descending
        result.sort(key=lambda x: x["total"], reverse=True)

        return result

    def get_monthly_trend(
        self,
        months: int = 6,
        account_id: Optional[int] = None
    ) -> list[dict]:
        """
        Get monthly income/expense trend.

        Args:
            months: Number of months to include (default 6)

        Returns:
            [
                {
                    "month": "2026-06",
                    "income": 300000,
                    "expenses": 200000,
                    "net": 100000
                },
                ...
            ]
        """
        end_date = date.today()
        start_date = end_date - timedelta(days=months * 31)

        query = select(Transaction).where(Transaction.date >= start_date)
        if account_id:
            query = query.where(Transaction.account_id == account_id)
        # Exclude transfers from monthly trends
        if self._transfer_category_id:
            query = query.where(Transaction.category_id != self._transfer_category_id)

        transactions = self.db.execute(query).scalars().all()

        # Group by month
        monthly_data = {}
        for txn in transactions:
            month_key = txn.date.strftime("%Y-%m")

            if month_key not in monthly_data:
                monthly_data[month_key] = {
                    "income": 0,
                    "expenses": 0
                }

            if txn.amount_cents > 0:
                monthly_data[month_key]["income"] += txn.amount_cents
            else:
                monthly_data[month_key]["expenses"] += abs(txn.amount_cents)

        # Convert to sorted list
        result = []
        for month_key, data in sorted(monthly_data.items()):
            result.append({
                "month": month_key,
                "income": data["income"],
                "expenses": data["expenses"],
                "net": data["income"] - data["expenses"]
            })

        return result

    def get_budget_progress(
        self,
        year: Optional[int] = None,
        month: Optional[int] = None
    ) -> list[dict]:
        """
        Get budget progress for all categories.

        Returns:
            [
                {
                    "budget_id": 1,
                    "category_id": 3,
                    "category_name": "Groceries",
                    "category_icon": "🛒",
                    "budget_amount": 50000,  # cents
                    "spent": 45000,  # cents
                    "remaining": 5000,  # cents
                    "percentage": 90.0,
                    "over_budget": False
                },
                ...
            ]
        """
        if year is None:
            year = date.today().year
        if month is None:
            month = date.today().month

        # Get all budgets for this month
        stmt = select(Budget).where(
            and_(
                Budget.year == year,
                Budget.month == month
            )
        )
        budgets = self.db.execute(stmt).scalars().all()

        if not budgets:
            return []

        # Get spending for this month
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(year, month + 1, 1) - timedelta(days=1)

        result = []
        for budget in budgets:
            # Get spending for this category
            stmt = select(func.sum(Transaction.amount_cents)).where(
                and_(
                    Transaction.category_id == budget.category_id,
                    Transaction.date >= start_date,
                    Transaction.date <= end_date,
                    Transaction.amount_cents < 0  # Only expenses
                )
            )
            spent_result = self.db.execute(stmt).scalar()
            spent = abs(spent_result) if spent_result else 0

            remaining = budget.amount_cents - spent
            percentage = (spent / budget.amount_cents * 100) if budget.amount_cents > 0 else 0
            over_budget = spent > budget.amount_cents

            # Get category details
            category = self.db.get(Category, budget.category_id)

            result.append({
                "budget_id": budget.id,
                "category_id": budget.category_id,
                "category_name": category.name if category else "Unknown",
                "category_icon": category.icon if category else "",
                "budget_amount": budget.amount_cents,
                "spent": spent,
                "remaining": remaining,
                "percentage": round(percentage, 1),
                "over_budget": over_budget
            })

        # Sort by percentage descending (most used first)
        result.sort(key=lambda x: x["percentage"], reverse=True)

        return result

    def get_recent_transactions(
        self,
        limit: int = 10,
        account_id: Optional[int] = None
    ) -> list[dict]:
        """
        Get recent transactions with category info.

        Returns:
            [
                {
                    "id": 123,
                    "date": "2026-06-14",
                    "amount_cents": -5000,
                    "description": "...",
                    "counterparty": "...",
                    "category_name": "Groceries",
                    "category_icon": "🛒",
                    "source": "csv_dkb"
                },
                ...
            ]
        """
        query = select(Transaction).order_by(Transaction.date.desc()).limit(limit)

        if account_id:
            query = query.where(Transaction.account_id == account_id)
        # Exclude transfers from recent transactions
        if self._transfer_category_id:
            query = query.where(Transaction.category_id != self._transfer_category_id)

        transactions = self.db.execute(query).scalars().all()

        result = []
        for txn in transactions:
            category_name = None
            category_icon = None

            if txn.category_id:
                category = self.db.get(Category, txn.category_id)
                if category:
                    category_name = category.name
                    category_icon = category.icon

            result.append({
                "id": txn.id,
                "date": txn.date.isoformat(),
                "amount_cents": txn.amount_cents,
                "description": txn.description,
                "counterparty": txn.counterparty,
                "category_name": category_name,
                "category_icon": category_icon,
                "source": txn.source
            })

        return result
