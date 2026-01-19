# ANUBIS Chat Web App - Claude Configuration

This directory contains Claude Code configuration specifically for the ANUBIS Chat web application located in `/apps/web` within the monorepo.

## 🎯 Scope

This configuration is focused exclusively on the **web app portion** of the ANUBIS Chat monorepo:

- Working directory: `/apps/web`
- Technology: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Convex (BaaS)
- Blockchain: Solana integration
- AI: Vercel AI SDK v5

## 📁 Web App Structure

```
/apps/web/
├── app/            # Next.js app router pages
├── components/     # React components (shadcn/ui)
├── convex/        # Backend functions & schema
├── hooks/         # Custom React hooks
├── lib/           # Utilities & services
└── public/        # Static assets
```

## 🚀 Active Modes

- **nextjs-15**: Next.js 15 with App Router and React Server Components
- **solana-2025**: Solana Web3.js integration for wallet auth
- **continuous-verification**: Automatic code quality checks with Kluster AI
- **ai-agent-protocol**: Vercel AI SDK v5 streaming integration

## 🔌 MCP Servers

The following MCP servers are configured for enhanced capabilities:

- sequential-thinking - Deep analysis and reasoning
- context7 - Documentation and best practices
- kluster - Code verification and security
- puppeteer - Browser automation for testing
- convex - Backend database operations
- solana - Blockchain integration helpers

## 🛠️ Development Focus

### What we work on:

- ✅ Frontend components in `/components`
- ✅ App router pages in `/app`
- ✅ Convex functions in `/convex`
- ✅ React hooks in `/hooks`
- ✅ Utilities in `/lib`

### What we ignore:

- ❌ `../api` - Separate API service
- ❌ `../contracts` - Smart contracts
- ❌ `../packages` - Shared packages

## 💡 Quick Commands

```bash
# From /apps/web directory:

# Start dev server
bun dev

# Type checking
bun typecheck

# Linting with Biome
bun lint

# Run tests
bun test
```

## 🛡️ Quality Standards

- **TypeScript**: Strict mode, no `any` types
- **Nullish coalescing**: Use `??` not `||`
- **Warnings as errors**: Zero tolerance for warnings
- **Accessibility**: WCAG 2.1 compliance
- **Performance**: Core Web Vitals optimization
