import httpx
from datetime import datetime, timedelta
from typing import List
import logging

from app.config import settings
from app.services.csv_parsers.base import TransactionImport

logger = logging.getLogger(__name__)


class PayPalService:
    """Service for syncing transactions from PayPal API"""

    BASE_URL_SANDBOX = "https://api-m.sandbox.paypal.com"
    BASE_URL_LIVE = "https://api-m.paypal.com"

    def __init__(self):
        self.client_id = settings.PAYPAL_CLIENT_ID
        self.client_secret = settings.PAYPAL_CLIENT_SECRET
        self.env = settings.PAYPAL_ENV
        self.base_url = self.BASE_URL_SANDBOX if self.env == "sandbox" else self.BASE_URL_LIVE
        self._access_token = None
        self._token_expiry = None

    async def _get_access_token(self) -> str:
        """
        Authenticate with PayPal and get OAuth2 access token.
        Caches token until expiry.
        """
        # Return cached token if still valid
        if self._access_token and self._token_expiry and datetime.utcnow() < self._token_expiry:
            return self._access_token

        logger.info("Authenticating with PayPal API...")

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/v1/oauth2/token",
                auth=(self.client_id, self.client_secret),
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                data={"grant_type": "client_credentials"},
                timeout=30.0,
            )

            if response.status_code != 200:
                logger.error(f"PayPal auth failed: {response.status_code} {response.text}")
                raise ValueError(f"PayPal authentication failed: {response.status_code}")

            data = response.json()
            self._access_token = data["access_token"]
            # Token typically valid for 9 hours, cache for 8 hours to be safe
            expires_in = data.get("expires_in", 28800)
            self._token_expiry = datetime.utcnow() + timedelta(seconds=expires_in - 3600)

            logger.info("PayPal authentication successful")
            return self._access_token

    async def fetch_transactions(
        self,
        account_id: int,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> List[TransactionImport]:
        """
        Fetch transactions from PayPal Reporting API.

        Args:
            account_id: Account ID to associate transactions with
            start_date: Start date for transaction fetch (default: 30 days ago)
            end_date: End date for transaction fetch (default: now)

        Returns:
            List of normalized transaction objects
        """
        if not self.client_id or not self.client_secret:
            raise ValueError("PayPal credentials not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.")

        # Default date range: last 30 days
        if start_date is None:
            start_date = datetime.utcnow() - timedelta(days=30)
        if end_date is None:
            end_date = datetime.utcnow()

        token = await self._get_access_token()

        logger.info(f"Fetching PayPal transactions from {start_date.date()} to {end_date.date()}")

        transactions = []

        async with httpx.AsyncClient() as client:
            # PayPal Reporting API endpoint
            url = f"{self.base_url}/v1/reporting/transactions"

            params = {
                "start_date": start_date.strftime("%Y-%m-%dT%H:%M:%S-0000"),
                "end_date": end_date.strftime("%Y-%m-%dT%H:%M:%S-0000"),
                "fields": "all",
                "page_size": 500,  # Max per page
            }

            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            }

            response = await client.get(url, params=params, headers=headers, timeout=60.0)

            if response.status_code != 200:
                logger.error(f"PayPal transaction fetch failed: {response.status_code} {response.text}")
                raise ValueError(f"Failed to fetch PayPal transactions: {response.status_code}")

            data = response.json()
            transaction_details = data.get("transaction_details", [])

            logger.info(f"Retrieved {len(transaction_details)} transactions from PayPal")

            for txn in transaction_details:
                try:
                    # Only import completed transactions
                    transaction_info = txn.get("transaction_info", {})
                    if transaction_info.get("transaction_status") != "S":  # S = Success
                        continue

                    # Parse date
                    date_str = transaction_info.get("transaction_initiation_date")
                    if not date_str:
                        continue
                    trans_date = datetime.strptime(date_str[:10], "%Y-%m-%d").date()

                    # Parse amount
                    transaction_amount = transaction_info.get("transaction_amount", {})
                    amount_str = transaction_amount.get("value")
                    if not amount_str:
                        continue

                    amount_float = float(amount_str)

                    # Determine if this is a payment sent or received
                    # T00xx codes are typically payments sent (debit)
                    event_code = transaction_info.get("transaction_event_code", "")
                    if event_code.startswith("T00"):
                        amount_float = -abs(amount_float)  # Make it negative (expense)

                    amount_cents = int(amount_float * 100)

                    # Get description and counterparty
                    description = transaction_info.get("transaction_subject") or transaction_info.get("transaction_note")

                    payer_info = txn.get("payer_info", {})
                    counterparty = (
                        payer_info.get("payer_name", {}).get("alternate_full_name")
                        or payer_info.get("email_address")
                    )

                    # Use transaction_id as import_hash (unique per PayPal transaction)
                    transaction_id = transaction_info.get("transaction_id")
                    if not transaction_id:
                        continue

                    # Generate import hash from PayPal transaction ID
                    import hashlib
                    import_hash = hashlib.sha256(f"paypal_{transaction_id}".encode('utf-8')).hexdigest()

                    transactions.append(TransactionImport(
                        date=trans_date,
                        amount_cents=amount_cents,
                        description=description,
                        counterparty=counterparty,
                        import_hash=import_hash,
                        source="paypal"
                    ))

                except (ValueError, KeyError) as e:
                    logger.warning(f"Skipping PayPal transaction due to error: {e}")
                    continue

        logger.info(f"Parsed {len(transactions)} completed PayPal transactions")
        return transactions
