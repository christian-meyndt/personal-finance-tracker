"""
PayPal CSV parser.

PayPal allows downloading transaction history as CSV from:
PayPal.com → Activity → Statements → Custom → Download

Supports both German and English CSV formats, including the new tab-separated German format.
"""

import csv
import logging
from datetime import datetime
from io import StringIO

from .base import BaseParser, TransactionImport

logger = logging.getLogger(__name__)


class PayPalCSVParser(BaseParser):
    """Parser for PayPal CSV export files."""

    source_name = "csv_paypal"

    def detect(self, content: str) -> bool:
        """
        Detect if this is a PayPal CSV file.

        PayPal CSVs typically have headers like:
        - English: "Date","Time","Time Zone","Name","Type","Status","Currency","Gross","Fee","Net"
        - German (old): "Datum","Uhrzeit","Zeitzone","Name","Typ","Status","Währung","Brutto","Gebühr","Netto"
        - German (new): "Datum\tUhrzeit\tZeitzone\tBeschreibung\tWährung\tBrutto\tEntgelt\tNetto\tTransaktionscode"
        """
        lines = content.strip().split('\n')
        if not lines:
            return False

        header = lines[0].lower()

        # Check for PayPal-specific columns (tab or comma separated)
        # Use more flexible matching for different PayPal formats
        paypal_indicators = [
            'datum' in header or 'date' in header,
            'uhrzeit' in header or 'time' in header,
            'währung' in header or 'currency' in header,
            ('brutto' in header or 'gross' in header) and ('netto' in header or 'net' in header),
            'transaktionscode' in header or 'transaction id' in header,
        ]

        # Check if at least 4 indicators present
        return sum(paypal_indicators) >= 4

    def parse(self, content: str, account_id: int) -> list[TransactionImport]:
        """
        Parse PayPal CSV file.

        PayPal CSV format (English):
        "Date","Time","Time Zone","Name","Type","Status","Currency","Gross","Fee","Net","From Email Address","To Email Address","Transaction ID",...

        PayPal CSV format (German old - comma separated):
        "Datum","Uhrzeit","Zeitzone","Name","Typ","Status","Währung","Brutto","Gebühr","Netto","Von E-Mail-Adresse","An E-Mail-Adresse","Transaktionscode",...

        PayPal CSV format (German new - tab separated):
        Datum\tUhrzeit\tZeitzone\tBeschreibung\tWährung\tBrutto\tEntgelt\tNetto\tGuthaben\tTransaktionscode\t...

        We use the Net amount (after fees) for the transaction.
        """
        # Detect delimiter (tab or comma)
        first_line = content.split('\n')[0]
        delimiter = '\t' if '\t' in first_line else ','

        logger.info(f"PayPal CSV delimiter detected: {'tab' if delimiter == '\\t' else 'comma'}")

        reader = csv.DictReader(StringIO(content), delimiter=delimiter)
        transactions = []

        # Debug: log first row headers
        first_row = True

        for row in reader:
            if first_row:
                logger.info(f"PayPal CSV columns: {list(row.keys())}")
                first_row = False

            try:
                # Detect format by checking column names
                if 'Date' in row:
                    # English format
                    date_str = row['Date']
                    net_str = row['Net']
                    name = row.get('Name', '')
                    txn_type = row.get('Type', '')
                    status = row.get('Status', '')
                    transaction_id = row.get('Transaction ID', '')
                    currency = row.get('Currency', 'EUR')
                    sender_email = row.get('From Email Address', '')
                elif 'Datum' in row and 'Beschreibung' in row:
                    # German format (new - tab separated)
                    date_str = row['Datum']
                    net_str = row['Netto']
                    name = row.get('Name', '')
                    txn_type = row.get('Beschreibung', '')  # "Beschreibung" is the description/type
                    status = 'Completed'  # No status column in new format, assume all rows are completed
                    transaction_id = row.get('Transaktionscode', '')
                    currency = row.get('Währung', 'EUR')
                    sender_email = row.get('Absender E-Mail-Adresse', '')
                elif 'Datum' in row:
                    # German format (old - comma separated)
                    date_str = row['Datum']
                    net_str = row['Netto']
                    name = row.get('Name', '')
                    txn_type = row.get('Typ', '')
                    status = row.get('Status', 'Completed')
                    transaction_id = row.get('Transaktionscode', '')
                    currency = row.get('Währung', 'EUR')
                    sender_email = row.get('Von E-Mail-Adresse', '')
                else:
                    logger.warning(f"Unknown PayPal CSV format. Row keys: {list(row.keys())[:5]}")
                    continue

                # Skip if status is provided and not completed
                # Only check status if it exists (new format doesn't have status column)
                if status and status.lower() not in ['completed', 'abgeschlossen', 'erfolgt']:
                    logger.debug(f"Skipping non-completed transaction: {status}")
                    continue

                # Skip if no transaction ID
                if not transaction_id or not transaction_id.strip():
                    logger.debug(f"Skipping row without transaction ID")
                    continue

                # Parse date - PayPal uses various formats
                # Common formats: "DD/MM/YYYY", "MM/DD/YYYY", "DD.MM.YYYY"
                date_obj = self._parse_date(date_str)
                if not date_obj:
                    logger.warning(f"Could not parse date: {date_str}")
                    continue

                # Parse amount
                # PayPal uses formats like: "-10.50", "100.00", "-10,50" (German)
                amount_cents = self._parse_amount(net_str)
                if amount_cents is None:
                    logger.warning(f"Could not parse amount: {net_str}")
                    continue

                # Skip zero amounts
                if amount_cents == 0:
                    logger.debug(f"Skipping zero amount transaction")
                    continue

                # Build description from type and name
                description = f"{txn_type}"
                if name:
                    description += f" - {name}"

                # Use transaction ID as import hash (unique per transaction)
                import_hash = transaction_id

                transactions.append(TransactionImport(
                    date=date_obj,
                    amount_cents=amount_cents,
                    description=description,
                    counterparty=name if name else None,
                    import_hash=import_hash,
                    source=self.source_name
                ))

            except (KeyError, ValueError) as e:
                # Skip malformed rows
                logger.warning(f"Error parsing row: {e}")
                continue

        logger.info(f"PayPal CSV parsed: {len(transactions)} transactions")
        return transactions

    def _parse_date(self, date_str: str) -> datetime.date | None:
        """
        Parse date from various PayPal formats.

        Common formats:
        - DD/MM/YYYY (European)
        - MM/DD/YYYY (US)
        - DD.MM.YYYY (German)
        - YYYY-MM-DD (ISO)
        """
        date_formats = [
            "%d.%m.%Y",  # 31.12.2023 (German - most common for tab-separated)
            "%d/%m/%Y",  # 31/12/2023
            "%m/%d/%Y",  # 12/31/2023
            "%Y-%m-%d",  # 2023-12-31
        ]

        for fmt in date_formats:
            try:
                return datetime.strptime(date_str, fmt).date()
            except ValueError:
                continue

        return None

    def _parse_amount(self, amount_str: str) -> int | None:
        """
        Parse amount from PayPal format.

        PayPal amounts can be:
        - "-10.50" (negative expense)
        - "100.00" (positive income)
        - "-10,50" (German format with comma)
        - "1,234.56" (with thousand separator)
        - "1.234,56" (German with thousand separator)
        """
        if not amount_str:
            return None

        # Remove whitespace and quotes
        amount_str = amount_str.strip().strip('"')

        # Detect format by checking for comma vs period
        if ',' in amount_str and '.' in amount_str:
            # Has both - determine which is decimal separator
            if amount_str.rindex(',') > amount_str.rindex('.'):
                # Comma is decimal separator (German: 1.234,56)
                amount_str = amount_str.replace('.', '').replace(',', '.')
            else:
                # Period is decimal separator (US: 1,234.56)
                amount_str = amount_str.replace(',', '')
        elif ',' in amount_str:
            # Only comma - assume German decimal separator
            amount_str = amount_str.replace(',', '.')
        # If only period or neither, leave as-is

        try:
            amount_float = float(amount_str)
            return int(round(amount_float * 100))
        except ValueError:
            return None
