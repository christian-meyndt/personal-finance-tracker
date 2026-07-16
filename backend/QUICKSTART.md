# Quick Start Guide

Get the Personal Finance Tracker backend running in under 2 minutes.

## Prerequisites

- Python 3.11 or higher
- pip (Python package manager)

## Setup in 4 Commands

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create virtual environment and install dependencies
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 3. Start the server (database auto-creates on first run)
uvicorn app.main:app --reload --port 8000
```

**That's it!** The API is now running at http://localhost:8000

## First Steps

### 1. Check the API Documentation

Open your browser to:
- **Swagger UI:** http://localhost:8000/docs (interactive API testing)
- **ReDoc:** http://localhost:8000/redoc (clean documentation)

### 2. Test Authentication

```bash
# Login (returns JWT token)
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"
```

You'll get back:
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

### 3. Use the Token

```bash
# Save token to variable
TOKEN="<your-token-here>"

# Get current user info
curl "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer $TOKEN"

# List categories
curl "http://localhost:8000/api/v1/categories" \
  -H "Authorization: Bearer $TOKEN"

# Create an account
curl -X POST "http://localhost:8000/api/v1/accounts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Bank Account", "type": "checking", "currency": "EUR"}'
```

### 4. Run Automated Tests

```bash
# Make sure server is running, then:
./test_api.sh
```

This runs 8 automated tests to verify everything works.

## Default Credentials

- **Username:** `admin`
- **Password:** `admin123`

⚠️ Change these in production! Edit `.env` file:
```bash
ADMIN_USER=your_username
ADMIN_PASSWORD=your_secure_password
```

## What's Pre-Loaded

The database comes with:
- **11 categories**: Groceries, Restaurants, Transport, Entertainment, Shopping, Health, Utilities, Housing, Income, Subscriptions, Other
- **17 auto-categorization rules**: For common German merchants (REWE, EDEKA, Amazon, Spotify, etc.)

## Configuration (Optional)

Edit `.env` file to customize:

```bash
DATABASE_URL=sqlite:///./finance.db
SECRET_KEY=change-this-in-production
ADMIN_USER=admin
ADMIN_PASSWORD=admin123

# PayPal API sync (optional)
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-secret
PAYPAL_ENV=sandbox  # or 'live'

# AI categorization (optional)
ANTHROPIC_API_KEY=your-anthropic-key
```

## Common Commands

```bash
# Start server
uvicorn app.main:app --reload --port 8000

# Run on different port
uvicorn app.main:app --reload --port 3001

# Run without auto-reload (production-like)
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Check database migrations
alembic current

# Apply migrations (if needed)
alembic upgrade head

# Create new migration after model changes
alembic revision --autogenerate -m "Description"
```

## Troubleshooting

### Port Already in Use
```bash
# Kill existing server
pkill -f "uvicorn app.main:app"

# Or use different port
uvicorn app.main:app --port 8001
```

### Database Issues
```bash
# Reset database (WARNING: deletes all data)
rm finance.db
alembic upgrade head
# Server will recreate tables on next startup
```

### Package Installation Issues
```bash
# Upgrade pip first
pip install --upgrade pip

# Then retry
pip install -r requirements.txt
```

## API Endpoints Overview

All endpoints prefixed with `/api/v1/`

| Endpoint | Method | Protected | Description |
|----------|--------|-----------|-------------|
| `/health` | GET | No | Health check |
| `/auth/login` | POST | No | Get JWT token |
| `/auth/me` | GET | Yes | Current user |
| `/accounts` | GET/POST | Yes | List/create accounts |
| `/transactions` | GET | Yes | List transactions (paginated) |
| `/transactions/count` | GET | Yes | Transaction count |
| `/transactions/{id}` | PATCH | Yes | Update transaction |
| `/categories` | GET/POST | Yes | List/create categories |
| `/budgets` | GET/POST | Yes | List/create budgets |
| `/rules` | GET/POST/DELETE | Yes | Manage categorization rules |
| `/import/csv` | POST | Yes | Import CSV file |
| `/import/pdf` | POST | Yes | Import PDF statement |
| `/import/paypal` | POST | Yes | Sync PayPal transactions |
| `/analytics/summary` | GET | Yes | Financial summary |
| `/export/transactions/csv` | GET | Yes | Export as CSV |

**Protected** = Requires `Authorization: Bearer <token>` header

## Need Help?

- Check `README.md` for detailed API and schema docs
- API docs always available at http://localhost:8000/docs
