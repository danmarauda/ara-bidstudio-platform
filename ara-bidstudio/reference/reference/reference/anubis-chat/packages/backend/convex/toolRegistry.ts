/**
 * Tool Registry System for ANUBIS Chat
 *
 * This system provides dynamic tool loading based on agent capabilities,
 * type-safe tool definitions, and support for both sync and async tools.
 */

import { tool } from 'ai';
import type { ConvexError } from 'convex/values';
import { z } from 'zod';
import { internal } from './_generated/api';
import type { ActionCtx } from './_generated/server';

// =============================================================================
// Core Types and Interfaces
// =============================================================================

/**
 * Tool execution context with Convex action context
 */
export interface ToolExecutionContext {
  ctx: ActionCtx;
  sessionId?: string;
}

/**
 * Tool execution result with success/error handling
 */
export interface ToolExecutionResult {
  success: boolean;
  data?: Record<string, string | number | boolean | null>;
  error?: string;
  executionTime?: number;
}

/**
 * Tool metadata for registration
 */
export interface ToolMetadata {
  name: string;
  description: string;
  category: 'search' | 'computation' | 'content' | 'analysis' | 'utility';
  version: string;
  author?: string;
  tags?: string[];
}

/**
 * Tool parameter definition using Zod schema
 */
export interface ToolDefinition<T = any> {
  metadata: ToolMetadata;
  schema: z.ZodSchema<T>;
  handler: (
    input: T,
    context: ToolExecutionContext
  ) => Promise<ToolExecutionResult> | ToolExecutionResult;
  aiTool: any; // AI SDK tool definition - using any for flexibility
}

/**
 * Tool registry capability requirements
 */
export interface ToolCapability {
  capability: string;
  required: boolean;
  version?: string;
}

