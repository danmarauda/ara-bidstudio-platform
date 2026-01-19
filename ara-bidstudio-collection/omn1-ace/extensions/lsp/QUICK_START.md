# OmniMemory LSP Quick Start Guide

> **⚠️ Tool Names Updated (January 2025)**: This guide now uses the new consolidated `omn1_read` tool which replaces `omnimemory_smart_read`, `omnimemory_read_symbol`, and `omnimemory_symbol_overview`. The old tools are deprecated but still work. See [Migration Guide](../docs/OMN1_MIGRATION_GUIDE.md) for details.

Get started with symbol-level file operations in 5 minutes!

## Installation (1 minute)

```bash
# Install Python language server
pip install python-lsp-server

# That's it! You're ready to go.
```

## Basic Usage (MCP Tools)

### 1. Read a Specific Function (96% token savings)

Instead of reading an entire 5KB file (1,250 tokens), read just the function you need (50 tokens):

```python
omn1_read(
    file_path="/absolute/path/to/auth.py",
    target="authenticate"  # Specify the symbol name
)
```

**Returns**:
```json
{
  "symbol_name": "authenticate",
  "kind": "function",
  "content": "def authenticate(user, password):\n    ...",
  "line_start": 42,
  "line_end": 58,
  "tokens_saved": 1200,
  "summary": "Symbol Read: authenticate (function), Lines: 42-58, Tokens saved: 1,200 (25.0x compression)"
}
```

### 2. Get File Overview (92% token savings)

See what's in a file without reading it all (100 tokens vs 1,250):

```python
omn1_read(
    file_path="/absolute/path/to/models.py",
    target="overview"  # Get file structure without full content
)
```

**Returns**:
```json
{
  "file": "models.py",
  "total_symbols": 15,
  "classes": ["User", "Product", "Order"],
  "functions": ["validate_user", "create_order"],
  "methods": {
    "User": ["login", "logout"],
    "Product": ["get_price", "apply_discount"]
  },
  "tokens_saved": 1150,
  "summary": "File Overview: models.py, Total symbols: 15, Classes: 3, Functions: 2, LOC: 250, Tokens saved: 1,150 (12.5x compression)"
}
```

### 3. Find All References to a Symbol

Find everywhere a function/class is used:

```python
omnimemory_find_references(
    file_path="/absolute/path/to/auth.py",
    symbol="authenticate"
)
```

**Returns**:
```json
{
  "symbol": "authenticate",
  "total_references": 15,
  "references": [
    {"file": "api.py", "line": 42, "type": "call"},
    {"file": "test_auth.py", "line": 15, "type": "call"}
  ],
  "summary": "References Found: authenticate, Total references: 15, Files: 8"
}
```

## Use Cases

### Use Case 1: "I need to understand this function"

**Problem**: Reading entire file wastes tokens on irrelevant code
**Solution**: Read only the function

```python
# Bad: Read entire file (1,250 tokens)
Read(file="/project/auth.py")

# Good: Read just the function (50 tokens) using consolidated tool
omn1_read(
    file_path="/project/auth.py",
    target="authenticate"  # Symbol name as target
)
# Saves 1,200 tokens (96%)
```

### Use Case 2: "What's in this file?"

**Problem**: Need file structure, not full content
**Solution**: Get overview

```python
# Bad: Read entire file to see structure (1,250 tokens)
Read(file="/project/models.py")

# Good: Get structured overview (100 tokens) using consolidated tool
omn1_read(
    file_path="/project/models.py",
    target="overview"  # Get structure, not full content
)
# Saves 1,150 tokens (92%)
```

### Use Case 3: "Where is this function used?"

**Problem**: Manual grep doesn't show precise locations
**Solution**: Use LSP references

```python
# Bad: Manual grep
Bash(command="grep -r 'authenticate' src/")

# Good: LSP references with precise locations
omnimemory_find_references(
    file_path="/project/auth.py",
    symbol="authenticate"
)
# Returns exact file:line:column for each usage
```

## Common Patterns

### Pattern 1: Explore → Focus → Read

```python
# Step 1: Get file overview (100 tokens) - using consolidated tool
overview = omn1_read(file_path="auth.py", target="overview")
# See: 3 classes, 5 functions

# Step 2: Read specific function (50 tokens) - using consolidated tool
func = omn1_read(file_path="auth.py", target="authenticate")
# Get full function code

# Total: 150 tokens vs 2,500 tokens (94% savings)
```

### Pattern 2: Impact Analysis

