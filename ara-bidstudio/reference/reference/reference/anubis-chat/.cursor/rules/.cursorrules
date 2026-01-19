# ANUBIS Chat - Cursor AI Development Rules

## Project Overview
You are working on ANUBIS Chat, a Solana-native AI chat SaaS platform combining advanced AI/RAG capabilities with Web3 blockchain integration.

## Core Technology Stack
- **AI Models**: Claude 3.5 Sonnet, GPT-4o, DeepSeek  
- **AI Framework**: Vercel AI SDK v5.2 with streaming
- **Vector Database**: Qdrant with OpenAI embeddings
- **Frontend**: Next.js 15+, TypeScript, React Server Components
- **Backend**: Hono.js API with edge runtime
- **Blockchain**: Solana Web3.js, Anchor framework
- **Database**: PostgreSQL with Prisma ORM
- **Testing**: Vitest, Playwright, React Testing Library

## AI Assistant Configuration
- **Model Preference**: claude-3.5-sonnet, gpt-4-turbo
- **Context Window**: 16384-32768 tokens (adjust based on complexity)
- **Temperature**: 0.2-0.4 (precise, consistent code generation)
- **Max Tokens**: 8192-16384 (comprehensive responses)

## Development Principles

### Code Quality Standards
- Use TypeScript strict mode - no `any` types allowed
- Follow functional programming patterns where possible
- Implement comprehensive error handling with Result types
- Write self-documenting code with clear variable names
- Use ESLint + Biome for consistent formatting

### Architecture Patterns  
- Component-driven development with React Server Components
- Service layer separation for business logic
- Dependency injection for testability
- Event-driven architecture for real-time features
- Clean separation between AI, database, and blockchain layers

### Performance Requirements
- Frontend: <3s load time, <100ms interaction delay
- API endpoints: <200ms average, <500ms P95
- AI responses: <2s time-to-first-token, <10s total
- Vector search: <100ms query time, 95%+ recall accuracy

### Security Guidelines
- Validate all inputs with Zod schemas
- Implement prompt injection prevention for AI inputs
- Use parameterized queries for database operations
- Follow Web3 security best practices for wallet integration
- Implement proper session management and CSRF protection

## File Organization

### Directory Structure
```
src/
├── components/          # React components
├── hooks/              # Custom React hooks
├── services/           # Business logic services  
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── test/               # Test utilities and fixtures
└── app/                # Next.js app router pages
```

### Naming Conventions
- **Files**: kebab-case for regular files, PascalCase for components
- **Components**: PascalCase with descriptive names
- **Hooks**: camelCase starting with 'use'
- **Services**: PascalCase with 'Service' suffix
- **Types**: PascalCase for interfaces, camelCase for type aliases

## AI/RAG Implementation Guidelines

### Model Integration
- Use dynamic model selection based on task complexity and cost
- Implement fallback chains: Claude → GPT-4o → DeepSeek
- Configure rate limiting and error handling for all providers
- Cache responses when appropriate to reduce API costs

### Streaming Implementation  
- Use Vercel AI SDK v5.2 streaming patterns
- Implement backpressure management for large responses
- Handle stream interruption and reconnection gracefully
- Provide real-time user feedback during streaming

### Vector Search Optimization
- Use hybrid search combining semantic and keyword matching
- Implement contextual retrieval with chunk expansion
- Configure Qdrant for sub-100ms query performance
- Monitor and optimize retrieval accuracy continuously

### Prompt Engineering
- Build dynamic, context-aware prompts
- Implement comprehensive input sanitization
- Use system prompts that prevent prompt injection
- Validate AI responses for safety and relevance

## Testing Requirements

### Test Coverage Targets
- Unit tests: 90%+ statement coverage, 85%+ branch coverage
- Integration tests: All API endpoints and database operations
- E2E tests: Critical user workflows and cross-browser compatibility
- AI tests: Response quality, safety, and consistency validation

