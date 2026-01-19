# ARA Property Services - Ideal Bid & Tender Studio Platform

**Vision**: S-Tier Agentic Collaborative Platform for Facility Management Bids & Tenders

**Status**: Strategic Architecture Plan
**Version**: 1.0
**Date**: 2026-01-19

---

## 🎯 Executive Summary

Build a world-class bid and tender management platform that combines:
- **Agentic AI** - Intelligent agents that understand, analyze, and improve bids
- **Real-Time Collaboration** - Multi-user workflows with live presence
- **Document Intelligence** - Advanced PDF/DOCX processing with semantic understanding
- **S-Tier UX** - Delightful, fast, intuitive interface
- **Enterprise-Grade** - Multi-tenant, secure, scalable architecture

**Target Users**: ARA Property Services bid teams, facility managers, stakeholders

---

## 🏗️ Core Architecture

### Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Next.js 15 + React 19 | Latest App Router, Server Components, RSC |
| **State Management** | Jotai + Zustand | Atomic state for UI, global state for sync |
| **Real-Time** | Convex 1.14 + Liveblocks | Convex for data, Liveblocks for presence |
| **AI Agents** | Mastra 0.16 + LangGraph | Mastra orchestration + LangGraph workflows |
| **Document AI** | Docling + Unstructured | ML-based layout parsing + entity extraction |
| **Vector DB** | LibSQL + pgvector | Fast local + production vector search |
| **Auth** | Clerk + WorkOS | Clerk primary, WorkOS for enterprise SSO |
| **Streaming** | Vercel AI SDK + Server-Sent Events | Real-time AI responses |
| **File Storage** | Cloudflare R2 + Encryption | S3-compatible with edge caching |
| **Observability** | OpenTelemetry + New Relic | Production monitoring |
| **Styling** | Tailwind CSS 4 + Framer Motion | Utility-first + smooth animations |
| **Components** | Shadcn/ui + Radix | Accessible, customizable primitives |

---

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                  │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Web App    │  │   Mobile     │  │    CLI       │             │
│  │  (Next.js)   │  │  (React Nat) │  │   (Node)     │             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
│         │                 │                 │                      │
│         └─────────────────┼─────────────────┘                      │
│                           │                                        │
│         ┌─────────────────▼─────────────────┐                      │
│         │     Agentic State Layer (Jotai)    │                      │
│         │  - Agent State Atoms               │                      │
│         │  - Presence Indicators             │                      │
│         │  - Real-Time Sync                  │                      │
│         └─────────────────┬─────────────────┘                      │
└──────────────────────────┼─────────────────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────────────────┐
│                      API & ORCHESTRATION                             │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Next.js     │  │   Mastra     │  │  Convex      │             │
│  │  API Routes  │  │   Agents     │  │  Functions   │             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
│         │                 │                 │                      │
│         └─────────────────┼─────────────────┘                      │
│                           │                                        │
│  ┌────────────────────────▼────────────────────────┐               │
│  │         Workflow Engine (LangGraph)             │               │
│  │  - Bid Analysis Flow                            │               │
│  │  - Tender Review Flow                           │               │
│  │  - Collaboration Flow                            │               │
│  └────────────────────────┬────────────────────────┘               │
└───────────────────────────┼────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────────┐
│                      AI & DOCUMENT PROCESSING                         │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Docling    │  │  Unstructured│  │  OpenAI      │             │
│  │  Parser      │  │  Extractors  │  │  / Gemini    │             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
│         │                 │                 │                      │
│         └─────────────────┼─────────────────┘                      │
│                           │                                        │
│  ┌────────────────────────▼────────────────────────┐               │
│  │         Document Intelligence Layer            │               │
│  │  - PDF → PAWLs (tokens + coordinates)          │               │
│  │  - Entity Extraction (parties, dates, values)  │               │
│  │  - Vector Embeddings (semantic search)          │               │
│  │  - Classification (contract type, risk level)   │               │
│  └────────────────────────┬────────────────────────┘               │
└───────────────────────────┼────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────────┐
│                      DATA & STORAGE                                    │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Convex     │  │   LibSQL     │  │  R2 Storage  │             │
│  │  (Real-Time) │  │  (Vector DB) │  │  (Files)     │             │
│  └──────────────┘  └──────────────┘  └───────────────┘            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 S-Tier UI/UX Design Principles

