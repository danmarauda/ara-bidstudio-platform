# Claude Code Configuration for abubis.chat

This directory contains Enhanced Claude Code v3.0 configuration for the abubis.chat project.

## Active Modes

- **nextjs-14**: Next.js 14 with App Router and Server Actions
- **monorepo-bun**: Turborepo monorepo with Bun package manager
- **continuous-verification**: Automatic code quality checks with Kluster AI

## MCP Servers

The following MCP servers are configured for this project:

- sequential-thinking - Deep analysis and reasoning
- context7 - Documentation and best practices
- kluster - Code verification and security
- puppeteer - Browser automation for testing
- And more...

## Quick Commands

```bash
# Verify code quality
bun run claude:verify

# Index codebase for semantic search
bun run claude:index

# Cache documentation for offline use
bun run claude:docs

# Start continuous verification loop
bun run claude:loop
```

## Project-Specific Settings

- Strict TypeScript with no `any` types
- Nullish coalescing enforced (`??` not `||`)
- ESLint warnings treated as errors
- Automatic verification on save
- Convex backend integration support
