---
category: ai-rag
subcategory: overview
tags: [ai, rag, overview, navigation]
cursor:
  context_window: 16384
  temperature: 0.3
  max_tokens: 8192
  model_preference: ["auto"]
relations:
  imports: ["./ai-models.mdc", "./streaming.mdc", "./embeddings.mdc"]
  exports: ["ai-rag-overview"]
  references: ["../index.mdc"]
---

# AI/RAG System Overview - abubis.chat

## Architecture Overview

abubis.chat implements a modern AI/RAG (Retrieval-Augmented Generation) system optimized for Solana blockchain development. The system combines multiple AI models with vector search capabilities to provide accurate, context-aware assistance.

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Models     │    │  Vector Search  │    │   Memory Mgmt   │
│                 │    │                 │    │                 │
│ • Claude 3.5    │◄──►│ • Qdrant DB     │◄──►│ • Context Win.  │
│ • GPT-4o        │    │ • Embeddings    │    │ • Conversation  │
│ • DeepSeek      │    │ • Hybrid Search │    │ • Hierarchical  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────────────────────────────┐
         │            Streaming Engine            │
         │                                       │
         │ • Real-time responses                │
         │ • Tool calling                       │
         │ • Backpressure management           │
         └─────────────────────────────────────────┘
                                 │
         ┌─────────────────────────────────────────┐
         │         Prompt Engineering            │
         │                                       │
         │ • Safety & injection prevention      │
         │ • Context optimization               │
         │ • Chain-of-thought patterns         │
         └─────────────────────────────────────────┘
```

## System Components

### 🤖 [AI Models](./ai-models.mdc)
**Model selection, configuration, and routing**

- **Primary Models**: Claude 3.5 Sonnet, GPT-4o, DeepSeek
- **Dynamic Selection**: Task-based routing with fallback chains
- **Provider Abstraction**: Unified interface across different AI providers
- **Performance Optimization**: Rate limiting, caching, and cost management

**Key Features:**
- Smart model selection based on task complexity and budget
- Graceful degradation and error handling
- Cost-optimized routing for different use cases

### 🌊 [Streaming](./streaming.mdc)
**Real-time response streaming with Vercel AI SDK v5.2**

- **Stream Protocol**: Start/delta/end pattern with unique content blocks
- **Multi-Modal Support**: Text, reasoning, tool calls, and custom data types
- **Backpressure Management**: Flow control to prevent resource overload
- **Tool Integration**: Streaming tool execution with multi-turn conversations

**Key Features:**
- WebSocket transport for real-time communication
- Adaptive chunking based on connection speed
- Error recovery and reconnection logic

### 🔍 [Embeddings](./embeddings.mdc)
**Text embedding and chunking strategies**

- **Model Selection**: OpenAI text-embedding-3-large, multilingual support
- **Smart Chunking**: Semantic chunking with 20% overlap
- **Content-Aware**: Different strategies for code, docs, and conversations
- **Preprocessing Pipeline**: Text cleaning and metadata extraction

**Key Features:**
- Recursive character text splitting with intelligent separators
- Code-aware chunking that preserves structure
- Dynamic chunk size selection based on content type

### 🎯 [Vector Search](./vector-search.mdc)
**Qdrant-powered vector database optimization**

- **Hybrid Search**: Combines semantic and keyword search
- **HNSW Indexing**: Optimized for sub-100ms retrieval at 95%+ recall
- **Contextual Retrieval**: Expands results with surrounding chunks
- **Performance Monitoring**: Real-time analytics and optimization

**Key Features:**
- Quantization for memory efficiency
- Smart filtering and re-ranking
- Batch operations with retry logic

### 🛡️ [Prompt Engineering](./prompt-engineering.mdc)
**Safe and effective prompt construction**

- **Safety First**: Injection prevention and input sanitization
- **Dynamic Construction**: Context-aware prompt building
- **Chain-of-Thought**: Structured reasoning patterns
- **Response Validation**: Output safety and quality checks

**Key Features:**
- Advanced pattern detection for malicious inputs
- Context-sensitive prompt templates
- Automated safety instruction injection

### 🧠 [Memory Management](./memory-management.mdc)
**Context window and conversation state optimization**

- **Hierarchical Memory**: Working, short-term, and long-term storage
- **Sliding Window**: Token-aware conversation management
- **Context Compression**: Smart truncation preserving important information
- **Relevance Scoring**: Importance-based memory retention

**Key Features:**
- Automatic conversation balancing
- Intelligent context compression
- Cross-session memory persistence

## Integration Patterns

### Full RAG Pipeline
```typescript
import { HierarchicalMemory } from './memory-management.mdc';
import { HybridSearchEngine } from './vector-search.mdc';
import { SafePromptExecutor } from './prompt-engineering.mdc';
import { StreamingManager } from './streaming.mdc';

