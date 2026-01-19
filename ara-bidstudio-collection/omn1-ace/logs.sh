#!/bin/bash

# Omn1-ACE Logs Script
# View logs from Docker services

# Check if a service name was provided
if [ -n "$1" ]; then
    echo "📋 Showing logs for: $1"
    echo "   (Press Ctrl+C to exit)"
    echo ""
    docker-compose -f deploy/docker-compose.yml logs -f "$1"
else
    echo "📋 Showing logs for all services"
    echo "   (Press Ctrl+C to exit)"
    echo ""
    echo "💡 To view logs for a specific service:"
    echo "   ./logs.sh <service>    # api, postgres, qdrant, redis"
    echo ""
    docker-compose -f deploy/docker-compose.yml logs -f
fi
