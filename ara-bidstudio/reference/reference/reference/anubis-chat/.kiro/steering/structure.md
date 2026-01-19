# Project Structure

## Monorepo Organization

```
anubis-chat/
├── apps/
│   ├── web/                    # Next.js 15 frontend application
│   └── fumadocs/              # Documentation site
├── packages/
│   └── backend/               # Convex backend services
└── [config files]            # Root-level configuration
```

## Frontend Application (`apps/web/`)

```
apps/web/
├── src/
│   ├── app/                   # Next.js App Router pages and layouts
│   ├── components/            # React components and UI elements
│   ├── lib/                   # Utilities, types, and middleware
│   ├── hooks/                 # Custom React hooks
│   ├── contexts/              # React context providers
│   ├── constants/             # Application constants
│   └── middleware.ts          # Next.js middleware
├── public/                    # Static assets and PWA files
├── convex/                    # Convex client configuration
└── [config files]            # App-specific configuration
```

## Backend Services (`packages/backend/`)

```
packages/backend/
└── convex/
    ├── schema.ts              # Database schema definitions
    ├── auth.ts                # Wallet authentication logic
    ├── users.ts               # User management functions
    ├── chats.ts               # Chat conversation functions
    ├── messages.ts            # Message CRUD operations
    ├── documents.ts           # Document upload/management
    ├── memories.ts            # RAG memory system
    ├── embeddings.ts          # Vector embedding functions
    ├── rag.ts                 # Retrieval-augmented generation
    ├── subscriptions.ts       # SOL payment handling
    ├── referrals.ts           # Referral system logic
    └── _generated/            # Auto-generated Convex files
```

## Configuration Files

### Root Level
- `package.json` - Workspace configuration and scripts
- `turbo.json` - Turborepo build orchestration
- `tsconfig.json` - TypeScript configuration
- `biome.json` - Code formatting and linting rules
- `bunfig.toml` - Bun package manager configuration

### Code Quality
- `.husky/pre-commit` - Git pre-commit hooks
- `lint-staged` configuration in package.json
- Biome extends `ultracite` configuration

## Naming Conventions

### Files
- **camelCase** for all filenames (enforced by Biome)
- Component files match component names
- Utility files use descriptive camelCase names

### Directories
- **camelCase** for all directories (following Biome filename convention)
- Component directories use camelCase matching component names
- Utility directories use descriptive camelCase names

## Key Architectural Decisions

- **Apps vs Packages**: Frontend applications in `apps/`, shared backend logic in `packages/`
- **Convex Co-location**: Backend functions organized by domain (auth, chats, documents)
- **Component Organization**: UI components separated from business logic
- **Type Safety**: Strict TypeScript across all packages
- **Real-time Data**: Convex handles all database operations and real-time sync