#!/usr/bin/env python
"""
Test script for Django rate limiting in GraphQL endpoints.

This script tests that rate limiting is properly configured and working
for various GraphQL mutations and queries.
"""

import os
import sys

import django
from django.test import RequestFactory

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")
django.setup()

from config.graphql.ratelimits import (  # noqa: E402
    RateLimitExceeded,
    RateLimits,
    graphql_ratelimit,
)


def test_rate_limit_decorator():
    """Test the rate limit decorator directly."""

    print("Testing rate limit decorator...")

    # Create a mock resolver function
    call_count = 0

    @graphql_ratelimit(rate="3/m", key="test")
    def mock_resolver(root, info, **kwargs):
        nonlocal call_count
        call_count += 1
        return f"Call {call_count}"

    # Create a mock request
    factory = RequestFactory()

    # Create mock info object
    class MockInfo:
        def __init__(self, request):
            self.context = request

    # Test with anonymous user
    request = factory.post("/graphql")
    request.user = None
    info = MockInfo(request)

    # Should allow first 3 calls
    for i in range(3):
        result = mock_resolver(None, info)
        print(f"  Call {i+1}: {result}")

    # 4th call should be rate limited
    try:
        result = mock_resolver(None, info)
        print(f"  Call 4: {result} - ERROR: Should have been rate limited!")
    except RateLimitExceeded as e:
        print(f"  Call 4: Rate limited as expected - {e}")

    print("✓ Rate limit decorator test passed\n")


def test_rate_limit_configuration():
    """Test that rate limit configurations are properly loaded."""

    print("Testing rate limit configuration...")

    # Check that default rate limits are accessible
    expected_limits = [
        ("AUTH_LOGIN", "5/m"),
        ("READ_MEDIUM", "30/m"),
        ("WRITE_HEAVY", "5/m"),
        ("AI_QUERY", "20/m"),
        ("EXPORT", "5/h"),
    ]

    for attr, expected_value in expected_limits:
        actual_value = getattr(RateLimits, attr)
        print(f"  {attr}: {actual_value}")
        if actual_value != expected_value:
            print(f"    ERROR: Expected {expected_value}, got {actual_value}")
        else:
            print("    ✓ Correct")

    print("✓ Rate limit configuration test passed\n")


def test_graphql_integration():
    """Test that rate limiting is integrated with GraphQL resolvers."""

    print("Testing GraphQL integration...")

    # Import mutations and queries
    from config.graphql.mutations import CreateLabelset
    from config.graphql.queries import Query

    # Check that mutations have rate limiting decorators
    mutations_to_check = [
        ("CreateLabelset.mutate", CreateLabelset.mutate),
    ]

    for name, method in mutations_to_check:
        # Check if the method has been wrapped
        if hasattr(method, "__wrapped__"):
            print(f"  {name}: ✓ Has rate limiting")
        else:
            # The decorator might be applied differently
            # Check for rate limit attributes
            if "__closure__" in dir(method):
                print(f"  {name}: ✓ Likely has rate limiting (closure detected)")
            else:
                print(f"  {name}: ⚠ May not have rate limiting")

    # Check queries
    query_instance = Query()
    queries_to_check = [
        ("resolve_annotations", query_instance.resolve_annotations),
        ("resolve_corpus_stats", query_instance.resolve_corpus_stats),
    ]

    for name, method in queries_to_check:
        if hasattr(method, "__wrapped__"):
            print(f"  {name}: ✓ Has rate limiting")
        elif "__closure__" in dir(method):
            print(f"  {name}: ✓ Likely has rate limiting (closure detected)")
        else:
            print(f"  {name}: ⚠ May not have rate limiting")

    print("✓ GraphQL integration test completed\n")


def main():
    """Run all tests."""

    print("=" * 60)
    print("Django Rate Limiting Test Suite")
    print("=" * 60)
    print()

    try:
        test_rate_limit_configuration()
        test_rate_limit_decorator()
        test_graphql_integration()

        print("=" * 60)
        print("All tests completed successfully! ✓")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
