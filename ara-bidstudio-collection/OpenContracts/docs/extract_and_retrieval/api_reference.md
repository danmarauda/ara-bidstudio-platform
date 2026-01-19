# API Reference

## Django Models

### Extraction Models

#### Fieldset

Defines a collection of fields to extract from documents.

```python
class Fieldset(BaseOCModel):
    name: str                    # Fieldset name
    description: str             # Description of purpose
    corpus: Corpus | None        # Optional link for metadata schemas
```

**Permissions:**
- `permission_fieldset` - Base permission
- `create_fieldset` - Create new fieldsets
- `read_fieldset` - View fieldsets
- `update_fieldset` - Modify fieldsets
- `remove_fieldset` - Delete fieldsets

#### Column

Defines individual data fields within a fieldset.

```python
class Column(BaseOCModel):
    # Basic fields
    name: str                           # Column name
    fieldset: Fieldset                  # Parent fieldset

    # Extraction configuration
    query: str | None                   # Extraction prompt
    match_text: str | None              # Alternative to query
    must_contain_text: str | None       # Required text constraint
    limit_to_label: str | None          # Annotation label filter
    instructions: str | None            # Additional instructions

    # Output configuration
    output_type: str                    # Python type as string
    extract_is_list: bool = False       # Wrap in List[]

    # Task configuration
    task_name: str = "...doc_extract_query_task"  # Celery task

    # Metadata fields
    data_type: str | None              # METADATA_DATA_TYPES choice
    validation_config: dict | None      # Validation rules
```

**Data Types (for manual entry):**
- `STRING` - Single line text
- `TEXT` - Multi-line text
- `BOOLEAN` - True/False
- `INTEGER` - Whole numbers
- `FLOAT` - Decimal numbers
- `DATE` - Date only
- `DATETIME` - Date and time
- `URL` - Web addresses
- `EMAIL` - Email addresses
- `CHOICE` - Single selection
- `MULTI_CHOICE` - Multiple selections
- `JSON` - JSON objects

#### Extract

Represents an extraction job.

```python
class Extract(BaseOCModel):
    # Scope
    corpus: Corpus | None              # Target corpus
    documents: ManyToMany[Document]    # Documents to process

    # Configuration
    name: str                          # Extract name
    fieldset: Fieldset                 # Fields to extract

    # Status
    created: datetime                  # Creation time
    started: datetime | None           # Start time
    finished: datetime | None          # Completion time
    error: str | None                  # Error message if failed
```

#### Datacell

Stores extracted data for a document/column pair.

```python
class Datacell(BaseOCModel):
    # Relations
    extract: Extract                   # Parent extract
    column: Column                     # Column definition
    document: Document                 # Source document

    # Results
    data: Any | None                   # Extracted data (JSON)
    data_definition: str               # Data type description
    sources: ManyToMany[Annotation]    # Source annotations

    # Status
    started: datetime | None           # Processing start
    completed: datetime | None         # Processing end
    failed: datetime | None            # Failure time
    stacktrace: str | None            # Error details

    # Metadata
    creator: User                      # User who created
```

## Celery Tasks

### Orchestration Tasks

#### `run_extract`

Main extraction orchestrator that creates datacells and queues processing.

```python
@shared_task
def run_extract(
    extract_id: str | int,
    user_id: str | int
) -> None:
    """
    Creates Datacells for each document × column combination
    and queues extraction tasks.

    Args:
        extract_id: ID of Extract to process
        user_id: ID of user running extraction
    """
```

#### `mark_extract_complete`

Marks an extract as finished after all datacells complete.

```python
@shared_task
def mark_extract_complete(
    extract_id: str | int
) -> None:
    """
    Updates Extract.finished timestamp and aggregates
    any errors from failed datacells.

    Args:
        extract_id: ID of Extract to mark complete
    """
```

### Extraction Tasks

#### `doc_extract_query_task`

Performs structured data extraction using agent framework.

```python
@celery_task_with_async_to_sync()
async def doc_extract_query_task(
    cell_id: int,
    similarity_top_k: int = 10,
    max_token_length: int = 64000
) -> None:
    """
    Extracts data for a single datacell using PydanticAI agents.

    Args:
        cell_id: Datacell ID to process
        similarity_top_k: Number of similar chunks to retrieve
        max_token_length: Maximum context tokens
    """
```

## Agent System

### Factories

#### `UnifiedAgentFactory`

Creates framework-agnostic agents for document and corpus interactions.

```python
class UnifiedAgentFactory:
    @classmethod
    def for_corpus(
        cls,
        corpus_id: int,
        user_id: int,
        framework: str = None
    ) -> CoreAgent:
        """Create agent for corpus-level queries."""

    @classmethod
    def for_document(
        cls,
        document_id: int,
        user_id: int,
        framework: str = None
    ) -> CoreAgent:
        """Create agent for document-level queries."""
```

#### `UnifiedVectorStoreFactory`

Creates appropriate vector store based on framework.

```python
class UnifiedVectorStoreFactory:
    @classmethod
    def create(
        cls,
        framework: str,
        corpus_id: int = None,
        user_id: int = None,
        **kwargs
    ) -> VectorStore:
        """
        Create vector store for specified framework.

        Args:
            framework: "pydantic_ai"
            corpus_id: Filter by corpus
            user_id: Filter by user
            **kwargs: Additional configuration
        """
```

### Core Classes

#### `CoreAgent`

Base agent class providing unified interface.