### 1. **Immediate Value (Zero-Friction Onboarding)**

```
First 10 Seconds:
├── 0-2s:   Loading skeleton with brand animation
├── 2-5s:   Tenant dashboard ready (incremental loading)
├── 5-8s:   Recent bids loaded with AI summaries
└── 8-10s:  Agent greeting + quick actions available
```

**Implementation**:
- Stream rendering with React Suspense
- Progressive data loading (critical path first)
- Optimistic UI updates
- Skeleton screens for everything

### 2. **Contextual AI (Always There, Never in the Way)**

```typescript
// AI Assistant that adapts to context
<AIAssistant
  context={bidContext}
  mode="sidebar" // | "drawer" | "inline" | "modal"
  capabilities={{
    analyze: true,
    compare: true,
    suggest: true,
    chat: true
  }}
/>
```

**States**:
- **Idle**: Collapsed sidebar, subtle indicator
- **Active**: Expanded with contextual suggestions
- **Processing**: Animated progress with transparency
- **Results**: Rich cards with actions

### 3. **Multiplayer Presence (See Who's Working)**

```
Bid Document View:
├── Top right: Avatar stack (5 people viewing)
├── Highlights: Other users' cursor positions
├── Live edits: See annotations appear in real-time
└── Activity feed: "Sarah added note to clause 4.2"
```

**Tech**: Liveblocks presence + Convex real-time

### 4. **Command Palette (Power User Paradise)**

```
Cmd+K (anywhere):
├── Search bids, documents, contacts
├── Quick actions (upload, create, share)
├── Agent commands (analyze, compare, summarize)
├── Navigation (jump to any bid/section)
└── Settings (tenant, profile, integrations)
```

**Implementation**: Cmdk component + keyboard shortcuts

### 5. **Delightful Micro-Interactions**

```typescript
// Examples:
- Document upload: Progress bar + animated preview
- Task complete: Confetti burst (subtle, not distracting)
- AI thinking: Animated dots with personality
- Error states: Helpful recovery options
- Loading states: Skeleton + explanatory text
```

**Tech**: Framer Motion + CSS animations

### 6. **Responsive Dashboard (Information Density)**

```
Desktop (1920px):
├── Left: Navigation (collapsible)
├── Center: Kanban board (3 columns)
├── Right: AI assistant + Activity feed
└── Top: Tenant switcher + Search

Tablet (768px):
├── Full-width Kanban (horizontal scroll)
├── Collapsible sidebars
└── Bottom navigation for mobile

Mobile (375px):
├── Tab-based navigation
├── Stacked cards instead of columns
└── FAB for quick actions
```

---

## 🤖 Agentic AI Architecture

### Agent Types

#### 1. **Bid Analysis Agent**

```typescript
// src/mastra/agents/bidAnalysis.ts
export const bidAnalysisAgent = {
  name: 'bid-analysis',
  description: 'Analyzes bid documents and extracts key information',
  instructions: `
    You are an expert bid analyst for ARA Property Services.
    Your role is to:
    1. Extract critical bid information (value, timeline, requirements)
    2. Identify risk factors and red flags
    3. Compare against historical bids
    4. Suggest optimization strategies
    5. Highlight unique selling points

    Always cite specific sections when making claims.
    Provide confidence scores for all assessments.
  `,

  tools: [
    documentLibraryTool,       // Search document corpus
    bidComparisonTool,          // Compare with similar bids
    riskAssessmentTool,         // Calculate risk scores
    pricingAnalyzerTool,        // Analyze pricing structure
    requirementExtractorTool,   // Extract requirements
  ],

  memory: {
    type: 'libsql',
    schema: bidAnalysisMemorySchema
  }
};
```

**Capabilities**:
- Automatic bid summary generation
- Risk scoring (1-10) with explanations
- Competitive analysis
- Pricing optimization suggestions
- Requirements tracking matrix

#### 2. **Tender Review Agent**

```typescript
export const tenderReviewAgent = {
  name: 'tender-review',
  description: 'Reviews tender documents and ensures compliance',

  tools: [
    complianceCheckerTool,      // Check against requirements
    clauseAnalyzerTool,         // Analyze legal clauses
    deadlineTrackerTool,        // Track submission deadlines
    documentCompletenessTool,   // Verify all docs present
  ],

  workflows: [
    'tender-ingestion',          // Initial document processing
    'compliance-review',         // Compliance checking
    'gap-analysis',              // Identify missing requirements
    'submission-readiness',      // Ready to submit check
  ]
};
```

