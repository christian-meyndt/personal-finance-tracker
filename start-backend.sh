#!/bin/bash
# Start the FastAPI backend

cd "$(dirname "$0")/backend"

echo "🚀 Starting Personal Finance Tracker Backend..."
echo ""

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Creating one..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Check if database exists
if [ ! -f "finance.db" ]; then
    echo "📦 Database not found. Creating and seeding..."
    alembic upgrade head
fi

echo "✅ Backend ready!"
echo ""
echo "Starting server at http://localhost:8000"
echo "API docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop"
echo ""

uvicorn app.main:app --reload --port 8000
