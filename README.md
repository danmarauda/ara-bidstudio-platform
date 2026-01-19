# ARA BidStudio

**AI-Powered Bid & Tender Management Platform for Facility Management Contracts**

---

## Overview

ARA BidStudio is an enterprise-grade platform that streamlines the bid and tender management process for facility management contracts. It combines multi-tenant SaaS architecture with advanced AI agents, real-time collaboration, and intelligent document processing.

---

## Key Features

### 🏢 Multi-Tenant Architecture
- URL-based tenant isolation (`/t/[tenant]/[page]`)
- Organization-based user management via Clerk
- Database-level data separation
- Default tenant: `ara-property-services`

### 🤖 AI Agent Integration (Mastra)
- Enterprise-grade agent orchestration
- Bid analysis and processing workflows
- Document intelligence with embedding search
- CopilotKit embedded AI chat interface

### 📄 Document Processing
- Support for PDF, DOCX, XLSX, CSV, TXT
- MCP-based document processing pipeline
- Vector embeddings for semantic search
- Real-time upload progress tracking

### 📊 Project Management
- Visual Kanban board for bid tracking
- Team collaboration with presence indicators
- Real-time state synchronization via Convex
- Project containerization and metadata

### 🔐 Authentication & Security
- Clerk multi-tenant authentication
- Organization-based access control
- Secure session handling
- Environment-based configuration

### 📈 Observability
- OpenTelemetry instrumentation
- Performance monitoring
- Request tracing and debugging
- Production-ready logging

---

## Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Frontend** | Next.js | 15+ |
| **UI Library** | React | 19 |
| **Language** | TypeScript | 5 |
| **Styling** | Tailwind CSS | 4 |
| **AI Chat** | CopilotKit | 1.10.3 |
| **AI Agents** | Mastra | 0.12-0.16 |
| **Backend** | Convex | 1.14 |
| **Database** | LibSQL | - |
| **Auth** | Clerk | 6.9 |
| **Observability** | OpenTelemetry | - |
| **Package Manager** | Bun | - |

---

## Project Structure

```
ara-bidstudio/
├── ara-bidstudio/                    # Main application
│   ├── src/
│   │   ├── app/                      # Next.js App Router
│   │   │   ├── (bid)/               # Multi-tenant bid routes
│   │   │   ├── components/          # React components
│   │   │   │   ├── AraBidDashboard.tsx
│   │   │   │   ├── KanbanBoard.tsx
│   │   │   │   ├── CopilotSidebarClient.tsx
│   │   │   │   └── ...
│   │   │   └── ...
│   │   ├── lib/                      # Utilities and libraries
│   │   │   ├── db.ts                 # Database utilities
│   │   │   ├── auth.ts               # Authentication
│   │   │   ├── docsMcpClient.ts      # MCP document client
│   │   │   ├── embedding.ts          # Vector embeddings
│   │   │   └── ...
│   │   ├── mastra/                   # AI Agent orchestration
│   │   │   ├── agents/               # Agent definitions
│   │   │   ├── tools/                # Agent tools
│   │   │   └── index.ts              # Mastra setup
│   │   └── cli/                      # CLI tools
│   ├── convex/                       # Convex backend
│   │   ├── schema.ts                 # Data schema
│   │   └── functions/                # Serverless functions
│   ├── public/                       # Static assets
│   ├── scripts/                      # Build and utility scripts
│   └── package.json
│
├── ara-bidstudio-collection/         # Reference implementations
│   ├── contract-analysis/            # Contract analysis platform
│   ├── OpenContracts/                # Document analytics engine
│   ├── Gemini-File-Search-Manager/   # Gemini-based search
│   ├── papra/                        # Contract management
│   ├── araps-platform/               # ARAPS integration
│   ├── nodebench-ai/                 # AI benchmarking
│   ├── ever-teams/                   # Teams platform
│   ├── omn1-ace/                     # ACE platform
│   └── papra/                        # Encryption patterns
│
├── CONSOLIDATION_ANALYSIS.md         # Ecosystem analysis and consolidation plan
├── README.md                         # This file
└── .gitignore                        # Git ignore rules
```

---

## Getting Started

### Prerequisites

