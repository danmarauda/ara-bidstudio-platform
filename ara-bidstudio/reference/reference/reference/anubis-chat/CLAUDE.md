# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development

```bash
# Install dependencies (using Bun package manager)
bun install

# Development - starts all services
bun dev                    # Runs turbo dev (all apps)
bun dev:web               # Frontend only on port 3001
bun dev:server            # Backend Convex server only
bun dev:setup             # Initial Convex setup

# Code quality
bun check                 # Biome format and lint
npx ultracite format      # Format staged files (runs on pre-commit)

# Build
bun build                 # Build all apps
bun check-types           # TypeScript validation across monorepo

# Testing
# No test commands configured yet - tests would typically be:
# bun test                # Would run tests if configured
# bun test:watch          # Would run tests in watch mode
```

### Convex Backend Commands

```bash
cd packages/backend
bun dev                   # Start Convex dev server
bun dev:setup            # Configure Convex project
```

### Frontend Specific

```bash
cd apps/web
bun dev                   # Start Next.js dev server on port 3001
bun build                 # Build production bundle
bun generate-pwa-assets   # Generate PWA icons and manifest
```

## Architecture Overview

### Monorepo Structure

ANUBIS Chat uses **Turborepo** with a modular architecture:

- **apps/web**: Next.js 15 frontend with App Router, React 19, TypeScript
- **packages/backend**: Convex backend-as-a-service for real-time data

### Frontend Architecture (apps/web)

- **Framework**: Next.js 15 with App Router and React Server Components
- **Styling**: Tailwind CSS v4 with Shadcn UI components
- **State**: Convex reactive queries and mutations
- **PWA**: Progressive Web App with offline support
- **Key Patterns**:
  - Server Components by default for data fetching
  - Client Components only for interactivity
  - Component composition in `src/components/`
  - Providers wrapped in `src/components/providers.tsx`

### Backend Architecture (packages/backend)

- **Platform**: Convex serverless backend
- **Schema**: Type-safe schema in `convex/schema.ts`
- **Functions**: Query/mutation functions in `convex/` directory
- **Real-time**: Automatic reactivity and subscriptions
- **Key Patterns**:
  - Schema-driven development with strict typing
  - Reactive queries update UI automatically
  - Mutations for data modifications
  - Built-in authentication (when configured)

### AI/RAG System Design (Planned)

Based on `.cursor/rules/`, the system is designed for:

- **Multi-model AI**: Claude 3.5, GPT-4o, DeepSeek v3, Gemini 2.0
- **Vector Search**: Qdrant for semantic search
- **Streaming**: Vercel AI SDK for real-time responses
- **RAG Pipeline**: Embeddings → Vector Store → Contextual Retrieval

### Web3 Integration (Planned)

- **Blockchain**: Solana with Web3.js and Anchor
- **Wallet**: Multi-wallet support (Phantom, Solflare)
- **Smart Contracts**: Anchor framework integration

## Critical Context from Cursor Rules

### Code Quality Standards

- **TypeScript strict mode** - No `any` types allowed
- **Result<T, E> pattern** for error handling
- **Functional programming** where appropriate
- **Component-driven development** with reusability focus
- **Test coverage targets**: 90%+ unit, 85%+ branch

### Performance Requirements

- Frontend: <3s load on 3G, <100ms interactions
- API: <200ms average, <500ms P95
- AI responses: <2s time-to-first-token
- Vector search: <100ms query time

### Security Mandates

- Zod validation for all inputs
- Prompt injection prevention for AI
- Parameterized database queries
- Web3 security best practices
- CSRF protection and session management

### AI Implementation Approach

- Uses Cursor's Auto Model Selection for optimal routing
- Streaming with backpressure management
- Hybrid semantic + keyword search
- Contextual chunk expansion for RAG

## Development Workflow

### Git Conventions

```bash
# Commit message format (enforced by tooling)
feat: New feature
fix: Bug fix
docs: Documentation
refactor: Code restructuring
test: Test updates
chore: Maintenance

# Pre-commit hooks run automatically:
# - Ultracite formatting
# - TypeScript type checking
```

### File Organization

- Components: `src/components/` with UI subfolder for primitives
- App routes: `src/app/` following Next.js conventions
- Backend functions: `packages/backend/convex/`
- Shared types: Define in backend, import in frontend

### Convex Development Pattern

1. Define schema in `packages/backend/convex/schema.ts`
2. Create query/mutation functions in `convex/` directory
3. Use generated hooks in frontend via `convex/react`
4. Mutations modify data, queries read reactively

### Component Development Pattern

1. Server Components for data fetching (default)
2. Client Components for interactivity (use client directive)
3. Compose with Shadcn UI primitives
4. Style with Tailwind utility classes
5. Validate props with TypeScript interfaces

## Technology Stack Reference

### Core Dependencies

- **Runtime**: Bun 1.2.18 (package manager and runtime)
- **Framework**: Next.js 15 with React 19
- **Backend**: Convex 1.25.4
- **Styling**: Tailwind CSS 4.1, Shadcn UI
- **Forms**: Tanstack Form, Zod validation
- **Build**: Turborepo for monorepo orchestration
- **Code Quality**: Biome, Ultracite, Husky

### Development Tools

- **Cursor IDE**: Auto model selection enabled
- **TypeScript**: Strict mode configuration
- **Git Hooks**: Husky + lint-staged for pre-commit
- **PWA**: Next.js PWA configuration

## Known Patterns and Constraints

### Current Implementation Status

- Basic Convex todo example implemented
- PWA manifest and icons configured
- Theme switching (dark/light mode) enabled
- Component library initialized with Shadcn

### Pending Features (from rules)

- AI/RAG system integration
- Vector database setup
- Solana wallet integration
- Authentication system
- Testing infrastructure

### Important Files

- `packages/backend/convex/schema.ts`: Database schema
- `apps/web/src/components/providers.tsx`: App providers
- `apps/web/src/app/layout.tsx`: Root layout
- `.cursor/rules/main.mdc`: Primary development guidelines

## Code Research Guidance

- **Research Best Practices**:
  - NEVER USE ANY TYPES, USE CONTEXT7 AND THE GREP MCP TO RESEARCH GITHUB FOR BEST PRACTICES AND DOCS

## Development Restrictions

- **Key Constraint**:
  - Dont touch auth, convex, or api

- Stop creating .md files unless I request you
- Explicitly no any types, ALWAYS review for the proper type strcture and if one does not exsist then create it.
- STRICTLY USE camelCase