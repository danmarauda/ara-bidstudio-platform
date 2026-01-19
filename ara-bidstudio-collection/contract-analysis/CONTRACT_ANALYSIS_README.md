# Contract Analysis Platform

This is a Next.js contract analysis platform that combines the best features of OpenContracts and papra with a Convex/Langflow/Mastra backend.

## Getting Started

First, run the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `/src` - Next.js frontend components and pages
- `/convex` - Convex backend functions and schema
  - `/documents` - Document management functions
  - `/annotations` - Text annotation functions
  - `/corpuses` - Corpus management functions
- `/public` - Static assets

## Features

- Real-time collaborative document analysis
- PDF processing with docling-granite integration
- Intelligent text annotation system
- Corpus-based document grouping
- AI-powered contract entity extraction
- Structured data analysis with Mastra agents
- Visual AI pipeline design with Langflow

## Architecture

This platform combines modern web technologies:

- **Next.js 19** with **React 19** for a modern, performant frontend
- **Convex** for real-time database synchronization and serverless functions
- **Langflow** for visual creation of AI processing pipelines
- **Mastra Agents** for enterprise-grade agentic workflows with observability
- **Tailwind CSS** for utility-first styling with clean aesthetics

The integration allows for real-time UI updates while leveraging powerful AI processing capabilities for contract analysis.

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Convex Documentation](https://docs.convex.dev) - real-time backend platform
- [Langflow Documentation](https://langflow.wiki) - visual AI pipeline builder
- [Mastra Documentation](https://mastra.ai/docs) - enterprise agentic workflows

## Deployment

- Frontend can be deployed on Vercel or similar platforms
- Convex backend deployed through Convex cloud
- Langflow pipelines deployed separately
- Docling-granite microservice deployed as external service