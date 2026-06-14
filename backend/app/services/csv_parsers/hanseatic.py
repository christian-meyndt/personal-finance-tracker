import csv
from datetime import datetime
from io import StringIO
from typing import List
import logging

from app.services.csv_parsers.base import BaseParser, TransactionImport

logger = logging.getLogger(__name__)


class HanseaticParser(BaseParser):
    """Parser for Hanseatic Bank CSV exports"""

    source_name = "csv_hanseatic"

    def detect(self, content: str) -> bool:
        """Detect Hanseatic format by checking for specific column headers"""
        try:
            lines = content.strip().split('\n')

            # Look for Hanseatic-specific headers
            for line in lines[:20]:
                if 'Buchungstag' in line and 'Umsatzbeschreibung' in line:
                    return True
                if 'Hanseatic' in line:
                    return True

            return False
        except Exception as e:
            logger.error(f"Error detecting Hanseatic format: {e}")
            return False

    def parse(self, content: str, account_id: int) -> List[TransactionImport]:
        """
        Parse Hanseatic Bank CSV format.

        Format:
        - Encoding: UTF-8
        - Delimiter: semicolon (;)
        - Date format: DD.MM.YYYY
        - Amount: German locale (e.g., "-42,50")
        - Columns: Buchungstag, Umsatzbeschreibung, Betrag
        """
        transactions = []

        try:
            reader = csv.reader(StringIO(content), delimiter=';')

            # Find header row
            header_index = None
            header_row = None
            all_rows = list(reader)

            for idx, row in enumerate(all_rows):
                if any('Buchungstag' in cell for cell in row):
                    header_index = idx
                    header_row = row
                    break

            if header_index is None:
                # Try first row as header
                header_row = all_rows[0]
                header_index = 0

            # Find column indices
            date_idx = next((i for i, h in enumerate(header_row)
                           if 'Buchungstag' in h or 'Datum' in h), 0)
            amount_idx = next((i for i, h in enumerate(header_row)
                             if 'Betrag' in h), len(header_row) - 1)
            description_idx = next((i for i, h in enumerate(header_row)
                                  if 'Umsatzbeschreibung' in h or 'Beschreibung' in h), 1)

            # Parse data rows
            for row in all_rows[header_index + 1:]:
                if len(row) < 3:
                    continue  # Skip incomplete rows

                try:
                    # Parse date (DD.MM.YYYY)
                    date_str = row[date_idx].strip()
                    if not date_str:
                        continue
                    trans_date = datetime.strptime(date_str, '%d.%m.%Y').date()

                    # Parse amount (German format)
                    amount_str = row[amount_idx].strip()
                    if not amount_str:
                        continue
                    amount_float = self.parse_german_decimal(amount_str)
                    amount_cents = int(amount_float * 100)

                    # Get description
                    description = row[description_idx].strip() if len(row) > description_idx else None

                    # Generate import hash
                    import_hash = self.generate_import_hash(
                        trans_date,
                        amount_cents,
                        description or ''
                    )

                    transactions.append(TransactionImport(
                        date=trans_date,
                        amount_cents=amount_cents,
                        description=description,
                        counterparty=None,  # Hanseatic doesn't separate counterparty
                        import_hash=import_hash,
                        source=self.source_name
                    ))

                except (ValueError, IndexError) as e:
                    logger.warning(f"Skipping row due to error: {e}")
                    continue

        except Exception as e:
            logger.error(f"Error parsing Hanseatic CSV: {e}")
            raise ValueError(f"Failed to parse Hanseatic CSV: {str(e)}")

        logger.info(f"Parsed {len(transactions)} transactions from Hanseatic CSV")
        return transactions
