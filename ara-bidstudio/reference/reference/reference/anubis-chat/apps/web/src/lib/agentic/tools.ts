/**
 * Agentic AI Tool Definitions
 * Comprehensive tool system for multi-step AI agents
 */

import { nanoid } from 'nanoid';
import { z } from 'zod';
import type {
  AgentContext,
  AgentTool,
  ToolCategory,
  ToolResult,
} from '@/lib/types/agentic';

// =============================================================================
// Tool Registry
// =============================================================================

export const TOOL_REGISTRY = new Map<string, AgentTool<unknown>>();

export function registerTool<T>(tool: AgentTool<T>): void {
  TOOL_REGISTRY.set(tool.name, tool as AgentTool<unknown>);
}

export function getTool(name: string): AgentTool<unknown> | undefined {
  return TOOL_REGISTRY.get(name);
}

export function getAllTools(): AgentTool<unknown>[] {
  return Array.from(TOOL_REGISTRY.values());
}

export function getToolsByCategory(
  category: ToolCategory
): AgentTool<unknown>[] {
  return getAllTools().filter((tool) => tool.category === category);
}

// =============================================================================
// Core Utility Tools
// =============================================================================

export const calculatorTool: AgentTool<{ expression: string }> = {
  name: 'calculator',
  description:
    'Perform mathematical calculations with support for basic arithmetic, algebra, and common functions',
  category: 'computation',
  parameters: z.object({
    expression: z
      .string()
      .describe(
        'Mathematical expression to evaluate (e.g., "2 + 3 * 4", "sqrt(16)", "sin(pi/2)")'
      ),
  }),
  async execute(
    params: { expression: string },
    _context: AgentContext
  ): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      // Simple expression evaluator (in production, use a proper math library)
      const result = evaluateMathExpression(params.expression);

      return {
        id: nanoid(),
        success: true,
        result: {
          expression: params.expression,
          result,
          type: typeof result,
        },
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        id: nanoid(),
        success: false,
        result: null,
        error: {
          code: 'CALCULATION_ERROR',
          message: `Math calculation failed: ${error instanceof Error ? error.message : String(error)}`,
          details: { expression: params.expression },
        },
        executionTime: Date.now() - startTime,
      };
    }
  },
};

export const textAnalyzerTool: AgentTool<{
  text: string;
  analysisTypes: string[];
}> = {
  name: 'text_analyzer',
  description:
    'Analyze text for various metrics including word count, sentiment, readability, and key phrases',
  category: 'data_retrieval',
  parameters: z.object({
    text: z.string().describe('Text to analyze'),
    analysisTypes: z
      .array(
        z.enum([
          'word_count',
          'sentiment',
          'readability',
          'key_phrases',
          'language',
        ])
      )
      .default(['word_count', 'sentiment'])
      .describe('Types of analysis to perform'),
  }),
  async execute(
    params: { text: string; analysisTypes: string[] },
    _context: AgentContext
  ): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      const analysis: {
        wordCount?: {
          words: number;
          characters: number;
          charactersNoSpaces: number;
          paragraphs: number;
          sentences: number;
        };
        sentiment?: {
          score: number;
          label: string;
          confidence: number;
        };
        readability?: {
          level: string;
          score: number;
        };
        keyPhrases?: string[];
        language?: {
          language: string;
          confidence: number;
        };
      } = {};

      if (params.analysisTypes.includes('word_count')) {
        analysis.wordCount = {
          words: params.text.split(/\s+/).filter((word) => word.length > 0)
            .length,
          characters: params.text.length,
          charactersNoSpaces: params.text.replace(/\s/g, '').length,
          paragraphs: params.text.split(/\n\s*\n/).length,
          sentences: params.text
            .split(/[.!?]+/)
            .filter((s) => s.trim().length > 0).length,
        };
      }

      if (params.analysisTypes.includes('sentiment')) {
        // Simple sentiment analysis (in production, use a proper NLP library)
        analysis.sentiment = analyzeSentiment(params.text);
      }

      if (params.analysisTypes.includes('readability')) {
        analysis.readability = calculateReadability(params.text);
      }

      if (params.analysisTypes.includes('key_phrases')) {
        analysis.keyPhrases = extractKeyPhrases(params.text);
      }

      if (params.analysisTypes.includes('language')) {
        analysis.language = detectLanguage(params.text);
      }

      return {
        id: nanoid(),
        success: true,
        result: analysis,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        id: nanoid(),
        success: false,
        result: null,
        error: {
          code: 'ANALYSIS_ERROR',
          message: `Text analysis failed: ${error instanceof Error ? error.message : String(error)}`,
          details: { textLength: params.text.length },
        },
        executionTime: Date.now() - startTime,
      };
    }
  },
};

