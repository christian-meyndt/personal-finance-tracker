from typing import Annotated
from datetime import datetime, timedelta
import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.auth import get_current_user
from app.db import get_db
from app.models.transaction import Transaction
from app.models.user import User
from app.services.csv_parsers import ALL_PARSERS
from app.services.paypal import PayPalService
from app.services.categorization import CategorizationService

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
        existing_hashes.add(trans.import_hash)  # Track in this session too
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

    logger.info(f"Import complete: {imported_count} imported, {skipped_count} skipped")

    return {
        "bank": parser.source_name.replace('csv_', '').upper(),
        "imported": imported_count,
        "skipped": skipped_count,
        "total": imported_count + skipped_count
    }
# Add to the end of import_api.py

@router.post("/paypal")
async def import_paypal(
    account_id: int = Query(...),
    days: int | None = Query(None, ge=1, le=365),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    current_user: Annotated[User, Depends(get_current_user)] = None,
    db: Session = Depends(get_db),
) -> dict:
    """
    Import transactions from PayPal API.

    Args:
        account_id: Target account ID
        days: Number of days to fetch (default: 30, max: 365) - used if start_date/end_date not provided
        start_date: Start date in YYYY-MM-DD format (optional)
        end_date: End date in YYYY-MM-DD format (optional, defaults to today)

    Returns:
        {
            "imported": 10,
            "skipped": 5,
            "total": 15
        }
    """
    logger.info(f"PayPal import started for account {account_id} by user {current_user.username}")

    # Calculate date range
    if start_date or end_date:
        # Use provided dates
        try:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d") if end_date else datetime.utcnow()
            if start_date:
                start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            else:
                # If only end_date provided, default to 30 days before end_date
                start_dt = end_dt - timedelta(days=30)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
    else:
        # Use days parameter (default 30)
        end_dt = datetime.utcnow()
        start_dt = end_dt - timedelta(days=days if days else 30)

    # Fetch from PayPal
    try:
        paypal_service = PayPalService()
        parsed_transactions = await paypal_service.fetch_transactions(
            account_id=account_id,
            start_date=start_dt,
            end_date=end_dt
        )
    except ValueError as e:
        logger.error(f"PayPal error: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"PayPal error: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch from PayPal: {str(e)}"
        )

    if not parsed_transactions:
        return {
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
            logger.debug(f"Skipping duplicate PayPal transaction: {trans.date} {trans.amount_cents}")
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
        logger.info(f"Auto-categorized {len(categorized)}/{len(new_transactions)} PayPal transactions")

    logger.info(f"PayPal import complete: {imported_count} imported, {skipped_count} skipped")

    return {
        "imported": imported_count,
        "skipped": skipped_count,
        "total": imported_count + skipped_count
    }