#### 3. **Collaboration Agent**

```typescript
export const collaborationAgent = {
  name: 'collaboration',
  description: 'Facilitates team collaboration on bids',

  tools: [
    taskAssignmentTool,         // Suggest task assignments
    notificationTool,            // Smart notifications
    meetingSchedulerTool,        // Schedule bid reviews
    actionItemExtractorTool,     // Extract action items from chats
  ],

  capabilities: [
    'suggest-reviewers',         // Based on expertise
    'highlight-conflicts',       // Identify conflicting changes
    'track-deadlines',           // Monitor task progress
    'summarize-discussions',     // Meeting summaries
  ]
};
```

#### 4. **Document Intelligence Agent**

```typescript
export const documentAgent = {
  name: 'document-intelligence',
  description: 'Processes and understands bid documents',

  tools: [
    pdfParserTool,               // Docling integration
    entityExtractorTool,         // Extract parties, dates, values
    clauseClassifierTool,        // Categorize clauses
    similaritySearchTool,        // Find similar clauses
    redactionTool,               // Redact sensitive info
  ],

  pipelines: [
    'pdf-to-pawls',              // Convert to structured tokens
    'entity-extraction',          // Extract named entities
    'vector-embedding',           // Generate embeddings
    'classification',             // Classify document type
  ]
};
```

### Agent Orchestration (LangGraph)

```typescript
// src/mastra/workflows/bidProcessing.ts
import { StateGraph } from "@langchain/langgraph";

const bidProcessingWorkflow = new StateGraph({
  channels: {
    documents: { value: [], reducer: 'append' },
    analysis: { value: null },
    risks: { value: [] },
    suggestions: { value: [] },
  }
})
  .addNode("ingest", ingestDocuments)
  .addNode("parse", parseDocuments)          // Docling
  .addNode("analyze", analyzeBid)            // Bid Analysis Agent
  .addNode("assess-risks", assessRisks)       // Risk Assessment
  .addNode("compare", compareWithHistory)     // Historical comparison
  .addNode("suggest", generateSuggestions)    // Optimization suggestions
  .addNode("notify", notifyTeam)             // Collaboration Agent
  .addEdge("ingest", "parse")
  .addEdge("parse", "analyze")
  .addEdge("analyze", "assess-risks")
  .addEdge("assess-risks", "compare")
  .addEdge("compare", "suggest")
  .addEdge("suggest", "notify")
  .setEntryPoint("ingest")
  .setFinishPoint("notify");
```

---

## 📄 Document Processing Pipeline

### 1. **Ingestion → Intelligence Flow**

```
┌─────────────┐
│   Upload    │ (Drag-drop, paste, or API)
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│     File Processing Queue           │
│  - Show progress per file           │
│  - Batch processing support         │
│  - Retry failed uploads             │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│      Docling Parser                 │
│  - Extract text + layout            │
│  - Identify tables, headers, lists  │
│  - Generate PAWLs JSON              │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   Entity Extraction (Unstructured)  │
│  - Parties (buyer, seller, contacts) │
│  - Dates (deadlines, milestones)    │
│  - Values (prices, quantities)      │
│  - Clauses (obligations, penalties)  │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   Vector Embeddings (OpenAI)         │
│  - Chunk by semantic boundaries      │
│  - Generate embeddings              │
│  - Store in LibSQL with pgvector     │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   Classification                   │
│  - Bid type (services, goods, etc)  │
│  - Risk level (low, medium, high)    │
│  - Complexity score                │
│  - Suggested reviewers              │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   AI Analysis (Mastra Agents)       │
│  - Bid summary                      │
│  - Risk assessment                  │
│  - Competitive analysis             │
│  - Optimization suggestions         │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   Ready for Review                  │
│  - Notify team                      │
│  - Add to Kanban board              │
│  - Enable collaborative features    │
└─────────────────────────────────────┘
```

### 2. **PDF Viewer Architecture** (from OpenContracts)

