"""
Hanseatic Bank PDF parser.

Hanseatic Bank only provides monthly PDF statements (Kontoauszug).
This parser extracts transaction data from the PDF.
"""

import re
import logging
from datetime import datetime
from typing import List
from pypdf import PdfReader
from io import BytesIO

from .base import BaseParser, TransactionImport

logger = logging.getLogger(__name__)


class HanseaticPDFParser(BaseParser):
    """Parser for Hanseatic Bank PDF statements"""

    source_name = "pdf_hanseatic"

    def detect(self, content: str) -> bool:
        """Detect if this is a Hanseatic PDF (content is not used for PDF)"""
        # This method is called with string content, but PDFs need binary
        # Detection happens in the API layer by checking file extension
        return False

    def parse_pdf(self, pdf_bytes: bytes, account_id: int) -> List[TransactionImport]:
        """
        Parse Hanseatic Bank PDF statement.

        Format:
        Buchungs-   Transaktions-
        datum       datum         Beschreibung                           Karte    Betrag in €
        27.04.2026  22.04.2026   Kartenumsatz
                                  KAUFLAND GERETSRIED 7860, GERETSRIED   6791    -15,62
        """
        transactions = []

        try:
            # Read PDF
            pdf_reader = PdfReader(BytesIO(pdf_bytes))
            logger.info(f"Reading Hanseatic PDF with {len(pdf_reader.pages)} pages")

            all_text = ""
            for page in pdf_reader.pages:
                all_text += page.extract_text() + "\n"

            # Extract transactions
            # Pattern: Date, Date, Description (can be multi-line), Card number, Amount
            # Example:
            # 27.04.2026 22.04.2026 Kartenumsatz
            # KAUFLAND GERETSRIED 7860, GERETSRIED
            # 6791 -15,62

            lines = all_text.split('\n')

            i = 0
            while i < len(lines):
                line = lines[i].strip()

                # Look for transaction date pattern: DD.MM.YYYY DD.MM.YYYY
                date_pattern = r'^(\d{2}\.\d{2}\.\d{4})\s+(\d{2}\.\d{2}\.\d{4})'
                match = re.match(date_pattern, line)

                if match:
                    booking_date_str = match.group(1)
                    transaction_date_str = match.group(2)

                    # Rest of the line after dates
                    rest_of_line = line[match.end():].strip()

                    # Next line(s) contain the merchant/description
                    description_parts = []
                    if rest_of_line and not rest_of_line.startswith('6791'):
                        description_parts.append(rest_of_line)

                    # Look ahead for merchant name and amount
                    j = i + 1
                    amount = None
                    card_suffix = None

                    while j < len(lines) and j < i + 5:  # Look ahead max 5 lines
                        next_line = lines[j].strip()

                        # Check if line contains card suffix and amount
                        # Pattern: "6791 -15,62" or just "6791 -15,62" at end
                        amount_pattern = r'(\d{4})\s+([-]?\d+,\d{2})(?:\s*€)?$'
                        amount_match = re.search(amount_pattern, next_line)

                        if amount_match:
                            card_suffix = amount_match.group(1)
                            amount_str = amount_match.group(2)

                            # Everything before the amount is description
                            desc_part = next_line[:amount_match.start()].strip()
                            if desc_part and not desc_part.startswith('Kartenumsatz'):
                                description_parts.append(desc_part)

                            amount = self._parse_german_amount(amount_str)
                            i = j  # Skip processed lines
                            break
                        else:
                            # This line is part of description (if not empty and not a separator)
                            if next_line and not next_line.startswith('---') and not next_line.startswith('Übertrag'):
                                # Skip "Kartenumsatz" line
                                if 'Kartenumsatz' not in next_line:
                                    description_parts.append(next_line)

                        j += 1

                    # Build final description
                    if amount is not None:
                        description = ' '.join(description_parts).strip()

                        # Clean up description
                        # Remove extra spaces and "Kartenumsatz"
                        description = re.sub(r'\s+', ' ', description)
                        description = description.replace('Kartenumsatz', '').strip()

                        if description:
                            try:
                                # Use booking date (first date)
                                trans_date = datetime.strptime(booking_date_str, '%d.%m.%Y').date()
                                amount_cents = int(amount * 100)

                                # Generate import hash
                                import_hash = self.generate_import_hash(
                                    trans_date,
                                    amount_cents,
                                    description
                                )

                                transactions.append(TransactionImport(
                                    date=trans_date,
                                    amount_cents=amount_cents,
                                    description=description,
                                    counterparty=None,
                                    import_hash=import_hash,
                                    source=self.source_name
                                ))

                                logger.debug(f"Parsed: {trans_date} {description} {amount}")

                            except ValueError as e:
                                logger.warning(f"Error parsing transaction: {e}")

                i += 1

            logger.info(f"Parsed {len(transactions)} transactions from Hanseatic PDF")
            return transactions

        except Exception as e:
            logger.error(f"Error parsing Hanseatic PDF: {e}", exc_info=True)
            raise ValueError(f"Failed to parse Hanseatic PDF: {str(e)}")

    def _parse_german_amount(self, amount_str: str) -> float:
        """Parse German decimal format (e.g., '-15,62' or '1.234,56')"""
        amount_str = amount_str.strip().replace('€', '').strip()

        # Handle thousand separator and decimal comma
        if '.' in amount_str and ',' in amount_str:
            # Format: 1.234,56
            amount_str = amount_str.replace('.', '').replace(',', '.')
        elif ',' in amount_str:
            # Format: 15,62
            amount_str = amount_str.replace(',', '.')

        return float(amount_str)

    def parse(self, content: str, account_id: int) -> List[TransactionImport]:
        """Not used for PDF - use parse_pdf instead"""
        raise NotImplementedError("Use parse_pdf() for PDF files")
