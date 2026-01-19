# Backend WebSocket Implementation

## Overview

The backend WebSocket implementation consists of two Django Channels consumers that handle real-time chat functionality. Both consumers follow similar patterns but serve different contexts:

- **DocumentQueryConsumer**: Handles document-specific conversations
- **CorpusQueryConsumer**: Handles corpus-wide conversations

## Architecture

### Consumer Base Pattern

Both consumers inherit from `AsyncWebsocketConsumer` and implement:

1. **Connection lifecycle management**
2. **Authentication and authorization**
3. **Agent lifecycle management**
4. **Message processing and streaming**
5. **Error handling and logging**

### Agent Integration

Consumers use the unified LLM agent API (`opencontractserver.llms.agents`) which provides:

- Framework-agnostic agent creation
- Conversation persistence
- Streaming response handling
- Tool approval workflows

## DocumentQueryConsumer

**Location:** `config/websocket/consumers/document_conversation.py`

### Connection Flow

```python
async def connect(self) -> None:
    # 1. Generate unique session ID
    self.session_id = str(uuid.uuid4())

    # 2. Authenticate user
    if not self.scope["user"].is_authenticated:
        await self.close(code=4000)
        return

    # 3. Extract and validate corpus/document IDs
    graphql_corpus_id = extract_websocket_path_id(self.scope["path"], "corpus")
    graphql_doc_id = extract_websocket_path_id(self.scope["path"], "document")

    # 4. Load database records
    self.corpus = await Corpus.objects.aget(id=self.corpus_id)
    self.document = await Document.objects.aget(id=self.document_id)

    # 5. Accept connection
    await self.accept()
```

### Agent Creation

Agents are created lazily on first query:

```python
# Parse optional conversation ID from query string
query_params = urllib.parse.parse_qs(query_string)
conversation_id = query_params.get("load_from_conversation_id", [None])[0]

# Create agent with context
agent_kwargs = {
    "document": self.document,
    "corpus": self.corpus,
    "user_id": self.scope["user"].id,
}

if conversation_id:
    agent_kwargs["conversation_id"] = int(from_global_id(conversation_id)[1])

self.agent = await agents.for_document(
    **agent_kwargs,
    framework=settings.LLMS_DEFAULT_AGENT_FRAMEWORK
)
```

### Message Processing

The `receive()` method handles incoming messages:

```python
async def receive(self, text_data: str) -> None:
    # 1. Parse JSON payload
    text_data_json = json.loads(text_data)

    # 2. Handle approval decisions
    if "approval_decision" in text_data_json:
        await self._handle_approval_decision(text_data_json)
        return

    # 3. Extract user query
    user_query = text_data_json.get("query", "").strip()

    # 4. Create agent if needed
    if self.agent is None:
        # Agent creation logic...

    # 5. Stream response
    async for event in self.agent.stream(user_query):
        # Event processing logic...
```

### Event Processing

The consumer maps agent events to WebSocket messages:

```python
# Content streaming
if isinstance(event, ContentEvent):
    await self.send_standard_message(
        msg_type="ASYNC_CONTENT",
        content=event.content,
        data={"message_id": event.llm_message_id},
    )

# Source citations
elif isinstance(event, SourceEvent):
    await self.send_standard_message(
        msg_type="ASYNC_SOURCES",
        content="",
        data={
            "message_id": event.llm_message_id,
            "sources": [s.to_dict() for s in event.sources],
        },
    )

# Tool approval requests
elif isinstance(event, ApprovalNeededEvent):
    await self.send_standard_message(
        msg_type="ASYNC_APPROVAL_NEEDED",
        content="",
        data={
            "message_id": event.llm_message_id,
            "pending_tool_call": event.pending_tool_call,
        },
    )
```

### Approval Workflow

The approval system allows users to authorize tool execution:

```python
async def _handle_approval_decision(self, payload: dict[str, Any]) -> None:
    approved = bool(payload.get("approval_decision"))
    llm_msg_id = payload.get("llm_message_id")

    # Resume agent with approval decision
    async for event in self.agent.resume_with_approval(
        llm_msg_id, approved, stream=True
    ):
        # Process resumed events...
```

## CorpusQueryConsumer

**Location:** `config/websocket/consumers/corpus_conversation.py`

### Key Differences from Document Consumer

1. **Simpler path structure**: Only requires corpus ID
2. **Corpus-level agent**: Uses `agents.for_corpus()` factory
3. **No approval workflow**: Corpus queries typically don't require tool approval
4. **Embedder configuration**: Respects corpus `preferred_embedder` setting

### Connection Flow

```python
async def connect(self) -> None:
    # 1. Authenticate user
    if not self.scope["user"].is_authenticated:
        await self.close(code=4000)
        return

    # 2. Extract and validate corpus ID
    graphql_corpus_id = extract_websocket_path_id(self.scope["path"], "corpus")
    self.corpus_id = int(from_global_id(graphql_corpus_id)[1])
    self.corpus = await Corpus.objects.aget(id=self.corpus_id)

    # 3. Accept connection
    await self.accept()
```

### Agent Creation

