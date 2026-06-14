import csv
from datetime import datetime
from io import StringIO
from typing import List
import logging

from app.services.csv_parsers.base import BaseParser, TransactionImport

logger = logging.getLogger(__name__)


class DKBParser(BaseParser):
    """Parser for DKB (Deutsche Kreditbank) CSV exports"""

    source_name = "csv_dkb"

    def detect(self, content: str) -> bool:
        """Detect DKB format by checking for specific column headers"""
        try:
            # DKB files have UTF-8 BOM
            lines = content.strip().split('\n')

            # Look for DKB-specific headers
            for line in lines[:20]:  # Check first 20 lines
                if 'Buchungsdatum' in line and 'Verwendungszweck' in line:
                    return True
                if 'DKB' in line or 'Deutsche Kreditbank' in line:
                    return True

            return False
        except Exception as e:
            logger.error(f"Error detecting DKB format: {e}")
            return False

    def parse(self, content: str, account_id: int) -> List[TransactionImport]:
        """
        Parse DKB CSV format.

        Format:
        - Encoding: UTF-8 with BOM
        - Delimiter: semicolon (;)
        - Date format: DD.MM.YYYY
        - Amount: German locale (e.g., "1.234,56")
        - Has metadata rows before the actual data
        """
        transactions = []

        try:
            # Read with UTF-8-sig to handle BOM
            reader = csv.reader(StringIO(content), delimiter=';')

            # Find the header row by looking for 'Buchungsdatum'
            header_index = None
            header_row = None
            all_rows = list(reader)

            for idx, row in enumerate(all_rows):
                if any('Buchungsdatum' in cell for cell in row):
                    header_index = idx
                    header_row = row
                    break

            if header_index is None:
                raise ValueError("Could not find header row with 'Buchungsdatum'")

            # Find column indices
            date_idx = next(i for i, h in enumerate(header_row) if 'Buchungsdatum' in h)
            amount_idx = next(i for i, h in enumerate(header_row) if 'Betrag' in h)

            # Find description/usage columns
            usage_idx = next((i for i, h in enumerate(header_row) if 'Verwendungszweck' in h), None)
            counterparty_idx = next((i for i, h in enumerate(header_row)
                                    if 'Auftraggeber' in h or 'Empfänger' in h or 'Gläubiger' in h), None)

            # Parse data rows
            for row in all_rows[header_index + 1:]:
                if len(row) <= max(date_idx, amount_idx):
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

                    # Get description and counterparty
                    description = row[usage_idx].strip() if usage_idx and len(row) > usage_idx else None
                    counterparty = row[counterparty_idx].strip() if counterparty_idx and len(row) > counterparty_idx else None

                    # Generate import hash
                    import_hash = self.generate_import_hash(
                        trans_date,
                        amount_cents,
                        description or counterparty or ''
                    )

                    transactions.append(TransactionImport(
                        date=trans_date,
                        amount_cents=amount_cents,
                        description=description,
                        counterparty=counterparty,
                        import_hash=import_hash,
                        source=self.source_name
                    ))

                except (ValueError, IndexError) as e:
                    logger.warning(f"Skipping row due to error: {e}")
                    continue

        except Exception as e:
            logger.error(f"Error parsing DKB CSV: {e}")
            raise ValueError(f"Failed to parse DKB CSV: {str(e)}")

        logger.info(f"Parsed {len(transactions)} transactions from DKB CSV")
        return transactions
