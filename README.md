# Personal Finance Tracker

A self-hosted personal finance tracking web application built with Python FastAPI backend and Next.js frontend. Track income and expenses across multiple accounts with zero recurring costs.

## Features

- 📊 Multi-account tracking (checking, savings, credit, PayPal)
- 💰 All amounts in cents - no float precision issues
- 🏷️ Automatic categorization with customizable rules
- 📈 Budget tracking per category
- 🔐 JWT authentication with bcrypt password hashing
- 📥 CSV import - DKB, Hanseatic Bank, Openbank
- 🔄 PayPal API sync
- 🎨 Next.js frontend with shadcn/ui
- 🤖 AI categorization with Anthropic Claude (Phase 6)
- 📊 Analytics and charts (Phase 7-8)

## Current Status

**✅ Phase 1-5 Complete!**

Working features:
- ✅ FastAPI backend with JWT auth
- ✅ Next.js frontend with authentication
- ✅ CSV import for 3 banks (DKB, Hanseatic, Openbank)
- ✅ PayPal API integration
- ✅ Transaction list UI
- ✅ Deduplication (import_hash)
- ✅ Navigation between pages

**🚧 Phase 6 Next:** Categorization (rule engine + AI fallback)

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

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **shadcn/ui** - Component library
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization (Phase 8)

## Architecture

```
personal-finance-tracker/
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── api/         # Route handlers
│   │   ├── models/      # SQLAlchemy models (separated by entity)
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── services/    # Business logic, CSV parsers, PayPal
│   │   ├── auth.py      # JWT utilities (dual: Bearer + Cookie)
│   │   ├── config.py    # Settings
│   │   └── main.py      # FastAPI app
│   ├── alembic/         # Database migrations
│   └── test_data/       # Sample CSV files
└── frontend/            # Next.js application
    ├── src/
    │   ├── app/         # Pages (App Router)
    │   ├── components/  # UI components
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
- `GET /transactions` - List transactions (with pagination)
- `GET/POST /categories` - Category management
- `GET/POST /budgets` - Budget management
- `GET/POST/DELETE /rules` - Categorization rules

### Import
- `POST /import/csv` - Upload CSV file (auto-detects bank format)
- `POST /import/paypal` - Sync PayPal transactions (requires credentials)

Full API documentation at http://localhost:8000/docs

## Supported Banks

| Bank | Country | Format | Status |
|------|---------|--------|--------|
| DKB (Deutsche Kreditbank) | 🇩🇪 Germany | UTF-8-sig, semicolon, DD.MM.YYYY | ✅ |
| Hanseatic Bank | 🇩🇪 Germany | UTF-8, semicolon, DD.MM.YYYY | ✅ |
| Openbank | 🇪🇸 Spain | Auto-detect, flexible dates | ✅ |
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

### ✅ Phase 1: Backend Foundation (Complete)
- FastAPI project structure
- SQLAlchemy 2.0 models (6 models, separated files)
- Alembic migrations
- JWT authentication
- All API endpoints
- Seed data (11 categories, 17 rules)

### ✅ Phase 2: Frontend Setup (Complete)
- Next.js 14 with App Router
- shadcn/ui components
- Authentication (dual: Bearer + Cookie)
- Login/logout flow
- Middleware for protected routes

### ✅ Phase 3: DKB Parser + UI (Complete)
- DKB CSV parser (German format)
- Transaction list UI
- Import page with file upload
- Auto-detection for bank format
- Navigation component

### ✅ Phase 4: Multi-Bank Support (Complete)
- Hanseatic Bank parser
- Openbank parser
- Auto-detection for all 3 banks
- Tested end-to-end with all formats

### ✅ Phase 5: PayPal Integration (Complete)
- PayPal OAuth2 authentication
- PayPal Reporting API integration
- Sync endpoint with date range
- UI button for PayPal sync
- Results display with auto-redirect

### 🚧 Phase 6: Categorization (In Progress)
- Rule-based categorization engine
- Run rules on import (CSV and PayPal)
- AI categorization with Anthropic Claude Haiku
- Auto-create rules from AI suggestions
- Category management UI

### 📋 Phase 7: Dashboard (Planned)
- Dashboard with summary cards
- Budget tracking page
- Monthly spending overview
- Category breakdown

### 📋 Phase 8: Analytics (Planned)
- Charts with Recharts
- Spending trends
- Income vs expenses
- Category analysis

### 📋 Phase 9: Settings (Planned)
- Account management
- Category editor
- Rule management
- CSV export
- User settings

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
- ✅ Automatic transaction import (CSV + PayPal)
- 🚧 Smart categorization (rule-based + AI)
- 📋 Beautiful, responsive UI with charts

## License

MIT License - This is a personal project, feel free to fork and modify.

---

**Built with FastAPI + Next.js 14 + SQLAlchemy 2.0 + shadcn/ui**
