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
        - Delimiter: semicolon (;) or tab (\t)
        - Date format: DD.MM.YYYY or DD.MM.YY
        - Amount: German locale (e.g., "1.234,56")
        - Has metadata rows before the actual data
        """
        transactions = []

        try:
            # Detect delimiter (tab or semicolon)
            first_line = content.split('\n')[0]
            delimiter = '\t' if '\t' in first_line else ';'
            logger.info(f"DKB CSV delimiter detected: {'tab' if delimiter == '\\t' else 'semicolon'}")

            # Read with UTF-8-sig to handle BOM
            reader = csv.reader(StringIO(content), delimiter=delimiter)

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
            # Look for recipient column (Zahlungsempfänger*in comes before Gläubiger-ID, so check lowercase)
            recipient_idx = next((i for i, h in enumerate(header_row) if 'empfänger' in h.lower()), None)
            # Fallback to other counterparty columns
            if not recipient_idx:
                recipient_idx = next((i for i, h in enumerate(header_row)
                                        if 'Auftraggeber' in h or 'Gläubiger-ID' in h), None)
            counterparty_idx = recipient_idx

            # Parse data rows
            for row in all_rows[header_index + 1:]:
                if len(row) <= max(date_idx, amount_idx):
                    continue  # Skip incomplete rows

                try:
                    # Parse date (DD.MM.YYYY or DD.MM.YY)
                    date_str = row[date_idx].strip()
                    if not date_str:
                        continue

                    # Try both date formats
                    trans_date = None
                    for date_format in ['%d.%m.%Y', '%d.%m.%y']:
                        try:
                            trans_date = datetime.strptime(date_str, date_format).date()
                            break
                        except ValueError:
                            continue

                    if trans_date is None:
                        logger.warning(f"Could not parse date: {date_str}")
                        continue

                    # Parse amount (German format)
                    amount_str = row[amount_idx].strip()
                    if not amount_str:
                        continue
                    amount_float = self.parse_german_decimal(amount_str)
                    amount_cents = int(amount_float * 100)

                    # Get description and counterparty
                    usage = row[usage_idx].strip() if usage_idx and len(row) > usage_idx else None
                    recipient = row[counterparty_idx].strip() if counterparty_idx and len(row) > counterparty_idx else None

                    # For VISA card transactions, use merchant name as description
                    # "VISA Debitkartenumsatz vom DD.MM.YYYY" is too generic
                    if usage and 'VISA Debitkartenumsatz' in usage and recipient:
                        description = recipient  # Use merchant name (e.g., "Lidl.sagt.Danke/Geretsried")
                        counterparty = None  # Merchant is already in description
                    else:
                        # For regular transactions, use usage purpose as description
                        description = usage
                        counterparty = recipient

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
