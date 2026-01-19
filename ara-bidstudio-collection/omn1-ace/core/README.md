# Core Services

These are battle-tested services copied from omni-memory (proven in production).

## Services

### embeddings/
MLX-based embedding service (port 8000)
- 768-dimensional vectors
- Local model support (Ollama, E5, BGE)
- Async generation
- Production-ready

### compression/
VisionDrop compression service (port 8001)
- 94.4% token reduction
- 91% quality retention
- Content-type aware (code, JSON, logs, markdown)
- Multi-tier strategies (JECQ, VisionDrop, CompresSAE)

### knowledge_graph/
NetworkX graph service
- File relationship tracking
- Multi-strategy prediction (80%+ accuracy)
- Import resolution
- Workflow pattern learning

### tri_index/
Hybrid search (Dense + Sparse + Structural)
- Qdrant vector search (semantic)
- BM25 keyword search
- AST facts (structural)
- RRF fusion + cross-encoder reranking

### cache/
3-tier Redis cache
- L1: User session (hot, 1hr TTL)
- L2: Team repository (warm, 7 day TTL, 80-90% savings)
- L3: Workflow (cold, 30 day TTL)
- LZ4 compression (85% reduction)
- Hash-based storage (40-60% memory savings)

## Status

All services proven in production. Copying in progress.
