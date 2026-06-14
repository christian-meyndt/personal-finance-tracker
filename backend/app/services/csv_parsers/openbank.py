import csv
from datetime import datetime
from io import StringIO
from typing import List
import logging

from app.services.csv_parsers.base import BaseParser, TransactionImport

logger = logging.getLogger(__name__)


class OpenbankParser(BaseParser):
    """Parser for Openbank CSV exports"""

    source_name = "csv_openbank"

    def detect(self, content: str) -> bool:
        """Detect Openbank format by checking for specific column headers"""
        try:
            lines = content.strip().split('\n')

            # Look for Openbank-specific headers (Spanish)
            for line in lines[:20]:
                if 'Fecha' in line and ('Concepto' in line or 'Descripción' in line):
                    return True
                if 'Openbank' in line or 'Importe' in line:
                    return True

            return False
        except Exception as e:
            logger.error(f"Error detecting Openbank format: {e}")
            return False

    def parse(self, content: str, account_id: int) -> List[TransactionImport]:
        """
        Parse Openbank CSV format.

        Format:
        - Encoding: UTF-8
        - Delimiter: auto-detect (comma or semicolon)
        - Date format: auto-detect (DD/MM/YYYY or YYYY-MM-DD)
        - Columns: Fecha, Concepto/Descripción, Importe
        """
        transactions = []

        try:
            # Auto-detect delimiter
            first_line = content.split('\n')[0]
            delimiter = ';' if first_line.count(';') > first_line.count(',') else ','

            reader = csv.reader(StringIO(content), delimiter=delimiter)
            all_rows = list(reader)

            # Find header row
            header_index = None
            header_row = None

            for idx, row in enumerate(all_rows):
                if any('Fecha' in cell for cell in row):
                    header_index = idx
                    header_row = row
                    break

            if header_index is None:
                # Assume first row is header
                header_row = all_rows[0]
                header_index = 0

            # Find column indices
            date_idx = next((i for i, h in enumerate(header_row)
                           if 'Fecha' in h or 'Date' in h), 0)
            amount_idx = next((i for i, h in enumerate(header_row)
                             if 'Importe' in h or 'Amount' in h), len(header_row) - 1)
            description_idx = next((i for i, h in enumerate(header_row)
                                  if 'Concepto' in h or 'Descripción' in h or 'Description' in h), 1)

            # Parse data rows
            for row in all_rows[header_index + 1:]:
                if len(row) < 3:
                    continue

                try:
                    # Parse date (try both formats)
                    date_str = row[date_idx].strip()
                    if not date_str:
                        continue

                    trans_date = None
                    # Try DD/MM/YYYY
                    try:
                        trans_date = datetime.strptime(date_str, '%d/%m/%Y').date()
                    except ValueError:
                        pass

                    # Try YYYY-MM-DD
                    if trans_date is None:
                        try:
                            trans_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                        except ValueError:
                            pass

                    # Try DD.MM.YYYY
                    if trans_date is None:
                        try:
                            trans_date = datetime.strptime(date_str, '%d.%m.%Y').date()
                        except ValueError:
                            pass

                    if trans_date is None:
                        logger.warning(f"Could not parse date: {date_str}")
                        continue

                    # Parse amount (handle both German and international formats)
                    amount_str = row[amount_idx].strip()
                    if not amount_str:
                        continue

                    # Determine format and parse
                    if ',' in amount_str and '.' in amount_str:
                        # Has both - check which is last (decimal separator)
                        if amount_str.rindex(',') > amount_str.rindex('.'):
                            # German format: 1.234,56
                            amount_float = self.parse_german_decimal(amount_str)
                        else:
                            # US format: 1,234.56
                            amount_float = float(amount_str.replace(',', ''))
                    elif ',' in amount_str:
                        # Assume comma is decimal separator (German/Spanish)
                        amount_float = float(amount_str.replace(',', '.'))
                    else:
                        # Standard format
                        amount_float = float(amount_str.replace(',', ''))

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
                        counterparty=None,
                        import_hash=import_hash,
                        source=self.source_name
                    ))

                except (ValueError, IndexError) as e:
                    logger.warning(f"Skipping row due to error: {e}")
                    continue

        except Exception as e:
            logger.error(f"Error parsing Openbank CSV: {e}")
            raise ValueError(f"Failed to parse Openbank CSV: {str(e)}")

        logger.info(f"Parsed {len(transactions)} transactions from Openbank CSV")
        return transactions
