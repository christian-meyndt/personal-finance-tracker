# Personal Finance Tracker

A self-hosted personal finance tracking web application built with Python FastAPI backend and Next.js frontend (planned). Track income and expenses across multiple accounts with zero recurring costs.

## Features

- 📊 Multi-account tracking (checking, savings, credit, PayPal)
- 💰 All amounts in cents - no float precision issues
- 🏷️ Automatic categorization with customizable rules
- 📈 Budget tracking per category
- 🔐 JWT authentication with bcrypt password hashing
- 📥 CSV import (Phase 2) - DKB, Hanseatic Bank, Openbank
- 🔄 PayPal sync (Phase 2)
- 🤖 AI categorization with Anthropic Claude (Phase 3)
- 📊 Analytics and charts (Phase 3)
- 🎨 Next.js frontend (Phase 4+)

## Project Status

**✅ Phase 1 Complete**: Backend foundation with FastAPI, SQLAlchemy 2.0, Alembic migrations, JWT auth, and all database models.

See [PROJECT_STATUS.md](./PROJECT_STATUS.md) for detailed progress.

## Quick Start

### Backend (Phase 1 - Ready Now)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload --port 8000
```

**API:** http://localhost:8000  
**Docs:** http://localhost:8000/docs  
**Login:** admin / admin123

See [backend/QUICKSTART.md](./backend/QUICKSTART.md) for details.

### Frontend (Phase 4+ - Coming Later)

Next.js frontend will be added in a future phase.

## Tech Stack

### Backend
- **FastAPI** - Modern async Python web framework
- **SQLAlchemy 2.0** - ORM with type safety
- **Alembic** - Database migrations
- **JWT** - Stateless authentication (7-day tokens)
- **Bcrypt** - Password hashing
- **SQLite** - Embedded database (upgradeable to PostgreSQL)
- **Pydantic** - Request/response validation
- **Uvicorn** - ASGI server

### Frontend (Planned)
- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type safety
- **TanStack Query** - Server state management
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization

## Architecture

```
personal-finance-tracker/
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── api/         # Route handlers
│   │   ├── models/      # SQLAlchemy models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── services/    # Business logic
│   │   ├── auth.py      # JWT utilities
│   │   ├── config.py    # Settings
│   │   └── main.py      # FastAPI app
│   ├── alembic/         # Database migrations
│   └── tests/           # (Phase 2+)
└── frontend/            # (Phase 4+) Next.js app
```

## Database Schema

### Models
- **User** - Authentication
- **Account** - Bank accounts (checking, savings, credit, PayPal)
- **Transaction** - Financial transactions (amounts in cents)
- **Category** - Hierarchical categories with icons/colors
- **Budget** - Monthly budget limits per category
- **CategoryRule** - Pattern-based auto-categorization

All monetary amounts stored as **integers (cents)** to avoid float precision issues.

## API Endpoints

All endpoints prefixed with `/api/v1/`

### Authentication
- `POST /auth/login` - Login, get JWT token
- `GET /auth/me` - Current user info

### Resources (All Protected)
- `GET/POST/PATCH /accounts` - Account management
- `GET/PATCH /transactions` - Transaction management
- `GET /transactions/uncategorized` - Uncategorized transactions
- `GET/POST /categories` - Category management
- `GET/POST /budgets` - Budget management
- `GET/POST/DELETE /rules` - Categorization rules

Full API documentation at http://localhost:8000/docs when running.

## Development Phases

### ✅ Phase 1: Backend Foundation (Complete)
- FastAPI project structure
- SQLAlchemy 2.0 models (6 models)
- Alembic migrations
- JWT authentication
- All API endpoints
- Seed data (11 categories, 17 rules)

### 🚧 Phase 2: Import & Sync (Planned)
- CSV parsers (DKB, Hanseatic, Openbank)
- PayPal API integration
- Import deduplication
- File upload handling

### 📋 Phase 3: Intelligence (Planned)
- Anthropic Claude AI categorization
- Rule-based categorization engine
- Analytics endpoints
- Monthly/yearly summaries

### 🎨 Phase 4+: Frontend (Planned)
- Next.js application
- Dashboard with charts
- Transaction management UI
- Budget tracking UI
- CSV import interface

## Configuration

Copy `backend/.env.example` to `backend/.env`:

```bash
DATABASE_URL=sqlite:///./finance.db
SECRET_KEY=your-secret-key-here
ADMIN_USER=admin
ADMIN_PASSWORD=changeme
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-secret
ANTHROPIC_API_KEY=your-anthropic-key
```

## Testing

```bash
cd backend
./test_api.sh  # Run automated test suite
```

## Contributing

This is a personal project. If you'd like to use it:
1. Fork the repository
2. Set up your environment
3. Make your changes
4. Test thoroughly

## License

TBD - This is a personal project, license to be determined.

## Goals

- ✅ Zero recurring costs (self-hosted)
- ✅ Full data ownership
- ✅ Easy to extend
- ✅ Multi-user household support
- 🚧 Automatic transaction import (CSV + PayPal)
- 🚧 Smart categorization
- 📋 Beautiful, responsive UI

## Documentation

- [PROJECT_STATUS.md](./PROJECT_STATUS.md) - Overall project status
- [backend/README.md](./backend/README.md) - Backend technical docs
- [backend/QUICKSTART.md](./backend/QUICKSTART.md) - Get started in 2 minutes
- [backend/PHASE1_COMPLETE.md](./backend/PHASE1_COMPLETE.md) - Phase 1 details

---

**Current Status:** Phase 1 complete ✅ - Backend is fully functional with JWT auth and all database models. Ready for Phase 2 implementation.
