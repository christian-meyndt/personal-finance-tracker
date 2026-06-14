from abc import ABC, abstractmethod
from datetime import date
from typing import List
from pydantic import BaseModel
import hashlib


class TransactionImport(BaseModel):
    """Normalized transaction data from CSV import"""
    date: date
    amount_cents: int  # Negative for expenses, positive for income
    description: str | None = None
    counterparty: str | None = None
    import_hash: str
    source: str  # e.g., 'csv_dkb', 'csv_hanseatic', 'csv_openbank'


class BaseParser(ABC):
    """Base class for all CSV parsers"""

    source_name: str = "unknown"  # Override in subclasses

    @abstractmethod
    def detect(self, content: str) -> bool:
        """
        Detect if this parser can handle the given CSV content.

        Args:
            content: Raw CSV file content as string

        Returns:
            True if this parser recognizes the format
        """
        pass

    @abstractmethod
    def parse(self, content: str, account_id: int) -> List[TransactionImport]:
        """
        Parse CSV content into normalized transactions.

        Args:
            content: Raw CSV file content as string
            account_id: ID of the account these transactions belong to

        Returns:
            List of normalized transaction objects
        """
        pass

    @staticmethod
    def generate_import_hash(date_val: date, amount_cents: int, description: str) -> str:
        """
        Generate unique hash for deduplication.

        Args:
            date_val: Transaction date
            amount_cents: Amount in cents
            description: Transaction description

        Returns:
            SHA-256 hash string
        """
        hash_input = f"{date_val.isoformat()}{amount_cents}{description or ''}"
        return hashlib.sha256(hash_input.encode('utf-8')).hexdigest()

    @staticmethod
    def parse_german_decimal(value: str) -> float:
        """
        Parse German number format (dots for thousands, comma for decimal).

        Examples:
            "1.234,56" -> 1234.56
            "-42,50" -> -42.50
            "1234,56" -> 1234.56

        Args:
            value: Number string in German format

        Returns:
            Float value
        """
        # Remove thousands separator (dot)
        value = value.replace('.', '')
        # Replace decimal comma with dot
        value = value.replace(',', '.')
        return float(value)
