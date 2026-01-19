# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

ARA Bid Studio is a comprehensive AI-powered bid and tender management workshop demonstrating **AG-UI** (Agent User Interaction) protocol integration with **Mastra** agents and **CopilotKit**. This is a Next.js application that showcases multi-agent architecture with shared state synchronization across web and CLI interfaces.

Key Features:
- **Multi-Agent System**: WeatherAgent (demo) + BidAgent (bid/tender management)
- **Dual Client Architecture**: Web UI (CopilotKit + React) + CLI interface
- **Shared State**: Real-time synchronization between agents and UI components via AG-UI protocol
- **Flexible Persistence**: In-memory + Convex database support with adapter pattern

## Quick Commands

**Development:**
```bash
npm run dev           # Start Next.js dev server with Turbopack
npm run cli           # Interactive CLI agent chat
npm run dev:agent     # Mastra agent development mode
npm run dev:ui        # Next.js UI only
npm run dev:debug     # Debug mode with verbose logging
```

**Production:**
```bash
npm run build         # Build for production
npm start             # Start production server
npm run lint          # ESLint code checking
```

## Environment Setup

### Prerequisites
- Node.js 18+
- Package manager: npm (default), pnpm, or yarn
- OpenAI API key for LLM functionality

### Required Environment Variables

Create `.env.local` with:
```bash
# LLM Provider (required)
OPENAI_API_KEY=your-openai-api-key-here

# Mastra Configuration
MASTRA_MODEL=gpt-4.1                    # Optional: default model for agents
LOG_LEVEL=info                          # Optional: debug, info, warn, error

# Clerk Authentication (optional)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=      # Public key for Clerk auth
CLERK_SECRET_KEY=                       # Secret key for Clerk auth

# Tenant Configuration
DEFAULT_TENANT=ara-property-services    # Default tenant slug
```

### Database Setup

**In-Memory Mode** (default):
- No additional setup required
- Data persists only during runtime
- Good for development and testing

**Convex Mode** (optional):
```bash
# Install Convex CLI globally
npm install -g convex

# Initialize Convex project (in separate terminal)
npx convex dev

# The application will automatically detect Convex presence
```

## Architecture Overview

### Multi-Agent System

**Agent Definitions:**
- `src/mastra/agents/index.ts` - WeatherAgent (demo/workshop)
- `src/mastra/agents/bid/index.ts` - BidAgent (bid management)

**Agent Registration:**
- `src/mastra/index.ts` - Main Mastra instance with agent registry
- Uses LibSQL storage for agent memory
- Working memory enabled with Zod schema validation

### Bid Management Tools

Located in `src/mastra/tools/bid.ts`:
- `ingestDocumentTool` - Parse tender documents
- `answerQuestionTool` - Context-aware Q&A
- `extractRequirementsTool` - Requirements extraction
- `mapCapabiliesTool` - Capability-requirement mapping
- `buildComplianceMatrixTool` - Compliance gap analysis
- `generateEstimateTool` - Cost estimation
- `costSummaryTool` - Estimate totals
- `createSectionDraftTool` - Proposal section drafting
- `reviseSectionTool` - Section revision
- `proposeReviewChecklistTool` - Review checklist generation
- `prepareSubmissionPackageTool` - Final submission prep

### State Management & AG-UI Protocol

**Shared State Schema:**
- `src/lib/state.ts` - AgentStateSchema with Zod validation
- `src/lib/types.ts` - UserSchema, TaskSchema definitions
- Shared across web and CLI clients via AG-UI protocol

**State Synchronization:**
- Web: `useCoAgent` hook in `src/app/page.tsx`
- CLI: `MastraAgent` wrapper in `src/cli/index.ts`
- Real-time updates via shared memory and event system

### Dual Client Architecture

**Web Client (Next.js + CopilotKit):**
- `src/app/layout.tsx` - CopilotKit provider setup
- `src/app/page.tsx` - Main UI with shared state integration
- `src/app/api/copilotkit/route.ts` - CopilotKit runtime endpoint
- Component structure in `src/app/components/`

**CLI Client:**
- `src/cli/index.ts` - Interactive terminal interface
- Shares same agent instances and state as web client
- Event-driven updates with detailed logging

### Database Abstraction

**Persistence Layer:**
- `src/lib/store.ts` - Unified store interface
- `src/lib/persistence.ts` - In-memory implementations
- `src/lib/persistence-db.ts` - Convex implementations
- `src/lib/db.ts` - Database connection management

