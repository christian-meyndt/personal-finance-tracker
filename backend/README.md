# Personal Finance Tracker - Backend

FastAPI-based backend for the Personal Finance Tracker application.

## Features

- **SQLAlchemy 2.0** ORM with Alembic migrations
- **JWT Authentication** with 7-day token expiry
- **RESTful API** with automatic OpenAPI/Swagger documentation
- **Database Models**: Users, Accounts, Transactions, Categories, Budgets, Category Rules
- **Multi-user support** with bcrypt password hashing
- **Pre-seeded data**: Default categories and categorization rules for German merchants

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
- `POST /auth/login` - Login with username/password, returns JWT token
- `GET /auth/me` - Get current user info (protected)

### Accounts
- `GET /accounts` - List all accounts
- `POST /accounts` - Create new account
- `PATCH /accounts/{id}` - Update account

### Transactions
- `GET /transactions` - List transactions (with filters: account_id, category_id, date_from, date_to, search)
- `GET /transactions/uncategorized` - List uncategorized transactions
- `PATCH /transactions/{id}` - Update transaction (e.g., assign category)

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
- Source tracking: csv_dkb, csv_hanseatic, csv_openbank, paypal, manual

### Categories
- Hierarchical structure with parent_id for subcategories
- Icon (emoji) and color for UI display

### Budgets
- Monthly budget limits per category
- Amounts in cents

### Category Rules
- Pattern matching for auto-categorization
- Match types: contains, starts_with, exact

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
│   │   └── rules.py
│   ├── models/           # SQLAlchemy ORM models
│   ├── schemas/          # Pydantic request/response schemas
│   ├── services/         # Business logic (CSV parsers, categorizer, PayPal)
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

## Next Steps (Phase 2+)

Phase 1 is now complete with:
- ✅ FastAPI project structure
- ✅ SQLAlchemy 2.0 with all models
- ✅ Alembic migrations
- ✅ JWT authentication endpoint
- ✅ All API endpoints scaffolded
- ✅ Database seeded with default categories and rules

**Ready for Phase 2**: CSV import functionality, PayPal integration, and AI categorization.
