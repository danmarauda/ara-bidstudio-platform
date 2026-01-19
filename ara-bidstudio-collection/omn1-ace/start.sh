#!/bin/bash

# Omn1-ACE Startup Script
# Starts all services with Docker Compose

set -e

echo "🚀 Starting Omn1-ACE..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo "⚠️  IMPORTANT: Edit .env and change POSTGRES_PASSWORD before production use!"
    echo ""
fi

# Start services
echo "📦 Starting Docker services..."
docker-compose -f deploy/docker-compose.yml up -d

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check service health
echo ""
echo "🔍 Checking service status..."
docker-compose -f deploy/docker-compose.yml ps

echo ""
echo "✅ Omn1-ACE is running!"
echo ""
echo "📊 Service URLs:"
echo "   • API:        http://localhost:8000"
echo "   • API Docs:   http://localhost:8000/docs"
echo "   • PostgreSQL: localhost:5432"
echo "   • Qdrant:     http://localhost:6333"
echo "   • Redis:      localhost:6379"
echo ""
echo "📝 Useful commands:"
echo "   • View logs:    ./logs.sh"
echo "   • Stop:         ./stop.sh"
echo "   • Restart:      ./restart.sh"
echo "   • Status:       ./status.sh"
echo ""
echo "🔧 Health check:"
curl -s http://localhost:8000/health 2>/dev/null && echo "   ✅ API is healthy" || echo "   ⚠️  API not ready yet (wait 30s and try: curl http://localhost:8000/health)"
echo ""
