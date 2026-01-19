# AGENTS.md - Guide for Working in This Codebase

## Project Overview

This is **NodeBench AI**, a sophisticated full-stack application built with React/TypeScript frontend and Convex backend that combines document management, AI chat, and multi-agent orchestration capabilities.

### Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Shadcn/ui components
- **Backend**: Convex (database + serverless functions), TypeScript
- **AI Integration**: OpenAI GPT-4, custom agent orchestration system
- **Testing**: Vitest, Testing Library, custom evaluation framework
- **Build Tools**: ESLint, Prettier, npm-run-all
- **Additional**: TipTap editor, BlockNote, ReactFlow, various data grids

## Essential Commands

### Development
```bash
npm run dev                 # Start both frontend and backend in parallel
npm run dev:frontend        # Frontend only: Vite dev server on port 5173
npm run dev:backend         # Backend only: Convex dev server
```

### Build & Quality
```bash
npm run build              # Production build (includes type checking)
npm run lint               # Full lint: TypeScript + Convex + build check
npm run lint:eslint        # ESLint only
npm run lint:eslint:fix    # Fix ESLint issues automatically
```

### Testing
```bash
npm test                   # Run Vitest tests in watch mode
npm run test:run           # Run all tests once
```

### AI Agent Evaluation System
```bash
npm run eval                # Run full evaluation suite
npm run eval:quick          # Quick agent tool tests
npm run eval:all           # Comprehensive evaluation
npm run eval:stats         # Get evaluation statistics
npm run eval:docs          # Test document tools
npm run eval:web           # Test web search tools
npm run eval:workflow      # Test workflow tools
```

### UI Components
```bash
npm run storybook           # Start Storybook dev server on port 6006
npm run build-storybook     # Build Storybook for production
```

### Convex Backend
```bash
npx convex dev              # Start Convex development backend
npx convex deploy           # Deploy to production
npx convex dashboard        # Open Convex dashboard
npx convex functions list   # List all backend functions
```

## Code Organization & Patterns

### Frontend Structure (`src/`)
```
src/
├── components/          # React components (organized by feature)
│   ├── ui/             # Shadcn/ui base components
│   ├── FastAgentPanel/ # Complex AI agent interface
│   ├── AIChatPanel/    # Chat interface
│   ├── agents/         # Agent-related components
│   ├── documentsHub/   # Document management
│   └── views/          # Main application views
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and helpers
├── types/              # TypeScript type definitions
├── test/               # Test files and mocks
└── styles/             # CSS files and theme configurations
```

### Backend Structure (`convex/`)
```
convex/
├── schema.ts           # Database schema definition
├── router.ts           # Main function router
├── agents/             # AI agent system implementation
├── orchestrator/       # Multi-agent orchestration
├── tools/              # AI tool implementations
├── fastAgentChat/     # Fast agent chat functions
├── documents.ts        # Document CRUD operations
├── auth.ts            # Authentication functions
└── _generated/        # Auto-generated Convex types
```

### Agent System (`agents/`)
```
agents/
├── core/               # Core orchestration logic
├── tools/              # Tool implementations
├── services/           # External service integrations
├── graphs/             # Agent workflow graphs
└── examples/           # Usage examples
```

## Key Conventions & Patterns

### Convex Functions
**ALWAYS** use the new function syntax with validators:

```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const myQuery = query({
  args: { documentId: v.id("documents") },
  returns: v.optional(v.string()),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    return doc?.title;
  },
});
```

### React Component Patterns
- Use functional components with TypeScript interfaces
- Import from `@/` alias for clean paths
- Follow the existing component structure with proper prop interfaces
- Use Shadcn/ui components as base, extend in feature components

### Database Operations
- **Queries**: Use `withIndex()` instead of `filter()` for performance
- **Mutations**: Use `patch()` for updates, `replace()` for full replacement
- **Always** include proper argument and return validators
- Use `internalMutation`/`internalQuery` for private functions

### Agent System
- Agents are orchestrated through graph-based workflows
- Tools are registered in the tools registry
- Use the evaluation framework to test agent capabilities
- Context and memory management via `InMemoryStore`

### File Naming
- Components: PascalCase (e.g., `DocumentHeader.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useDocumentState.ts`)
- Utilities: camelCase (e.g., `documentHelpers.ts`)
- Convex functions: camelCase (e.g., `getDocumentById.ts`)

## Important Gotchas

### Convex Specific
1. **Never use `filter()` in queries** - use indexes instead
2. **Always include validators** for args and returns
3. **Use `v.null()`** for null returns, not `undefined`
4. **Actions can't access `ctx.db`** -only queries/mutations can
5. **File-based routing**: function location determines API path

### TypeScript Configuration
1. **Path aliases**: `@/*` maps to `src/*`, `@convex/*` maps to `convex/*`
2. **Multiple tsconfig files**: Separate configs for frontend and Convex
3. **Strict typing**: The codebase uses strict TypeScript with proper Id types

### Testing Patterns
1. **Test location**: `__tests__/` directories or `*.test.ts` files
2. **Test timeout**: 4 minutes for E2E tests (real API calls)
3. **Mock system**: Extensive mocking for BlockNote and other complex dependencies
4. **Coverage**: Configured to exclude types, mocks, and test files

### UI Component System
1. **Shadcn/ui**: Base components live in `src/components/ui/`
2. **KokonutUI**: Additional UI components via custom registry
3. **Tailwind**: CSS variables for theming, dark mode support
4. **Icons**: Lucide React icons throughout

### Agent & AI Integration
1. **OpenAI Tools**: Implement as Convex actions with proper validation
2. **Streaming**: Use `@convex-dev/persistent-text-streaming` for real-time responses
3. **Error Handling**: Comprehensive error boundaries and retry logic
4. **Memory Management**: Context stores and memory for agent conversations

### Performance Considerations
1. **Database Indexes**: Properly defined in schema.ts for query optimization
2. **React Optimizations**: useMemo, useCallback patterns in complex components
3. **Bundle Splitting**: Vite handles optimization, but be mindful of large imports
4. **Image Handling**: Use Convex storage with proper URL generation

## Development Workflow

1. **Start development**: `npm run dev` (starts both frontend and backend)
2. **Make changes**: Frontend auto-reloads via Vite, backend auto-reloads via Convex
3. **Run tests**: `npm test` in separate terminal for watch mode
4. **Type checking**: `npm run lint` before committing
5. **Deploy**: `npx convex deploy` for backend, then `npm run build` for frontend

## Key Files to Understand

- `convex/schema.ts` - Database schema and indexes
- `src/App.tsx` - Main application entry point with auth flow
- `src/components/MainLayout.tsx` - Core layout component
- `convex/orchestrator/` - Multi-agent coordination system
- `convex/agents/` - AI agent implementations
- `agents/core/orchestrator.ts` - Agent orchestration graph execution
- `src/test/setup.ts` - Test configuration and mocks

## Environment Setup

Ensure these environment variables are configured:
- `NEXT_PUBLIC_CONVEX_URL` - Your Convex deployment URL
- `OPENAI_API_KEY` - For AI functionality
- Other keys as needed for integrations (Google APIs, etc.)

The system uses `.env` file for local development. DO NOT commit sensitive keys.