```python
# Step 1: Read function to understand (50 tokens) - using consolidated tool
func = omn1_read(file_path="auth.py", target="authenticate")

# Step 2: Find all callers (minimal tokens)
refs = omnimemory_find_references(file_path="auth.py", symbol="authenticate")

# Step 3: Read caller functions if needed - using consolidated tool
for ref in refs["references"][:3]:  # Top 3 callers
    caller = omn1_read(
        file_path=ref["file_path"],
        target=extract_function_at_line(ref["line"])
    )

# Total: ~200 tokens vs 5,000+ tokens (96% savings)
```

### Pattern 3: Codebase Exploration

```python
# Get overviews of multiple files (100 tokens each) - using consolidated tool
files = ["auth.py", "models.py", "api.py", "utils.py"]

for file in files:
    overview = omn1_read(file_path=f"src/{file}", target="overview")
    # See structure of entire codebase

# Total: 400 tokens vs 5,000 tokens (92% savings)
```

## Troubleshooting

### Error: "LSP Symbol Service not available"

**Solution**: Install Python language server
```bash
pip install python-lsp-server
```

### Error: "Symbol 'xyz' not found in file"

**Possible causes**:
1. Typo in symbol name → Check spelling
2. Symbol is in different file → Use overview to find it
3. Symbol is private/nested → Try parent symbol

**Solution**:
```python
# Step 1: Get file overview to see all symbols - using consolidated tool
overview = omn1_read(file_path="auth.py", target="overview")
print(overview["functions"])  # List all available functions

# Step 2: Use exact name from overview - using consolidated tool
symbol = omn1_read(
    file_path="auth.py",
    target="authenticate"  # Exact name from overview
)
```

### Error: "Unsupported file type"

**Supported**: .py, .js, .ts, .tsx, .jsx, .go, .rs, .java

**Week 1 Tested**: .py only (others configured, testing in Week 2)

## Tips & Best Practices

### Tip 1: Always Use Absolute Paths

```python
# Bad: Relative path
omn1_read(file_path="auth.py", target="authenticate")

# Good: Absolute path - using consolidated tool
omn1_read(
    file_path="/Users/you/project/src/auth.py",
    target="authenticate"
)
```

### Tip 2: Start with Overview

```python
# Pattern: Overview → Symbol - using consolidated tool
# 1. Get overview to see what's available
overview = omn1_read(file_path="/path/to/file.py", target="overview")

# 2. Read specific symbols based on overview
for func in overview["functions"]:
    if "auth" in func.lower():
        content = omn1_read(file_path="/path/to/file.py", target=func)
```

### Tip 3: Cache Results

The symbol service automatically caches results. Subsequent calls are instant!

```python
# First call: Slow (LSP query) - using consolidated tool
result1 = omn1_read(file_path="models.py", target="overview")

# Second call: Instant (cache hit) - using consolidated tool
result2 = omn1_read(file_path="models.py", target="overview")
```

### Tip 4: Combine with Compression

```python
# Enable compression for maximum token savings (99.2%) - using consolidated tool
result = omn1_read(
    file_path="/path/to/auth.py",
    target="authenticate",
    compress=True  # Default: True (automatic compression)
)
# 50 tokens → 10 tokens (90% additional compression)
```

## Token Savings Calculator

### Example: Auth Module

**File Size**: 5KB (250 lines)
**Full File Read**: 1,250 tokens

| Operation | Tokens | Savings vs Full File |
|-----------|--------|---------------------|
| Read authenticate function | 50 | 96% (1,200 tokens) |
| Read AuthManager class | 120 | 90% (1,130 tokens) |
| File overview | 100 | 92% (1,150 tokens) |
| Find references | 80 | 94% (1,170 tokens) |

**Scenario**: Understand authenticate function and find its usage
- Traditional: Read full file + grep = 1,250 tokens
- With LSP: Symbol read + references = 130 tokens
- **Savings: 89% (1,120 tokens)**

### At Scale

**Daily Operations**: 1,000 file reads
**Traditional Cost**: 1,250,000 tokens/day
**With LSP**: 100,000 tokens/day
**Savings**: 1,150,000 tokens/day (92%)

**At GPT-4 Pricing** ($0.03/1K tokens input):
- Traditional: $37.50/day = $1,125/month
- With LSP: $3.00/day = $90/month
- **Savings: $1,035/month**

## Next Steps

1. **Try it now**: Use the examples above
2. **Check metrics**: `service.get_metrics()` to see token savings
3. **Read full docs**: See README.md for advanced usage
4. **Report issues**: Check IMPLEMENTATION_SUMMARY.md for known limitations

## Questions?

- **Documentation**: See README.md
- **Implementation details**: See IMPLEMENTATION_SUMMARY.md
- **Testing**: Run `python tests/test_lsp_integration.py`

---

**Happy symbol reading! You're now saving 96% tokens on every file read!** 🚀
