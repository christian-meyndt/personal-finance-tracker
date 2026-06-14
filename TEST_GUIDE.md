# Testing Guide - Personal Finance Tracker

Complete guide to test your application.

## Prerequisites

Make sure you have:
- Python 3.11+ installed
- Node.js 18+ installed
- Backend running on port 8000
- Frontend running on port 3000

---

## Test 1: Backend API (5 minutes)

### Step 1.1: Start Backend

```bash
cd "/Users/christianmeyndt/AI Projects/personal-finance-tracker/backend"
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Expected output:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 1.2: Test Health Check

Open browser: http://localhost:8000/health

Expected:
```json
{"status": "healthy"}
```

### Step 1.3: View API Documentation

Open browser: http://localhost:8000/docs

You should see:
- ✅ Swagger UI interface
- ✅ 15+ endpoints listed
- ✅ Can try endpoints interactively

### Step 1.4: Test Login (Swagger UI)

1. In Swagger UI, find **POST /api/v1/auth/login**
2. Click "Try it out"
3. Enter:
   - username: `admin`
   - password: `admin123`
4. Click "Execute"

Expected response:
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

### Step 1.5: Test Protected Endpoint

1. Copy the `access_token` from previous step
2. Click "Authorize" button at top of Swagger UI
3. Enter: `Bearer <your-token>`
4. Find **GET /api/v1/auth/me**
5. Click "Try it out" → "Execute"

Expected response:
```json
{
  "id": 1,
  "username": "admin"
}
```

### Step 1.6: Test Categories

In Swagger UI:
1. Find **GET /api/v1/categories**
2. Click "Try it out" → "Execute"

Expected: List of 11 categories:
```json
[
  {"id": 1, "name": "Groceries", "icon": "🛒", "color": "#4CAF50"},
  {"id": 2, "name": "Restaurants", "icon": "🍽️", ...},
  ...
]
```

### Step 1.7: Test Rules

In Swagger UI:
1. Find **GET /api/v1/rules**
2. Click "Try it out" → "Execute"

Expected: List of 17 categorization rules (REWE, EDEKA, Amazon, etc.)

---

## Test 2: Backend via Command Line (Alternative)

If you prefer testing with `curl`:

```bash
# Health check
curl http://localhost:8000/health

# Login
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"

