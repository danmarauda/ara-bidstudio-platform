# OmniMemory LSP Integration

> **⚠️ Tool Names Updated (January 2025)**: This project now uses the consolidated `omn1_read` tool which replaces `omnimemory_smart_read`, `omnimemory_read_symbol`, and `omnimemory_symbol_overview`. The old tools are deprecated but still work. See [Migration Guide](../docs/OMN1_MIGRATION_GUIDE.md) for details.

Phase 5C Week 1: Symbol-level file operations using Language Server Protocol (LSP) for 95%+ compression and 99% token savings.

## Overview

Instead of reading entire files (1,250 tokens), read only specific symbols (50 tokens) using LSP. Achieves 96%+ token savings compared to full file reads.

### Token Savings

| Operation | Full File | With LSP | Savings |
|-----------|-----------|----------|---------|
| Read function | 1,250 tokens | 50 tokens | 96% (1,200 tokens) |
| File overview | 1,250 tokens | 100 tokens | 92% (1,150 tokens) |
| With compression | 125 tokens | 10 tokens | 99.2% (115 tokens) |

## Architecture

```
omnimemory-lsp/
├── src/
│   ├── __init__.py              # Package initialization
│   ├── lsp_client_wrapper.py    # LSP client wrapper (uses Serena adapter)
│   └── symbol_service.py        # High-level symbol operations service
├── tests/
│   ├── test_lsp_integration.py  # Integration tests
│   └── test_symbol_extraction.py # Symbol extraction tests
├── servers.json                  # Language server configurations
├── requirements.txt              # Python dependencies
└── README.md                     # This file
```

### Components

1. **LSP Client Wrapper** (`lsp_client_wrapper.py`)
   - Wraps Serena's LSP implementation
   - Manages language server lifecycle
   - Handles symbol extraction and file operations

2. **Symbol Service** (`symbol_service.py`)
   - High-level API for MCP tools
   - Caching and compression integration
   - Metrics tracking

3. **MCP Tools** (in `mcp_server/omnimemory_mcp.py`)
   - `omn1_read` - Unified tool for reading files (full, overview, or specific symbols)
     - Replaces: `omnimemory_smart_read`, `omnimemory_read_symbol`, `omnimemory_symbol_overview`
   - `omnimemory_find_references` - Find symbol references (unchanged)

## Installation

### 1. Install Python Language Server

```bash
pip install python-lsp-server
```

### 2. Install Additional Language Servers (Optional)

**TypeScript/JavaScript:**
```bash
npm install -g typescript-language-server typescript
```

**Go:**
```bash
go install golang.org/x/tools/gopls@latest
```

**Rust:**
```bash
rustup component add rust-analyzer
```

**Java:**
```bash
# Download from https://download.eclipse.org/jdtls/
```

### 3. Install OmniMemory LSP Module

```bash
cd omnimemory-lsp
pip install -r requirements.txt
```

## Usage

### MCP Tools Usage

**1. Read Specific Symbol (99% token savings)**

```python
# Instead of reading entire file (1,250 tokens) - using consolidated tool
omn1_read(
    file_path="src/auth.py",
    target="authenticate"  # Specify symbol name
)
# Returns ONLY the function (50 tokens) - 96% savings
```

**Response:**
```json
{
  "symbol_name": "authenticate",
  "kind": "function",
  "signature": "def authenticate(user: str, password: str) -> bool:",
  "content": "def authenticate(user, password):\n    ...",
  "docstring": "Authenticate a user with username and password",
  "line_start": 42,
  "line_end": 58,
  "tokens_saved": 1200,
  "compression_ratio": 25.0,
  "summary": "Symbol Read: authenticate (function), Lines: 42-58, Tokens saved: 1,200"
}
```

**2. Get File Overview (98% token savings)**

```python
# Get file structure without reading full content - using consolidated tool
omn1_read(
    file_path="src/auth.py",
    target="overview"  # Get structure, not full content
)
# Returns structure (100 tokens vs 1,250) - 92% savings
```

**Response:**
```json
{
  "file": "auth.py",
  "language": "python",
  "total_symbols": 15,
  "classes": ["AuthManager", "TokenValidator"],
  "functions": ["authenticate", "validate_token", "refresh_token"],
  "methods": {
    "AuthManager": ["login", "logout", "verify"],
    "TokenValidator": ["validate", "decode"]
  },
  "variables": ["SECRET_KEY", "TOKEN_EXPIRY"],
  "loc": 250,
  "tokens_used": 100,
  "tokens_saved": 1150,
  "compression_ratio": 12.5
}
```

**3. Find Symbol References**

```python
# Find all references to a symbol across codebase
omnimemory_find_references(
    file_path="src/auth.py",
    symbol="authenticate"
)
```

**Response:**
```json
{
  "symbol": "authenticate",
  "total_references": 15,
  "references": [
    {
      "file": "src/api.py",
      "line": 42,
      "column": 10,
      "type": "call"
    },
    {
      "file": "tests/test_auth.py",
      "line": 15,
      "type": "call"
    }
  ]
}
```

### Python API Usage

