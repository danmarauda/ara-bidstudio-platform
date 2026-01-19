#!/bin/bash

# Omn1-ACE Status Script
# Check status of all services

echo "📊 Omn1-ACE Status"
echo "=================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running"
    echo "   Please start Docker Desktop"
    exit 1
fi

# Show service status
echo "🐳 Docker Services:"
docker-compose -f deploy/docker-compose.yml ps
echo ""

# Check service health
echo "🔍 Health Checks:"
echo ""

# API
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ API (http://localhost:8000)"
else
    echo "   ❌ API (not responding)"
fi

# Qdrant
if curl -s http://localhost:6333/health > /dev/null 2>&1; then
    echo "   ✅ Qdrant (http://localhost:6333)"
else
    echo "   ❌ Qdrant (not responding)"
fi

# Redis
if redis-cli -h localhost ping > /dev/null 2>&1; then
    echo "   ✅ Redis (localhost:6379)"
else
    echo "   ❌ Redis (not responding)"
fi

# PostgreSQL
if docker-compose -f deploy/docker-compose.yml exec -T postgres pg_isready -U omn1 > /dev/null 2>&1; then
    echo "   ✅ PostgreSQL (localhost:5432)"
else
    echo "   ❌ PostgreSQL (not responding)"
fi

echo ""
