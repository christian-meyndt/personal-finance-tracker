"""
PayPal CSV parser.

PayPal allows downloading transaction history as CSV from:
PayPal.com → Activity → Statements → Custom → Download

Supports both German and English CSV formats.
"""

import csv
from datetime import datetime
from io import StringIO

from .base import BaseParser, TransactionImport


class PayPalCSVParser(BaseParser):
    """Parser for PayPal CSV export files."""

    source_name = "csv_paypal"

    def detect(self, content: str) -> bool:
        """
        Detect if this is a PayPal CSV file.

        PayPal CSVs typically have headers like:
        - English: "Date","Time","Time Zone","Name","Type","Status","Currency","Gross","Fee","Net"
        - German: "Datum","Uhrzeit","Zeitzone","Name","Typ","Status","Währung","Brutto","Gebühr","Netto"
        """
        lines = content.strip().split('\n')
        if not lines:
            return False

        header = lines[0].lower()

        # Check for PayPal-specific columns
        english_indicators = ['"date"', '"time"', '"gross"', '"fee"', '"net"', '"transaction id"']
        german_indicators = ['"datum"', '"uhrzeit"', '"brutto"', '"gebühr"', '"netto"', '"transaktionscode"']

        # Check if at least 4 indicators present
        english_count = sum(1 for ind in english_indicators if ind in header)
        german_count = sum(1 for ind in german_indicators if ind in header)

        return english_count >= 4 or german_count >= 4

    def parse(self, content: str, account_id: int) -> list[TransactionImport]:
        """
        Parse PayPal CSV file.

        PayPal CSV format (English):
        "Date","Time","Time Zone","Name","Type","Status","Currency","Gross","Fee","Net","From Email Address","To Email Address","Transaction ID",...

        PayPal CSV format (German):
        "Datum","Uhrzeit","Zeitzone","Name","Typ","Status","Währung","Brutto","Gebühr","Netto","Von E-Mail-Adresse","An E-Mail-Adresse","Transaktionscode",...

        We use the Net amount (after fees) for the transaction.
        """
        reader = csv.DictReader(StringIO(content))
        transactions = []

        for row in reader:
            try:
                # Detect language by checking column names
                if 'Date' in row:
                    # English format
                    date_str = row['Date']
                    net_str = row['Net']
                    name = row.get('Name', '')
                    txn_type = row.get('Type', '')
                    status = row.get('Status', '')
                    transaction_id = row.get('Transaction ID', '')
                    currency = row.get('Currency', 'EUR')
                elif 'Datum' in row:
                    # German format
                    date_str = row['Datum']
                    net_str = row['Netto']
                    name = row.get('Name', '')
                    txn_type = row.get('Typ', '')
                    status = row.get('Status', '')
                    transaction_id = row.get('Transaktionscode', '')
                    currency = row.get('Währung', 'EUR')
                else:
                    continue

                # Skip if not completed
                if status.lower() not in ['completed', 'abgeschlossen', 'erfolgt']:
                    continue

                # Skip if no transaction ID
                if not transaction_id:
                    continue

                # Parse date - PayPal uses various formats
                # Common formats: "DD/MM/YYYY", "MM/DD/YYYY", "DD.MM.YYYY"
                date_obj = self._parse_date(date_str)
                if not date_obj:
                    continue

                # Parse amount
                # PayPal uses formats like: "-10.50", "100.00", "-10,50" (German)
                amount_cents = self._parse_amount(net_str)
                if amount_cents is None:
                    continue

                # Skip zero amounts
                if amount_cents == 0:
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
                continue

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
            "%d/%m/%Y",  # 31/12/2023
            "%m/%d/%Y",  # 12/31/2023
            "%d.%m.%Y",  # 31.12.2023
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