interface TimestampParams {
  operation: 'current' | 'convert' | 'format';
  timestamp?: number;
  format?: string;
  timezone?: string;
}

export const timestampTool: AgentTool<TimestampParams> = {
  name: 'timestamp',
  description:
    'Get current timestamp or convert between different time formats',
  category: 'computation',
  parameters: z.object({
    operation: z
      .enum(['current', 'convert', 'format'])
      .describe('Operation to perform'),
    timestamp: z
      .number()
      .optional()
      .describe('Unix timestamp (for convert/format operations)'),
    format: z
      .string()
      .optional()
      .describe('Desired format (ISO, UTC, local, or custom format string)'),
    timezone: z
      .string()
      .optional()
      .describe('Target timezone (e.g., "UTC", "America/New_York")'),
  }),
  async execute(
    params: TimestampParams,
    _context: AgentContext
  ): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      let result:
        | {
            unix?: number;
            iso?: string;
            utc?: string;
            local?: string;
          }
        | string;

      switch (params.operation) {
        case 'current':
          result = {
            unix: Date.now(),
            iso: new Date().toISOString(),
            utc: new Date().toUTCString(),
            local: new Date().toLocaleString(),
          };
          break;

        case 'convert': {
          if (!params.timestamp) {
            throw new Error('Timestamp required for conversion');
          }
          const date = new Date(params.timestamp);
          result = {
            unix: params.timestamp,
            iso: date.toISOString(),
            utc: date.toUTCString(),
            local: date.toLocaleString(),
          };
          break;
        }

        case 'format':
          if (!params.timestamp) {
            throw new Error('Timestamp required for formatting');
          }
          result = formatTimestamp(
            params.timestamp,
            params.format,
            params.timezone
          );
          break;
      }

      return {
        id: nanoid(),
        success: true,
        result,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        id: nanoid(),
        success: false,
        result: null,
        error: {
          code: 'TIMESTAMP_ERROR',
          message: `Timestamp operation failed: ${error instanceof Error ? error.message : String(error)}`,
          details: { operation: params.operation },
        },
        executionTime: Date.now() - startTime,
      };
    }
  },
};

// =============================================================================
// Data Retrieval Tools
// =============================================================================

export const webSearchTool: AgentTool<{
  query: string;
  limit: number;
  type: string;
}> = {
  name: 'web_search',
  description:
    'Search the web for current information, news, and general knowledge',
  category: 'web_api',
  parameters: z.object({
    query: z.string().describe('Search query'),
    limit: z
      .number()
      .min(1)
      .max(10)
      .default(5)
      .describe('Number of results to return'),
    type: z
      .enum(['general', 'news', 'images'])
      .default('general')
      .describe('Type of search to perform'),
  }),
  async execute(
    params: { query: string; limit: number; type: string },
    _context: AgentContext
  ): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      // Mock web search results (in production, integrate with actual search APIs)
      const results = generateMockSearchResults(
        params.query,
        params.limit,
        params.type
      );

      return {
        id: nanoid(),
        success: true,
        result: {
          query: params.query,
          type: params.type,
          results,
          timestamp: Date.now(),
        },
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        id: nanoid(),
        success: false,
        result: null,
        error: {
          code: 'SEARCH_ERROR',
          message: `Web search failed: ${error instanceof Error ? error.message : String(error)}`,
          details: { query: params.query },
        },
        executionTime: Date.now() - startTime,
      };
    }
  },
};

interface DocumentRetrievalParams {
  operation: 'search' | 'get' | 'list';
  documentId?: string;
  query?: string;
  category?: string;
  limit?: number;
}