```python
agent_kwargs = {
    "corpus": self.corpus_id,
    "user_id": self.scope["user"].id,
}

if conversation_id:
    agent_kwargs["conversation_id"] = conversation_id

if getattr(self.corpus, "preferred_embedder", None):
    agent_kwargs["embedder"] = self.corpus.preferred_embedder

self.agent = await agents.for_corpus(
    **agent_kwargs,
    framework=settings.LLMS_DEFAULT_AGENT_FRAMEWORK
)
```

## Common Utilities

### Path ID Extraction

Both consumers use `extract_websocket_path_id()` to parse GraphQL IDs from URLs:

```python
from config.websocket.utils.extract_ids import extract_websocket_path_id

# Extract from path like "/ws/corpus/Q29ycHVzOjE=/document/RG9jdW1lbnQ6MQ==/"
corpus_id = extract_websocket_path_id(path, "corpus")
doc_id = extract_websocket_path_id(path, "document")
```

### Standard Message Format

Both consumers use `send_standard_message()` for consistent output:

```python
async def send_standard_message(
    self,
    msg_type: MessageType,
    content: str = "",
    data: dict[str, Any] | None = None,
) -> None:
    await self.send(
        json.dumps({
            "type": msg_type,
            "content": content,
            "data": data or {},
        })
    )
```

## Error Handling

### Connection Errors

```python
try:
    # Connection logic...
except (ValueError, Corpus.DoesNotExist):
    await self.accept()
    await self.send_standard_message(
        msg_type="SYNC_CONTENT",
        content="",
        data={"error": "Invalid or missing corpus_id"},
    )
    await self.close(code=4000)
```

### Processing Errors

```python
try:
    # Message processing...
except Exception as e:
    logger.error(f"[Session {self.session_id}] Error: {e}", exc_info=True)
    await self.send_standard_message(
        msg_type="SYNC_CONTENT",
        content="",
        data={"error": f"Error during processing: {e}"},
    )
```

## Logging Strategy

### Session-Based Logging

All log messages include session IDs for traceability:

```python
logger.debug(f"[Session {self.session_id}] Agent created for doc {self.document_id}")
logger.error(f"[Session {self.session_id}] Error during API call: {str(e)}", exc_info=True)
```

### Log Levels

- **DEBUG**: Connection events, agent creation, message flow
- **INFO**: Successful operations, conversation lifecycle
- **WARNING**: Unexpected but handled conditions
- **ERROR**: Failures requiring investigation

### Consumer Lifecycle Logging

```python
def __init__(self, *args, **kwargs):
    super().__init__(*args, **kwargs)
    self.consumer_id = uuid.uuid4()
    logger.debug(f"[Consumer {self.consumer_id}] __init__ called.")

async def disconnect(self, close_code: int) -> None:
    logger.debug(f"[Consumer {self.consumer_id} | Session {self.session_id}] disconnect() called.")
    self.agent = None  # Clean up for GC
```

## Performance Considerations

### Resource Management

1. **Agent Reuse**: Agents persist for the WebSocket session duration
2. **Lazy Loading**: Agents created only when first query arrives
3. **Memory Cleanup**: Agents nullified on disconnect for garbage collection
4. **Database Efficiency**: Uses async ORM methods for non-blocking I/O

### Streaming Efficiency

1. **Event-Driven**: Uses async generators for memory-efficient streaming
2. **Backpressure**: Natural flow control via WebSocket buffering
3. **Early Sources**: Citations sent as soon as available
4. **Progressive Display**: Content streams immediately without buffering

## Configuration

### Django Settings

```python
# Agent framework selection
LLMS_DEFAULT_AGENT_FRAMEWORK = "pydantic_ai"  # or another defined framework enum

# OpenAI API configuration
OPENAI_API_KEY = "sk-..."

# Channels configuration
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        # Redis config...
    },
}
```

### URL Routing

WebSocket consumers are registered in Django Channels routing:

```python
# config/routing.py
from django.urls import path
from config.websocket.consumers import DocumentQueryConsumer, CorpusQueryConsumer

websocket_urlpatterns = [
    path("ws/corpus/<str:corpus_id>/document/<str:document_id>/", DocumentQueryConsumer.as_asgi()),
    path("ws/corpus/<str:corpus_id>/", CorpusQueryConsumer.as_asgi()),
]
```

## Testing Considerations

### Unit Testing

Consumers can be tested using Django Channels testing utilities:

```python
from channels.testing import WebsocketCommunicator
from myapp.consumers import DocumentQueryConsumer

async def test_document_consumer():
    communicator = WebsocketCommunicator(DocumentQueryConsumer.as_asgi(), "/ws/test/")
    connected, subprotocol = await communicator.connect()
    assert connected

    # Send test message
    await communicator.send_json_to({"query": "test question"})

    # Receive response
    response = await communicator.receive_json_from()
    assert response["type"] == "ASYNC_START"

    await communicator.disconnect()
```

### Integration Testing

End-to-end tests should verify:

1. Authentication and authorization
2. Message flow completeness
3. Error handling behavior
4. Agent state persistence
5. Database record creation

## Related Files

- `opencontractserver/llms/agents/`: Agent implementations
- `opencontractserver/conversations/models.py`: Database models
- `config/websocket/utils/`: Utility functions
- `config/routing.py`: WebSocket URL configuration
