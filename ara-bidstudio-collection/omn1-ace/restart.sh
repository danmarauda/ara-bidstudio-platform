#!/bin/bash

# Omn1-ACE Restart Script
# Restarts all Docker services

set -e

echo "🔄 Restarting Omn1-ACE..."
echo ""

./stop.sh
sleep 2
./start.sh
