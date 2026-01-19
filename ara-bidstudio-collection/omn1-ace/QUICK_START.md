# Quick Start Guide

Get Omn1-ACE running in 5 minutes.

## Prerequisites

- Docker and Docker Compose installed
- Python 3.11+ (for local development)
- 4GB RAM minimum

## Installation

### Step 1: Clone and Configure

```bash
git clone https://github.com/mrtozner/omn1-ace.git
cd omn1-ace

# Copy environment template
cp .env.example .env

# ⚠️ IMPORTANT: Edit .env and change POSTGRES_PASSWORD
nano .env  # or use your favorite editor
```

### Step 2: Start Services

```bash
# Start all services (PostgreSQL, Redis, Qdrant, API)
docker-compose -f deploy/docker-compose.yml up -d

# Wait for services to be ready (~30 seconds)
sleep 30
```

### Step 3: Verify Installation

```bash
# Check all services are healthy
curl http://localhost:8000/health

# Expected: {"status": "healthy"}
```

## ⚠️ Current Limitations

**IMPORTANT**: Omn1-ACE is currently in **prototype stage**. Core API endpoints return mock data:

- ❌ `/v1/embed` - Not yet implemented
- ❌ `/v1/search` - Not yet implemented
- ❌ `/v1/predict` - Not yet implemented

See [README.md](README.md) for full feature status and roadmap.

## Troubleshooting

**Services won't start?**
```bash
# Check Docker logs
docker-compose -f deploy/docker-compose.yml logs

# Check ports aren't in use
lsof -i :5432,6379,6333,8000
```

**Database connection errors?**
```bash
# Verify PostgreSQL is running
docker-compose -f deploy/docker-compose.yml ps postgres

# Check your DATABASE_URL in .env matches postgres service
```

## Next Steps

1. Read the [Architecture documentation](docs/ARCHITECTURE.md)
2. Check the [API documentation](README.md#api-endpoints)
3. See [Contributing](CONTRIBUTING.md) to help implement features
