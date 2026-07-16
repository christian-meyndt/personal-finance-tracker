# Personal Finance Tracker - Backend

FastAPI-based backend for the Personal Finance Tracker application.

## Features

- **SQLAlchemy 2.0** ORM with Alembic migrations
- **JWT Authentication** with 7-day token expiry
- **RESTful API** with automatic OpenAPI/Swagger documentation
- **Database Models**: Users, Accounts, Transactions, Categories, Budgets, Category Rules
- **Multi-user support** with bcrypt password hashing
- **Pre-seeded data**: Default categories and categorization rules for German merchants
- **Multi-bank CSV import**: DKB, Hanseatic, Openbank, PayPal
- **PDF import**: Hanseatic Bank statements
- **PayPal API sync**: OAuth2-based transaction sync
- **Auto-categorization**: Rule engine + AI fallback (Claude Haiku 4.5)
- **Analytics**: Financial summaries, category breakdowns, monthly trends
- **CSV export**: Filtered transaction export with German headers

## Quick Start

### 1. Install Dependencies

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- `SECRET_KEY`: Change this to a secure random string in production
- `ADMIN_USER` / `ADMIN_PASSWORD`: Initial admin credentials
- Optional: Add PayPal and Anthropic API keys for advanced features

### 3. Run Database Migrations

```bash
alembic upgrade head
```

### 4. Start the Server

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at:
- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

All endpoints are prefixed with `/api/v1/` and protected routes require a JWT bearer token.

### Authentication
- `POST /auth/login` - Login with form data (sets httpOnly cookie)
- `POST /auth/login/json` - Login with JSON (for API clients)
- `POST /auth/logout` - Logout (clears cookie)
- `GET /auth/me` - Get current user info

### Accounts
- `GET /accounts` - List all accounts
- `POST /accounts` - Create new account
- `PATCH /accounts/{id}` - Update account

### Transactions
- `GET /transactions` - List transactions (with pagination, filters: account_id, category_id, date_from, date_to, search)
- `GET /transactions/count` - Transaction count with filters
- `GET /transactions/uncategorized` - List uncategorized transactions
- `POST /transactions/{id}/categorize` - Categorize single transaction
- `POST /transactions/categorize-all` - Auto-categorize all uncategorized
- `PATCH /transactions/{id}` - Update transaction

### Categories
- `GET /categories` - List all categories
- `POST /categories` - Create new category

### Budgets
- `GET /budgets` - List all budgets
- `POST /budgets` - Create or update budget

### Categorization Rules
- `GET /rules` - List all rules
- `POST /rules` - Create new rule
- `DELETE /rules/{id}` - Delete rule

### Import
- `POST /import/csv` - Upload CSV file (auto-detects bank format)
- `POST /import/pdf` - Upload PDF bank statement (Hanseatic)
- `POST /import/paypal` - Sync PayPal transactions via API

### Analytics
- `GET /analytics/summary` - Financial summary (income, expenses, net)
- `GET /analytics/by-category` - Spending breakdown by category
- `GET /analytics/monthly-trend` - Monthly income/expense trends
- `GET /analytics/budget-progress` - Budget vs actual spending
- `GET /analytics/recent` - Recent transactions

### Export
- `GET /export/transactions/csv` - Export as CSV (filters: start_date, end_date, account_id, category_id)

## Database Schema

### Users
- Authentication and user management
- Bcrypt-hashed passwords

### Accounts
- Supports: checking, savings, credit, paypal account types
- Multi-currency support (default: EUR)

### Transactions
- All amounts stored as **cents** (integers) to avoid float precision issues
- Negative amounts = expenses, positive = income
- Unique `import_hash` for deduplication
- Source tracking: csv_dkb, csv_hanseatic, csv_openbank, csv_paypal, paypal, manual

### Categories
- Hierarchical structure with parent_id for subcategories
- Icon (emoji) and color for UI display

### Budgets
- Monthly budget limits per category
- Amounts in cents

### Category Rules
- Pattern matching for auto-categorization
- Match types: contains, starts_with, exact, regex

## Database Migrations

### Create a new migration

```bash
alembic revision --autogenerate -m "Description of changes"
```

### Apply migrations

```bash
alembic upgrade head
```

### Rollback migration

```bash
alembic downgrade -1
```

## Default Data

On first startup, the application automatically creates:

1. **Admin user** from environment variables
2. **11 default categories**: Groceries, Restaurants, Transport, Entertainment, Shopping, Health, Utilities, Housing, Income, Subscriptions, Other
3. **17 categorization rules** for common German merchants (REWE, EDEKA, ALDI, LIDL, Amazon, Spotify, Netflix, etc.)

## Testing Authentication

```bash
# Login and get token
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"

# Use token for protected endpoints
curl "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Development

### Code Structure

```
backend/
├── app/
│   ├── api/              # API route handlers
│   │   ├── auth.py
│   │   ├── accounts.py
│   │   ├── transactions.py
│   │   ├── categories.py
│   │   ├── budgets.py
│   │   ├── rules.py
│   │   ├── import_api.py      # CSV import
│   │   ├── import_api_pdf.py  # PDF import
│   │   ├── analytics.py       # Analytics endpoints
│   │   └── export.py          # CSV export
│   ├── models/           # SQLAlchemy ORM models
│   ├── schemas/          # Pydantic request/response schemas
│   ├── services/         # Business logic
│   │   ├── csv_parsers/       # Bank-specific parsers (DKB, Hanseatic, Openbank, PayPal, PDF)
│   │   ├── categorization.py  # Rule engine + AI fallback
│   │   ├── analytics.py       # Financial summaries
│   │   └── paypal.py          # PayPal API integration
│   ├── auth.py           # JWT and password hashing utilities
│   ├── config.py         # Settings from environment variables
│   ├── db.py             # Database session management
│   ├── init_db.py        # Database initialization with seed data
│   └── main.py           # FastAPI application
├── alembic/              # Database migrations
│   └── versions/
├── requirements.txt
├── .env                  # Environment variables (not in git)
└── finance.db           # SQLite database (not in git)
```

### Type Hints

All functions use Python type hints for better IDE support and code clarity.

### Async/Await

FastAPI is async-first. All route handlers and database operations support async/await.

## Environment Variables

```bash
DATABASE_URL=sqlite:///./finance.db
SECRET_KEY=your-secret-key-here-min-32-chars
ADMIN_USER=admin
ADMIN_PASSWORD=changeme

# PayPal API (optional)
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-secret
PAYPAL_ENV=sandbox  # or 'live'

# AI categorization (optional)
ANTHROPIC_API_KEY=your-anthropic-key
```
