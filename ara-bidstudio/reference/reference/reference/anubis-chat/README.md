# Anubis Chat

A next-generation AI chat platform combining advanced RAG (Retrieval-Augmented Generation) capabilities with Solana Web3 integration. Anubis Chat enables users to upload documents, create intelligent chatbots, and interact with multiple AI models through a secure, wallet-based authentication system.

## 🚀 Key Features

### AI & Chat

- **Latest AI Models (August 2025)** - GPT-5, Claude Opus 4.1, Gemini 2.5 Pro, and 14+ cutting-edge models
- **Dynamic Model Selection** - Switch between AI models on-the-fly with rich UI selector
- **Multi-Provider Support** - Seamless integration with OpenAI, Anthropic, and Google
- **Real-time Streaming** - Convex HTTP actions for streaming AI responses
- **Document RAG System** - Upload and query documents with semantic search
- **Real-time Chat** - Streaming responses with conversation memory
- **Typing Indicators** - Real-time typing status with automatic cleanup
- **Optimistic Updates** - Instant UI feedback for better user experience
- **Context-Aware Responses** - AI leverages uploaded documents for enhanced answers
- **Model Persistence** - Selected model saved per chat conversation

### Web3 Integration

- **Solana wallet authentication** - Phantom, Backpack, and more
- **Signature-based security** - Challenge/nonce verification
- **Subscription-ready** - On-chain and off-chain verification flows

### Platform Architecture

- **TypeScript-first** across frontend and backend
- **Next.js 15 (App Router)** with React 19
- **Convex backend** for data, auth, and server actions
- **PWA** with service worker and icon set
- **Code quality** with Biome and Turborepo

### Document Management

- **Multi-format ingestion** - Text, Markdown, PDF, URLs
- **Semantic search** - Vector embeddings and similarity search
- **User isolation** - Per-wallet document scopes

## 🛠 Tech Stack

### Frontend

- **Next.js 15** (App Router) + **React 19**
- **TypeScript**, **Tailwind CSS 4**, Shadcn UI
- **TanStack Form** + **Zod** validation

### Backend

- **Convex** - Real-time backend-as-a-service
- **Edge Functions** - Serverless query/mutation functions
- **Real-time Database** - Reactive data synchronization
- **Full-text Search** - Built-in document search indexes

### Security & Auth

- **Wallet Authentication** - Solana signature verification
- **JWT Tokens** with blacklisting support
- **Rate Limiting** - Request throttling and abuse prevention
- **Input Validation** - Zod schemas with ReDoS protection

### Development

- **Turborepo**, **Bun**, **Biome**, **Husky**

## 🚦 Getting Started

### Prerequisites

- Bun 1.2.19+
- Solana wallet (Phantom recommended)
- Convex account/project

### Installation

1. Clone and install

```bash
git clone https://github.com/your-username/anubis-chat.git
cd anubis-chat
bun install
```

2. Configure environment

Frontend (`apps/web/.env.local`):

```bash
# Required
NEXT_PUBLIC_CONVEX_URL=https://<your-convex-deployment>.convex.cloud

# Providers (choose one or more)
OPENROUTER_API_KEY=...            # preferred for broad model access
OPENAI_API_KEY=...                # optional
GOOGLE_GENERATIVE_AI_API_KEY=...  # optional

# Solana (client)
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

Backend (Convex env variables; set via Convex dashboard/CLI):

```bash
# Providers
OPENROUTER_API_KEY=...
OPENAI_API_KEY=...
GOOGLE_GENERATIVE_AI_API_KEY=...

# Security / CORS / Rate-limits
ALLOWED_ORIGINS=http://localhost:3001
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Auth / Admin (optional)
ADMIN_WALLETS=<comma-separated-solana-public-keys>
JWT_SECRET=<optional-legacy-only>

