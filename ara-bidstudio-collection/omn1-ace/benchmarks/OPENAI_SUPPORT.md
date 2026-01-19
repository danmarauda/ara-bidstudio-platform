# OpenAI/GPT-4 Support for LOCOMO Benchmark

## Summary

The LOCOMO adapter now supports both OpenAI (GPT-4) and Claude for running benchmarks.

## Changes Made

### 1. Added OpenAI Answer Method (`locomo_adapter.py`)

- New method: `answer_with_openai()` (lines 205-256)
- Uses OpenAI's `gpt-4o` model
- Matches Claude's prompt structure for fair comparison
- Temperature set to 0.0 for deterministic results

### 2. Updated run_benchmark Method

- Added `provider` parameter (default: "openai")
- Provider selection logic (lines 367-377)
- Supports both "openai" and "claude" providers

### 3. Updated CLI

- New `--provider` flag (choices: openai, claude)
- Updated help text to mention both API key types
- Default provider: OpenAI

### 4. Updated Shell Script (`run_locomo.sh`)

- Third parameter for provider selection
- Conditional dependency checking (OpenAI or Anthropic)
- Updated usage examples

## Usage

### Direct Python Usage

```bash
# With OpenAI (default)
python3 locomo_adapter.py \
  --api-key "sk-..." \
  --provider openai \
  --max-conversations 2

# With Claude
python3 locomo_adapter.py \
  --api-key "sk-ant-..." \
  --provider claude \
  --max-conversations 2
```

### Shell Script Usage

```bash
# Quick test with OpenAI
./run_locomo.sh test "sk-..." openai

# Quick test with Claude
./run_locomo.sh test "sk-ant-..." claude

# Full benchmark with OpenAI
./run_locomo.sh full "sk-..." openai
```

## Testing the Implementation

### 1. Verify OpenAI Library

```bash
python3 -c "from openai import OpenAI; print('OpenAI library OK')"
```

### 2. Test Help Message

```bash
python3 benchmarks/locomo_adapter.py --help
```

Should show:
```
--provider {openai,claude}
                        LLM provider to use (default: openai)
```

### 3. Run Quick Test (if you have OpenAI API key)

```bash
cd /Users/mertozoner/Documents/claude-idea-discussion/omni-memory/benchmarks
python3 locomo_adapter.py \
  --api-key "YOUR_OPENAI_API_KEY" \
  --provider openai \
  --max-conversations 1 \
  --dataset /Users/mertozoner/Documents/claude-idea-discussion/omni-memory/locomo/data/locomo10.json
```

## Implementation Details

### OpenAI Method Structure

```python
async def answer_with_openai(
    self,
    question: str,
    context: str,
    api_key: str,
    category: int = 1
) -> str:
```

**Key features:**
- Uses `gpt-4o` (latest GPT-4 model)
- System message: "You are a helpful assistant..."
- Max tokens: 100 (same as Claude)
- Temperature: 0.0 (deterministic)
- Handles temporal questions (category 2) with date hints

### Provider Selection Logic

```python
# In run_benchmark()
if provider == "openai":
    predicted_answer = await self.answer_with_openai(...)
elif provider == "claude":
    predicted_answer = await self.answer_with_claude(...)
else:
    raise ValueError(f"Unknown provider: {provider}")
```

## Dependencies

### OpenAI Setup

```bash
pip3 install openai
```

### Claude Setup (existing)

```bash
pip3 install anthropic
```

## Files Modified

1. `/Users/mertozoner/Documents/claude-idea-discussion/omni-memory/benchmarks/locomo_adapter.py`
   - Added `from __future__ import annotations` for Python 3.8 compatibility
   - Added `answer_with_openai()` method
   - Updated `run_benchmark()` signature and logic
   - Updated CLI parser

2. `/Users/mertozoner/Documents/claude-idea-discussion/omni-memory/benchmarks/run_locomo.sh`
   - Added provider parameter
   - Updated usage examples
   - Conditional dependency checks
   - Updated command building

## Verification Checklist

- [x] OpenAI library imports successfully
- [x] Help message shows provider option
- [x] Provider defaults to OpenAI
- [x] Python 3.8 compatibility (future annotations)
- [x] Shell script updated
- [x] Error handling in place

## Next Steps

To actually run the benchmark with OpenAI:

1. Ensure OmniMemory services are running:
   ```bash
   ./omnimemory_launcher.sh
   ```

2. Verify LOCOMO dataset exists:
   ```bash
   ls /Users/mertozoner/Documents/claude-idea-discussion/omni-memory/locomo/data/locomo10.json
   ```

3. Run quick test:
   ```bash
   ./run_locomo.sh test "YOUR_OPENAI_API_KEY" openai
   ```

## Cost Estimates

**Quick Test (2 conversations, ~20 questions):**
- OpenAI GPT-4o: ~$0.50-1.00
- Claude Sonnet 3.5: ~$1.00-2.00

**Full Benchmark (10 conversations, ~100 questions):**
- OpenAI GPT-4o: ~$2.50-5.00
- Claude Sonnet 3.5: ~$5.00-10.00

(Actual costs depend on conversation length and context retrieved)
