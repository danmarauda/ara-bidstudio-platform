# Deployment

## Quick Start (Local Development)

```bash
# Start all services
cd deploy
docker-compose up -d

# Check health
curl http://localhost:8000/health

# Initialize database
docker-compose exec postgres psql -U omn1 -d omn1_ace -f /docker-entrypoint-initdb.d/schema.sql
```

## Services

- **API**: http://localhost:8000
- **PostgreSQL**: localhost:5432
- **Qdrant**: http://localhost:6333
- **Redis**: localhost:6379

## Environment Variables

Create `.env` file:
```
DATABASE_URL=postgresql://omn1:omn1_dev_password@localhost:5432/omn1_ace
REDIS_URL=redis://localhost:6379
QDRANT_URL=http://localhost:6333
ENVIRONMENT=development
```
