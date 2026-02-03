#!/bin/bash

# Smart Booking Tashkent - Local Development Script
# Usage: ./scripts/dev.sh

set -e

PROJECT_DIR=$(dirname "$(dirname "$(readlink -f "$0")")")

echo "🛠️  Starting Smart Booking Tashkent in development mode..."

cd "$PROJECT_DIR"

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd "$PROJECT_DIR/backend"
npm install

# Run migrations and seed
echo "🗄️  Setting up database..."
npm run migrate
npm run seed 2>/dev/null || echo "Database already seeded or seed failed"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd "$PROJECT_DIR/frontend"
npm install --legacy-peer-deps

# Start both services
echo ""
echo "🚀 Starting development servers..."
echo ""

# Use concurrently if available, otherwise use background processes
if command -v npx &> /dev/null; then
    cd "$PROJECT_DIR"
    npx concurrently \
        --names "backend,frontend" \
        --prefix-colors "blue,green" \
        "cd backend && npm run dev" \
        "cd frontend && npm run dev"
else
    echo "Starting backend..."
    cd "$PROJECT_DIR/backend" && npm run dev &
    BACKEND_PID=$!

    echo "Starting frontend..."
    cd "$PROJECT_DIR/frontend" && npm run dev &
    FRONTEND_PID=$!

    echo ""
    echo "✅ Development servers started!"
    echo "🔌 Backend: http://localhost:5000"
    echo "🌐 Frontend: http://localhost:3000"
    echo ""
    echo "Press Ctrl+C to stop all servers"

    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
    wait
fi
