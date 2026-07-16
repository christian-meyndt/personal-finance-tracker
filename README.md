# Personal Finance Tracker

A self-hosted personal finance tracking web application built with Python FastAPI backend and Next.js frontend. Track income and expenses across multiple accounts with zero recurring costs.

## Features

- 📊 Multi-account tracking (checking, savings, credit, PayPal)
- 💰 All amounts in cents - no float precision issues
- 🏷️ Automatic categorization with customizable rules + AI fallback
- 📈 Budget tracking per category with visual progress
- 🔐 JWT authentication with bcrypt password hashing
- 📥 CSV import - DKB, Hanseatic Bank, Openbank, PayPal
- 📄 PDF import - Hanseatic Bank statements
- 🔄 PayPal API sync with custom date ranges
- 🎨 Next.js frontend with shadcn/ui
- 🤖 AI categorization with Anthropic Claude Haiku
- 📊 Interactive analytics charts (Recharts)
- 💾 CSV export with filtering
- 🇩🇪 Full German UI
- 🔍 Transaction search, pagination, and transfer filtering

## Current Status

**✅ All Phases Complete!**

- ✅ FastAPI backend with JWT auth
- ✅ Next.js 16 frontend with React 19
- ✅ CSV import for 3 banks (DKB, Hanseatic, Openbank) + PayPal CSV
- ✅ PDF import for Hanseatic Bank statements
- ✅ PayPal API integration with custom date ranges
- ✅ Categorization engine (rule-based + AI fallback)
- ✅ Categorization rules management UI
- ✅ Dashboard with financial summaries
- ✅ Budget tracking with visual progress bars
- ✅ Interactive analytics charts (line, pie, bar)
- ✅ Transaction pagination and search
- ✅ Transfer filtering
- ✅ CSV export with date/account/category filters
- ✅ Settings page
- ✅ Full German translation

## Quick Start

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure .env file
cp .env.example .env
# Edit .env with your settings

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --port 8000
```

**API:** http://localhost:8000  
**Docs:** http://localhost:8000/docs  
**Login:** admin / admin123

### Frontend

```bash
cd frontend
npm install
npm run dev
```

**App:** http://localhost:3000  
**Login:** admin / admin123

## Tech Stack

### Backend
- **FastAPI** - Modern async Python web framework
- **SQLAlchemy 2.0** - ORM with type safety
- **Alembic** - Database migrations
- **JWT** - Stateless authentication (7-day tokens)
- **Bcrypt** - Password hashing
- **SQLite** - Embedded database (upgradeable to PostgreSQL)
- **Anthropic SDK** - AI categorization (Claude Haiku 4.5)

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **shadcn/ui** - Component library
- **Tailwind CSS** - Styling
- **Recharts** - Interactive data visualization

## Architecture

```
personal-finance-tracker/
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── api/         # Route handlers (transactions, import, analytics, export)
│   │   ├── models/      # SQLAlchemy models (separated by entity)
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── services/    # Business logic
│   │   │   ├── csv_parsers/  # Bank-specific parsers (DKB, Hanseatic, Openbank, PayPal)
│   │   │   ├── categorization.py  # Rule engine + AI fallback
│   │   │   ├── analytics.py       # Financial summaries
│   │   │   └── paypal.py          # PayPal API integration
│   │   ├── auth.py      # JWT utilities (dual: Bearer + Cookie)
│   │   ├── config.py    # Settings
│   │   └── main.py      # FastAPI app
│   ├── alembic/         # Database migrations
│   └── test_data/       # Sample CSV files
└── frontend/            # Next.js application
    ├── src/
    │   ├── app/         # Pages (dashboard, analytics, transactions, etc.)
    │   ├── components/  # UI components (shadcn/ui)
    │   └── middleware.ts # Auth middleware
    └── public/
```

## Database Schema

### Models
- **User** - Authentication
- **Account** - Bank accounts (checking, savings, credit, PayPal)
- **Transaction** - Financial transactions (amounts in cents, import_hash for deduplication)
- **Category** - Hierarchical categories with icons/colors
- **Budget** - Monthly budget limits per category
- **CategoryRule** - Pattern-based auto-categorization

All monetary amounts stored as **integers (cents)** to avoid float precision issues.

Transaction deduplication uses SHA-256 hash of: `date + amount_cents + description`

## API Endpoints

All endpoints prefixed with `/api/v1/`

### Authentication
- `POST /auth/login` - Login with form data (sets httpOnly cookie)
- `POST /auth/login/json` - Login with JSON (for API clients)
- `POST /auth/logout` - Logout (clears cookie)
- `GET /auth/me` - Current user info

### Resources (All Protected)
- `GET/POST /accounts` - Account management
- `GET /transactions` - List transactions (with pagination, search, filters)
- `GET /transactions/count` - Transaction count with filters
- `GET/POST /categories` - Category management
- `GET/POST /budgets` - Budget management
- `GET/POST/DELETE /rules` - Categorization rules

### Import
- `POST /import/csv` - Upload CSV file (auto-detects bank format)
- `POST /import/pdf` - Upload PDF bank statement (Hanseatic)
- `POST /import/paypal` - Sync PayPal transactions (requires credentials)

### Analytics
- `GET /analytics/summary` - Financial summary (income, expenses, net)
- `GET /analytics/by-category` - Spending breakdown by category
- `GET /analytics/monthly-trend` - Monthly income/expense trends
- `GET /analytics/budget-progress` - Budget vs actual spending

### Export
- `GET /export/transactions/csv` - Export transactions as CSV (with date/account/category filters)

### Categorization
- `POST /transactions/{id}/categorize` - Categorize single transaction
- `POST /transactions/categorize-all` - Auto-categorize all uncategorized

Full API documentation at http://localhost:8000/docs

## Supported Banks

| Bank | Country | Format | Status |
|------|---------|--------|--------|
| DKB (Deutsche Kreditbank) | 🇩🇪 Germany | CSV (UTF-8-sig, semicolon, DD.MM.YYYY) | ✅ |
| Hanseatic Bank | 🇩🇪 Germany | CSV (UTF-8, semicolon, DD.MM.YYYY) | ✅ |
| Hanseatic Bank | 🇩🇪 Germany | PDF bank statements | ✅ |
| Openbank | 🇪🇸 Spain | CSV (auto-detect, flexible dates) | ✅ |
| PayPal | 🌍 Global | CSV export | ✅ |
| PayPal | 🌍 Global | API integration (OAuth2) | ✅ |

## Configuration

Create `backend/.env`:

```bash
DATABASE_URL=sqlite:///./finance.db
SECRET_KEY=your-secret-key-here-min-32-chars
ADMIN_USER=admin
ADMIN_PASSWORD=changeme