export const documentRetrievalTool: AgentTool<DocumentRetrievalParams> = {
  name: 'document_retrieval',
  description:
    'Retrieve and search through user documents stored in the system',
  category: 'data_retrieval',
  parameters: z.object({
    operation: z
      .enum(['search', 'get', 'list'])
      .describe('Operation to perform'),
    documentId: z.string().optional().describe('Document ID for get operation'),
    query: z.string().optional().describe('Search query for search operation'),
    category: z.string().optional().describe('Document category filter'),
    limit: z
      .number()
      .min(1)
      .max(50)
      .default(10)
      .describe('Maximum number of results'),
  }),
  async execute(
    params: DocumentRetrievalParams,
    context: AgentContext
  ): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      // This would integrate with the actual document storage system
      const result = await mockDocumentOperation(params, context.walletAddress);

      return {
        id: nanoid(),
        success: true,
        result,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        id: nanoid(),
        success: false,
        result: null,
        error: {
          code: 'RETRIEVAL_ERROR',
          message: `Document retrieval failed: ${error instanceof Error ? error.message : String(error)}`,
          details: { operation: params.operation },
        },
        executionTime: Date.now() - startTime,
      };
    }
  },
};

// =============================================================================
// Communication Tools
// =============================================================================

interface ChatCompletionParams {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export const chatCompletionTool: AgentTool<ChatCompletionParams> = {
  name: 'chat_completion',
  description: 'Generate AI responses for specific tasks or questions',
  category: 'communication',
  parameters: z.object({
    prompt: z.string().describe('The prompt or question to send to the AI'),
    model: z.string().default('gpt-4o-mini').describe('AI model to use'),
    temperature: z
      .number()
      .min(0)
      .max(2)
      .default(0.7)
      .describe('Response creativity (0-2)'),
    maxTokens: z
      .number()
      .min(1)
      .max(4000)
      .default(1000)
      .describe('Maximum response length'),
  }),
  async execute(
    params: ChatCompletionParams,
    _context: AgentContext
  ): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      // This would integrate with the actual AI completion API
      const response = await mockChatCompletion(params);

      return {
        id: nanoid(),
        success: true,
        result: {
          prompt: params.prompt,
          response: response.text,
          model: params.model,
          usage: response.usage,
        },
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        id: nanoid(),
        success: false,
        result: null,
        error: {
          code: 'COMPLETION_ERROR',
          message: `Chat completion failed: ${error instanceof Error ? error.message : String(error)}`,
          details: { model: params.model || 'unknown' },
        },
        executionTime: Date.now() - startTime,
      };
    }
  },
};

// =============================================================================
// Blockchain Tools
// =============================================================================

interface SolanaWalletParams {
  operation: 'balance' | 'transactions' | 'tokens';
  walletAddress?: string;
  limit?: number;
}

export const solanaWalletTool: AgentTool<SolanaWalletParams> = {
  name: 'solana_wallet',
  description:
    'Get information about Solana wallets including balance, transactions, and token holdings',
  category: 'blockchain',
  parameters: z.object({
    operation: z
      .enum(['balance', 'transactions', 'tokens'])
      .describe('Operation to perform'),
    walletAddress: z
      .string()
      .optional()
      .describe('Wallet address (defaults to current user)'),
    limit: z
      .number()
      .min(1)
      .max(100)
      .default(10)
      .describe('Number of transactions to retrieve'),
  }),
  requiresApproval: true, // Blockchain operations require approval
  async execute(
    params: SolanaWalletParams,
    context: AgentContext
  ): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      const targetWallet = params.walletAddress || context.walletAddress;
      const result = await mockSolanaOperation(
        params.operation,
        targetWallet,
        params.limit || 10
      );

      return {
        id: nanoid(),
        success: true,
        result,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        id: nanoid(),
        success: false,
        result: null,
        error: {
          code: 'BLOCKCHAIN_ERROR',
          message: `Solana wallet operation failed: ${error instanceof Error ? error.message : String(error)}`,
          details: {
            operation: params.operation,
            wallet: (params.walletAddress || context.walletAddress) as string,
          },
        },
        executionTime: Date.now() - startTime,
      };
    }
  },
};

// =============================================================================
// Helper Functions
// =============================================================================