```typescript
// Virtualized PDF Rendering
interface PDFViewerState {
  pages: PDFPage[];              // All pages
  visibleRange: [number, number]; // Currently visible
  zoomLevel: number;
  scrollPosition: number;
}

// Binary search for visible pages O(log n)
function getVisiblePages(
  pages: PDFPage[],
  scrollTop: number,
  viewportHeight: number
): PDFPage[] {
  const startIndex = binarySearchFloor(pages, scrollTop);
  const endIndex = binarySearchFloor(pages, scrollTop + viewportHeight);
  return pages.slice(startIndex, endIndex + 2); // +2 for overscan
}

// Dual-layer rendering
<PDFCanvas>
  <Layer type="document">  {/* Original PDF */}
  <Layer type="knowledge"> {/* Annotations, highlights */}
    <Annotation annotations={annotations} />
    <Highlight sections={sections} />
  </Layer>
</PDFCanvas>
```

**Performance Optimizations**:
- Virtualization: Only render visible pages + overscan
- Height caching: Store page heights per zoom level
- Lazy loading: Load high-res images on demand
- Web Workers: Parse PDFs off main thread

### 3. **Annotation System**

```typescript
// Annotation types
type Annotation = {
  id: string;
  type: 'highlight' | 'comment' | 'redaction' | 'bookmark';
  position: {
    pageIndex: number;
    boundingBox: BoundingBox;
    text?: string;
  };
  content: string;
  author: User;
  createdAt: Date;
  replies?: Annotation[];
};

// Real-time sync via Convex
const useAnnotationSync = (documentId: string) => {
  const annotations = useQuery(
    api.annotations.list,
    { documentId }
  );

  const addAnnotation = useMutation(api.annotations.create);

  return {
    annotations,
    addAnnotation: (data) => addAnnotation({ ...data, documentId }),
    // Auto-syncs via Convex real-time
  };
};
```

---

## 🔄 Bid & Tender Workflows

### Workflow 1: New Tender Opportunity

```
Trigger: New tender document received

Step 1: Ingest & Parse
├── Upload documents (PDF, DOCX, Excel)
├── Auto-classify tender type
├── Extract key dates (deadline, submission)
└── Create tender record

Step 2: AI Pre-Analysis
├── Generate executive summary
├── Identify requirements (mandatory vs optional)
├── Calculate complexity score
├── Assess risk level
└── Suggest team assignments

Step 3: Planning
├── Create project in Kanban board
├── Break down into tasks (research, pricing, writing)
├── Assign to team members
├── Set internal deadlines
└── Schedule check-ins

Step 4: Collaborative Drafting
├── Writers draft responses
├── SMEs review technical sections
├── Pricing team builds cost model
├── Legal reviews contract terms
└── All changes visible in real-time

Step 5: AI Quality Check
├── Compliance verification
├── Completeness check
├── Consistency review
├── Risk assessment
└── Score prediction

Step 6: Final Review
├── Stakeholder approval
├── Document generation
├── Format validation
└── Submission ready
```

### Workflow 2: Bid Comparison

```
Trigger: Compare 2+ bids

Step 1: Selection
├── Choose bids to compare
└── Select comparison criteria

Step 2: AI Analysis
├── Extract key metrics from each bid
├── Normalize pricing structures
├── Identify unique strengths
└── Highlight risks/gaps

Step 3: Visualization
├── Side-by-side comparison table
├── Pricing charts
├── Requirements coverage matrix
└── Risk comparison heatmap

Step 4: Recommendation
├── Score each bid (weighted criteria)
├── Generate recommendation
├── Explain reasoning
└── Suggest negotiation points
```

### Workflow 3: Collaborative Review

```
Trigger: Document ready for review

Step 1: Assignment
├── Assign reviewers (SMEs, legal, pricing)
├── Set review deadlines
└── Specify review focus areas

Step 2: In-Context Review
├── Reviewers open document
├── Add comments/annotations
├── See other reviewers' cursors/marks
└── Discuss in contextual chat

Step 3: Synthesis
├── AI summarizes all feedback
├── Categorize comments (must-fix, should-fix, nice-to-have)
├── Identify conflicting feedback
└── Prioritize by impact

Step 4: Resolution
├── Writers address feedback
├── Mark items as resolved
├── Request clarification if needed
└── Re-submit for approval

Step 5: Approval
├── Final stakeholder sign-off
├── Mark as approved
└── Move to next stage
```

