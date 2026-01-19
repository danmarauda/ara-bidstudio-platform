# ANUBIS Chat - Cursor Rules Directory

## ✅ Status: Fully Updated (August 6, 2025)

This directory contains the **latest Cursor IDE rules** using the new MDC (Markdown Components) format.

## Quick Start

1. **Main Rules**: [`main.mdc`](./main.mdc) - Primary development rules (always applied)
2. **Configuration**: [`cursor-config.mdc`](./cursor-config.mdc) - Cursor IDE settings and features
3. **Navigation**: [`index.mdc`](./index.mdc) - Complete documentation index

## Directory Structure

```
.cursor/rules/
├── main.mdc              # Primary rules (alwaysApply: true)
├── cursor-config.mdc     # Cursor IDE configuration
├── index.mdc            # Master documentation index
├── ultracite.mdc        # Code quality and linting rules
├── ai-rag/              # AI and RAG system patterns
├── architecture/        # System design and patterns
├── backend/             # Backend development rules
├── frontend/            # Frontend and UI patterns
├── security/            # Security guidelines
├── testing/             # Testing strategies
├── web3/                # Blockchain integration
├── deployment/          # Deployment configuration
├── documentation/       # Documentation standards
└── monitoring/          # Monitoring and observability
```

## Key Features

### 🤖 Cursor Auto Model Selection (August 2025)

ANUBIS Chat uses **Cursor's Auto Mode** for intelligent model routing:

- Automatically selects the best model for each task
- No manual configuration required
- Cost and performance optimized
- Automatic fallback on rate limits

**Available Models in Auto Mode:**

- Claude 3.5 Sonnet
- GPT-4o
- DeepSeek v3
- Gemini 2.0 Flash
- o1-mini / o1-preview
- Claude Haiku
- GPT-4o-mini

### 📝 MDC Format

All rules use the new MDC format with proper frontmatter:

```yaml
---
description: Brief description
globs: ["**/*.ts"] # File patterns
alwaysApply: false # Auto-apply setting
---
```

### 🎯 Scoped Rules

Rules automatically apply based on:

- File patterns (via glob matching)
- Always-apply rules for core guidelines
- Context-aware loading in Cursor

## How Rules Work

1. **Automatic Loading**: Cursor loads rules from `.cursor/rules/` automatically
2. **Agent Mode**: Rules apply in Agent mode and Inline Edit
3. **File Matching**: Rules with globs apply to matching files
4. **Priority**: `alwaysApply: true` rules always included

## Usage in Cursor

### Keyboard Shortcuts

- `Cmd/Ctrl + K` - Inline edit
- `Cmd/Ctrl + L` - Open chat
- `Cmd/Ctrl + I` - Open composer
- `Tab` - Accept suggestion

### Commands

- `/Generate Cursor Rules` - Generate rules from chat
- `New Cursor Rule` - Create new MDC file
- `Cmd+Shift+P` - Open command palette

## Status

✅ **Fully Updated**: All rules use the latest MDC format with Cursor Auto Model Selection configured.

## Best Practices

1. **Keep Rules Concise**: <500 lines per file
2. **Use Active Voice**: "You are an expert..." not "Code should..."
3. **Be Specific**: Clear, actionable instructions
4. **Include Examples**: Show code patterns
5. **Organize by Category**: Use subdirectories for organization

## Contributing

When adding new rules:

1. Use the MDC format with proper frontmatter
2. Place in appropriate category directory
3. Update `index.mdc` with navigation links
4. Test in Cursor Agent mode

## Resources

- [Cursor Documentation](https://docs.cursor.com)
- [GitHub: Awesome Cursor Rules](https://github.com/PatrickJS/awesome-cursorrules)
- [Cursor Forum](https://forum.cursor.com)

---

**Last Updated**: August 6, 2025
**Format**: MDC (Markdown Components)
**Status**: Production Ready
