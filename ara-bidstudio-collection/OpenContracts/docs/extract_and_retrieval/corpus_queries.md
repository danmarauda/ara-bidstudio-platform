# Answering Corpus-Level Queries with WebSockets & Unified Agents

## Overview

OpenContracts provides real-time, conversational AI for answering questions about entire document collections (corpora). Using WebSockets for streaming responses and unified agents for consistent behavior, users can interactively explore their documents with instant feedback.

## Architecture

### WebSocket-Based Communication

Corpus queries are served **live** over Django Channels WebSockets, providing:
- **Real-time streaming** of partial answers
- **Interactive feedback** including thought processes
- **Persistent conversations** with memory
- **Tool approval workflows** for function calling

### End-to-End Flow

```python
# From config/websocket/consumers/corpus_conversation.py
class CorpusQueryConsumer(AsyncWebsocketConsumer):
    """Streams answers for questions about an entire corpus."""
```

1. **Client → Server**: React frontend opens `wss://…/ws/corpus/<globalId>/` and sends `{ "query": "…" }`
2. **Authentication**: `CorpusQueryConsumer.connect` authenticates user and resolves Corpus
3. **Agent Initialization**: Consumer lazily creates a `CoreAgent` via `opencontractserver.llms.agents.for_corpus(...)`
4. **Framework Selection**: Agent uses `UnifiedVectorStoreFactory` and framework from `settings.LLMS_DEFAULT_AGENT_FRAMEWORK`
5. **Streaming Response**: LLM streams answer with incremental `ASYNC_*` messages to UI
6. **Completion**: Terminal frame sent, socket ready for next question with context preserved

## Message Protocol

### Client → Server Messages

```json
{
    "query": "What are the key terms in these contracts?",
    "tools": ["search", "summarize"],  // Optional tool list
    "approve_tool": "tool_call_id_123"  // For tool approval
}
```

### Server → Client Messages

| Type | Description | Payload |
|------|-------------|---------|
| `ASYNC_START` | First event with conversation IDs | `{conversation_id, message_id}` |
| `ASYNC_CONTENT` | Incremental content from LLM | `{delta: "text..."}` |
| `ASYNC_THOUGHT` | Chain-of-thought reasoning | `{thought: "Analyzing..."}` |
| `ASYNC_SOURCES` | Sources for last delta | `{sources: [...]}` |
| `ASYNC_APPROVAL_NEEDED` | Tool requires approval | `{tool_call: {...}}` |
| `ASYNC_ERROR` | Non-fatal error | `{error: "..."}` |
| `ASYNC_FINISH` | Final message with sources | `{content, sources, timeline}` |
| `SYNC_CONTENT` | Immediate notice/error | `{message: "..."}` |

### Example WebSocket Session

```javascript
// Client-side JavaScript
const ws = new WebSocket('wss://localhost/ws/corpus/abc123/');

ws.onopen = () => {
    ws.send(JSON.stringify({
        query: "What are the payment terms across all contracts?"
    }));
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch(data.type) {
        case 'ASYNC_START':
            console.log('Starting conversation:', data.conversation_id);
            break;
        case 'ASYNC_CONTENT':
            appendToAnswer(data.delta);
            break;
        case 'ASYNC_SOURCES':
            displaySources(data.sources);
            break;
        case 'ASYNC_FINISH':
            finalizeAnswer(data.content, data.sources);
            break;
    }
};
```

## Agent System

### Unified Agent Factory

The `UnifiedAgentFactory` creates framework-agnostic agents:

```python
from opencontractserver.llms.agents import UnifiedAgentFactory

# Creates appropriate agent based on configuration
agent = UnifiedAgentFactory.for_corpus(
    corpus_id=corpus_id,
    user_id=user.id,
    framework=settings.LLMS_DEFAULT_AGENT_FRAMEWORK
)
```

### Core Agent Features

The `CoreAgent` provides:
- **Vector search** across corpus annotations
- **Conversation memory** with database persistence
- **Tool calling** with approval gates
- **Source attribution** for grounded answers
- **Streaming events** for real-time updates

### Framework Support

Switch between frameworks via configuration:

```python
# settings.py
LLMS_DEFAULT_AGENT_FRAMEWORK = "pydantic_ai"
```

Both frameworks provide identical functionality through the unified interface.

## Conversation Persistence

### Memory Management

Conversations are persisted for authenticated users:

```python
# Conversation model stores:
- conversation_id: Unique identifier
- user: Associated user
- corpus: Target corpus
- messages: JSON array of conversation history
- created/updated: Timestamps
```

### Context Preservation

The WebSocket consumer maintains conversation context:
- Previous messages available for follow-up questions
- Tool results cached for reference
- Sources accumulated across queries

## Tool Integration

### Available Tools

