# OpenContracts Project Analysis

## Main Technologies Used

### Backend
- **Django** - Python web framework for the backend
- **Celery** - Asynchronous task queue for background processing
- **PostgreSQL** - Primary database with pgvector extension
- **GraphQL** - API layer using Graphene/Django GraphQL
- **Docker** - Containerization for deployment

### Frontend
- **React** - JavaScript library for UI components
- **TypeScript** - Typed superset of JavaScript
- **Vite** - Build tool and development server

### Additional Technologies
- **Traefik** - Reverse proxy and load balancer
- **Auth0** - Authentication backend option
- **Pydantic** - Data validation and AI agent framework
- **Playwright** - Testing framework

## Core Features and Functionality

### Document Processing
- PDF parsing and text extraction
- Document thumbnail generation
- Metadata extraction and management
- Document embeddings and vector storage

### Annotation System
- Text annotations on documents
- Label sets and hierarchical labeling
- Smart labeling mutations
- Note-taking and revision tracking

### Corpus Management
- Corpus creation and organization
- Document grouping and categorization
- Corpus forking functionality
- Corpus action triggers

### AI/LLM Integration
- Structured data extraction from documents
- Conversation-based querying
- Embedding generation and search
- Agentic workflows with Pydantic AI

### Permissioning
- Role-based access control
- Read-only mode support
- User object permissions
- Group permissions management

## Architecture Components

### Backend Structure
```
config/ - Django configuration files
opencontractserver/
  ├── analyzer/ - Document analysis tools and analyzers
  ├── annotations/ - Annotation models and management
  ├── contrib/ - Site management
  ├── conversations/ - Chat and conversation handling
  ├── corpuses/ - Corpus management system
  ├── documents/ - Document models and processing
  ├── extracts/ - Data extraction framework
  ├── feedback/ - User feedback system
  ├── llms/ - Language model integration
  │   ├── agents/ - AI agent implementations
  │   ├── embedders/ - Text embedding tools
  │   ├── tools/ - LLM tool implementations
  │   └── vector_stores/ - Vector database interfaces
  ├── pipeline/ - Document processing pipeline
  │   ├── parsers/ - PDF/text parsing components
  │   ├── embedders/ - Embedding generation
  │   ├── post_processors/ - Document post-processing
  │   └── thumbnailers/ - Thumbnail generation
  ├── shared/ - Shared utilities and base models
  ├── tasks/ - Background task definitions
  ├── users/ - User management and authentication
  └── utils/ - Various utility functions
```

### Frontend Structure
```
frontend/
  ├── src/
  │   ├── components/ - React UI components
  │   │   ├── analyses/ - Analysis card components
  │   │   ├── annotator/ - Document annotation UI
  │   │   └── chat/ - WebSocket communication
  │   ├── views/ - Main application views
  │   ├── types/ - TypeScript type definitions
  │   └── utils/ - Frontend utilities
  └── tests/ - Frontend testing components
```

## Key Directories and Their Purposes

### `/config` - Django Configuration
Contains Django settings files for different environments (base, local, production, test) and GraphQL configuration including authentication backends.

### `/opencontractserver/analyzer` - Analysis Framework
Management of document analyzers, analysis tasks, and synchronization of analyzers with documents. Handles both manual and automated analysis workflows.

### `/opencontractserver/annotations` - Annotation Management
Core annotation models, label sets, hierarchical annotation structures, and embedding support for annotations. Includes migrations for annotation schema evolution.

### `/opencontractserver/corpuses` - Corpus System
Corpus creation, management, and relationships. Includes corpus actions, queries, and metadata management functionality.

### `/opencontractserver/documents` - Document Processing
Document models, file handling, embeddings, relationships, and processing status tracking. Core component for document storage and metadata.

### `/opencontractserver/extracts` - Data Extraction
Structured data extraction framework with column definitions, data cells, and corpus-level extraction management. Supports complex data schemas.

### `/opencontractserver/llms` - AI Integration
LLM agents, tools, and workflows. Contains both core agents and Pydantic AI-based implementations for structured response generation.

### `/opencontractserver/pipeline` - Processing Pipeline
Document processing components including parsers, embedders, thumbnailers, and post-processors. Modular framework for document analysis.

### `/frontend/src` - React Source
TypeScript React components organized by functionality. Contains main UI components, views, and utilities for the frontend application.

### `/docs` - Documentation
Project documentation covering architecture, walkthroughs, configuration, API references, and guides for various system components.

### `/compose` - Docker Compose Configurations
Docker configurations for different environments (local, production) including service definitions for django, postgres, traefik, and maintenance scripts.

### `/requirements` - Python Dependencies
Python package requirements organized by component type (base, local, production, analyzers, processors, etc.) for modular dependency management.