```python
class CoreAgent:
    async def query(
        self,
        query: str,
        tools: list[str] = None
    ) -> AsyncIterator[Event]:
        """
        Process a query and stream events.

        Yields:
            StartEvent: Initial event with IDs
            ContentEvent: Incremental content
            SourcesEvent: Source annotations
            FinishEvent: Final results
        """

    async def approve_tool(
        self,
        tool_call_id: str
    ) -> None:
        """Approve a pending tool call."""
```

#### `CoreAnnotationVectorStore`

Framework-agnostic vector store implementation.

```python
class CoreAnnotationVectorStore:
    def __init__(
        self,
        corpus_id: int = None,
        user_id: int = None,
        embedder_path: str = None,
        embed_dim: int = 384
    ):
        """Initialize vector store with filters."""

    def search(
        self,
        query: VectorSearchQuery
    ) -> list[VectorSearchResult]:
        """Execute vector similarity search."""
```

## WebSocket Consumers

### `CorpusQueryConsumer`

Handles real-time corpus queries over WebSocket.

```python
class CorpusQueryConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """Authenticate and initialize corpus agent."""

    async def receive(self, text_data):
        """Process incoming queries."""

    async def disconnect(self, close_code):
        """Clean up on disconnection."""
```

**WebSocket URL:** `/ws/corpus/<corpus_id>/`

**Message Types:**

Client → Server:
```json
{
    "query": "string",           // User question
    "tools": ["list"],          // Optional tools
    "approve_tool": "string"    // Tool approval
}
```

Server → Client:
```json
{
    "type": "ASYNC_START|ASYNC_CONTENT|ASYNC_SOURCES|...",
    "data": {}  // Type-specific payload
}
```

### `DocumentQueryConsumer`

Handles document-specific queries.

```python
class DocumentQueryConsumer(AsyncWebsocketConsumer):
    # Similar interface to CorpusQueryConsumer
    # URL: /ws/document/<document_id>/
```

## GraphQL API

### Queries

#### Extract Queries

```graphql
query GetExtracts {
    extracts {
        edges {
            node {
                id
                name
                started
                finished
                datacells {
                    edges {
                        node {
                            id
                            data
                            completed
                        }
                    }
                }
            }
        }
    }
}
```

#### Fieldset Queries

```graphql
query GetFieldsets {
    fieldsets {
        edges {
            node {
                id
                name
                description
                columns {
                    edges {
                        node {
                            id
                            name
                            outputType
                        }
                    }
                }
            }
        }
    }
}
```

### Mutations

#### Start Extract

```graphql
mutation StartExtract($extractId: ID!) {
    startExtract(extractId: $extractId) {
        ok
        message
        objId
    }
}
```

#### Create Fieldset

```graphql
mutation CreateFieldset($name: String!, $description: String!) {
    createFieldset(
        name: $name
        description: $description
    ) {
        ok
        objId
        message
    }
}
```

## Configuration Settings

### Agent Framework

```python
# settings.py

# Framework selection: "pydantic_ai"
LLMS_DEFAULT_AGENT_FRAMEWORK = "pydantic_ai"

# Model configuration
LLMS_DEFAULT_MODEL = "gpt-4-turbo"
LLMS_MAX_TOKENS = 4096
LLMS_TEMPERATURE = 0.7

# Embedder settings
PREFERRED_EMBEDDER = "sentence-transformers/all-MiniLM-L6-v2"
EMBED_DIMENSIONS = 384
```

### Celery Configuration

```python
# Celery settings
CELERY_BROKER_URL = 'redis://localhost:6379'
CELERY_RESULT_BACKEND = 'redis://localhost:6379'

# Task routing
CELERY_TASK_ROUTES = {
    'opencontractserver.tasks.extract_orchestrator_tasks.*': {
        'queue': 'extract'
    },
    'opencontractserver.tasks.data_extract_tasks.*': {
        'queue': 'ml'
    }
}
```

### WebSocket Configuration

```python
# Channel layers
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [('127.0.0.1', 6379)],
        },
    },
}

# WebSocket settings
WEBSOCKET_TIMEOUT = 300  # seconds
WEBSOCKET_MAX_MESSAGE_SIZE = 1048576  # 1MB
```

## Error Codes

### WebSocket Close Codes

| Code | Description |
|------|-------------|
| 1000 | Normal closure |
| 4001 | Authentication failed |
| 4004 | Resource not found |
| 4008 | Rate limit exceeded |
| 5000 | Internal server error |

### Extraction Error Types

| Error | Description |
|-------|-------------|
| `ExtractionTimeout` | Task exceeded time limit |
| `InvalidOutputType` | Unsupported type specified |
| `DocumentNotFound` | Document doesn't exist |
| `InsufficientPermissions` | User lacks access |
| `AgentError` | LLM processing failed |

## Utilities

### Type Parsing

```python
from opencontractserver.utils.etl import parse_model_or_primitive

# Parse string type to Python type
python_type = parse_model_or_primitive("list[str]")
```

### Embedding Generation

```python
from opencontractserver.annotations.models import generate_embeddings_from_text

# Generate embeddings for text
embeddings = generate_embeddings_from_text(
    text="Sample text",
    embedder_path="sentence-transformers/all-MiniLM-L6-v2"
)
```

### Async Decorators

```python
from opencontractserver.shared.decorators import celery_task_with_async_to_sync

@celery_task_with_async_to_sync()
async def my_async_task():
    # Async task implementation
    pass
```