# Get token and test /me
TOKEN=$(curl -s -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123" | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

curl "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer $TOKEN"

# Test categories
curl "http://localhost:8000/api/v1/categories" \
  -H "Authorization: Bearer $TOKEN"

# Run automated test suite
cd backend
./test_api.sh
```

---

## Test 3: Frontend (Next.js)

### Step 3.1: Start Frontend

Open a **new terminal** (keep backend running):

```bash
cd "/Users/christianmeyndt/AI Projects/personal-finance-tracker/frontend"

# First time only:
npm install

# Start dev server:
npm run dev
```

Expected output:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Ready in X.Xs
```

### Step 3.2: Open Login Page

Open browser: http://localhost:3000

Expected:
- ✅ Redirects to http://localhost:3000/login (because not authenticated)
- ✅ See login form with:
  - "Sign in" title
  - "Personal Finance Tracker" subtitle
  - Email field
  - Password field
  - "Sign in" button

### Step 3.3: Test Login

In the login form:
1. **Email:** `admin`
2. **Password:** `admin123`
3. Click **"Sign in"**

Expected:
- ✅ Button shows "Signing in..." briefly
- ✅ Redirects to http://localhost:3000/
- ✅ Shows dashboard with:
  - "Personal Finance Tracker" header
  - "Sign out" button
  - Card showing:
    - Username: admin
    - User ID: 1
  - Message: "Phase 1 complete! Backend with 15 API endpoints ready..."

### Step 3.4: Test Logout

1. Click **"Sign out"** button

Expected:
- ✅ Redirects back to http://localhost:3000/login
- ✅ Cookie cleared
- ✅ Can't access http://localhost:3000/ (redirects to /login)

### Step 3.5: Test Auth Protection

1. While logged out, try to visit: http://localhost:3000/

Expected:
- ✅ Automatically redirects to http://localhost:3000/login
- ✅ Can't view dashboard without authentication

---

## Test 4: Database

### Step 4.1: Check Database Created

```bash
cd "/Users/christianmeyndt/AI Projects/personal-finance-tracker/backend"
ls -lh finance.db
```

Expected:
- ✅ File exists
- ✅ Size > 0 bytes

### Step 4.2: Inspect Database

```bash
cd "/Users/christianmeyndt/AI Projects/personal-finance-tracker/backend"
source venv/bin/activate
sqlite3 finance.db "SELECT name FROM sqlite_master WHERE type='table';"
```

Expected tables:
```
alembic_version
users
accounts
categories
transactions
budgets
category_rules
```

### Step 4.3: Check Seed Data

```bash
sqlite3 finance.db "SELECT COUNT(*) FROM categories;"
# Should show: 11

sqlite3 finance.db "SELECT COUNT(*) FROM category_rules;"
# Should show: 17

sqlite3 finance.db "SELECT username FROM users;"
# Should show: admin
```

---

## Test 5: End-to-End Flow

Complete workflow test:

1. ✅ **Backend starts** (port 8000)
2. ✅ **Frontend starts** (port 3000)
3. ✅ **Open browser** → http://localhost:3000
4. ✅ **Redirects to login** (not authenticated)
5. ✅ **Login** with admin/admin123
6. ✅ **See dashboard** with username
7. ✅ **Sign out** → back to login
8. ✅ **Try to access dashboard** → redirected to login

---

## Troubleshooting

### Backend won't start

```bash
# Check if port 8000 is in use
lsof -i :8000

# Kill existing process
pkill -f "uvicorn app.main:app"

# Remove old database and recreate
rm finance.db
alembic upgrade head

# Restart
uvicorn app.main:app --reload --port 8000
```

### Frontend won't start

```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill existing process
pkill -f "next dev"

# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Restart
npm run dev
```

### Login fails

**Check backend logs** - should show:
```
INFO:app.init_db:Admin user created successfully
```

**Test backend directly:**
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login/json" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

Should return token.

### Frontend can't reach backend

Check `frontend/next.config.mjs`:
```javascript
const backend = process.env.BACKEND_URL ?? "http://localhost:8000";
```

Make sure backend is actually running on port 8000.

---

## Success Checklist

- [ ] Backend starts without errors
- [ ] http://localhost:8000/health returns `{"status": "healthy"}`
- [ ] http://localhost:8000/docs shows Swagger UI
- [ ] Can login via Swagger UI (admin/admin123)
- [ ] GET /api/v1/categories returns 11 categories
- [ ] GET /api/v1/rules returns 17 rules
- [ ] Frontend starts without errors
- [ ] http://localhost:3000 redirects to /login
- [ ] Can login with admin/admin123
- [ ] Dashboard shows username and user ID
- [ ] Sign out button works
- [ ] Auth protection works (can't access / when logged out)

**All checked?** ✅ Phase 1 is working perfectly!

---

## What's Working

- ✅ **6 database models** (User, Account, Transaction, Category, Budget, CategoryRule)
- ✅ **15 API endpoints** (auth, accounts, transactions, categories, budgets, rules)
- ✅ **JWT authentication** (cookies for frontend, Bearer tokens for API)
- ✅ **Seed data** (11 categories, 17 rules)
- ✅ **Next.js frontend** with login/logout
- ✅ **Auth middleware** protecting routes
- ✅ **Complete documentation**

## Next Steps

After testing, you can:
1. **Start Phase 2** - CSV import, PayPal sync, AI categorization
2. **Build frontend pages** - Transactions list, budget dashboard, etc.
3. **Add more features** to the existing endpoints

Happy testing! 🚀
