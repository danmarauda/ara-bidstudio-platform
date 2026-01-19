"""
OmniMemory LSP Integration

Provides symbol-level file operations using Language Server Protocol (LSP)
for 95%+ compression and 99% token savings on targeted queries.

Key Features:
- Symbol-level code reading (functions, classes, methods)
- File structure overview (99% compression vs full file)
- Cross-reference tracking
- Multi-language support (Python, TypeScript, Go, Rust, Java)

Architecture:
- LSP Client Wrapper: Manages language server lifecycle
- Symbol Service: High-level symbol operations
- MCP Integration: Exposes tools via MCP protocol

Example Usage:
    # Read only a specific function (50 tokens vs 5,000)
    result = await omnimemory_read_symbol(
        file_path="auth.py",
        symbol="authenticate"
    )

    # Get file overview (100 tokens vs 5,000)
    overview = await omnimemory_symbol_overview(
        file_path="auth.py"
    )

Author: OmniMemory Team
Version: 1.0.0
"""

from .lsp_client_wrapper import OmniMemoryLSPClient, LSPClientManager
from .symbol_service import SymbolService

__version__ = "1.0.0"
__all__ = ["OmniMemoryLSPClient", "LSPClientManager", "SymbolService"]
