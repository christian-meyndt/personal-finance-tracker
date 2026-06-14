#!/bin/bash
# Start the Next.js frontend

cd "$(dirname "$0")/frontend"

echo "🎨 Starting Personal Finance Tracker Frontend..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "✅ Frontend ready!"
echo ""
echo "Starting Next.js at http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop"
echo ""

npm run dev