---

## 🎯 Key Features by Priority

### P0 - Must Have (MVP)

#### 1. **Multi-Tenant Bid Dashboard**
```
/t/ara-property-services/dashboard
├── Active bids (Kanban view)
├── Upcoming deadlines (timeline)
├── Recent activity (feed)
└── Quick actions (FAB)
```

#### 2. **Document Upload & Processing**
- Drag-drop upload
- Progress tracking
- Auto-parsing
- Vector search

#### 3. **AI Bid Assistant**
- Chat interface
- Bid summarization
- Question answering
- Suggestions

#### 4. **Real-Time Collaboration**
- Multi-user editing
- Presence indicators
- Comments/annotations
- Activity feed

#### 5. **Basic Security**
- Clerk authentication
- Tenant isolation
- Role-based access
- Audit logging

### P1 - Should Have (V1)

#### 6. **Advanced PDF Viewer**
- Virtualized rendering
- Annotation tools
- Search/highlight
- Export with annotations

#### 7. **Workflow Automation**
- Bid templates
- Task assignments
- Deadline reminders
- Approval workflows

#### 8. **Analytics Dashboard**
- Win rate tracking
- Bid pipeline
- Team performance
- Risk trends

#### 9. **Integrations**
- CRM (HubSpot/Salesforce)
- E-signature (DocuSign)
- Storage (Google Drive, OneDrive)
- Communication (Slack, Teams)

#### 10. **Advanced AI**
- Competitive analysis
- Pricing optimization
- Risk prediction
- Quality scoring

### P2 - Nice to Have (V2)

#### 11. **Mobile Apps**
- iOS/Android native
- Offline mode
- Push notifications
- Biometric auth

#### 12. **Advanced Collaboration**
- Video calls (embedded)
- Screen sharing
- Version history
- Branching/merging

#### 13. **Custom Workflows**
- Workflow builder
- Custom triggers
- Webhook integrations
- API access

#### 14. **Enterprise Features**
- SSO (SAML, OIDC)
- SCIM provisioning
- Advanced audit logs
- Compliance reports

---

## 🗄️ Data Model

### Core Entities

```typescript
// convex/schema.ts
export default defineSchema({
  // Tenants (multi-tenant isolation)
  tenants: v.object({
    id: v.id("tenants"),
    name: v.string(),
    slug: v.string(), // URL-based tenant ID
    logo: v.optional(v.string()),
    settings: v.optional(v.object({
      ssoEnabled: v.boolean(),
      default reviewers: v.array(v.id("users")),
    })),
  }),

  // Bids & Tenders
  bids: v.object({
    id: v.id("bids"),
    tenantId: v.id("tenants"),
    title: v.string(),
    type: v.enum(["tender", "rfp", "rfi", "quote"]),
    status: v.enum(["draft", "in-review", "submitted", "won", "lost"]),
    value: v.optional(v.number()),
    deadline: v.optional(v.number()), // Unix timestamp
    description: v.optional(v.string()),
    requirements: v.array(v.id("requirements")),
    documents: v.array(v.id("documents")),
    assignees: v.array(v.id("users")),
    aiSummary: v.optional(v.string()),
    riskScore: v.optional(v.number()),
    complexityScore: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // Documents
  documents: v.object({
    id: v.id("documents"),
    tenantId: v.id("tenants"),
    bidId: v.optional(v.id("bids")),
    filename: v.string(),
    mimeType: v.string(),
    size: v.number(),
    storageKey: v.string(), // R2 storage
    pawls: v.optional(v.any()), // Parsed document structure
    entities: v.optional(v.array(v.any())), // Extracted entities
    embeddingsGenerated: v.boolean(),
    classification: v.optional(v.object({
      type: v.string(),
      confidence: v.number(),
    })),
    uploadedBy: v.id("users"),
    createdAt: v.number(),
  }),

  // Annotations
  annotations: v.object({
    id: v.id("annotations"),
    documentId: v.id("documents"),
    type: v.enum(["highlight", "comment", "redaction", "bookmark"]),
    position: v.object({
      pageIndex: v.number(),
      boundingBox: v.object({
        x: v.number(),
        y: v.number(),
        width: v.number(),
        height: v.number(),
      }),
      text: v.optional(v.string()),
    }),
    content: v.string(),
    authorId: v.id("users"),
    parentId: v.optional(v.id("annotations")), // For replies
    resolved: v.boolean(),
    createdAt: v.number(),
  }),

  // Requirements
  requirements: v.object({
    id: v.id("requirements"),
    bidId: v.id("bids"),
    text: v.string(),
    type: v.enum(["mandatory", "optional", "nice-to-have"]),
    category: v.string(),
    status: v.enum(["pending", "in-progress", "complete", "not-applicable"]),
    assigneeId: v.optional(v.id("users")),
    dueDate: v.optional(v.number()),
    source: v.object({ // Where requirement came from
      documentId: v.id("documents"),
      pageIndex: v.number(),
      clause: v.string(),
    }),
  }),

  // Users (via Clerk)
  users: v.object({
    id: v.id("users"),
    clerkId: v.string(), // Clerk user ID
    tenantId: v.id("tenants"),
    name: v.string(),
    email: v.string(),
    role: v.enum(["admin", "manager", "writer", "reviewer", "viewer"]),
    avatar: v.optional(v.string()),
    expertise: v.array(v.string()), // For smart assignments
  }),

  // Activities (audit log)
  activities: v.object({
    id: v.id("activities"),
    tenantId: v.id("tenants"),
    type: v.enum(["bid-created", "document-uploaded", "comment-added", "status-changed"]),
    actorId: v.id("users"),
    targetId: v.string(), // ID of affected resource
    targetType: v.string(), // Type of resource
    metadata: v.optional(v.any()), // Additional context
    createdAt: v.number(),
  }),
});
```