function evaluateMathExpression(expression: string): number {
  // Simple math evaluator - in production, use a proper library like math.js
  try {
    // Basic security check - only allow safe mathematical operations
    if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
      throw new Error('Invalid mathematical expression');
    }

    // Use Function constructor for evaluation (more secure than eval)
    const result = new Function(`return ${expression}`)();

    if (typeof result !== 'number' || !Number.isFinite(result)) {
      throw new Error('Expression did not evaluate to a valid number');
    }

    return result;
  } catch (_error) {
    throw new Error(`Cannot evaluate expression: ${expression}`);
  }
}

function analyzeSentiment(text: string): {
  score: number;
  label: string;
  confidence: number;
} {
  // Simple sentiment analysis - in production, use a proper NLP library
  const positiveWords = [
    'good',
    'great',
    'excellent',
    'amazing',
    'wonderful',
    'fantastic',
    'love',
    'like',
  ];
  const negativeWords = [
    'bad',
    'terrible',
    'awful',
    'hate',
    'dislike',
    'horrible',
    'worst',
  ];

  const words = text.toLowerCase().split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of words) {
    if (positiveWords.includes(word)) {
      positiveCount++;
    }
    if (negativeWords.includes(word)) {
      negativeCount++;
    }
  }

  const score = (positiveCount - negativeCount) / words.length;
  let label = 'neutral';
  if (score > 0.1) {
    label = 'positive';
  } else if (score < -0.1) {
    label = 'negative';
  }

  return {
    score,
    label,
    confidence: Math.min(Math.abs(score) * 10, 1),
  };
}

function calculateReadability(text: string): { level: string; score: number } {
  // Simple readability calculation
  const sentences = text
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 0).length;
  const words = text.split(/\s+/).filter((w) => w.length > 0).length;
  const syllables = text.split(/[aeiouAEIOU]/).length - 1;

  // Simplified Flesch Reading Ease
  const score =
    206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);

  let level = 'Graduate';
  if (score >= 90) {
    level = 'Very Easy';
  } else if (score >= 80) {
    level = 'Easy';
  } else if (score >= 70) {
    level = 'Fairly Easy';
  } else if (score >= 60) {
    level = 'Standard';
  } else if (score >= 50) {
    level = 'Fairly Difficult';
  } else if (score >= 30) {
    level = 'Difficult';
  }

  return { level, score };
}

function extractKeyPhrases(text: string): string[] {
  // Simple key phrase extraction
  const words = text.toLowerCase().split(/\s+/);
  const wordCounts = new Map<string, number>();

  for (const word of words) {
    if (word.length > 3) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }
  }

  return Array.from(wordCounts.entries())
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

function detectLanguage(text: string): {
  language: string;
  confidence: number;
} {
  // Simple language detection - in production, use a proper library
  const commonEnglishWords = [
    'the',
    'and',
    'to',
    'of',
    'a',
    'in',
    'is',
    'it',
    'you',
    'that',
  ];
  const words = text.toLowerCase().split(/\s+/);

  let englishMatches = 0;
  for (const word of words) {
    if (commonEnglishWords.includes(word)) {
      englishMatches++;
    }
  }

  const confidence = Math.min((englishMatches / words.length) * 5, 1);
  return { language: 'en', confidence };
}

function formatTimestamp(
  timestamp: number,
  format?: string,
  _timezone?: string
): string | { iso: string; utc: string; local: string; unix: number } {
  const date = new Date(timestamp);

  switch (format) {
    case 'ISO':
      return date.toISOString();
    case 'UTC':
      return date.toUTCString();
    case 'local':
      return date.toLocaleString();
    default:
      return {
        iso: date.toISOString(),
        utc: date.toUTCString(),
        local: date.toLocaleString(),
        unix: timestamp,
      };
  }
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  type: string;
  relevance: number;
}

function generateMockSearchResults(
  query: string,
  limit: number,
  type: string
): SearchResult[] {
  // Mock search results - in production, integrate with actual search APIs
  return Array.from({ length: limit }, (_, i) => ({
    title: `Search result ${i + 1} for: ${query}`,
    url: `https://example.com/result-${i + 1}`,
    snippet: `This is a mock search result snippet for query "${query}". In a real implementation, this would contain actual search results from web APIs.`,
    type,
    relevance: Math.random(),
  }));
}