### Testing Patterns
- Write tests first for new functionality (TDD approach)
- Use Page Object Model for E2E tests
- Mock external services (AI APIs, blockchain) for unit tests
- Implement property-based testing for utility functions

### Performance Testing
- Validate Core Web Vitals compliance (LCP <2.5s, FID <100ms, CLS <0.1)
- Test API performance under concurrent load
- Monitor memory usage and detect leaks
- Validate streaming response performance

## Web3/Solana Integration

### Wallet Integration
- Support multiple wallet providers (Phantom, Solflare, etc.)
- Implement graceful error handling for user rejection
- Cache wallet connection state appropriately
- Validate all transactions before signing

### Blockchain Interaction
- Use Anchor framework for program interactions
- Implement proper error handling for network failures
- Cache RPC responses to improve performance
- Validate account states before operations

## Error Handling Patterns

### Error Types
- Use custom error classes with proper inheritance
- Implement Result<T, E> patterns for fallible operations
- Provide user-friendly error messages
- Log errors with appropriate context and severity

### Recovery Strategies  
- Implement exponential backoff for API retries
- Provide fallback options for critical functionality
- Cache successful responses to reduce failure impact
- Gracefully degrade features when services are unavailable

## Development Workflow

### Code Generation Guidelines
- Generate TypeScript interfaces from database schema
- Create API route handlers with proper validation
- Build React components with TypeScript props
- Include comprehensive JSDoc comments for public APIs

### Git Workflow
- Use conventional commits (feat, fix, docs, etc.)
- Create meaningful commit messages with context
- Include tests in the same commit as features
- Keep commits focused and atomic

## File References

When implementing features, refer to these rule files for detailed guidance:

### AI/RAG System
- `./ai-rag/ai-models.mdc` - Model selection and configuration
- `./ai-rag/streaming.mdc` - Real-time streaming implementation  
- `./ai-rag/embeddings.mdc` - Text processing and embedding strategies
- `./ai-rag/vector-search.mdc` - Qdrant optimization and search patterns
- `./ai-rag/prompt-engineering.mdc` - Safe prompt construction
- `./ai-rag/memory-management.mdc` - Context window optimization

### Testing Strategy  
- `./testing/unit-tests.mdc` - Component and service testing
- `./testing/integration-tests.mdc` - API and database testing
- `./testing/e2e-tests.mdc` - User workflow testing
- `./testing/ai-testing.mdc` - AI response validation
- `./testing/wallet-testing.mdc` - Web3 interaction testing
- `./testing/performance-tests.mdc` - Performance benchmarking

## Code Style Preferences

### TypeScript
- Use strict mode with no implicit any
- Prefer interfaces over type aliases for object shapes
- Use const assertions and satisfies operator appropriately
- Implement proper null/undefined handling

### React
- Use functional components with hooks
- Implement proper dependency arrays for useEffect
- Use React.memo for performance optimization when needed
- Follow React Server Component patterns for Next.js 15+

### Async Programming
- Use async/await over Promise chains
- Implement proper error handling in async functions
- Use Promise.allSettled for parallel operations that can fail
- Cache async results appropriately

## Performance Optimization

### Bundle Optimization
- Use dynamic imports for code splitting
- Optimize images with Next.js Image component
- Implement proper caching strategies
- Monitor bundle size and Core Web Vitals

### Database Optimization
- Use database indexes for query performance
- Implement connection pooling
- Cache frequently accessed data
- Use pagination for large result sets

### AI Performance
- Cache embedding computations
- Implement streaming for long responses
- Use appropriate model selection for task complexity
- Monitor token usage and optimize prompts

## Accessibility Requirements
- Ensure WCAG 2.1 AA compliance
- Implement proper ARIA labels and roles
- Support keyboard navigation throughout the application
- Test with screen readers and other assistive technologies
- Provide alternative text for images and visual content

Remember: Always prioritize security, performance, and user experience. When in doubt, refer to the comprehensive rule files in the `.cursor/rules/` directory for detailed implementation guidance.