# Tool Registry System

A comprehensive tool management system for ANUBIS Chat that provides dynamic tool loading based on agent capabilities, type-safe tool definitions, and support for both synchronous and asynchronous tools.

## Architecture

### Core Components

1. **Tool Registry**: Central registry that maps capabilities to tool implementations
2. **Tool Definitions**: Type-safe tool specifications with metadata and handlers
3. **Capability System**: Agent-based authorization for tool access
4. **Execution Context**: Runtime context for tool execution

### Flow Diagram

```
Agent Capabilities → Tool Registry → Available Tools → AI SDK Tools → Tool Execution
```

## Usage

### 1. Basic Tool Registry Usage

```typescript
import { globalToolRegistry, getToolsForAgent } from './toolRegistry';

// Get tools for an agent with specific capabilities
const agentCapabilities = ['webSearch', 'calculator', 'generateCode'];
const { tools, aiTools, missingCapabilities } = getToolsForAgent(agentCapabilities);

console.log(`Agent has access to ${tools.length} tools`);
console.log(`Missing capabilities: ${missingCapabilities.join(', ')}`);
```

### 2. Agent Integration

```typescript
// In streaming.ts - how the registry integrates with agents
const chat = await ctx.runQuery(api.chats.getById, { id: chatId });

// Get agent capabilities
let availableCapabilities = ['webSearch', 'calculator']; // defaults
if (chat.agentId) {
  const agent = await ctx.runQuery(api.agents.getById, { id: chat.agentId });
  if (agent?.capabilities) {
    availableCapabilities = agent.capabilities;
  }
}

// Get tools for this agent
const { aiTools } = getToolsForAgent(availableCapabilities);

// Use with AI SDK
const result = await streamText({
  model: aiModel,
  tools: aiTools, // Registry provides the tools
  // ...
});
```

### 3. Tool Execution

```typescript
import { executeToolByName } from './toolRegistry';

// Execute a tool dynamically
const result = await executeToolByName(
  'webSearch', 
  { query: 'TypeScript best practices', num: 5 }, 
  { ctx, sessionId }
);

if (result.success) {
  console.log('Search results:', result.data);
} else {
  console.error('Search failed:', result.error);
}
```

### 4. Managing Agent Capabilities

```typescript
// Update an agent's capabilities
await ctx.runMutation(api.agents.updateCapabilities, {
  agentId: 'agent123',
  capabilities: ['webSearch', 'calculator', 'createDocument']
});

// Get agent capabilities
const capInfo = await ctx.runQuery(api.agents.getAgentCapabilities, {
  agentId: 'agent123'
});
```

## Available Tools

### Core Tools

| Capability | Tool Name | Description | Category |
|-----------|-----------|-------------|----------|
| `webSearch` | webSearch | Search the web for current information | search |
| `calculator` | calculator | Perform mathematical calculations | computation |
| `createDocument` | createDocument | Create documents and artifacts | content |
| `generateCode` | generateCode | Generate code in various languages | content |
| `summarizeText` | summarizeText | Summarize long text content | analysis |

### Tool Categories

- **search**: Web search and information retrieval
- **computation**: Mathematical and logical operations  
- **content**: Document and code generation
- **analysis**: Text processing and analysis
- **utility**: General purpose utilities

## Extending the System

### 1. Adding New Tools

```typescript
import { globalToolRegistry, ToolDefinition } from './toolRegistry';
import { z } from 'zod';
import { tool } from 'ai';

// Define schema
const myToolSchema = z.object({
  input: z.string().describe('Input parameter'),
  options: z.object({
    mode: z.enum(['fast', 'accurate']).default('fast')
  }).optional()
});

// Create tool definition
const myTool: ToolDefinition<z.infer<typeof myToolSchema>> = {
  metadata: {
    name: 'myCustomTool',
    description: 'My custom tool for specific tasks',
    category: 'utility',
    version: '1.0.0',
    tags: ['custom', 'example']
  },
  schema: myToolSchema,
  handler: async (input, context) => {
    // Your tool implementation
    try {
      const result = await processInput(input);
      return {
        success: true,
        data: { result },
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  aiTool: tool({
    description: 'My custom tool for specific tasks',
    inputSchema: myToolSchema,
    execute: (input) => ({ ...input, pending: true })
  })
};

// Register the tool
globalToolRegistry.register('myCapability', myTool);
```

### 2. Tool Categories

When creating new tools, assign them to appropriate categories:

- **search**: Information retrieval tools
- **computation**: Mathematical, logical operations
- **content**: Creation of documents, code, etc.
- **analysis**: Processing and analysis of data
- **utility**: General purpose tools

### 3. Best Practices

1. **Validation**: Always use Zod schemas for input validation
2. **Error Handling**: Provide detailed error messages
3. **Metadata**: Include comprehensive metadata for tools
4. **Performance**: Consider execution time in tool handlers
5. **Security**: Validate and sanitize all inputs

## Helper Functions

### Registry Management

```typescript
import {
  listAvailableTools,
  getToolsByCategory,
  validateAgentCapabilities
} from './toolRegistryHelpers';

// List all tools
const allTools = listAvailableTools();

// Get tools by category
const searchTools = getToolsByCategory().search;

// Validate capabilities
const validation = validateAgentCapabilities(['webSearch', 'invalidTool']);
console.log('Valid:', validation.valid);
console.log('Invalid:', validation.invalid);
```

### Agent Tools Preparation

```typescript
import { prepareAgentTools } from './toolRegistryHelpers';

const agentTools = prepareAgentTools(['webSearch', 'calculator']);
console.log(`Agent has ${agentTools.toolsCount} tools available`);
```

## Migration from Legacy System

The tool registry maintains backward compatibility with the existing `tools.ts` file. The hardcoded switch statement in `streaming.ts` has been replaced with dynamic tool execution:

### Before (Legacy)
```typescript
switch (toolCall.toolName) {
  case 'webSearch':
    toolResult = await ctx.runAction(internal.tools.searchWeb, args);
    break;
  // ... more cases
}
```

### After (Registry)
```typescript
const toolResult = await executeToolByName(
  toolCall.toolName, 
  toolCall.input, 
  { ctx, sessionId }
);
```

## Security Considerations

1. **Capability-based Access**: Tools are only available if the agent has the required capability
2. **Input Validation**: All tool inputs are validated using Zod schemas
3. **Error Isolation**: Tool failures don't crash the entire system
4. **Execution Context**: Tools receive controlled access to system resources

## Performance Optimization

1. **Lazy Loading**: Tools are loaded only when needed
2. **Caching**: Registry caches tool definitions for fast lookup
3. **Parallel Execution**: Multiple tools can execute concurrently
4. **Resource Management**: Execution timeouts and resource limits

## Future Enhancements

1. **Dynamic Tool Loading**: Load tools from external plugins
2. **Tool Composition**: Combine multiple tools into workflows
3. **Advanced Permissions**: Fine-grained access control
4. **Tool Metrics**: Performance monitoring and analytics
5. **Tool Marketplace**: Community-contributed tools