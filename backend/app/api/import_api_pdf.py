"""
PDF import endpoint for Hanseatic Bank statements.
"""

from typing import Annotated
import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.auth import get_current_user
from app.db import get_db
from app.models.transaction import Transaction
from app.models.user import User
from app.services.csv_parsers.hanseatic_pdf import HanseaticPDFParser
from app.services.categorization import CategorizationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/import", tags=["import"])


@router.post("/pdf/hanseatic")
async def import_hanseatic_pdf(
    file: UploadFile = File(...),
    account_id: int = Form(...),
    current_user: Annotated[User, Depends(get_current_user)] = None,
    db: Session = Depends(get_db),
) -> dict:
    """
    Import transactions from Hanseatic Bank PDF statement.

    Returns:
        {
            "bank": "HANSEATIC",
            "imported": 10,
            "skipped": 5,
            "total": 15
        }
    """
    logger.info(f"Hanseatic PDF import started for account {account_id} by user {current_user.username}")

    # Check file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a PDF"
        )

    # Read PDF file
    try:
        pdf_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not read file: {str(e)}"
        )

    # Parse PDF
    try:
        parser = HanseaticPDFParser()
        parsed_transactions = parser.parse_pdf(pdf_bytes, account_id)
    except Exception as e:
        logger.error(f"Parse error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse PDF: {str(e)}"
        )

    if not parsed_transactions:
        return {
            "bank": "HANSEATIC",
            "imported": 0,
            "skipped": 0,
            "total": 0
        }

    # Get existing import_hashes for this account
    existing_hashes = set()
    stmt = select(Transaction.import_hash).where(
        Transaction.account_id == account_id,
        Transaction.import_hash.isnot(None)
    )
    result = db.execute(stmt)
    existing_hashes = {row[0] for row in result}

    # Insert new transactions
    imported_count = 0
    skipped_count = 0
    new_transactions = []

    for trans in parsed_transactions:
        if trans.import_hash in existing_hashes:
            skipped_count += 1
            logger.debug(f"Skipping duplicate: {trans.date} {trans.amount_cents}")
            continue

        # Create transaction
        db_transaction = Transaction(
            account_id=account_id,
            date=trans.date,
            amount_cents=trans.amount_cents,
            description=trans.description,
            counterparty=trans.counterparty,
            import_hash=trans.import_hash,
            source=trans.source,
        )
        db.add(db_transaction)
        existing_hashes.add(trans.import_hash)
        new_transactions.append(db_transaction)
        imported_count += 1

    db.commit()

    # Auto-categorize new transactions
    if new_transactions:
        categorization_service = CategorizationService(db)
        categorized = categorization_service.categorize_batch(new_transactions)

        # Apply categories
        for txn in new_transactions:
            if txn.id in categorized:
                txn.category_id = categorized[txn.id]

        db.commit()
        logger.info(f"Auto-categorized {len(categorized)}/{len(new_transactions)} transactions")

    logger.info(f"Hanseatic PDF import complete: {imported_count} imported, {skipped_count} skipped")

    return {
        "bank": "HANSEATIC",
        "imported": imported_count,
        "skipped": skipped_count,
        "total": imported_count + skipped_count
    }
