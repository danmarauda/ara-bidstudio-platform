#!/bin/bash

# LOCOMO Benchmark Runner Script
# Usage: ./run_locomo.sh [test|full] [YOUR_API_KEY] [openai|claude]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${GREEN}=== LOCOMO Benchmark Runner ===${NC}"
echo

# Parse arguments
MODE="${1:-test}"
API_KEY="${2:-}"
PROVIDER="${3:-openai}"

if [ -z "$API_KEY" ]; then
    echo -e "${RED}Error: API key required${NC}"
    echo "Usage: ./run_locomo.sh [test|full] YOUR_API_KEY [openai|claude]"
    echo
    echo "Examples:"
    echo "  ./run_locomo.sh test sk-xxx openai        # Quick test with OpenAI (2 conversations)"
    echo "  ./run_locomo.sh test sk-ant-xxx claude    # Quick test with Claude (2 conversations)"
    echo "  ./run_locomo.sh full sk-xxx openai        # Full benchmark with OpenAI (10 conversations)"
    exit 1
fi

# Validate provider
if [ "$PROVIDER" != "openai" ] && [ "$PROVIDER" != "claude" ]; then
    echo -e "${RED}Error: Invalid provider '$PROVIDER'${NC}"
    echo "Provider must be 'openai' or 'claude'"
    exit 1
fi

echo "Provider: $PROVIDER"

# Verify OmniMemory services
echo -e "${YELLOW}Checking OmniMemory services...${NC}"

if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${RED}Error: Embeddings service not running on port 8000${NC}"
    echo "Start it with: cd $PROJECT_ROOT && ./omnimemory_launcher.sh"
    exit 1
fi
echo -e "${GREEN}✓ Embeddings service running${NC}"

if ! curl -s http://localhost:8003/health > /dev/null 2>&1; then
    echo -e "${RED}Error: Metrics service not running on port 8003${NC}"
    echo "Start it with: cd $PROJECT_ROOT && ./omnimemory_launcher.sh"
    exit 1
fi
echo -e "${GREEN}✓ Metrics service running${NC}"

# Check Qdrant
if ! curl -s http://localhost:6333 > /dev/null 2>&1; then
    echo -e "${YELLOW}Warning: Qdrant may not be running on port 6333${NC}"
    echo "This may affect semantic search quality"
fi

# Check dataset exists
DATASET_PATH="$PROJECT_ROOT/locomo/data/locomo10.json"
if [ ! -f "$DATASET_PATH" ]; then
    echo -e "${RED}Error: LOCOMO dataset not found at $DATASET_PATH${NC}"
    echo "Clone it with: cd $PROJECT_ROOT && git clone https://github.com/snap-research/locomo"
    exit 1
fi
echo -e "${GREEN}✓ LOCOMO dataset found${NC}"

# Check dependencies
echo
echo -e "${YELLOW}Checking Python dependencies...${NC}"

if [ "$PROVIDER" == "claude" ]; then
    if ! python3 -c "import anthropic" 2>/dev/null; then
        echo -e "${RED}Error: anthropic package not installed${NC}"
        echo "Install it with: pip3 install anthropic"
        exit 1
    fi
    echo -e "${GREEN}✓ anthropic package installed${NC}"
elif [ "$PROVIDER" == "openai" ]; then
    if ! python3 -c "import openai" 2>/dev/null; then
        echo -e "${RED}Error: openai package not installed${NC}"
        echo "Install it with: pip3 install openai"
        exit 1
    fi
    echo -e "${GREEN}✓ openai package installed${NC}"
fi

if ! python3 -c "import tqdm" 2>/dev/null; then
    echo -e "${RED}Error: tqdm package not installed${NC}"
    echo "Install it with: pip3 install tqdm"
    exit 1
fi
echo -e "${GREEN}✓ tqdm package installed${NC}"

if ! python3 -c "import requests" 2>/dev/null; then
    echo -e "${RED}Error: requests package not installed${NC}"
    echo "Install it with: pip3 install requests"
    exit 1
fi
echo -e "${GREEN}✓ requests package installed${NC}"

# Set output path and max conversations based on mode
if [ "$MODE" == "test" ]; then
    OUTPUT_PATH="$SCRIPT_DIR/locomo_test_results.json"
    MAX_CONVERSATIONS="2"
    echo
    echo -e "${GREEN}Running QUICK TEST mode (2 conversations)${NC}"
    echo "Estimated time: 30-60 minutes"
    echo "Estimated cost: ~\$1-2"
elif [ "$MODE" == "full" ]; then
    OUTPUT_PATH="$SCRIPT_DIR/locomo_full_results.json"
    MAX_CONVERSATIONS=""
    echo
    echo -e "${YELLOW}Running FULL BENCHMARK mode (10 conversations)${NC}"
    echo "Estimated time: 2-3 hours"
    echo "Estimated cost: ~\$5-10"
    echo
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
else
    echo -e "${RED}Error: Invalid mode '$MODE'${NC}"
    echo "Use: test or full"
    exit 1
fi

echo
echo -e "${GREEN}Starting benchmark...${NC}"
echo "Dataset: $DATASET_PATH"
echo "Output: $OUTPUT_PATH"
echo "API Key: ${API_KEY:0:10}...${API_KEY: -4}"
echo

# Build command
CMD="python3 $SCRIPT_DIR/locomo_adapter.py \
  --dataset $DATASET_PATH \
  --api-key $API_KEY \
  --provider $PROVIDER \
  --output $OUTPUT_PATH"

if [ -n "$MAX_CONVERSATIONS" ]; then
    CMD="$CMD --max-conversations $MAX_CONVERSATIONS"
fi

# Run benchmark
echo "Running: $CMD"
echo
eval $CMD

# Check if successful
if [ $? -eq 0 ]; then
    echo
    echo -e "${GREEN}=== Benchmark Complete! ===${NC}"
    echo "Results saved to: $OUTPUT_PATH"
    echo
    echo "View results:"
    echo "  cat $OUTPUT_PATH | jq '.accuracy, .token_reduction'"
    echo
else
    echo
    echo -e "${RED}Benchmark failed!${NC}"
    echo "Check the error messages above."
    exit 1
fi
