#!/bin/bash

# Omn1-ACE Stop Script
# Stops all Docker services

set -e

echo "🛑 Stopping Omn1-ACE..."
echo ""

docker-compose -f deploy/docker-compose.yml down

echo ""
echo "✅ All services stopped!"
echo ""
echo "💡 To remove volumes (data will be lost):"
echo "   docker-compose -f deploy/docker-compose.yml down -v"
echo ""