export class AnubisRAGSystem {
  constructor(
    private memory: HierarchicalMemory,
    private search: HybridSearchEngine,
    private promptExecutor: SafePromptExecutor,
    private streaming: StreamingManager
  ) {}

  async processQuery(
    userQuery: string,
    sessionId: string
  ): Promise<ReadableStream> {
    // 1. Retrieve relevant context
    const retrievedContext = await this.search.search({
      text: userQuery,
      limit: 5,
      threshold: 0.7
    });

    // 2. Get conversation memory
    const conversationHistory = this.memory.getWorkingMemory();

    // 3. Build contextual prompt
    const prompt = await this.memory.buildContextualPrompt(
      userQuery,
      SYSTEM_PROMPTS.base,
      retrievedContext.map(r => r.content)
    );

    // 4. Execute safely with streaming
    const result = await this.promptExecutor.executePrompt({
      userQuery,
      conversationHistory,
      retrievedContext,
      model: 'claude-3.5-sonnet',
      strictMode: true
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    // 5. Stream response
    return this.streaming.createStream(result.response);
  }
}
```

## Performance Characteristics

### System Metrics (2025)
| Component | Latency Target | Throughput | Accuracy |
|-----------|----------------|------------|----------|
| Vector Search | <100ms | 1000 QPS | 95%+ recall |
| Embedding | <200ms | 500 docs/sec | N/A |
| Streaming | <50ms TTFB | 100 concurrent | N/A |
| Memory Mgmt | <10ms | N/A | 95%+ retention |
| Prompt Safety | <20ms | N/A | 99.9% detection |

### Resource Usage
- **Memory**: 2-4GB for vector index + 1GB working memory
- **CPU**: 2-4 cores for optimal performance
- **Storage**: 100MB/10K documents (compressed)
- **Network**: 10-50MB/hour per active session

## Development Workflow

### 1. Setup and Configuration
```bash
# Install dependencies
bun add @ai-sdk/anthropic @ai-sdk/openai @qdrant/js-client-rest

# Environment setup
cp .env.example .env
# Add API keys for Claude, OpenAI, Qdrant
```

### 2. Initialize Components
```typescript
// Initialize in your main application
const ragSystem = new AnubisRAGSystem(
  new HierarchicalMemory('claude-3.5-sonnet'),
  new HybridSearchEngine(qdrantClient, embeddingPipeline),
  new SafePromptExecutor(promptBuilder, sanitizer),
  new StreamingManager()
);
```

### 3. Data Ingestion
```typescript
// Process and embed documents
const chunker = new SemanticChunker({ chunkSize: 1200, chunkOverlap: 240 });
const chunks = await chunker.chunkDocument(documentText);
const embeddings = await embeddingPipeline.embedChunks(chunks);
await qdrantManager.upsertBatch(embeddings);
```

### 4. Query Processing
```typescript
// Handle user queries
app.post('/api/chat', async (req, res) => {
  const { message, sessionId } = req.body;
  
  const stream = await ragSystem.processQuery(message, sessionId);
  res.setHeader('Content-Type', 'text/stream');
  
  const reader = stream.getReader();
  // Stream response to client
});
```

## Quality Assurance

### Testing Strategy
- **Unit Tests**: Individual component functionality
- **Integration Tests**: Cross-component interactions
- **E2E Tests**: Full pipeline validation
- **Performance Tests**: Latency and throughput benchmarks
- **Security Tests**: Injection and safety validation

### Monitoring
- **Real-time Metrics**: Response times, error rates, token usage
- **Quality Metrics**: Relevance scores, user satisfaction
- **Cost Tracking**: Per-model usage and optimization opportunities
- **Safety Monitoring**: Injection attempts and blocked requests

## Security Considerations

### Data Protection
- **Input Sanitization**: Comprehensive prompt injection prevention
- **Output Validation**: Response safety and appropriateness
- **Context Isolation**: User-specific data boundaries
- **API Security**: Rate limiting and authentication

### Privacy
- **Memory Management**: Automatic expiration of sensitive data
- **Logging**: No PII in application logs
- **Encryption**: At-rest and in-transit data protection
- **Compliance**: GDPR and privacy regulation adherence

## Next Steps

1. **Review individual component documentation** for detailed implementation
2. **Set up development environment** with required dependencies
3. **Implement components incrementally** starting with core models
4. **Test thoroughly** at each integration step
5. **Monitor and optimize** based on usage patterns

For specific implementation details, refer to the individual component documentation files linked above.