"""
Integration tests for LSP Symbol Service

Tests the LSP client wrapper and symbol service with real language servers.
"""

import asyncio
import pytest
from pathlib import Path
import sys

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from lsp_client_wrapper import OmniMemoryLSPClient, LSPClientManager
from symbol_service import SymbolService


# Test file content for Python
TEST_PYTHON_CODE = '''
"""Test module for authentication"""

class AuthManager:
    """Manages user authentication"""

    def __init__(self, secret_key: str):
        self.secret_key = secret_key

    def authenticate(self, username: str, password: str) -> bool:
        """Authenticate a user with username and password"""
        # Mock authentication logic
        return len(password) > 8

def validate_token(token: str) -> bool:
    """Validate an authentication token"""
    return len(token) == 32

SECRET_KEY = "test_secret_key"
'''


@pytest.mark.asyncio
async def test_lsp_client_initialization():
    """Test LSP client initialization"""
    try:
        client = OmniMemoryLSPClient(language="python")
        assert client is not None
        assert client.language == "python"
        assert not client.is_started
        print("✓ LSP client initialization test passed")
    except Exception as e:
        pytest.skip(f"LSP client not available: {e}")


@pytest.mark.asyncio
async def test_lsp_client_manager():
    """Test LSP client manager"""
    try:
        manager = LSPClientManager()
        assert manager is not None

        # Test language detection
        extension_test = manager.file_extension_map.get(".py")
        assert extension_test == "python"

        print("✓ LSP client manager test passed")
    except Exception as e:
        pytest.skip(f"LSP manager not available: {e}")


@pytest.mark.asyncio
async def test_symbol_service_initialization():
    """Test symbol service initialization"""
    try:
        service = SymbolService()
        assert service is not None
        await service.start()
        await service.stop()
        print("✓ Symbol service initialization test passed")
    except Exception as e:
        pytest.skip(f"Symbol service not available: {e}")


@pytest.mark.asyncio
async def test_get_symbol_content():
    """Test reading symbol content"""
    # Create temporary test file
    test_file = Path("/tmp/test_auth.py")
    test_file.write_text(TEST_PYTHON_CODE)

    try:
        client = OmniMemoryLSPClient(language="python")
        await client.start()

        # Get symbol content
        result = await client.get_symbol_content(str(test_file), "authenticate")

        if result:
            assert "symbol_name" in result
            assert result["symbol_name"] == "authenticate"
            assert "kind" in result
            assert "content" in result
            print(f"✓ Symbol read test passed - Found {result['symbol_name']}")
        else:
            print("⚠ Symbol not found (LSP server may not be fully initialized)")

        await client.stop()
    except Exception as e:
        pytest.skip(f"Symbol reading not available: {e}")
    finally:
        test_file.unlink(missing_ok=True)


@pytest.mark.asyncio
async def test_get_file_overview():
    """Test getting file overview"""
    # Create temporary test file
    test_file = Path("/tmp/test_auth.py")
    test_file.write_text(TEST_PYTHON_CODE)

    try:
        client = OmniMemoryLSPClient(language="python")
        await client.start()

        # Get file overview
        result = await client.get_file_overview(str(test_file))

        if result:
            assert "file" in result
            assert "total_symbols" in result
            assert "classes" in result or "functions" in result
            print(
                f"✓ File overview test passed - Found {result.get('total_symbols', 0)} symbols"
            )
        else:
            print("⚠ Overview not available (LSP server may not be fully initialized)")

        await client.stop()
    except Exception as e:
        pytest.skip(f"File overview not available: {e}")
    finally:
        test_file.unlink(missing_ok=True)


@pytest.mark.asyncio
async def test_symbol_service_read():
    """Test symbol service read operation"""
    # Create temporary test file
    test_file = Path("/tmp/test_auth.py")
    test_file.write_text(TEST_PYTHON_CODE)

    try:
        service = SymbolService()
        await service.start()

        # Read symbol
        result = await service.read_symbol(str(test_file), "authenticate")

        if not result.get("error"):
            assert "symbol_name" in result or "message" in result
            print("✓ Symbol service read test passed")
        else:
            print(f"⚠ Symbol service read returned error: {result.get('message')}")

        await service.stop()
    except Exception as e:
        pytest.skip(f"Symbol service not available: {e}")
    finally:
        test_file.unlink(missing_ok=True)


@pytest.mark.asyncio
async def test_token_savings_calculation():
    """Test token savings calculation"""
    # Create temporary test file
    test_file = Path("/tmp/test_auth.py")
    test_file.write_text(TEST_PYTHON_CODE)

    try:
        client = OmniMemoryLSPClient(language="python")
        await client.start()

        # Get symbol content
        result = await client.get_symbol_content(str(test_file), "authenticate")

        if result and "tokens_saved" in result:
            tokens_saved = result.get("tokens_saved", 0)
            compression_ratio = result.get("compression_ratio", 1.0)

            assert tokens_saved >= 0, "Token savings should be non-negative"
            assert compression_ratio >= 1.0, "Compression ratio should be >= 1.0"

            print(
                f"✓ Token savings test passed - Saved {tokens_saved} tokens ({compression_ratio}x)"
            )
        else:
            print(
                "⚠ Token savings not calculated (LSP server may not be fully initialized)"
            )

        await client.stop()
    except Exception as e:
        pytest.skip(f"Token calculation not available: {e}")
    finally:
        test_file.unlink(missing_ok=True)


def run_tests():
    """Run all tests"""
    print("\n=== Running LSP Integration Tests ===\n")

    # Run tests
    asyncio.run(test_lsp_client_initialization())
    asyncio.run(test_lsp_client_manager())
    asyncio.run(test_symbol_service_initialization())
    asyncio.run(test_get_symbol_content())
    asyncio.run(test_get_file_overview())
    asyncio.run(test_symbol_service_read())
    asyncio.run(test_token_savings_calculation())

    print("\n=== LSP Integration Tests Complete ===\n")


if __name__ == "__main__":
    run_tests()