---

## 🔒 Security Architecture

### Multi-Layer Security

```
Layer 1: Authentication
├── Clerk (primary)
│   - Email/password
│   - OAuth (Google, Microsoft)
│   - MFA support
└── WorkOS (enterprise)
    - SAML SSO
    - OIDC
    - SCIM provisioning

Layer 2: Authorization
├── Role-Based Access Control (RBAC)
│   - Admin, Manager, Writer, Reviewer, Viewer
├── Object-Level Permissions
│   - Bid-level access
│   - Document-level access
└── Tenant Isolation
    - All queries filtered by tenantId
    - No cross-tenant data leakage

Layer 3: Data Protection
├── Encryption at Rest (R2)
├── Encryption in Transit (TLS 1.3)
├── Field-Level Encryption (sensitive fields)
└── Data Retention Policies

Layer 4: Audit & Compliance
├── Comprehensive Activity Logging
├── Session Management
├── GDPR Compliance
└── SOC 2 Type II Ready
```

### Security Best Practices

```typescript
// 1. Tenant Isolation Middleware
export const tenantMiddleware = async (
  req: NextRequest,
  ctx: ExecutionContext
) => {
  const tenantSlug = req.headers.get("X-Tenant-Slug");
  if (!tenantSlug) {
    return new Response("Missing tenant", { status: 400 });
  }

  const tenant = await ctx.runMutation(
    api.tenants.getBySlug,
    { slug: tenantSlug }
  );

  if (!tenant) {
    return new Response("Tenant not found", { status: 404 });
  }

  // Inject tenant into context for all subsequent queries
  return NextResponse.next({
    headers: {
      "X-Tenant-ID": tenant.id,
    },
  });
};

// 2. Permission Checks
export const checkPermission = (
  user: User,
  resource: { tenantId: string },
  action: "read" | "write" | "delete"
) => {
  if (user.tenantId !== resource.tenantId) {
    throw new Error("Cross-tenant access denied");
  }

  const permissions = {
    admin: ["read", "write", "delete"],
    manager: ["read", "write"],
    writer: ["read", "write"],
    reviewer: ["read"],
    viewer: ["read"],
  };

  if (!permissions[user.role].includes(action)) {
    throw new Error("Insufficient permissions");
  }
};

// 3. Audit Logging
export const logActivity = async (
  ctx: ExecutionContext,
  data: {
    type: string;
    actorId: string;
    targetId: string;
    targetType: string;
    metadata?: any;
  }
) => {
  await ctx.runMutation(api.activities.log, data);
};
```

---

## 📊 Analytics & Insights

### Dashboard Metrics

