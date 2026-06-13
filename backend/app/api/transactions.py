from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db import get_db
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.transaction import TransactionResponse, TransactionUpdate

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("", response_model=list[TransactionResponse])
async def list_transactions(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    account_id: int | None = Query(None),
    category_id: int | None = Query(None),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    search: str | None = Query(None),
    limit: int = Query(100, le=1000),
    offset: int = Query(0),
) -> list[TransactionResponse]:
    query = select(Transaction)

    if account_id is not None:
        query = query.where(Transaction.account_id == account_id)
    if category_id is not None:
        query = query.where(Transaction.category_id == category_id)
    if date_from:
        query = query.where(Transaction.date >= date_from)
    if date_to:
        query = query.where(Transaction.date <= date_to)
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            (Transaction.description.ilike(search_pattern))
            | (Transaction.counterparty.ilike(search_pattern))
        )

    query = query.order_by(Transaction.date.desc()).limit(limit).offset(offset)
    transactions = db.execute(query).scalars().all()

    return [TransactionResponse.model_validate(txn) for txn in transactions]


@router.get("/uncategorized", response_model=list[TransactionResponse])
async def list_uncategorized_transactions(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> list[TransactionResponse]:
    query = select(Transaction).where(Transaction.category_id.is_(None)).order_by(Transaction.date.desc())
    transactions = db.execute(query).scalars().all()
    return [TransactionResponse.model_validate(txn) for txn in transactions]


@router.patch("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: int,
    transaction_data: TransactionUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> TransactionResponse:
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    update_data = transaction_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(transaction, key, value)

    db.commit()
    db.refresh(transaction)
    return TransactionResponse.model_validate(transaction)