Corpus agents can use various tools:
- **Search**: Vector search within corpus
- **Summarize**: Generate summaries of documents
- **Extract**: Pull specific information
- **Compare**: Analyze differences between documents

### Tool Approval Workflow

For sensitive operations:

1. Agent requests tool use
2. Server sends `ASYNC_APPROVAL_NEEDED`
3. Client displays approval UI
4. User approves/rejects
5. Client sends `approve_tool` message
6. Agent continues or adjusts

```json
// Server → Client
{
    "type": "ASYNC_APPROVAL_NEEDED",
    "tool_call": {
        "id": "call_123",
        "tool": "delete_document",
        "args": {"doc_id": 456}
    }
}

// Client → Server (approval)
{
    "approve_tool": "call_123"
}
```

## Configuration

### Extensibility Hooks

1. **Framework Selection**: Uses PydanticAI framework
2. **Embedder Override**: Set `Corpus.preferred_embedder` for custom models
3. **Tool Registration**: Pass `?tools=…` query parameter or configure defaults
4. **Token Limits**: Configure max context and response lengths

### WebSocket Settings

```python
# settings.py
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [('127.0.0.1', 6379)],
        },
    },
}

# Timeout and buffer settings
WEBSOCKET_TIMEOUT = 300  # 5 minutes
WEBSOCKET_MAX_MESSAGE_SIZE = 1048576  # 1MB
```

## Error Handling

### Connection Errors

The consumer handles various failure modes:
- **Authentication failure**: Closes with 4001 code
- **Corpus not found**: Closes with 4004 code
- **Agent initialization failure**: Sends SYNC_CONTENT error
- **LLM errors**: Sends ASYNC_ERROR, conversation continues

### Recovery Strategies

```python
# Automatic retry with exponential backoff
async def query_with_retry(self, query: str, max_retries: int = 3):
    for attempt in range(max_retries):
        try:
            return await self.agent.query(query)
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            await asyncio.sleep(2 ** attempt)
```

## Performance Optimization

### Connection Pooling

WebSocket connections are pooled and reused:
- Connections persist across multiple queries
- Reduced overhead for conversation continuity
- Automatic cleanup on idle timeout

### Streaming Optimizations

- **Chunked responses**: Content streamed in optimal chunks
- **Source deduplication**: Repeated sources sent once
- **Incremental rendering**: UI updates without full redraws

### Caching

Multiple levels of caching improve performance:
- **Vector embeddings**: Cached in database
- **Agent instances**: Reused within consumer
- **Tool results**: Cached within conversation

## Frontend Integration

### React Hook Example

```typescript
// useCorpusChat.ts
import { useWebSocket } from './websocket';

export function useCorpusChat(corpusId: string) {
    const { send, messages, status } = useWebSocket(
        `/ws/corpus/${corpusId}/`
    );

    const query = useCallback((text: string) => {
        send({ query: text });
    }, [send]);

    const approveTool = useCallback((toolCallId: string) => {
        send({ approve_tool: toolCallId });
    }, [send]);

    return { query, messages, status, approveTool };
}
```

### Message Handling

```typescript
// CorpusChatStream.tsx
function handleMessage(data: WebSocketMessage) {
    switch(data.type) {
        case 'ASYNC_CONTENT':
            setAnswer(prev => prev + data.delta);
            break;
        case 'ASYNC_SOURCES':
            setSources(data.sources);
            break;
        case 'ASYNC_APPROVAL_NEEDED':
            showApprovalDialog(data.tool_call);
            break;
    }
}
```

## Monitoring and Debugging

### Logging

Comprehensive logging for debugging:

```python
import logging
logger = logging.getLogger('corpus.websocket')

# Log levels for different events
logger.info(f"User {user.id} connected to corpus {corpus_id}")
logger.debug(f"Query received: {query[:100]}...")
logger.error(f"Agent error: {str(e)}")
```

### Metrics

Track key performance indicators:
- Connection count and duration
- Query latency and token usage
- Error rates and types
- Tool usage statistics

## Security Considerations

### Authentication

All WebSocket connections require authentication:
- Session-based auth for web clients
- Token-based auth for API clients
- Automatic disconnection on auth failure

### Authorization

Corpus access controlled via permissions:
- User must have read permission on corpus
- Tool usage requires additional permissions
- Admin tools restricted to staff users

### Rate Limiting

Prevent abuse with rate limits:
- Per-user query limits
- Token usage caps
- Connection count restrictions

## Further Reading

- [LLM Agent Architecture](../architecture/llms/README.md)
- [WebSocket Backend Implementation](../architecture/websocket/backend.md)
- [WebSocket Frontend Implementation](../architecture/websocket/frontend.md)
- [Vector Store Architecture](./vector_stores.md)
