# Foundation Codebase Decision

**Decision**: Start with **ara-bidstudio (main app)** as the foundation

**Date**: 2026-01-19

---

## 🎯 Recommended Foundation

### **Primary Choice**: `ara-bidstudio/` (main app)

**Path**: `/Users/alias/Downloads/_ACTIVE/ara-bidstudio/ara-bidstudio/`

**Size**: 193MB (includes build artifacts, will be smaller clean)

---

## ✅ Why ara-bidstudio/main?

### 1. **Clerk Already Configured** ✅
```bash
# Already set up in codebase
.env.example:
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
  CLERK_SECRET_KEY=

# Middleware exists
src/middleware.ts (or add it)
```

### 2. **Multi-Tenant Architecture Working** ✅
```typescript
// Already has URL-based tenant structure
src/app/(bid)/
  - Multi-tenant routing
  - Tenant context extraction
  - Organization-based access
```

### 3. **Tech Stack Matches Plan** ✅
| Required | ara-bidstudio/main | Status |
|----------|-------------------|--------|
| Next.js 15+ | ✅ Next.js 15+ | Ready |
| React 19 | ✅ React 19 | Ready |
| Mastra Agents | ✅ Mastra 0.12-0.16 | Ready |
| Convex Backend | ✅ Convex 1.14 | Ready |
| CopilotKit | ✅ CopilotKit 1.10.3 | Ready |
| TypeScript | ✅ TypeScript 5 | Ready |
| Tailwind CSS 4 | ✅ Tailwind CSS 4 | Ready |

### 4. **Core Features Implemented** ✅
```typescript
// Already has:
src/app/components/
├── AraBidDashboard.tsx      // Dashboard UI
├── KanbanBoard.tsx          // Kanban board
├── ProjectContainer.tsx     // Project management
├── CopilotSidebarClient.tsx // AI chat integration
├── TeamSection.tsx          // Team management
└── UsersModal.tsx           // User management

src/mastra/
├── agents/                  // Agent definitions
├── tools/                   // Agent tools
└── index.ts                 // Mastra setup

src/lib/
├── docsMcpClient.ts         // Document processing (MCP)
├── embedding.ts             // Vector embeddings
├── auth.ts                  // Clerk auth utilities
└── tenant.ts                // Tenant management
```

### 5. **Document Processing Foundation** ✅
```typescript
// MCP server for document processing
scripts/start-mcp.mjs         // MCP server starter
src/lib/docsMcpClient.ts       // MCP client
package.json:
  "dev:mcp": "node scripts/start-mcp.mjs"
  "dev:full": "concurrently -k -n mcp,web..."
```

### 6. **Package.json Scripts Match** ✅
```json
{
  "dev": "next dev --turbopack",
  "dev:agent": "mastra dev",
  "dev:mcp": "node scripts/start-mcp.mjs",
  "dev:full": "concurrently -k -n mcp,web...",
  "build": "next build",
  "cli": "tsx src/cli/index.ts"
}
```

---

## 📋 Foundation Structure

```
ara-bidstudio/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Auth routes (sign-in, sign-up)
│   │   ├── (bid)/            # Multi-tenant bid routes ✅
│   │   ├── api/              # API routes ✅
│   │   │   └── copilotkit/    # CopilotKit runtime ✅
│   │   ├── components/       # React components ✅
│   │   ├── lib/              # Utilities ✅
│   │   ├── mastra/           # Agent orchestration ✅
│   │   └── cli/              # CLI tools ✅
│   ├── convex/               # Convex backend ✅
│   │   ├── schema.ts
│   │   └── functions/
│   └── middleware.ts         # Add Clerk middleware
├── public/                   # Static assets
├── scripts/                  # Build/startup scripts
├── .env.example              # Env variables ✅
├── package.json              # Dependencies ✅
├── bun.lock                  # Bun lock file
└── tsconfig.json             # TypeScript config
```

---

## 🎨 What to Extract from Other Projects

### From **contract-analysis** (608KB)

Extract these features:

| Feature | Location | Complexity | Value |
|---------|----------|------------|-------|
| **Real-Time Annotations** | Components | Medium | High |
| **Corpus Forking** | Lib/Convex | Medium | High |
| **File Encryption** | Lib | Low | Medium |
| **Langflow Integration** | Tools | High | Medium |

```bash
# Extract command
cp -r ara-bidstudio-collection/contract-analysis/src/lib/annotations \
      ara-bidstudio/src/lib/annotations

cp -r ara-bidstudio-collection/contract-analysis/src/lib/corpus \
      ara-bidstudio/src/lib/corpus
```

### From **OpenContracts** (14MB frontend)

Extract these features:

| Feature | Location | Complexity | Value |
|---------|----------|------------|-------|
| **Virtualized PDF Viewer** | PDF components | High | Very High |
| **Pluggable Parser Pipeline** | Parser system | High | Very High |
| **Dual-Layer Annotations** | Annotation layer | Medium | High |
| **PAWLs Format** | Data structures | Medium | High |

```bash
# Extract command
cp -r OpenContracts/frontend/src/components/pdf-viewer \
      ara-bidstudio/src/app/components/pdf-viewer

cp -r OpenContracts/frontend/src/lib/parsers \
      ara-bidstudio/src/lib/parsers
```

