# Technology Stack

## Frontend
- **Framework**: Next.js 15 with App Router and React 19
- **Language**: TypeScript with strict mode enabled
- **Styling**: Tailwind CSS 4 with Shadcn UI components
- **State Management**: React 19 server components
- **AI Integration**: Vercel AI SDK v5.2 for streaming responses
- **Web3**: Solana wallet adapters (@solana/wallet-adapter-backpack)
- **Package Manager**: Bun 1.2.18

## Backend
- **Platform**: Convex v1.7+ (real-time backend-as-a-service)
- **Database**: Convex DB with real-time synchronization
- **Functions**: Convex Actions and Mutations for serverless logic
- **Vector Storage**: Qdrant v1.9+ for RAG embeddings
- **Blockchain**: Solana with Anchor 0.29 smart contracts

## Development Tools
- **Monorepo**: Turborepo for optimized build orchestration
- **Code Quality**: Biome for formatting and linting (extends ultracite config)
- **Type Safety**: TypeScript with strict mode across all packages
- **Git Hooks**: Husky with lint-staged for pre-commit quality checks
- **Testing**: Vitest for unit testing

## Common Commands

### Development
```bash
bun dev                    # Start all services (web + backend)
bun dev:web               # Frontend only (Next.js)
bun dev:server            # Convex backend only
bun dev:setup             # Initial Convex project setup
```

### Code Quality
```bash
bun check                 # Format and lint with Biome
bun check-types           # TypeScript validation across workspace
```

### Build & Deploy
```bash
bun build                 # Production build for all packages
turbo build               # Turborepo orchestrated build
```

### Convex Backend
```bash
cd packages/backend
npx convex dev            # Start Convex development server
npx convex deploy         # Deploy to production
```

## Architecture Patterns
- **Monorepo Structure**: Apps and packages separation
- **Real-time First**: Convex provides reactive data synchronization
- **Wallet-Scoped Data**: All user data isolated by Solana wallet address
- **Streaming AI**: Real-time AI responses with optimistic UI updates
- **Edge Functions**: Serverless functions for AI model integration