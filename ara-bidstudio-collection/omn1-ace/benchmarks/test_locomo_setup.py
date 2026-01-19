#!/usr/bin/env python3
"""
Quick validation script to test LOCOMO adapter setup.

Tests:
1. OmniMemory services are accessible
2. LOCOMO dataset is readable
3. Adapter can store and retrieve data
4. Claude API is accessible (if key provided)

Usage:
    python3 test_locomo_setup.py [--api-key YOUR_KEY]
"""

import sys
import json
import asyncio
import argparse
from pathlib import Path
import requests

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))


def test_services():
    """Test OmniMemory services are running."""
    print("Testing OmniMemory services...")

    # Test embeddings service
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("  ✓ Embeddings service: OK")
        else:
            print(f"  ✗ Embeddings service returned: {response.status_code}")
            return False
    except Exception as e:
        print(f"  ✗ Embeddings service not accessible: {e}")
        return False

    # Test metrics service
    try:
        response = requests.get("http://localhost:8003/health", timeout=5)
        if response.status_code == 200:
            print("  ✓ Metrics service: OK")
        else:
            print(f"  ✗ Metrics service returned: {response.status_code}")
            return False
    except Exception as e:
        print(f"  ✗ Metrics service not accessible: {e}")
        return False

    return True


def test_dataset():
    """Test LOCOMO dataset is accessible."""
    print("\nTesting LOCOMO dataset...")

    dataset_path = Path(__file__).parent.parent / "locomo" / "data" / "locomo10.json"

    if not dataset_path.exists():
        print(f"  ✗ Dataset not found at: {dataset_path}")
        return False

    try:
        with open(dataset_path) as f:
            data = json.load(f)

        print(f"  ✓ Dataset loaded: {len(data)} conversations")

        # Check structure
        if len(data) > 0:
            sample = data[0]
            if "qa" in sample and "conversation" in sample:
                num_questions = len(sample["qa"])
                print(
                    f"  ✓ Dataset structure valid (e.g., {num_questions} questions in first conversation)"
                )
            else:
                print("  ✗ Dataset structure invalid")
                return False
    except Exception as e:
        print(f"  ✗ Error loading dataset: {e}")
        return False

    return True


async def test_adapter_storage():
    """Test adapter can store data."""
    print("\nTesting adapter storage...")

    try:
        # Test storing a simple turn
        response = requests.post(
            "http://localhost:8000/store",
            json={
                "content": "Alice: Hello, how are you today?",
                "metadata": {
                    "session": 1,
                    "date": "2023-01-01",
                    "speaker": "Alice",
                    "session_id": "test_session",
                },
            },
            timeout=10,
        )

        if response.status_code == 200:
            print("  ✓ Storage test: OK")
            return True
        else:
            print(f"  ✗ Storage test failed: {response.status_code}")
            print(f"    Response: {response.text}")
            return False
    except Exception as e:
        print(f"  ✗ Storage test error: {e}")
        return False


async def test_adapter_search():
    """Test adapter can search data."""
    print("\nTesting adapter search...")

    try:
        # Search for the stored turn
        response = requests.post(
            "http://localhost:8000/search",
            json={"query": "greeting hello", "limit": 5, "session_id": "test_session"},
            timeout=10,
        )

        if response.status_code == 200:
            results = response.json()
            if "results" in results:
                print(f"  ✓ Search test: OK (found {len(results['results'])} results)")
                return True
            else:
                print("  ✗ Search test: No results field")
                return False
        else:
            print(f"  ✗ Search test failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"  ✗ Search test error: {e}")
        return False


async def test_claude_api(api_key: str):
    """Test Claude API is accessible."""
    print("\nTesting Claude API...")

    if not api_key:
        print("  ⊘ Skipped (no API key provided)")
        return True

    try:
        from anthropic import Anthropic

        client = Anthropic(api_key=api_key)

        # Simple test message
        message = client.messages.create(
            max_tokens=50,
            messages=[{"role": "user", "content": "Say 'test successful' in 2 words"}],
            model="claude-3-5-sonnet-20241022",
        )

        response = message.content[0].text.strip()
        print(f"  ✓ Claude API: OK (response: '{response}')")
        return True
    except Exception as e:
        print(f"  ✗ Claude API error: {e}")
        return False


async def main():
    """Run all tests."""
    parser = argparse.ArgumentParser(description="Test LOCOMO setup")
    parser.add_argument("--api-key", type=str, help="Anthropic API key (optional)")
    args = parser.parse_args()

    print("=" * 60)
    print("LOCOMO Setup Validation")
    print("=" * 60)

    results = []

    # Test services
    results.append(("Services", test_services()))

    # Test dataset
    results.append(("Dataset", test_dataset()))

    # Test adapter storage
    results.append(("Storage", await test_adapter_storage()))

    # Test adapter search
    results.append(("Search", await test_adapter_search()))

    # Test Claude API (if key provided)
    results.append(("Claude API", await test_claude_api(args.api_key)))

    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"  {status}: {name}")

    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        print("\n✅ All tests passed! Ready to run LOCOMO benchmark.")
        print("\nNext steps:")
        print("  1. Quick test: ./run_locomo.sh test YOUR_API_KEY")
        print("  2. Full benchmark: ./run_locomo.sh full YOUR_API_KEY")
        return 0
    else:
        print("\n❌ Some tests failed. Please fix issues before running benchmark.")
        return 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
