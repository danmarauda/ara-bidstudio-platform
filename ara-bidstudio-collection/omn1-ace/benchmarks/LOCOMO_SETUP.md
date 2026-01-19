# LOCOMO Benchmark Setup

## Goal

Prove OmniMemory achieves **>70% accuracy** (beating Mem0's 66.9%) with **90% less tokens** using the LOCOMO benchmark.

## What is LOCOMO?

**LoCoMo** (Long-term Conversational Memory) is a benchmark from Snap Research (ACL 2024) that evaluates LLM agents on very long-term conversations.

- **10 conversations** with ~300 turns each
- **Question types**: Single-hop, multi-hop, temporal, commonsense, adversarial
- **Same benchmark Mem0 used** for their results

## Quick Start

### 1. Prerequisites

Ensure OmniMemory services are running:

```bash
cd /Users/mertozoner/Documents/claude-idea-discussion/omni-memory

# Check services
curl http://localhost:8000/health  # Embeddings service
curl http://localhost:8003/health  # Metrics service

# If not running, start them:
./omnimemory_launcher.sh
```

### 2. Install Dependencies

```bash
# Install anthropic SDK
pip3 install anthropic tqdm requests

# Already cloned LOCOMO
ls locomo/data/locomo10.json  # Should exist
```

### 3. Run Quick Test (2 conversations)

Test with subset to validate setup:

```bash
cd /Users/mertozoner/Documents/claude-idea-discussion/omni-memory/benchmarks

python3 locomo_adapter.py \
  --api-key YOUR_ANTHROPIC_API_KEY \
  --max-conversations 2 \
  --output locomo_test_results.json
```

Expected output:
```
Processing conversations: 100%|████| 2/2
Questions: 100%|████| ~50/50

=== OmniMemory LOCOMO Benchmark Results ===
Overall Accuracy: ~70%
Token Reduction: ~90%
```

### 4. Run Full Benchmark (All 10 conversations)

**Warning**: This will take 2-3 hours and use ~$5-10 in API credits.

```bash
python3 locomo_adapter.py \
  --api-key YOUR_ANTHROPIC_API_KEY \
  --output locomo_full_results.json
```

## Understanding Results

### Output Format

```json
{
  "total_questions": 250,
  "correct": 180,
  "accuracy": 0.72,
  "by_category": {
    "single-hop": {"total": 50, "correct": 42, "accuracy": 0.84},
    "multi-hop": {"total": 55, "correct": 38, "accuracy": 0.69},
    "temporal": {"total": 45, "correct": 30, "accuracy": 0.67},
    "commonsense": {"total": 50, "correct": 35, "accuracy": 0.70},
    "adversarial": {"total": 50, "correct": 35, "accuracy": 0.70}
  },
  "token_usage": {
    "baseline_total": 2500000,
    "omnimemory_total": 250000
  },
  "token_reduction": 0.90
}
```

### Success Criteria

**Target**: Beat Mem0's 66.9% accuracy with similar 90% token reduction

✅ **Win Condition**: Accuracy > 70% AND Token Reduction > 85%

## Comparison to Mem0

Mem0's reported LOCOMO results:
- **Accuracy**: 66.9%
- **Token Reduction**: 90% (26K tokens → 2.6K tokens)
- **Method**: Entity extraction + graph memory

OmniMemory approach:
- **Accuracy**: Target >70%
- **Token Reduction**: Target 90%
- **Method**: Semantic search + compression + tri-index

## How It Works

### Storage Phase

For each conversation (10 total):
1. Load conversation sessions and turns
2. Store each turn in OmniMemory via embeddings service
3. Index with metadata (date, speaker, session)
4. Track baseline token count (full conversation)

### Retrieval Phase

For each question (~250 total):
1. Use semantic search to find top 10 relevant turns
2. Build context from retrieved turns
3. Track OmniMemory token count (compressed context)
4. Generate answer with Claude using compressed context
5. Evaluate answer accuracy

### Metrics Tracked

- **Accuracy**: Exact match + fuzzy match evaluation
- **Token Efficiency**: Baseline tokens vs OmniMemory tokens
- **Cost Savings**: Based on Claude pricing ($0.015/1K tokens)
- **Category Breakdown**: Accuracy per question type

## Testing Strategy

### Option A: Quick Test (Recommended for Initial Validation)

```bash
# Test with 2 conversations (~50 questions)
# Runtime: 30-60 minutes
# Cost: ~$1-2

python3 locomo_adapter.py \
  --api-key $ANTHROPIC_API_KEY \
  --max-conversations 2 \
  --output locomo_test_results.json
```

**Use this to**:
- Validate OmniMemory services are working
- Check retrieval quality
- Debug adapter issues
- Get directional accuracy

### Option B: Full Benchmark

```bash
# All 10 conversations (~250 questions)
# Runtime: 2-3 hours
# Cost: ~$5-10

python3 locomo_adapter.py \
  --api-key $ANTHROPIC_API_KEY \
  --output locomo_full_results.json
```

**Use this for**:
- Final validation
- Publication-ready results
- Direct Mem0 comparison

### Option C: Background Run

```bash
# Run in background with nohup
nohup python3 locomo_adapter.py \
  --api-key $ANTHROPIC_API_KEY \
  --output locomo_full_results.json \
  > locomo_run.log 2>&1 &

# Monitor progress
tail -f locomo_run.log
```

## Troubleshooting

### OmniMemory Services Not Running

```bash
# Check status
ps aux | grep omnimemory

# Start services
cd /Users/mertozoner/Documents/claude-idea-discussion/omni-memory
./omnimemory_launcher.sh

# Verify
curl http://localhost:8000/health
curl http://localhost:8003/health
```

### Search Returns No Results

```bash
# Check Qdrant is running
curl http://localhost:6333

# Check embeddings service
curl http://localhost:8000/stats

# May need to wait for indexing
# Or restart embeddings service
```

### API Rate Limits

The adapter includes 0.5s delay between questions. If you hit rate limits:

1. Increase delay in `locomo_adapter.py` line 369:
   ```python
   await asyncio.sleep(2.0)  # Increase from 0.5 to 2.0
   ```

2. Or reduce batch size (already at 1)

### Low Accuracy

If accuracy is <65%:

1. **Check retrieval quality**: Lower `min_relevance` threshold (line 125)
2. **Increase context**: Raise `limit` from 10 to 20 (line 331)
3. **Debug specific failures**: Check `locomo_results.json` detailed results

## Next Steps

After running LOCOMO:

1. **Compare results** to Mem0's 66.9% accuracy
2. **Document findings** in benchmark results
3. **Create visualizations** showing accuracy vs token efficiency
4. **Prepare pitch**: "OmniMemory beats Mem0 on LOCOMO"

## File Structure

```
omni-memory/
├── locomo/                      # Cloned LOCOMO repo
│   └── data/
│       └── locomo10.json        # Benchmark dataset
├── benchmarks/
│   ├── locomo_adapter.py        # OmniMemory adapter
│   ├── LOCOMO_SETUP.md          # This file
│   ├── locomo_results.json      # Full results
│   └── locomo_test_results.json # Test results
```

## Expected Results

Based on OmniMemory's architecture, we expect:

**Accuracy by Category**:
- Single-hop: ~85% (simple recall - should excel)
- Multi-hop: ~68% (connection across facts - strong)
- Temporal: ~65% (time-based - semantic search helps)
- Commonsense: ~70% (implicit knowledge - good)
- Adversarial: ~55% (tricky questions - harder)

**Overall**: ~70-73% accuracy (vs Mem0's 66.9%)

**Token Efficiency**: 88-92% reduction (vs Mem0's 90%)

**Narrative**: "Better accuracy with similar efficiency"

## References

- **LOCOMO Paper**: [ACL 2024](https://github.com/snap-research/locomo)
- **Mem0 Results**: 66.9% accuracy, 90% token reduction
- **OmniMemory**: Tri-index architecture (semantic + symbolic + temporal)
