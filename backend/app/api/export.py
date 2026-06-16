from typing import Annotated
from datetime import date
from io import StringIO
import csv

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db import get_db
from app.models.transaction import Transaction
from app.models.category import Category
from app.models.user import User

router = APIRouter(prefix="/export", tags=["export"])


@router.get("/transactions/csv")
async def export_transactions_csv(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    account_id: int | None = Query(None),
    category_id: int | None = Query(None),
) -> StreamingResponse:
    """
    Export transactions to CSV file.

    Filters:
    - start_date: Start date (inclusive)
    - end_date: End date (inclusive)
    - account_id: Filter by account
    - category_id: Filter by category
    """
    # Build query
    query = select(Transaction).order_by(Transaction.date.desc())

    if start_date:
        query = query.where(Transaction.date >= start_date)
    if end_date:
        query = query.where(Transaction.date <= end_date)
    if account_id:
        query = query.where(Transaction.account_id == account_id)
    if category_id:
        query = query.where(Transaction.category_id == category_id)

    transactions = db.execute(query).scalars().all()

    # Get categories for lookup
    categories = {cat.id: cat.name for cat in db.execute(select(Category)).scalars().all()}

    # Create CSV in memory
    output = StringIO()
    writer = csv.writer(output)

    # Write header
    writer.writerow([
        "Datum",
        "Betrag",
        "Beschreibung",
        "Gegenseite",
        "Kategorie",
        "Quelle",
        "Konto-ID"
    ])

    # Write data
    for txn in transactions:
        amount = txn.amount_cents / 100
        category_name = categories.get(txn.category_id, "Nicht kategorisiert") if txn.category_id else "Nicht kategorisiert"

        writer.writerow([
            txn.date.isoformat(),
            f"{amount:.2f}",
            txn.description or "",
            txn.counterparty or "",
            category_name,
            txn.source or "manual",
            txn.account_id
        ])

    # Prepare response
    output.seek(0)

    # Generate filename with date range
    filename = "transaktionen"
    if start_date:
        filename += f"_{start_date.isoformat()}"
    if end_date:
        filename += f"_{end_date.isoformat()}"
    filename += ".csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