# Solana (server)
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
```

3. Initialize Convex

```bash
bun dev:setup
```

4. Start development

```bash
bun dev
```

- Web app: http://localhost:3001
- Docs app: http://localhost:4000 (see `apps/fumadocs` below)

### Quick Commands

```bash
# Development
bun dev          # Start all apps
bun dev:web      # Frontend only
bun dev:server   # Convex backend only

# Code Quality
bun check        # Format + lint (Biome)
bun check-types  # TypeScript validation
bun build        # Production build
```

## 📁 Project Structure

```
anubis-chat/
├── apps/
│   ├── web/                     # Next.js frontend
│   │   ├── src/app/             # App Router pages and API routes
│   │   ├── src/components/      # UI components
│   │   └── src/lib/             # Utils, env, middleware
│   ├── fumadocs/                # Documentation site (Next.js + Fumadocs)
│   │   └── ...                  # Run with: bun -C apps/fumadocs dev
├── packages/
│   └── backend/
│       └── convex/              # Convex functions and HTTP routes
│           ├── http.ts          # HTTP router (uploads, streaming, payments)
│           ├── streaming.ts     # WebSocket + HTTP streaming actions
│           ├── files.ts         # Uploads and storage
│           ├── documents.ts     # Document pipeline and CRUD
│           ├── rag.ts           # RAG retrieval and formatting
│           ├── users.ts         # User management
│           ├── auth.ts          # Convex Auth (Solana)
│           └── schema.ts        # Data model
└── turbo.json                   # Turborepo config
```

## 🔧 API Reference

### Next.js API routes (frontend bridge)

```text
POST /api/chat                   # Stream chat via AI SDK providers
POST /api/ai/chat                # Tool-enabled chat endpoint
GET  /api/models                 # Available model list
GET  /api/ai-overview            # Providers/feature overview
GET  /api/mcp/servers            # List MCP servers
GET  /api/mcp/servers/[name]     # MCP server detail
POST /api/subscriptions/payment  # Subscription payment webhook/flow
POST /api/verify-payment         # Proxy to Convex payment verification
```

### Convex HTTP routes (backend)

```text
POST /stream-chat                # HTTP streaming fallback
POST /generateUploadUrl          # Get upload URL
POST /registerUpload             # Persist upload metadata
GET  /serveStorage               # Serve stored files
POST /verify-payment             # Verify Solana payments
# Convex Auth routes are also exposed via httpRouter (see auth.addHttpRoutes)
```

Note: Most application logic uses Convex queries/mutations/actions directly from the client. The REST-like endpoints above exist for streaming fallback, uploads, and integration surfaces.

## 🔐 Security Features

### Authentication

- **Solana wallet sign-in** with nonce challenge (Convex Auth)
- Optional legacy **JWT** for bridge routes only

### Input & Transport

- **Zod** validation across server boundaries
- **CORS** allowlist with environment-configurable origins
- **Rate limiting** for HTTP endpoints

### Data Protection

- **Per-wallet isolation** for documents and chats
- **Access controls** enforced in Convex functions
- **Audit-friendly logging** via structured logger

## 🚀 Deployment

1. Build

```bash
bun build
```

2. Deploy Convex

```bash
cd packages/backend
npx convex deploy
```

3. Deploy Web (e.g., Vercel)

```bash
cd apps/web
vercel deploy
```

4. Configure Environment

- Set Convex env vars (providers, CORS, Solana, limits) in the Convex dashboard/CLI
- Set web `.env` (NEXT_PUBLIC_CONVEX_URL, provider keys as needed)

## 🛡️ Operational Tips

- Never commit secrets; use environment variables
- Rotate provider keys and JWT secrets regularly if enabled
- Monitor rate limits and model usage
- Keep dependencies updated

## 🤝 Contributing

1. Fork the repository
2. Create a branch: `git checkout -b feature/amazing-feature`
3. Add tests and ensure quality: `bun check && bun check-types`
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📄 License

MIT — see [LICENSE](LICENSE).

## 🙏 Acknowledgments

- [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack)
- [Convex](https://convex.dev)
- [Solana](https://solana.com)
- [Shadcn UI](https://ui.shadcn.com)