interface DocumentSearchResult {
  [key: string]: unknown;
  id: string;
  title: string;
  content: string;
  relevance: number;
}

interface DocumentGetResult {
  [key: string]: unknown;
  id: string;
  title: string;
  content: string;
  metadata: { type: string; size: number };
}

interface DocumentListResult {
  [key: string]: unknown;
  documents: Array<{ id: string; title: string; type: string }>;
  total: number;
}

type DocumentOperationResult =
  | { [key: string]: unknown; query: string; results: DocumentSearchResult[] }
  | DocumentGetResult
  | DocumentListResult;

async function mockDocumentOperation(
  params: DocumentRetrievalParams,
  _walletAddress: string
): Promise<DocumentOperationResult> {
  // Mock document operations - integrate with actual document storage
  switch (params.operation) {
    case 'search':
      return {
        query: params.query || '',
        results: [
          {
            id: 'doc-1',
            title: 'Sample Document 1',
            content: 'Mock document content...',
            relevance: 0.95,
          },
        ],
      };
    case 'get':
      return {
        id: params.documentId || 'unknown',
        title: 'Sample Document',
        content: 'Mock document content...',
        metadata: { type: 'text', size: 1024 },
      };
    case 'list':
      return {
        documents: [
          { id: 'doc-1', title: 'Document 1', type: 'text' },
          { id: 'doc-2', title: 'Document 2', type: 'pdf' },
        ],
        total: 2,
      };
    default:
      throw new Error(`Unknown operation: ${params.operation}`);
  }
}

interface ChatCompletionResult {
  text: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

async function mockChatCompletion(
  params: ChatCompletionParams
): Promise<ChatCompletionResult> {
  // Mock AI completion - integrate with actual AI APIs
  return {
    text: `This is a mock AI response to: "${params.prompt}". In a real implementation, this would be generated by the specified AI model.`,
    usage: {
      inputTokens: params.prompt.length / 4,
      outputTokens: 50,
      totalTokens: params.prompt.length / 4 + 50,
    },
  };
}

interface SolanaBalanceResult {
  walletAddress: string;
  balance: number;
  usdValue: number;
  [key: string]: unknown;
}

interface SolanaTransactionsResult {
  walletAddress: string;
  transactions: Array<{
    signature: string;
    type: string;
    amount: number;
    timestamp: number;
  }>;
  [key: string]: unknown;
}

interface SolanaTokensResult {
  walletAddress: string;
  tokens: Array<{
    mint: string;
    balance: number;
    symbol: string;
    name: string;
  }>;
  [key: string]: unknown;
}

type SolanaOperationResult =
  | SolanaBalanceResult
  | SolanaTransactionsResult
  | SolanaTokensResult;

async function mockSolanaOperation(
  operation: string,
  walletAddress: string,
  limit: number
): Promise<SolanaOperationResult> {
  // Mock Solana operations - integrate with actual Solana APIs
  switch (operation) {
    case 'balance':
      return {
        walletAddress,
        balance: 1.5, // SOL
        usdValue: 150.75,
      };
    case 'transactions':
      return {
        walletAddress,
        transactions: Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
          signature: `mock-signature-${i + 1}`,
          type: 'transfer',
          amount: 0.1,
          timestamp: Date.now() - i * 60_000,
        })),
      };
    case 'tokens':
      return {
        walletAddress,
        tokens: [
          { mint: 'USDC', balance: 100, symbol: 'USDC', name: 'USD Coin' },
          { mint: 'USDT', balance: 50, symbol: 'USDT', name: 'Tether USD' },
        ],
      };
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

// =============================================================================
// Tool Registration
// =============================================================================

// Register all tools
registerTool(calculatorTool as AgentTool<unknown>);
registerTool(textAnalyzerTool as AgentTool<unknown>);
registerTool(timestampTool as AgentTool<unknown>);
registerTool(webSearchTool as AgentTool<unknown>);
registerTool(documentRetrievalTool as AgentTool<unknown>);
registerTool(chatCompletionTool as AgentTool<unknown>);
registerTool(solanaWalletTool as AgentTool<unknown>);

export { TOOL_REGISTRY as default };