// =============================================================================
// Tool Registry Implementation
// =============================================================================

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();
  private capabilityMapping = new Map<string, string[]>();

  /**
   * Register a tool with the registry
   */
  register<T>(capability: string, toolDef: ToolDefinition<T>): void {
    this.tools.set(capability, toolDef);

    // Build reverse mapping for capability lookup
    if (!this.capabilityMapping.has(capability)) {
      this.capabilityMapping.set(capability, []);
    }
    this.capabilityMapping.get(capability)!.push(toolDef.metadata.name);
  }

  /**
   * Get tools available for given capabilities
   */
  getToolsForCapabilities(capabilities: string[]): ToolDefinition[] {
    return capabilities
      .filter((cap) => this.tools.has(cap))
      .map((cap) => this.tools.get(cap)!)
      .filter(Boolean);
  }

  /**
   * Get AI SDK tools for streaming
   */
  getAIToolsForCapabilities(capabilities: string[]): Record<string, any> {
    const tools: Record<string, any> = {};

    for (const capability of capabilities) {
      const toolDef = this.tools.get(capability);
      if (toolDef) {
        tools[toolDef.metadata.name] = toolDef.aiTool;
      }
    }

    return tools;
  }

  /**
   * Execute a tool by name
   */
  async executeTool(
    toolName: string,
    input: any,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    // Find tool by name
    const toolEntry = Array.from(this.tools.entries()).find(
      ([_, toolDef]) => toolDef.metadata.name === toolName
    );

    if (!toolEntry) {
      return {
        success: false,
        error: `Tool '${toolName}' not found in registry`,
      };
    }

    const [capability, toolDef] = toolEntry;
    const startTime = Date.now();

    try {
      // Validate input against schema
      const validatedInput = toolDef.schema.parse(input);

      // Execute tool
      const result = await toolDef.handler(validatedInput, context);

      return {
        ...result,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tool execution failed',
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Get tool metadata by capability
   */
  getToolMetadata(capability: string): ToolMetadata | null {
    const toolDef = this.tools.get(capability);
    return toolDef ? toolDef.metadata : null;
  }

  /**
   * List all registered capabilities
   */
  getAvailableCapabilities(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Check if capability is available
   */
  hasCapability(capability: string): boolean {
    return this.tools.has(capability);
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: ToolMetadata['category']): ToolDefinition[] {
    return Array.from(this.tools.values()).filter(
      (tool) => tool.metadata.category === category
    );
  }
}

// =============================================================================
// Tool Schemas
// =============================================================================

export const toolSchemas = {
  webSearch: z.object({
    query: z.string().describe('The search query to look up on the web'),
    num: z
      .number()
      .optional()
      .default(5)
      .describe('Number of results to return (1-10)'),
  }),

  calculator: z.object({
    expression: z
      .string()
      .describe(
        'Mathematical expression to evaluate (supports +, -, *, /, %, parentheses, and basic functions)'
      ),
  }),

  createDocument: z.object({
    title: z.string().describe('Title of the document'),
    content: z.string().describe('Content of the document in markdown format'),
    type: z
      .enum(['document', 'code', 'markdown'])
      .describe('Type of document to create'),
  }),

  generateCode: z.object({
    language: z
      .string()
      .describe(
        'Programming language (typescript, javascript, python, rust, go, etc.)'
      ),
    description: z
      .string()
      .describe('Detailed description of what the code should do'),
    framework: z
      .string()
      .optional()
      .describe(
        'Optional framework to use (react, nextjs, express, fastapi, etc.)'
      ),
  }),

  summarizeText: z.object({
    text: z.string().describe('Text content to summarize'),
    maxLength: z
      .number()
      .optional()
      .default(200)
      .describe('Maximum length of the summary in characters'),
  }),
} as const;

// =============================================================================
// Tool Implementations
// =============================================================================

/**
 * Web Search Tool Implementation
 */
const webSearchTool: ToolDefinition<z.infer<typeof toolSchemas.webSearch>> = {
  metadata: {
    name: 'webSearch',
    description: 'Search the web for current information using Google Search',
    category: 'search',
    version: '1.0.0',
    tags: ['web', 'search', 'information', 'google'],
  },
  schema: toolSchemas.webSearch,
  handler: async (input, { ctx }) => {
    try {
      const result = await ctx.runAction(internal.tools.searchWeb, {
        query: input.query,
        num: input.num,
      });
      return result as ToolExecutionResult;
    } catch (error) {
      return {
        success: false,
        error: `Web search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
  aiTool: tool({
    description: 'Search the web for current information',
    inputSchema: toolSchemas.webSearch,
    execute: ({ query, num }: z.infer<typeof toolSchemas.webSearch>) => ({
      query,
      num,
      pending: true,
    }),
  }),
};

/**
 * Calculator Tool Implementation
 */
const calculatorTool: ToolDefinition<z.infer<typeof toolSchemas.calculator>> = {
  metadata: {
    name: 'calculator',
    description: 'Perform mathematical calculations and evaluate expressions',
    category: 'computation',
    version: '1.0.0',
    tags: ['math', 'calculation', 'arithmetic'],
  },
  schema: toolSchemas.calculator,
  handler: async (input, { ctx }) => {
    try {
      const result = await ctx.runAction(internal.tools.calculate, {
        expression: input.expression,
      });
      return result as ToolExecutionResult;
    } catch (error) {
      return {
        success: false,
        error: `Calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
  aiTool: tool({
    description: 'Perform mathematical calculations',
    inputSchema: toolSchemas.calculator,
    execute: ({ expression }: z.infer<typeof toolSchemas.calculator>) => ({
      expression,
      pending: true,
    }),
  }),
};

/**
 * Create Document Tool Implementation
 */
const createDocumentTool: ToolDefinition<
  z.infer<typeof toolSchemas.createDocument>
> = {
  metadata: {
    name: 'createDocument',
    description:
      'Create documents, code artifacts, or markdown content that can be displayed separately',
    category: 'content',
    version: '1.0.0',
    tags: ['document', 'creation', 'markdown', 'code'],
  },
  schema: toolSchemas.createDocument,
  handler: async (input, { ctx }) => {
    try {
      const result = await ctx.runAction(
        internal.tools.createDocumentInternal,
        {
          title: input.title,
          content: input.content,
          type: input.type,
        }
      );
      return result as ToolExecutionResult;
    } catch (error) {
      return {
        success: false,
        error: `Document creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
  aiTool: tool({
    description:
      'Create a document or code artifact that can be displayed separately',
    inputSchema: toolSchemas.createDocument,
    execute: ({
      title,
      content,
      type,
    }: z.infer<typeof toolSchemas.createDocument>) => ({
      title,
      content,
      type,
      pending: true,
    }),
  }),
};

/**
 * Generate Code Tool Implementation
 */
const generateCodeTool: ToolDefinition<
  z.infer<typeof toolSchemas.generateCode>
> = {
  metadata: {
    name: 'generateCode',
    description:
      'Generate code in various programming languages with optional framework support',
    category: 'content',
    version: '1.0.0',
    tags: ['code', 'generation', 'programming', 'development'],
  },
  schema: toolSchemas.generateCode,
  handler: async (input, { ctx }) => {
    try {
      const result = await ctx.runAction(internal.tools.generateCodeInternal, {
        language: input.language,
        description: input.description,
        framework: input.framework,
      });
      return result as ToolExecutionResult;
    } catch (error) {
      return {
        success: false,
        error: `Code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
  aiTool: tool({
    description: 'Generate code in a specific programming language',
    inputSchema: toolSchemas.generateCode,
    execute: ({
      language,
      description,
      framework,
    }: z.infer<typeof toolSchemas.generateCode>) => ({
      language,
      description,
      framework,
      pending: true,
    }),
  }),
};

/**
 * Summarize Text Tool Implementation
 */
const summarizeTextTool: ToolDefinition<
  z.infer<typeof toolSchemas.summarizeText>
> = {
  metadata: {
    name: 'summarizeText',
    description:
      'Summarize long text content into concise, digestible summaries',
    category: 'analysis',
    version: '1.0.0',
    tags: ['text', 'summarization', 'analysis', 'nlp'],
  },
  schema: toolSchemas.summarizeText,
  handler: async (input, { ctx }) => {
    try {
      const result = await ctx.runAction(internal.tools.summarizeText, {
        text: input.text,
        maxLength: input.maxLength,
      });
      return result as ToolExecutionResult;
    } catch (error) {
      return {
        success: false,
        error: `Text summarization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
  aiTool: tool({
    description: 'Summarize long text into a shorter version',
    inputSchema: toolSchemas.summarizeText,
    execute: ({
      text,
      maxLength,
    }: z.infer<typeof toolSchemas.summarizeText>) => ({
      text,
      maxLength,
      pending: true,
    }),
  }),
};

// =============================================================================
// Global Tool Registry Instance
// =============================================================================

export const globalToolRegistry = new ToolRegistry();

// Register all available tools
globalToolRegistry.register('webSearch', webSearchTool);
globalToolRegistry.register('calculator', calculatorTool);
globalToolRegistry.register('createDocument', createDocumentTool);
globalToolRegistry.register('generateCode', generateCodeTool);
globalToolRegistry.register('summarizeText', summarizeTextTool);

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get tools for agent capabilities with validation
 */
export function getToolsForAgent(capabilities: string[]): {
  tools: ToolDefinition[];
  aiTools: Record<string, any>;
  missingCapabilities: string[];
} {
  const tools = globalToolRegistry.getToolsForCapabilities(capabilities);
  const aiTools = globalToolRegistry.getAIToolsForCapabilities(capabilities);

  const foundCapabilities = new Set(
    tools.map((_, index) => capabilities[index])
  );
  const missingCapabilities = capabilities.filter(
    (cap) => !foundCapabilities.has(cap)
  );

  return {
    tools,
    aiTools,
    missingCapabilities,
  };
}

/**
 * Execute tool by name with proper error handling
 */
export async function executeToolByName(
  toolName: string,
  input: any,
  context: ToolExecutionContext
): Promise<ToolExecutionResult> {
  return await globalToolRegistry.executeTool(toolName, input, context);
}

/**
 * Get available capabilities for agent creation
 */
export function getAvailableCapabilities(): {
  capability: string;
  metadata: ToolMetadata;
}[] {
  return globalToolRegistry.getAvailableCapabilities().map((capability) => ({
    capability,
    metadata: globalToolRegistry.getToolMetadata(capability)!,
  }));
}

/**
 * Validate agent capabilities against registry
 */
export function validateAgentCapabilities(capabilities: string[]): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const capability of capabilities) {
    if (globalToolRegistry.hasCapability(capability)) {
      valid.push(capability);
    } else {
      invalid.push(capability);
    }
  }

  return { valid, invalid };
}

// =============================================================================
// Backward Compatibility Export
// =============================================================================

/**
 * Export AI tools in the same format as the original tools.ts
 * This ensures backward compatibility with existing streaming.ts
 */
export const aiTools = globalToolRegistry.getAIToolsForCapabilities([
  'webSearch',
  'calculator',
  'createDocument',
  'generateCode',
  'summarizeText',
]);

export default globalToolRegistry;
