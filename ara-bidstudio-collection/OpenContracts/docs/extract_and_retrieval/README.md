# Data Extraction and Retrieval System

## Overview

OpenContracts provides a unified system for extracting structured data from documents and answering questions about document collections using state-of-the-art AI agents.

## Key Features

### Structured Data Extraction
Transform any collection of documents into spreadsheet-like data grids with:
- **Flexible field definitions** via Fieldsets and Columns
- **Type-safe extraction** supporting primitives and complex types
- **Distributed processing** using Celery for scalability
- **Constraint enforcement** through intelligent prompting

### Real-time Corpus Queries
Interactive Q&A over document collections with:
- **WebSocket streaming** for instant responses
- **Conversation memory** with database persistence
- **Tool calling** with approval workflows
- **Source attribution** for grounded answers

### Multi-Framework Architecture
Seamlessly switch between AI frameworks:
- **PydanticAI** for structured extraction
- **Framework-agnostic core** for business logic
- **Unified factories** for consistent interfaces
- **Pluggable adapters** for new frameworks

### Vector Search
Efficient similarity search powered by:
- **pgvector** for PostgreSQL vector operations
- **Multiple embedders** (384, 768, 1536, 3072 dimensions)
- **Corpus and document filtering**
- **Metadata-based constraints**

## Architecture Components

### 1. Extraction Pipeline
Celery-based orchestration that:
- Creates Datacells for each document × column pair
- Fans out work across available workers
- Uses agent framework for structured responses
- Tracks progress and handles failures

### 2. Vector Store System
Two-layer architecture providing:
- **Core layer**: Framework-agnostic search logic
- **Adapter layer**: Framework-specific interfaces
- **Unified factory**: Automatic framework selection
- **Direct Django ORM integration**

### 3. Agent System
Unified agents supporting:
- Document-level conversations
- Corpus-wide analysis
- Structured data extraction
- Tool use with approval gates

### 4. WebSocket Infrastructure
Real-time communication via:
- Django Channels consumers
- Streaming response protocol
- Incremental content delivery
- Error recovery and retry logic

## Quick Start

### Setting Up Extraction

1. **Create a Fieldset** to define what to extract
2. **Add Columns** specifying queries and output types
3. **Create an Extract** linking documents to fieldset
4. **Run extraction** via GraphQL or admin interface

### Querying a Corpus

1. **Open WebSocket** to `/ws/corpus/<id>/`
2. **Send query** as JSON message
3. **Receive streaming** response with sources
4. **Continue conversation** with context preserved

## Configuration

Key settings in `settings.py`:

```python
# Agent framework selection
LLMS_DEFAULT_AGENT_FRAMEWORK = "pydantic_ai"

# Embedder configuration
PREFERRED_EMBEDDER = "sentence-transformers/all-MiniLM-L6-v2"
```

## Documentation

- [Data Extraction Guide](./data_extraction.md) - Complete extraction pipeline documentation
- [Vector Store Architecture](./vector_stores.md) - Core/adapter pattern and implementation
- [Corpus Query System](./corpus_queries.md) - WebSocket-based conversational AI
- [API Reference](./api_reference.md) - Models, tasks, and endpoints
- [Extraction Tutorial](../walkthrough/advanced/extraction_tutorial.md) - Step-by-step walkthrough