---

## 🚀 Migration Strategy

### Phase 1: Foundation Setup (Week 1)

**Start with**: ara-bidstudio/main (clean slate)

```bash
# 1. Create clean foundation
mkdir ara-bidstudio-foundation
cd ara-bidstudio-foundation

# 2. Copy main app core
cp -r ../ara-bidstudio/* .

# 3. Remove build artifacts
rm -rf .next node_modules

# 4. Install dependencies
bun install

# 5. Configure Clerk
# (Already has Clerk in package.json)
# Just need to add middleware.ts

# 6. Test
bun run dev
```

### Phase 2: Extract Enhancements (Week 2)

```bash
# From contract-analysis
cp -r ../ara-bidstudio-collection/contract-analysis/src/lib/annotations \
      src/lib/features/annotations

cp -r ../ara-bidstudio-collection/contract-analysis/src/lib/corpus \
      src/lib/features/corpus

# From OpenContracts (React components only)
cp -r ../ara-bidstudio-collection/OpenContracts/frontend/src/components/PDFViewer \
      src/app/components/pdf-viewer
```

### Phase 3: Integration (Week 3-4)

```typescript
// Integrate extracted features
src/
├── app/
│   ├── components/
│   │   ├── pdf-viewer/        # From OpenContracts
│   │   ├── annotations/        # From contract-analysis
│   │   └── corpus/             # From contract-analysis
│   └── lib/
│       ├── parsers/           # From OpenContracts
│       ├── features/
│       │   ├── annotations/
│       │   └── corpus/
```

---

## 📊 Comparison Matrix

| Feature | ara-bidstudio/main | contract-analysis | OpenContracts | Winner |
|---------|-------------------|------------------|---------------|--------|
| **Clerk Auth** | ✅ Ready | ❌ WorkOS | ❌ Custom | **main** |
| **Multi-Tenant** | ✅ Ready | ✅ Ready | ❌ None | **main** |
| **Next.js 15** | ✅ Ready | ✅ Ready | ❌ N/A | **main** |
| **Mastra Agents** | ✅ Ready | ✅ Ready | ❌ N/A | **main** |
| **Convex Backend** | ✅ Ready | ✅ Ready | ❌ Django | **main** |
| **CopilotKit** | ✅ Ready | ❌ No | ❌ No | **main** |
| **Kanban Board** | ✅ Ready | ❌ No | ❌ No | **main** |
| **PDF Viewer** | ⚠️ Basic | ⚠️ Basic | ✅ Advanced | **OpenContracts** |
| **Annotations** | ⚠️ Basic | ✅ Advanced | ✅ Advanced | **contract-analysis** |
| **Corpus Forking** | ❌ No | ✅ Yes | ❌ No | **contract-analysis** |
| **Parser Pipeline** | ⚠️ MCP only | ❌ No | ✅ Pluggable | **OpenContracts** |
| **Real-Time Sync** | ✅ Convex | ✅ Convex | ✅ Websockets | **main** |

---

## 🎯 Recommendation: Hybrid Approach

### Foundation: ara-bidstudio/main (70%)
- Core architecture
- Authentication (Clerk)
- Multi-tenancy
- Mastra agents
- Convex backend
- CopilotKit
- Kanban board

### Enhancements from contract-analysis (15%)
- Real-time annotations
- Corpus forking
- File encryption
- Langflow integration (optional)

### Enhancements from OpenContracts (15%)
- Virtualized PDF viewer
- Pluggable parser pipeline
- Dual-layer annotations
- PAWLs data format

---

## ✅ Final Decision

**Start with**: **ara-bidstudio/main** (193MB)

**Reasons**:
1. ✅ Clerk authentication already configured
2. ✅ Multi-tenant URL structure working
3. ✅ Tech stack 100% matches plan
4. ✅ Mastra + CopilotKit integrated
5. ✅ Convex backend ready
6. ✅ Most features already implemented
7. ✅ Package scripts match development workflow

**Enhancement Strategy**:
- Week 1: Clean up ara-bidstudio/main
- Week 2: Extract PDF viewer from OpenContracts
- Week 3: Extract annotations from contract-analysis
- Week 4: Integrate and test

**Total Foundation Effort**: 2-3 weeks (vs 8+ weeks starting from scratch)

---

## 🚀 Next Steps

1. ✅ **Clean ara-bidstudio/main**
   - Remove build artifacts
   - Update dependencies
   - Verify Clerk setup

2. ⏳ **Add Clerk Middleware**
   ```typescript
   // middleware.ts
   import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

   const isProtectedRoute = createRouteMatcher([
     '/t/(.*)/dashboard',
     '/t/(.*)/bids',
   ]);

   export default clerkMiddleware((auth, req) => {
     if (isProtectedRoute(req)) {
       auth().protect();
     }
   });
   ```

3. ⏳ **Extract PDF Viewer** (from OpenContracts)
4. ⏳ **Extract Annotations** (from contract-analysis)
5. ⏳ **Integrate & Test**

---

**Status**: Ready to begin
**Foundation**: ara-bidstudio/main app
**Estimated Time**: 2-3 weeks to enhanced foundation

**Commit to make**: Create clean foundation from ara-bidstudio/main
