# Omn1-ACE Architecture

## The 4-Layer Anticipatory System

### Layer 1: PREDICTION ENGINE
- Multi-strategy prediction (85% accuracy)
- Knowledge graph traversal
- Workflow pattern matching
- Team cooccurrence analysis
- Background prefetching

### Layer 2: EMBEDDING-FIRST STORAGE
- Store embeddings, not text (93% storage reduction)
- Qdrant vector DB (production-grade)
- Tri-index: Dense + Sparse + Structural
- 3-tier cache: L1 (user) + L2 (team) + L3 (archive)

### Layer 3: DYNAMIC CONTEXT GENERATION
- Use target MODEL to generate its own optimal context
- Claude generates Claude-optimized summaries
- GPT generates GPT-optimized summaries
- Gemini generates Gemini-optimized summaries
- Same embedding → Different optimal outputs per model

### Layer 4: COLLECTIVE INTELLIGENCE
- Team L2 cache sharing (80-90% savings)
- Cross-user pattern learning
- Network effects (more users = smarter system)
- Aggregate team workflows

## Technical Stack

### Core Services (Proven from omni-memory):
- Embeddings: MLX service (port 8000)
- Compression: VisionDrop (94.4% reduction)
- Knowledge Graph: NetworkX + PostgreSQL
- Tri-Index: Qdrant + BM25 + Facts
- Cache: Redis 3-tier

### New Components (Omn1-ACE):
- Anticipation Engine: Multi-strategy predictor
- Context Generator: Dynamic model-specific generation
- Collective Learning: Team pattern aggregation
- REST API: FastAPI with auth
- Billing: Stripe integration