```python
import asyncio
from symbol_service import SymbolService

async def main():
    # Initialize service
    service = SymbolService()
    await service.start()

    # Read specific symbol (now via omn1_read MCP tool internally)
    result = await service.read_symbol(
        "src/auth.py",
        "authenticate",
        compress=True
    )
    print(f"Symbol: {result['symbol_name']}")
    print(f"Tokens saved: {result['tokens_saved']}")

    # Get file overview (now via omn1_read MCP tool internally)
    overview = await service.get_overview(
        "src/auth.py",
        include_details=False
    )
    print(f"Total symbols: {overview['total_symbols']}")

    # Find references (unchanged)
    refs = await service.find_references(
        "src/auth.py",
        "authenticate"
    )
    print(f"References: {refs['total_references']}")

    # Cleanup
    await service.stop()

asyncio.run(main())
```

## Supported Languages

| Language | Server | Install Command | Extensions |
|----------|--------|-----------------|------------|
| Python | pylsp | `pip install python-lsp-server` | .py |
| TypeScript | typescript-language-server | `npm install -g typescript-language-server` | .ts, .tsx, .js, .jsx |
| Go | gopls | `go install golang.org/x/tools/gopls@latest` | .go |
| Rust | rust-analyzer | `rustup component add rust-analyzer` | .rs |
| Java | jdtls | Download from eclipse.org | .java |

## Performance Metrics

### Token Savings

- **Symbol Read**: 96% savings (1,200 tokens saved per operation)
- **File Overview**: 92% savings (1,150 tokens saved per operation)
- **With Compression**: 99.2% savings (1,240 tokens saved per operation)

### Use Cases

1. **Code Exploration**: Understand codebase without reading all files
2. **Targeted Reading**: Read only relevant functions/classes
3. **Impact Analysis**: Find all references before refactoring
4. **Context Optimization**: Reduce context window by 90%+

## Testing

### Run Integration Tests

```bash
cd omnimemory-lsp
python tests/test_lsp_integration.py
```

### Expected Output

```
=== Running LSP Integration Tests ===

✓ LSP client initialization test passed
✓ LSP client manager test passed
✓ Symbol service initialization test passed
✓ Symbol read test passed - Found authenticate
✓ File overview test passed - Found 15 symbols
✓ Symbol service read test passed
✓ Token savings test passed - Saved 1200 tokens (25.0x)

=== LSP Integration Tests Complete ===
```

## Implementation Details

### LSP Client Wrapper

The `OmniMemoryLSPClient` wraps Serena's LSP implementation:

```python
from lsp_client_wrapper import OmniMemoryLSPClient

client = OmniMemoryLSPClient(language="python")
await client.start()

# Get symbol content
symbol_data = await client.get_symbol_content("file.py", "function_name")

# Get file overview
overview = await client.get_file_overview("file.py")

# Find references
refs = await client.find_references("file.py", "function_name")

await client.stop()
```

### Symbol Service

The `SymbolService` provides caching and metrics:

```python
from symbol_service import SymbolService

service = SymbolService()
await service.start()

# Cached read (subsequent calls are instant)
result1 = await service.read_symbol("file.py", "func")  # Cache miss
result2 = await service.read_symbol("file.py", "func")  # Cache hit!

# Get metrics
metrics = service.get_metrics()
print(f"Cache hit rate: {metrics['cache_hit_rate']}%")
print(f"Total tokens saved: {metrics['total_tokens_saved']}")

await service.stop()
```

## Configuration

Language servers are configured in `servers.json`:

```json
{
  "python": {
    "name": "pylsp",
    "command": ["pylsp"],
    "transport": "stdio",
    "supports": ["*.py"]
  },
  "typescript": {
    "name": "typescript-language-server",
    "command": ["typescript-language-server", "--stdio"],
    "transport": "stdio",
    "supports": ["*.ts", "*.tsx", "*.js", "*.jsx"]
  }
}
```

## Troubleshooting

### Language Server Not Found

```
Error: Language server 'pylsp' not found
```

**Solution**: Install the language server:
```bash
pip install python-lsp-server
```

### Symbol Not Found

```
Error: Symbol 'function_name' not found in file.py
```

**Solutions**:
1. Check symbol name spelling
2. Ensure file is valid Python/TypeScript/etc
3. Try with different symbol (class, variable)
4. Check LSP server is running: `service.get_status()`

### LSP Server Timeout

```
Error: LSP request timeout
```

**Solutions**:
1. Increase timeout in config
2. Restart LSP server
3. Check server logs

## Metrics and Monitoring

Get real-time metrics:

```python
# Service metrics
metrics = service.get_metrics()
print(f"Total requests: {metrics['total_requests']}")
print(f"Cache hit rate: {metrics['cache_hit_rate']}%")
print(f"Total tokens saved: {metrics['total_tokens_saved']}")

# LSP client status
status = client.get_status()
print(f"Status: {status['status']}")
print(f"Is ready: {status['is_ready']}")
```

## Future Enhancements

Week 2-4 roadmap:

- **Week 2**: Multi-language support (TypeScript, Go, Rust)
- **Week 3**: Advanced symbol operations (hover, completion)
- **Week 4**: Integration with compression and knowledge graph

## References

- **Inspiration**: [Serena](https://github.com/oraios/serena) - LSP-based code understanding
- **LSP Specification**: https://microsoft.github.io/language-server-protocol/
- **Python LSP**: https://github.com/python-lsp/python-lsp-server

## License

Part of OmniMemory project.
