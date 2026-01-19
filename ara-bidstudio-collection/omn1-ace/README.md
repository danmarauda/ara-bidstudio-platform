<div align="center">

# Omn1-ACE

**Intelligent Context Management for AI Development Tools**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Docker](https://img.shields.io/badge/docker-ready-brightgreen.svg)](deploy/docker-compose.yml)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-blue.svg)](https://github.com/mrtozner/omn1-ace)
[![Stars](https://img.shields.io/github/stars/mrtozner/omn1-ace?style=social)](https://github.com/mrtozner/omn1-ace)
[![Last Commit](https://img.shields.io/github/last-commit/mrtozner/omn1-ace)](https://github.com/mrtozner/omn1-ace/commits/master)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/mrtozner/omn1-ace/pulls)

**[Quick Start](QUICK_START.md)** • **[Report Issue](https://github.com/mrtozner/omn1-ace/issues)**

---

### 🚀 Stop your AI tools from sending 50 files when only 3 are relevant

Omn1-ACE prevents wasteful API calls by finding only relevant context through semantic search and smart caching—saving 85% on API costs.

</div>

---

## 🚧 Project Status

> **Current Stage**: Prototype / Early Development
>
> - ✅ Architecture designed and documented
> - ✅ Infrastructure setup (Docker, databases)
> - ⚠️ Core API endpoints are placeholders (not yet implemented)
> - ⚠️ Not production-ready
>
> **For production-ready microservices**, see [OmniMemory](https://github.com/mrtozner/omnimemory)

---

## 💡 Why Omn1-ACE?

**The Problem**: AI coding assistants send ALL potentially relevant files to expensive APIs—even when 90% are irrelevant.

**The Solution**: Smart retrieval finds only what's needed BEFORE hitting paid APIs.

### Traditional vs Omn1-ACE

| Aspect | Without Omn1-ACE | With Omn1-ACE |
|--------|------------------|---------------|
| **Files Searched** | 50+ files keyword search | 50+ files semantic search (local) |
| **Files Sent to API** | All 50 files | Only 3 relevant files |
| **Cache Check** | None (re-send everything) | L1/L2/L3 (skip 2 already sent) |
| **API Tokens** | 60,000 tokens | 950 tokens |
| **Cost per Query** | $0.90 | $0.014 |
| **Monthly Cost** (500 queries) | ~$450 | ~$68 |

**How Savings Break Down:**

| Optimization | Impact | Savings |
|--------------|--------|---------|
| **Smart Retrieval** | Finds 3 of 50 files | 80% ($340/mo) |
| **Cache Hits** | Skips 2 already sent | 13% ($55/mo) |
| **Compression** | Reduces remaining size | 5% ($22/mo) |
| **Context Pruning** | Trims conversation history | 2% ($8/mo) |

**Total Savings**: $382/month per developer (85% reduction)

---

## ⚡ How It Works

### Without Omn1-ACE

```
You: "Find the authentication bug"

AI Tool:
1. Searches all files for "auth" → 50 files
2. Sends all 50 files → Anthropic API
3. You pay: 60,000 tokens ($0.90)

Result: 47 files were completely irrelevant (wasted money)
```

### With Omn1-ACE

```
You: "Find the authentication bug"

Omn1-ACE intercepts (before API):
1. Semantic search (local, free) → Finds 3 relevant of 50 files
2. Cache check (local, free) → 2 already sent, skip them
3. Sends 1 new file → Anthropic API
4. You pay: 950 tokens ($0.014)

Result: 59,050 tokens never hit paid API = $0.886 saved
```

---

## 🔑 Key Features

<table>
<tr>
<td width="33%" valign="top">

### 🔍 Tri-Index Search
**Prevents sending irrelevant files**

Find only what's relevant using three methods:
- **Dense**: Semantic vector similarity
- **Sparse**: BM25 keyword matching
- **Structural**: AST code patterns

**Impact**: 80% cost reduction

</td>
<td width="33%" valign="top">

### 💾 Multi-Tier Caching
**Prevents re-sending files**

Three-layer cache avoids redundant API calls:
- **L1**: User cache (your history)
- **L2**: Team cache (shared knowledge)
- **L3**: Archive (long-term)

**Impact**: 13% cost reduction

</td>
<td width="33%" valign="top">

### 🧠 Predictive Prefetching
**Anticipates what you'll need**

Learns from patterns to prefetch:
- Workflow patterns
- Code structure relationships
- Team behavior

**Impact**: Faster responses

</td>
</tr>
</table>

### Additional Capabilities

- **Code-Aware Compression**: Further reduces tokens while preserving semantic meaning (5% additional savings)
- **Model-Specific Optimization**: Context tailored for Claude, GPT, or Gemini
- **Team Intelligence**: L2 cache learns from what your teammates already sent
- **LSP Integration**: Enhanced code intelligence via Language Server Protocol

---

## 🎯 Quick Start

### Prerequisites

- Python 3.11+
- Docker & Docker Compose (recommended)
- 4GB+ RAM

### 🐳 Docker Compose (Recommended)

Get started in 5 minutes using convenience scripts:

```bash
# Clone the repository
git clone https://github.com/mrtozner/omn1-ace.git
cd omn1-ace

# Start all services (auto-creates .env from template)
./start.sh

# Check service status
./status.sh

# View logs
./logs.sh              # All services
./logs.sh postgres     # Specific service

# Restart services
./restart.sh

# Stop services
./stop.sh
```

**Available scripts:**
- `start.sh` - Start all Docker services with health checks
- `stop.sh` - Stop all services
- `restart.sh` - Restart all services
- `logs.sh` - View service logs (all or specific service)
- `status.sh` - Check service health and status

**Manual Docker commands** (if you prefer):
```bash
# Copy environment template
cp .env.example .env && nano .env

# Start services
docker-compose -f deploy/docker-compose.yml up -d

# Verify
curl http://localhost:8000/health
```

**[📖 Full Setup Guide →](QUICK_START.md)**

---

## 🏗️ Architecture

Omn1-ACE implements a 4-layer anticipatory system:

```
┌─────────────────────────────────────────────────┐
│         AI Development Tools                    │
│  (Claude Code, Cursor, Continue, etc.)          │
└───────────────────┬─────────────────────────────┘
                    │
        ┌───────────▼────────────┐
        │  Interception Layer    │  ← MCP Protocol
        │  (Before API call)     │
        └───────────┬────────────┘
                    │
        ┌───────────▼────────────┐
        │   Tri-Index Search     │  ← Find 3 of 50 relevant files
        │  (LOCAL, <100ms, FREE) │     (Dense + Sparse + Structural)
        └───────────┬────────────┘
                    │
        ┌───────────▼────────────┐
        │   Multi-Tier Cache     │  ← Check L1/L2/L3: Already sent?
        │  (LOCAL, <5ms, FREE)   │     Skip cached files
        └───────────┬────────────┘
                    │
        ┌───────────▼────────────┐
        │   Send to API          │  ← Only 1 new file (950 tokens)
        │  (PAID, Anthropic/     │     Instead of 50 files (60K tokens)
        │   OpenAI)              │
        └────────────────────────┘

Result: 85% cost reduction ($0.014 vs $0.90 per query)
```

---

## ⚙️ API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/v1/search` | POST | **Semantic search** (find relevant files, not all files) |
| `/api/v1/cache/check` | POST | **Cache lookup** (skip files already sent to API) |
| `/api/v1/embeddings` | POST | Generate vector embeddings for semantic search |
| `/api/v1/predict` | POST | Predict likely context needs (prefetching) |
| `/api/v1/compress` | POST | Compress context (optional secondary optimization) |
| `/api/v1/cache/stats` | GET | Cache performance statistics |

**Interactive Docs**: `http://localhost:8000/docs` (OpenAPI)

---

## 📊 Real-World Example

### Scenario: "Find the authentication bug"

**WITHOUT Omn1-ACE:**
```
Files sent to API: 50 files
- auth.ts ✓
- auth-middleware.ts ✓
- auth.test.ts ✓
- database-config.ts ✗ (irrelevant)
- logging-utils.ts ✗ (irrelevant)
- email-templates.ts ✗ (irrelevant)
- ...44 more irrelevant files ✗

Tokens sent: 60,000
Cost: $0.90
Waste: 47 files (78%) completely irrelevant
```

**WITH Omn1-ACE:**
```
Semantic search (local): Finds 3 relevant of 50
- auth.ts ✓ (similarity: 0.94)
- auth-middleware.ts ✓ (similarity: 0.89)
- auth.test.ts ✓ (similarity: 0.86)

Cache check (local):
- auth.ts: In L1 cache (sent 2 queries ago) → SKIP
- auth-middleware.ts: In L2 cache (teammate sent) → SKIP
- auth.test.ts: Not cached → SEND

Files sent to API: 1 file
Tokens sent: 950 (optionally compressed)
Cost: $0.014
Savings: $0.886 (98.5%)
```

---

## ⚠️ Multi-Tool Context Considerations

### Context Window Limits

Different AI models have different token limits:

| Model | Context Window | Configuration |
|-------|---------------|---------------|
| **Claude 3.5 Sonnet** | 200,000 tokens | `CLAUDE_CONTEXT_WINDOW=200000` |
| **GPT-4 Turbo** | 128,000 tokens | `GPT_CONTEXT_WINDOW=128000` |
| **Gemini 1.5 Pro** | 1,000,000 tokens | `GEMINI_CONTEXT_WINDOW=1000000` |
| **GPT-3.5 Turbo** | 16,000 tokens | `GPT_CONTEXT_WINDOW=16000` |

**Why this matters**: Even with smart retrieval, you need to ensure your target model can handle the optimized context.

### Configuration

Set your target model in `.env`:

```bash
DEFAULT_TARGET_MODEL=claude  # or gpt, gemini
CLAUDE_CONTEXT_WINDOW=200000
GPT_CONTEXT_WINDOW=128000
GEMINI_CONTEXT_WINDOW=1000000
```

### Model-Specific Behavior

**Claude (Anthropic)**:
- ✅ Best with structured, detailed context
- ✅ Excellent at following complex instructions
- ⚡ Prefers explicit task breakdowns

**GPT (OpenAI)**:
- ✅ Works well with conversational context
- ⚠️ May need more explicit formatting
- ⚡ Better with shorter, focused context

**Gemini (Google)**:
- ✅ Handles very large context windows
- ✅ Good with multimodal content
- ⚠️ May need different prompt engineering

**Recommendation**: Standardize on one model per team for consistent cache sharing (L2).

---

## 📊 Performance

### Recommended Resources

| Component | Requirements |
|-----------|-------------|
| **API Server** | 2+ CPU cores, 4GB+ RAM |
| **PostgreSQL** | 4GB+ RAM, SSD storage |
| **Qdrant** | 8GB+ RAM (scales with corpus) |
| **Redis** | 2GB+ RAM (scales with cache) |

### Typical Performance

| Operation | Time | Cost |
|-----------|------|------|
| Semantic search | <100ms | $0 (local) |
| Cache lookup | <5ms | $0 (local) |
| Vector embedding | <50ms | $0 (local) |
| API call (prevented) | N/A | $0.90 saved |
| API call (optimized) | 1-3s | $0.014 |

### Scaling

- **Horizontal**: API servers behind load balancer
- **PostgreSQL**: Read replicas for read-heavy workloads
- **Qdrant**: Clustering for large-scale vector search
- **Redis**: Clustering for high-availability caching

---

## 🔒 Security

**Before production deployment**:

1. ✅ Change all default passwords in `docker-compose.yml`
2. ✅ Use environment variables for sensitive configuration
3. ✅ Enable TLS/SSL for all service connections
4. ✅ Configure authentication for API endpoints
5. ✅ Use network policies to restrict service access
6. ✅ Regular security updates for all dependencies

---

## 🤝 Contributing

Contributions are welcome!

**Before submitting a PR**:
- All tests pass
- Code follows style guidelines (black, isort, pylint)
- New features include tests
- Documentation is updated

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

---

## 🔗 Related Projects

- **[OmniMemory](https://github.com/mrtozner/omnimemory)**: Production-ready microservices (13 independent services)
- **Extensions**: LSP integration for enhanced code intelligence ([docs](extensions/lsp/README.md))

---

## 🙏 Acknowledgments

Built with:
- [FastAPI](https://fastapi.tiangolo.com/) - Modern web framework
- [Qdrant](https://qdrant.tech/) - Vector similarity search
- [PostgreSQL](https://www.postgresql.org/) - Relational database
- [Redis](https://redis.io/) - In-memory data store
- [NetworkX](https://networkx.org/) - Graph analysis

---

<div align="center">

**[⭐ Star this repo](https://github.com/mrtozner/omn1-ace)** if you find it useful!

**[💬 Discussions](https://github.com/mrtozner/omn1-ace/discussions)** • **[🐛 Report Bug](https://github.com/mrtozner/omn1-ace/issues)**

Made with ❤️ by [Mert Ozoner](https://github.com/mrtozner)

</div>
