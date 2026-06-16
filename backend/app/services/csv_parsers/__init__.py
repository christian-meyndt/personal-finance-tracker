from app.services.csv_parsers.base import BaseParser, TransactionImport
from app.services.csv_parsers.dkb import DKBParser
from app.services.csv_parsers.hanseatic import HanseaticParser
from app.services.csv_parsers.openbank import OpenbankParser
from app.services.csv_parsers.paypal_csv import PayPalCSVParser

__all__ = [
    "BaseParser",
    "TransactionImport",
    "DKBParser",
    "HanseaticParser",
    "OpenbankParser",
    "PayPalCSVParser",
]

# List of all available parsers for auto-detection
ALL_PARSERS = [DKBParser, HanseaticParser, OpenbankParser, PayPalCSVParser]
