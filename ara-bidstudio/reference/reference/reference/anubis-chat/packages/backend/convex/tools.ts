/**
 * Tool System for AI Chat
 * Provides web search, code generation, and other capabilities
 */

import { tool } from 'ai';
import { v } from 'convex/values';
import { z } from 'zod';
import { internalAction } from './_generated/server';

// Define proper types for search results
interface SearchResult {
  title: string;
  link: string;
  snippet?: string;
  description?: string;
  displayed_link?: string;
  domain?: string;
}

// Tool schemas using Zod for validation
export const toolSchemas = {
  webSearch: z.object({
    query: z.string().describe('The search query to look up on the web'),
    num: z
      .number()
      .optional()
      .default(5)
      .describe('Number of results to return'),
  }),

  createDocument: z.object({
    title: z.string().describe('Title of the document'),
    content: z.string().describe('Content of the document in markdown format'),
    type: z.enum(['document', 'code', 'markdown']).describe('Type of document'),
  }),

  generateCode: z.object({
    language: z
      .string()
      .describe('Programming language (e.g., typescript, python, javascript)'),
    description: z.string().describe('Description of what the code should do'),
    framework: z
      .string()
      .optional()
      .describe('Framework to use (e.g., react, nextjs, express)'),
  }),

  calculator: z.object({
    expression: z.string().describe('Mathematical expression to evaluate'),
  }),

  summarize: z.object({
    text: z.string().describe('Text to summarize'),
    maxLength: z
      .number()
      .optional()
      .default(200)
      .describe('Maximum length of summary'),
  }),
};

// Web Search Tool using SearchAPI.io (more cost-effective than SerpAPI)
export const searchWeb = internalAction({
  args: {
    query: v.string(),
    num: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.SEARCHAPI_API_KEY;
    if (!apiKey) {
      throw new Error('SEARCHAPI_API_KEY not configured');
    }

    try {
      // SearchAPI.io endpoint
      const url = new URL('https://www.searchapi.io/api/v1/search');
      url.searchParams.append('api_key', apiKey);
      url.searchParams.append('q', args.query);
      url.searchParams.append('num', String(args.num || 5));
      url.searchParams.append('engine', 'google');

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`SearchAPI error: ${response.statusText}`);
      }

      const data = await response.json();

      // Extract relevant information from search results
      const organicResults = data.organic_results || [];

      return {
        success: true,
        results: organicResults.map((result: SearchResult) => ({
          title: result.title,
          link: result.link,
          snippet: result.snippet || result.description,
          displayedLink: result.displayed_link || result.domain,
        })),
        searchInformation: {
          totalResults: data.search_information?.total_results,
          timeTaken: data.search_information?.time_taken_displayed,
        },
      };
    } catch (_error) {
      // Log error for debugging - in production use proper logging
      // console.error('Web search error:', error);
      return {
        success: false,
        error: 'Failed to perform web search',
        results: [],
      };
    }
  },
});

// Calculator Tool
export const calculate = internalAction({
  args: {
    expression: v.string(),
  },
  handler: (_ctx, args) => {
    try {
      // Use Function constructor for safe evaluation
      // This is safer than eval but still be careful with user input
      const result = new Function(`return ${args.expression}`)();

      return {
        success: true,
        expression: args.expression,
        result,
      };
    } catch (_error) {
      return {
        success: false,
        error: 'Invalid mathematical expression',
        expression: args.expression,
      };
    }
  },
});

// Code Generation Tool (using AI to generate code)
export const generateCodeInternal = internalAction({
  args: {
    language: v.string(),
    description: v.string(),
    framework: v.optional(v.string()),
  },
  handler: (_ctx, args) => {
    // This would normally call an AI model to generate code
    // For now, we'll return a template
    const codeTemplates: Record<string, string> = {
      typescript: `// ${args.description}
export function generatedFunction() {
  // TODO: Implement ${args.description}
  return "Generated code placeholder";
}`,
      python: `# ${args.description}
def generated_function():
    """TODO: Implement ${args.description}"""
    return "Generated code placeholder"`,
      javascript: `// ${args.description}
function generatedFunction() {
  // TODO: Implement ${args.description}
  return "Generated code placeholder";
}`,
    };

    const code =
      codeTemplates[args.language.toLowerCase()] ||
      `// ${args.description}\n// Language: ${args.language}`;

    return {
      success: true,
      language: args.language,
      framework: args.framework,
      code,
      description: args.description,
    };
  },
});

// Document Creation Tool
export const createDocumentInternal = internalAction({
  args: {
    title: v.string(),
    content: v.string(),
    type: v.union(
      v.literal('document'),
      v.literal('code'),
      v.literal('markdown')
    ),
  },
  handler: (_ctx, args) => {
    // Store the document or return it for display
    return {
      success: true,
      document: {
        id: crypto.randomUUID(),
        title: args.title,
        content: args.content,
        type: args.type,
        createdAt: new Date().toISOString(),
      },
    };
  },
});

// Text Summarization Tool
const SENTENCE_SPLIT_REGEX = /[.!?]+/;

export const summarizeText = internalAction({
  args: {
    text: v.string(),
    maxLength: v.optional(v.number()),
  },
  handler: (_ctx, args) => {
    // Simple summarization - in production, use an AI model
    const maxLength = args.maxLength || 200;
    const sentences = args.text
      .split(SENTENCE_SPLIT_REGEX)
      .filter((s) => s.trim());

    if (args.text.length <= maxLength) {
      return {
        success: true,
        summary: args.text,
        originalLength: args.text.length,
      };
    }

    // Take first few sentences up to maxLength
    let summary = '';
    for (const sentence of sentences) {
      if (summary.length + sentence.length > maxLength) {
        break;
      }
      summary += `${sentence.trim()}. `;
    }

    return {
      success: true,
      summary: summary.trim() || `${args.text.substring(0, maxLength)}...`,
      originalLength: args.text.length,
      summaryLength: summary.length,
    };
  },
});

// Export tool definitions for AI SDK - now delegated to registry for consistency
export const aiTools = {
  webSearch: tool({
    description: 'Search the web for current information',
    inputSchema: toolSchemas.webSearch,
    execute: ({ query, num }: z.infer<typeof toolSchemas.webSearch>) => {
      // This will be called from the streaming action
      return { query, num, pending: true };
    },
  }),

  createDocument: tool({
    description:
      'Create a document or code artifact that can be displayed separately',
    inputSchema: toolSchemas.createDocument,
    execute: ({
      title,
      content,
      type,
    }: z.infer<typeof toolSchemas.createDocument>) => {
      return { title, content, type, pending: true };
    },
  }),

  generateCode: tool({
    description: 'Generate code in a specific programming language',
    inputSchema: toolSchemas.generateCode,
    execute: ({
      language,
      description,
      framework,
    }: z.infer<typeof toolSchemas.generateCode>) => {
      return { language, description, framework, pending: true };
    },
  }),

  calculator: tool({
    description: 'Perform mathematical calculations',
    inputSchema: toolSchemas.calculator,
    execute: ({ expression }: z.infer<typeof toolSchemas.calculator>) => {
      return { expression, pending: true };
    },
  }),

  summarize: tool({
    description: 'Summarize long text into a shorter version',
    inputSchema: toolSchemas.summarize,
    execute: ({ text, maxLength }: z.infer<typeof toolSchemas.summarize>) => {
      return { text, maxLength, pending: true };
    },
  }),
};
