#!/bin/bash

# Smart Booking Tashkent - Deployment Script
# Usage: ./scripts/deploy.sh [environment]
# Example: ./scripts/deploy.sh production

set -e

ENVIRONMENT=${1:-production}
PROJECT_DIR=$(dirname "$(dirname "$(readlink -f "$0")")")

echo "🚀 Deploying Smart Booking Tashkent..."
echo "📁 Project directory: $PROJECT_DIR"
echo "🌍 Environment: $ENVIRONMENT"

cd "$PROJECT_DIR"

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env with your configuration before proceeding."
    exit 1
fi

# Pull latest changes if in git repo
if [ -d .git ]; then
    echo "📥 Pulling latest changes..."
    git pull origin main 2>/dev/null || echo "Not a git repo or no remote, skipping pull"
fi

# Build and start containers
echo "🐳 Building Docker containers..."
docker-compose build --no-cache

echo "🏃 Starting containers..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose exec -T backend npm run migrate || true

# Seed database if in development
if [ "$ENVIRONMENT" = "development" ]; then
    echo "🌱 Seeding database..."
    docker-compose exec -T backend npm run seed || true
fi

# Health check
echo "🏥 Checking service health..."
curl -sf http://localhost:5000/api/health > /dev/null && echo "✅ Backend is healthy" || echo "❌ Backend health check failed"
curl -sf http://localhost:3000/health > /dev/null && echo "✅ Frontend is healthy" || echo "❌ Frontend health check failed"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 Backend API: http://localhost:5000/api"
echo "📊 Health check: http://localhost:5000/api/health"
echo ""
echo "📋 Useful commands:"
echo "  View logs:     docker-compose logs -f"
echo "  Stop services: docker-compose down"
echo "  Restart:       docker-compose restart"