# PayPal (optional - for PayPal sync)
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-secret
PAYPAL_ENV=sandbox  # or 'live'

# Anthropic (Phase 6 - for AI categorization)
ANTHROPIC_API_KEY=your-anthropic-key
```

Get PayPal credentials at https://developer.paypal.com (free)

## Testing the App

### 1. Start Backend
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

### 3. Login
Go to http://localhost:3000 and login with `admin` / `admin123`

### 4. Import Test Data
Go to Import page and upload:
- `backend/test_data/sample_dkb.csv`
- `backend/test_data/sample_hanseatic.csv`
- `backend/test_data/sample_openbank.csv`

### 5. View Transactions
Check the Transactions page - should see 15 transactions

### 6. Test Deduplication
Re-import the same files - should see "0 imported, 5 skipped" for each

## Development Phases

### ✅ Phase 1: Backend Foundation
- FastAPI project structure
- SQLAlchemy 2.0 models (6 models, separated files)
- Alembic migrations
- JWT authentication
- All API endpoints
- Seed data (11 categories, 17 rules)

### ✅ Phase 2: Frontend Setup
- Next.js with App Router
- shadcn/ui components
- Authentication (dual: Bearer + Cookie)
- Login/logout flow
- Middleware for protected routes

### ✅ Phase 3: DKB Parser + UI
- DKB CSV parser (German format)
- Transaction list UI
- Import page with file upload
- Auto-detection for bank format
- Navigation component

### ✅ Phase 4: Multi-Bank Support
- Hanseatic Bank parser
- Openbank parser
- Auto-detection for all 3 banks

### ✅ Phase 5: PayPal Integration
- PayPal OAuth2 authentication
- PayPal Reporting API integration
- Sync endpoint with custom date range
- UI button for PayPal sync

### ✅ Phase 6: Categorization
- Rule-based categorization engine (contains, starts_with, exact, regex)
- Auto-categorize on import (CSV and PayPal)
- AI fallback with Anthropic Claude Haiku 4.5
- Category management UI

### ✅ Phase 7: Dashboard + Budget Tracking
- Dashboard with summary cards (income, expenses, net)
- Top spending categories with progress bars
- Budget tracking with visual progress
- Over-budget warnings

### ✅ Phase 8: Analytics Charts
- Monthly trend line chart (income vs expenses)
- Category spending pie chart
- Budget vs actual bar chart
- Interactive tooltips and legends

### ✅ Phase 9: Settings + Export
- Settings page with account/category/rule overview
- CSV export with date range and account/category filters
- German column headers in export

### Post-Phase Enhancements
- Full German translation of the entire UI
- PayPal CSV parser (no business account needed)
- Hanseatic PDF bank statement parser
- Transfer filtering for transactions
- Categorization rules management page
- Server-side transaction pagination and search

## How Import Works

### CSV Import Flow
1. User uploads CSV file
2. Backend detects format (DKB, Hanseatic, or Openbank)
3. Parser extracts: date, amount, description, counterparty
4. Generate import_hash = SHA256(date + amount + description)
5. Check if hash exists in database
6. Insert new transactions, skip duplicates
7. Return results: bank, imported, skipped, total

### PayPal Sync Flow
1. User clicks "Sync PayPal Transactions" with days (1-365)
2. Backend authenticates with PayPal OAuth2
3. Fetch transactions from `/v1/reporting/transactions`
4. Use PayPal transaction_id as import_hash
5. Deduplicate against existing transactions
6. Return results: imported, skipped, total

## Goals

- ✅ Zero recurring costs (self-hosted)
- ✅ Full data ownership
- ✅ Easy to extend
- ✅ Multi-user household support
- ✅ Automatic transaction import (CSV + PDF + PayPal API)
- ✅ Smart categorization (rule-based + AI)
- ✅ Beautiful, responsive UI with interactive charts
- ✅ Full German translation

## License

MIT License - This is a personal project, feel free to fork and modify.

---

**Built with FastAPI + Next.js 16 + React 19 + SQLAlchemy 2.0 + shadcn/ui + Recharts**
