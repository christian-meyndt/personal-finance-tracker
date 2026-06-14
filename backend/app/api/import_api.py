from typing import Annotated
import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.auth import get_current_user
from app.db import get_db
from app.models.transaction import Transaction
from app.models.user import User
from app.services.csv_parsers import ALL_PARSERS

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/import", tags=["import"])


@router.post("/csv")
async def import_csv(
    file: UploadFile = File(...),
    account_id: int = Form(...),
    current_user: Annotated[User, Depends(get_current_user)] = None,
    db: Session = Depends(get_db),
) -> dict:
    """
    Import transactions from CSV file.

    Auto-detects bank format (DKB, Hanseatic, Openbank) and imports transactions.
    Deduplicates based on import_hash.

    Returns:
        {
            "bank": "DKB",
            "imported": 10,
            "skipped": 5,
            "total": 15
        }
    """
    logger.info(f"CSV import started for account {account_id} by user {current_user.username}")

    # Read file content
    try:
        content_bytes = await file.read()
        # Try UTF-8 with BOM first (DKB), then UTF-8
        try:
            content = content_bytes.decode('utf-8-sig')
        except UnicodeDecodeError:
            content = content_bytes.decode('utf-8')
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not read file: {str(e)}"
        )

    # Auto-detect parser
    parser = None
    for parser_class in ALL_PARSERS:
        parser_instance = parser_class()
        if parser_instance.detect(content):
            parser = parser_instance
            logger.info(f"Detected format: {parser.source_name}")
            break

    if parser is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not detect bank format. Supported: DKB, Hanseatic Bank, Openbank"
        )

    # Parse transactions
    try:
        parsed_transactions = parser.parse(content, account_id)
    except Exception as e:
        logger.error(f"Parse error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse CSV: {str(e)}"
        )

    if not parsed_transactions:
        return {
            "bank": parser.source_name.replace('csv_', '').upper(),
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
        existing_hashes.add(trans.import_hash)  # Track in this session too
        imported_count += 1

    db.commit()

    logger.info(f"Import complete: {imported_count} imported, {skipped_count} skipped")

    return {
        "bank": parser.source_name.replace('csv_', '').upper(),
        "imported": imported_count,
        "skipped": skipped_count,
        "total": imported_count + skipped_count
    }