- **Bun** (recommended) or npm/pnpm
- **Node.js** 18+
- **Convex** account (for backend)
- **Clerk** account (for authentication)
- **OpenAI API key** (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/ara-bidstudio.git
cd ara-bidstudio/ara-bidstudio

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys and configuration

# Initialize Convex
bunx convex dev

# Run development server
bun run dev
```

### Environment Variables

```env
# Convex
CONVEX_DEPLOYMENT=your-deployment-id
CONVEX_URL=https://your-deployment.convex.cloud

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-key
CLERK_SECRET_KEY=your-secret
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# OpenAI (for AI features)
OPENAI_API_KEY=your-openai-key

# LibSQL
LIBSQL_URL=file:local.db
# or for remote: LIBSQL_URL=turso-url

# Optional
DEFAULT_TENANT=ara-property-services
LOG_LEVEL=info
```

### Development Scripts

```bash
# Start Next.js dev server (with Turbopack)
bun run dev:ui

# Start Mastra agent playground
bun run dev:agent

# Start MCP document server
bun run dev:mcp

# Start all services concurrently
bun run dev:full

# Build for production
bun run build

# Start production server
bun run start

# Run linter
bun run lint

# Run CLI tool
bun run cli
```

---

## Architecture Overview

### Multi-Tenant Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser / Client                        │
├─────────────────────────────────────────────────────────────┤
│  /t/[tenant]/projects  →  Tenant-scoped project views      │
│  /t/[tenant]/dashboard  →  Tenant-scoped dashboard         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 15 App Router                   │
├─────────────────────────────────────────────────────────────┤
│  Middleware: Tenant extraction from URL                    │
│  Auth: Clerk session validation                            │
│  Data: Convex real-time queries                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Convex Backend                           │
├─────────────────────────────────────────────────────────────┤
│  Database: Tenant-isolated data                            │
│  Functions: Serverless query/mutation endpoints            │
│  Real-time: Automatic state synchronization                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    AI & Document Processing                  │
├─────────────────────────────────────────────────────────────┤
│  Mastra: Agent orchestration                               │
│  CopilotKit: Embedded AI chat                             │
│  MCP Server: Document processing pipeline                  │
│  LibSQL: Vector embeddings storage                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Components

### 1. Multi-Tenant Routing

```typescript
// src/app/(bid)/layout.tsx
export default function BidLayout({ children, params }) {
  const { tenant } = params;
  // Tenant context available to all child routes
}
```

### 2. Mastra Agents

```typescript
// src/mastra/agents/index.ts
export const bidAnalysisAgent = {
  name: 'bid-analysis',
  instructions: 'Analyze bid documents and extract key information...',
  tools: [documentLibraryTool, bidExtractionTool]
};
```

### 3. CopilotKit Integration

```typescript
// src/app/components/CopilotSidebarClient.tsx
<CopilotKit
  runtimeUrl="/api/copilotkit"
  headers={{ 'X-Tenant': tenant }}
>
  <CopilotSidebar />
</CopilotKit>
```

### 4. Convex Backend

```typescript
// convex/schema.ts
export default defineSchema({
  projects: v.object({
    tenantId: v.string(),
    name: v.string(),
    status: v.string(),
    // ... other fields
  }),
  bids: v.object({
    projectId: v.id('projects'),
    // ... other fields
  }),
});
```

---

## AI Capabilities

### Document Processing

- **PDF Extraction**: Text and layout extraction from PDFs
- **DOCX Parsing**: Microsoft Word document processing
- **XLSX Import**: Spreadsheet data extraction
- **Vector Embeddings**: Semantic search capabilities
- **Chunking**: Intelligent document segmentation

### Agent Workflows

- **Bid Analysis**: Extract key terms, obligations, deadlines
- **Risk Assessment**: Identify potential risks in contracts
- **Summary Generation**: Create executive summaries
- **Q&A**: Answer questions about bid documents
- **Comparison**: Compare multiple bids side-by-side

### Real-Time Collaboration

- **Multi-User Editing**: Concurrent document annotation
- **Presence Indicators**: See who's viewing/editing
- **Change Tracking**: Track all modifications
- **Comments**: Discuss specific document sections

---

## Deployment

### Production Build

```bash
bun run build
bun run start
```

### Environment Setup

1. Set up Convex production deployment
2. Configure Clerk production keys
3. Set environment variables
4. Run database migrations (if any)
5. Deploy to Vercel/your hosting platform

### Vercel Deployment

```bash
# Install Vercel CLI
bun i -g vercel

# Deploy
vercel --prod
```

---

## Ecosystem

This repository is part of a larger ecosystem of related projects:

- **contract-analysis**: Advanced contract annotation and corpus management
- **OpenContracts**: Open-source document analytics platform
- **Gemini-File-Search-Manager**: Alternative LLM integration
- **papra**: Contract management and encryption patterns

See [CONSOLIDATION_ANALYSIS.md](./CONSOLIDATION_ANALYSIS.md) for details on the ecosystem structure and consolidation roadmap.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

For questions or support:
- Open an issue on GitHub
- Contact the maintainers
- Check the documentation

---

**Status**: Active Development
**Last Updated**: 2026-01-19
**Version**: 0.1.0
