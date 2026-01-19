# Development Setup Guide

## Prerequisites

- [Bun](https://bun.sh) installed
- [Convex account](https://convex.dev) for backend deployment
- Access to Langflow instance
- Mastra agent configuration

## Quick Start

1. Install dependencies:
   ```bash
   bun install
   ```

2. Run the development server:
   ```bash
   bun dev
   ```

3. Initialize Convex development backend:
   ```bash
   bunx convex dev
   ```

## Project Structure

```
contract-analysis/
├── src/
│   ├── app/              # Next.js 19 App Router pages
│   │   ├── documents/   # Document management UI
│   │   ├── annotations/ # Annotation system UI
│   │   ├── corpuses/    # Corpus management UI
│   │   └── layout.tsx   # Root layout with navigation
│   └── components/      # Shared React components
├── convex/              # Convex backend functions
│   ├── documents/       # Document management functions
│   ├── annotations/     # Annotation functions
│   ├── corpuses/        # Corpus management functions
│   ├── schema.ts        # Combined database schema
│   └── integrations.ts  # Langflow and Mastra integrations
└── public/              # Static assets
```

## Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_CONVEX_URL=your-convex-url
LANGFLOW_API_URL=your-langflow-url
LANGFLOW_API_KEY=your-langflow-api-key
```

## Integration Points

### Convex + Docling
- REST API calls to docling-granite microservice
- Document preprocessing and tokenization
- Annotation data storage in Convex database

### Convex + Langflow
- API calls to Langflow pipelines
- Document processing workflows
- Structured data extraction and analysis

### Convex + Mastra Agents
- Enterprise agentic workflows
- Reasoning traceability and source citation
- Multi-agent collaboration for contract analysis

## Deployment

1. Deploy Convex backend:
   ```bash
   bunx convex deploy
   ```

2. Deploy Next.js frontend:
   ```bash
   bun run build
   # Then deploy to Vercel or similar platform
   ```

3. Configure Langflow flows separately

4. Set up docling-granite microservice deployment

## Development Workflow

1. Frontend development with Next.js hot reloading
2. Backend development with Convex local development server
3. AI pipeline design with Langflow visual interface
4. Agent development and testing with Mastra tools