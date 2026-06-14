"""
Categorization service for auto-assigning categories to transactions.

Two-tier approach:
1. Rule-based: Match patterns from CategoryRule table
2. AI fallback: Use Anthropic Claude Haiku for uncategorized transactions
"""

import logging
import re
from typing import Optional
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session
from anthropic import Anthropic

from app.models.transaction import Transaction
from app.models.category import Category
from app.models.category_rule import CategoryRule
from app.config import settings

logger = logging.getLogger(__name__)


class CategorizationService:
    """Service for automatic transaction categorization."""

    def __init__(self, db: Session):
        self.db = db
        self.anthropic_client = None
        if settings.ANTHROPIC_API_KEY:
            self.anthropic_client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    def categorize_transaction(self, transaction: Transaction) -> Optional[int]:
        """
        Categorize a single transaction using rules first, then AI fallback.

        Returns:
            category_id if categorized, None otherwise
        """
        # Try rule-based first
        category_id = self._apply_rules(transaction)
        if category_id:
            logger.info(f"Transaction {transaction.id} categorized by rule: {category_id}")
            return category_id

        # Fallback to AI if available
        if self.anthropic_client:
            category_id = self._categorize_with_ai(transaction)
            if category_id:
                logger.info(f"Transaction {transaction.id} categorized by AI: {category_id}")
                return category_id

        logger.debug(f"Transaction {transaction.id} remains uncategorized")
        return None

    def categorize_batch(self, transactions: list[Transaction]) -> dict[int, int]:
        """
        Categorize multiple transactions efficiently.

        Returns:
            Dict mapping transaction_id -> category_id
        """
        results = {}

        # Apply rules to all transactions first
        for txn in transactions:
            category_id = self._apply_rules(txn)
            if category_id:
                results[txn.id] = category_id

        # Collect uncategorized for AI batch processing
        uncategorized = [txn for txn in transactions if txn.id not in results]

        if uncategorized and self.anthropic_client:
            ai_results = self._categorize_batch_with_ai(uncategorized)
            results.update(ai_results)

        logger.info(f"Batch categorization: {len(results)}/{len(transactions)} categorized")
        return results

    def _apply_rules(self, transaction: Transaction) -> Optional[int]:
        """
        Apply pattern-matching rules to categorize transaction.

        Returns:
            category_id if rule matched, None otherwise
        """
        # Get all active rules
        stmt = select(CategoryRule).order_by(CategoryRule.id)
        rules = self.db.execute(stmt).scalars().all()

        # Check counterparty and description
        counterparty = (transaction.counterparty or "").lower()
        description = (transaction.description or "").lower()

        for rule in rules:
            pattern = rule.pattern.lower()
            match_type = rule.match_type

            # Check against both counterparty and description
            for text in [counterparty, description]:
                if not text:
                    continue

                matched = False
                if match_type == "contains":
                    matched = pattern in text
                elif match_type == "starts_with":
                    matched = text.startswith(pattern)
                elif match_type == "exact":
                    matched = text == pattern
                elif match_type == "regex":
                    try:
                        matched = bool(re.search(pattern, text, re.IGNORECASE))
                    except re.error:
                        logger.warning(f"Invalid regex pattern in rule {rule.id}: {pattern}")
                        continue

                if matched:
                    logger.debug(f"Rule matched: {pattern} ({match_type}) -> category {rule.category_id}")
                    return rule.category_id

        return None

    def _categorize_with_ai(self, transaction: Transaction) -> Optional[int]:
        """
        Use Claude Haiku to categorize a single transaction.

        Returns:
            category_id if categorized, None otherwise
        """
        # Get all categories
        stmt = select(Category)
        categories = self.db.execute(stmt).scalars().all()

        if not categories:
            return None

        # Build category list for prompt
        category_list = "\n".join([
            f"- {cat.name} (ID: {cat.id}): {cat.icon or ''}"
            for cat in categories
        ])

        # Build transaction description
        amount = transaction.amount_cents / 100
        direction = "expense" if amount < 0 else "income"
        txn_desc = f"{abs(amount):.2f}€ {direction}"
        if transaction.counterparty:
            txn_desc += f" to/from {transaction.counterparty}"
        if transaction.description:
            txn_desc += f" - {transaction.description}"

        prompt = f"""Categorize this transaction:

Transaction: {txn_desc}
Date: {transaction.date}

Available categories:
{category_list}

Reply with ONLY the category ID number (e.g., "3") for the most appropriate category.
If no category fits well, reply "NONE"."""

        try:
            response = self.anthropic_client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=10,
                messages=[{"role": "user", "content": prompt}]
            )

            reply = response.content[0].text.strip()

            if reply == "NONE":
                return None

            # Extract category ID
            try:
                category_id = int(reply)
                # Verify it exists
                stmt = select(Category).where(Category.id == category_id)
                category = self.db.execute(stmt).scalar_one_or_none()
                if category:
                    return category_id
            except (ValueError, AttributeError):
                logger.warning(f"AI returned invalid category ID: {reply}")
                return None

        except Exception as e:
            logger.error(f"AI categorization error: {e}")
            return None

        return None

    def _categorize_batch_with_ai(self, transactions: list[Transaction], batch_size: int = 20) -> dict[int, int]:
        """
        Use Claude Haiku to categorize multiple transactions in batches.

        Args:
            transactions: List of transactions to categorize
            batch_size: Max transactions per API call (default 20)

        Returns:
            Dict mapping transaction_id -> category_id
        """
        results = {}

        # Get all categories once
        stmt = select(Category)
        categories = self.db.execute(stmt).scalars().all()

        if not categories:
            return results

        # Build category list for prompt
        category_list = "\n".join([
            f"{cat.id}. {cat.name} {cat.icon or ''}"
            for cat in categories
        ])

        # Process in batches
        for i in range(0, len(transactions), batch_size):
            batch = transactions[i:i + batch_size]

            # Build transaction list
            txn_list = []
            for idx, txn in enumerate(batch, 1):
                amount = txn.amount_cents / 100
                direction = "expense" if amount < 0 else "income"
                desc = f"{abs(amount):.2f}€ {direction}"
                if txn.counterparty:
                    desc += f" - {txn.counterparty}"
                if txn.description:
                    desc += f" - {txn.description}"
                txn_list.append(f"{idx}. {desc}")

            prompt = f"""Categorize these transactions. Reply with one category ID per line (just the number).
If a transaction doesn't fit any category, use "0" for that line.

Categories:
{category_list}

Transactions:
{chr(10).join(txn_list)}

Reply with exactly {len(batch)} numbers, one per line:"""

            try:
                response = self.anthropic_client.messages.create(
                    model="claude-haiku-4-5-20251001",
                    max_tokens=100,
                    messages=[{"role": "user", "content": prompt}]
                )

                reply = response.content[0].text.strip()
                category_ids = reply.split('\n')

                # Match responses to transactions
                for txn, cat_id_str in zip(batch, category_ids):
                    try:
                        cat_id = int(cat_id_str.strip())
                        if cat_id > 0:
                            # Verify category exists
                            stmt = select(Category).where(Category.id == cat_id)
                            if self.db.execute(stmt).scalar_one_or_none():
                                results[txn.id] = cat_id
                    except (ValueError, AttributeError):
                        continue

            except Exception as e:
                logger.error(f"AI batch categorization error: {e}")
                continue

        return results

    def create_rule_from_transaction(
        self,
        transaction: Transaction,
        category_id: int,
        match_type: str = "contains"
    ) -> Optional[CategoryRule]:
        """
        Create a new categorization rule based on a transaction.

        Args:
            transaction: Transaction to base rule on
            category_id: Category to assign
            match_type: Type of match (contains, starts_with, exact)

        Returns:
            Created rule or None if pattern unavailable
        """
        # Use counterparty if available, otherwise description
        pattern = transaction.counterparty or transaction.description

        if not pattern:
            logger.warning(f"Cannot create rule for transaction {transaction.id}: no pattern")
            return None

        # Check if rule already exists
        stmt = select(CategoryRule).where(
            CategoryRule.pattern == pattern,
            CategoryRule.match_type == match_type
        )
        existing = self.db.execute(stmt).scalar_one_or_none()

        if existing:
            logger.info(f"Rule already exists for pattern: {pattern}")
            return existing

        # Create new rule
        rule = CategoryRule(
            pattern=pattern,
            category_id=category_id,
            match_type=match_type
        )
        self.db.add(rule)
        self.db.commit()
        self.db.refresh(rule)

        logger.info(f"Created new rule: {pattern} ({match_type}) -> category {category_id}")
        return rule