**Schema:**
- `convex/schema.ts` - Convex database schema
- Multi-tenant structure with projects, tenders, documents, requirements

## Key Directory Structure

```
ara-bidstudio/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (bid)/             # Bid-specific routes
│   │   ├── api/               # API routes
│   │   ├── components/        # React components
│   │   └── sign-in/           # Authentication
│   ├── cli/                   # CLI interface
│   ├── lib/                   # Utilities & abstractions
│   │   ├── auth.ts           # Authentication logic
│   │   ├── state.ts          # Shared state schema
│   │   ├── types.ts          # Type definitions
│   │   ├── store.ts          # Storage abstraction
│   │   └── persistence*.ts   # Storage implementations
│   └── mastra/               # Mastra configuration
│       ├── agents/           # Agent definitions
│       │   ├── bid/          # Bid-specific agent
│       │   └── index.ts      # Agent registry
│       ├── tools/            # Tool implementations
│       └── index.ts          # Mastra instance
├── convex/                   # Convex database
├── snippets/                 # Workshop step examples
└── middleware.ts             # Next.js middleware
```

## Development Workflow

### Running Full Stack
```bash
# Terminal 1: Web development server
npm run dev

# Terminal 2 (optional): Convex development
npx convex dev

# Terminal 3: CLI interface
npm run cli
```

### Testing Multi-Client State Sync
1. Start web dev server: `npm run dev`
2. Open browser to `http://localhost:3000`
3. In separate terminal, run CLI: `npm run cli`
4. Trigger actions from web UI and observe CLI state updates
5. Use CLI commands and observe web UI reactions

### Adding New Bid Tools
1. Define tool in `src/mastra/tools/bid.ts`:
   ```typescript
   export const myNewTool = createTool({
     id: "myNewTool",
     description: "Tool description",
     inputSchema: z.object({ param: z.string() }),
     outputSchema: z.object({ result: z.string() }),
     execute: async ({ context }) => { /* implementation */ }
   });
   ```

2. Register with bidAgent in `src/mastra/agents/bid/index.ts`:
   ```typescript
   export const bidAgent = new Agent({
     tools: { 
       // existing tools...
       myNewTool 
     },
     // other config...
   });
   ```

### Evolving Shared State
1. Update schema in `src/lib/state.ts`:
   ```typescript
   export const AgentStateSchema = z.object({
     // existing fields...
     newField: z.string().optional()
   });
   ```

2. Update default state in `src/app/page.tsx`
3. Handle state changes in both web and CLI clients

## Troubleshooting

**Common Issues:**

1. **Missing OpenAI API Key:**
   ```bash
   Error: OpenAI API key not found
   → Add OPENAI_API_KEY to .env.local
   ```

2. **CLI Cannot Connect to Agent:**
   ```bash
   → Ensure web server is running (agents share memory)
   → Check environment variables are accessible to CLI
   ```

3. **Convex Connection Issues:**
   ```bash
   → Run npx convex dev in separate terminal
   → Verify Convex CLI is installed globally
   → Check Convex project initialization
   ```

4. **State Not Syncing Between Clients:**
   ```bash
   → Verify both clients use same persistence layer
   → Check AG-UI protocol event handlers
   → Enable debug logging: LOG_LEVEL=debug npm run dev
   ```

**Enable Verbose Logging:**
```bash
LOG_LEVEL=debug npm run dev:debug
```

**Debug Agent Behavior:**
- Use browser developer tools for CopilotKit state
- CLI shows detailed event logs and state snapshots
- Check server console for agent tool executions

## Workshop Structure

This project demonstrates progressive complexity across 3 workshop steps:

- **Step 1**: Basic AG-UI integration with simple state
- **Step 2**: Complex state schemas and agent personas  
- **Step 3**: Production-ready bid management application

Each step builds on the previous, showcasing different aspects of multi-agent, multi-client architecture patterns.

## Appendix

**Technology Stack:**
- **Framework**: Next.js 15+ with App Router
- **AI/Agents**: Mastra, CopilotKit, OpenAI
- **Database**: Convex (optional), LibSQL
- **State**: AG-UI protocol, Zod validation
- **Auth**: Clerk (optional)
- **Styling**: Tailwind CSS
- **Type Safety**: TypeScript, ESLint

**Key Concepts:**
- **AG-UI**: Agent User Interaction protocol for multi-client state synchronization
- **Mastra**: AI agent framework with tools and memory
- **CopilotKit**: React components for AI interfaces
- **Working Memory**: Structured agent state with Zod schemas