```typescript
// Bid Pipeline Metrics
interface BidPipelineMetrics {
  total: number;
  byStatus: {
    draft: number;
    inReview: number;
    submitted: number;
    won: number;
    lost: number;
  };
  winRate: number; // won / (won + lost)
  avgValue: number;
  avgDuration: number; // days from draft to submission
}

// Team Performance
interface TeamPerformance {
  userId: string;
  userName: string;
  bidsParticipated: number;
  bidsAuthored: number;
  bidsReviewed: number;
  avgReviewTime: number; // hours
  approvalRate: number; // % of their reviews approved
}

// Risk Trends
interface RiskTrends {
  period: "week" | "month" | "quarter";
  avgRiskScore: number;
  highRiskCount: number;
  riskFactors: {
    factor: string;
    count: number;
    trend: "increasing" | "decreasing" | "stable";
  }[];
}
```

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)

**Goal**: Core multi-tenant platform with basic AI

```
Week 1-2: Architecture & Setup
├── Initialize Next.js 15 project
├── Configure Convex + Clerk
├── Set up tenant isolation
├── Create base UI components (shadcn/ui)
└── Implement authentication flow

Week 3-4: Core Features
├── Bid CRUD operations
├── Document upload (basic)
├── Simple AI chat (OpenAI)
├── Kanban board
└── Basic collaboration (comments)
```

**Deliverables**:
- Working multi-tenant app
- Bid management
- Document upload
- Basic AI assistant

### Phase 2: Document Intelligence (Weeks 5-8)

**Goal**: Advanced document processing

```
Week 5-6: Docling Integration
├── Implement PDF parser
├── Generate PAWLs structure
├── Extract entities
├── Build virtualized viewer
└── Add annotation system

Week 7-8: Vector Search & AI
├── Implement embeddings (OpenAI)
├── Store in LibSQL with pgvector
├── Semantic search
├── Enhanced AI chat with context
└── Bid summarization
```

**Deliverables**:
- Full PDF viewer
- Annotation system
- Semantic search
- Enhanced AI

### Phase 3: Collaboration & Workflows (Weeks 9-12)

**Goal**: Real-time collaboration

```
Week 9-10: Real-Time Features
├── Liveblocks integration (presence)
├── Real-time annotations
├── Activity feed
├── Notification system
└── Multi-user cursors

Week 11-12: Workflows
├── Workflow engine (LangGraph)
├── Bid templates
├── Task assignments
├── Deadline reminders
└── Approval processes
```

**Deliverables**:
- Full collaboration suite
- Workflow automation
- Template system

### Phase 4: Advanced AI & Analytics (Weeks 13-16)

**Goal**: Production-ready AI

```
Week 13-14: Advanced Agents
├── Mastra agent orchestration
├── Multi-agent workflows
├── Competitive analysis
├── Risk prediction
└── Pricing optimization

Week 15-16: Analytics
├── Dashboard with metrics
├── Bid pipeline tracking
├── Team performance
├── Win rate analytics
└── Risk trends
```

**Deliverables**:
- Advanced AI agents
- Analytics dashboard
- Risk prediction

### Phase 5: Polish & Production (Weeks 17-20)

**Goal**: Production-ready

```
Week 17-18: Enterprise Features
├── WorkOS SSO
├── Advanced permissions
├── Audit logging
├── Data export
└── API access

Week 19-20: Polish & Launch
├── Performance optimization
├── Security audit
├── User testing
├── Documentation
└── Launch
```

**Deliverables**:
- Production-ready platform
- Full documentation
- Security compliance

---

## 📈 Success Metrics

### Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Page Load** | <2s | Lighthouse |
| **Time to Interactive** | <3s | Lighthouse |
| **First Paint** | <1s | Lighthouse |
| **AI Response Time** | <5s | p95 latency |
| **Uptime** | 99.9% | Monitoring |
| **Error Rate** | <0.1% | Sentry |

### User Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Daily Active Users** | Growth 20% MoM | Analytics |
| **Bids Created** | 50+ per day | Analytics |
| **AI Usage Rate** | >80% of bids | Analytics |
| **Collaboration Rate** | >3 users per bid | Analytics |
| **Time Saved** | 40% vs manual | Survey |
| **Win Rate** | 15% improvement | Analytics |

### Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **User Satisfaction** | >4.5/5 | NPS |
| **Feature Adoption** | >70% | Analytics |
| **Support Tickets** | <5 per 100 users | Zendesk |
| **Churn Rate** | <5% MoM | Analytics |
| **Expansion Revenue** | 20% ARR | Finance |

---

## 🎁 Bonus Features (Delight)

### 1. **Smart Suggestions**
```
Context: Writer drafting a response

Suggestion:
"Consider adding a case study from the ABC mall project
to demonstrate experience with similar facilities."
```

### 2. **Negotiation Coach**
```
Context: Reviewing a contract

AI: "This clause has high risk. Consider negotiating:
- Reduce liability cap from $5M to $2M
- Add force majeure exception
- Limit indemnification to 12 months"
```

### 3. **Deadline Predictor**
```
Context: Team working on bid

AI: "Based on current progress and team capacity,
this bid has a 67% chance of missing the deadline.
Consider adding a writer or extending scope."
```

### 4. **Win Probability**
```
Context: Before submission

AI: "Win probability: 73%
Strengths: Relevant experience, competitive pricing
Weaknesses: Limited team availability, no case study
Suggestions: Add ABC mall case study to improve +10%"
```

### 5. **Auto-Fill from History**
```
Context: Creating new bid

AI: "I found 3 similar bids from last year. Would you like
to reuse the pricing model from the XYZ Center bid?"
```

---

## 🎨 UI Inspiration

### Best Practices to Study

1. **Linear** - Speed, keyboard shortcuts, command palette
2. **Notion** - Block-based editing, collaborative
3. **Figma** - Real-time collaboration, presence
4. **Loom** - Async video communication
5. **Vercel** - Dashboard design, analytics
6. **Superhuman** - Email productivity, shortcuts
7. **Raycast** - Command palette, extensibility
8. **Arc** - Browser innovation, profiles

### Design Principles

```
1. Speed First
   - Everything <100ms or show progress
   - Optimistic UI updates
   - Skeleton screens

2. Keyboard First
   - Full keyboard navigation
   - Command palette for everything
   - Shortcuts displayed in UI

3. Mobile First
   - Responsive design
   - Touch-friendly targets
   - Progressive enhancement

4. Accessibility First
   - WCAG 2.1 AA compliant
   - Screen reader tested
   - Keyboard navigation

5. Delightful
   - Micro-animations
   - Celebrate successes
   - Helpful error messages
   - Empty states guide users
```

---

## 📚 Appendix

### A. OpenContracts Features to Adopt

| Feature | Value | Complexity |
|---------|-------|------------|
| Pluggable Parser Pipeline | High | Medium |
| Virtualized PDF Rendering | High | High |
| Custom Metadata Schemas | High | Low |
| Dual-Layer Annotations | High | Medium |
| PydanticAI Extraction | Medium | Medium |
| Complex Permissions | Medium | High |

### B. Contract-Analysis Features to Adopt

| Feature | Value | Complexity |
|---------|-------|------------|
| Corpus Forking | Medium | Medium |
| Real-Time Collaboration | High | Medium |
| File Encryption | Medium | Low |
| Langflow Integration | Medium | High |
| WorkOS SSO | High | Low |

### C. Tech Stack Justification

| Technology | Why Chosen |
|-------------|-------------|
| **Next.js 15** | Latest features, RSC, great DX |
| **Convex** | Real-time, type-safe, great UX |
| **Mastra** | Modern agent framework, observability |
| **Docling** | Best PDF parser, ML-based |
| **LibSQL** | Fast, edge-compatible, vector search |
| **Clerk** | Best auth UX, multi-tenant support |
| **Liveblocks** | Purpose-built for collaboration |
| **Shadcn/ui** | Customizable, accessible, beautiful |

---

## 🎯 Next Steps

1. ✅ Review and validate this plan
2. ⏳ Create detailed technical specs
3. ⏳ Set up development environment
4. ⏳ Begin Phase 1 implementation
5. ⏳ Establish regular check-ins

**Target Launch**: 20 weeks (5 months)

**Team Size**: 4-6 developers
- 2 Frontend (Next.js, React)
- 1 Backend (Convex, Python for ML)
- 1 AI/ML (Mastra, LangChain)
- 1 DevOps/SRE
- 1 Designer/UX

---

**Status**: Ready for Development
**Last Updated**: 2026-01-19
**Version**: 1.0
