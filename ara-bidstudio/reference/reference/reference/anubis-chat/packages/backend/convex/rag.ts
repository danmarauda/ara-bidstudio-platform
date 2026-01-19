/**
 * Comprehensive RAG (Retrieval-Augmented Generation) Pipeline for ANUBIS Chat
 *
 * This module orchestrates retrieval of relevant memories, messages, and documents
 * to provide rich contextual information for AI responses. It implements intelligent
 * ranking, filtering, and context assembly to stay within token limits while
 * maximizing relevance.
 */

import { v } from 'convex/values';
import { api } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import type { ActionCtx } from './_generated/server';
import { action } from './_generated/server';

// import { generateEmbedding } from './embeddings';

// Configuration constants
const DEFAULT_TOKEN_BUDGET = 4000; // Max tokens for assembled context
const MIN_RELEVANCE_SCORE = 0.5; // Minimum cosine similarity threshold
const RECENCY_BOOST_FACTOR = 0.1; // Boost for recent content (per day)
const MAX_CONTEXT_ITEMS = 50; // Hard limit on total items retrieved
const CACHE_TTL = 300_000; // 5 minutes cache TTL in milliseconds

// Token estimation (approximate)
const TOKENS_PER_CHAR = 0.25; // Rough estimate
const MEMORY_OVERHEAD = 50; // Tokens for memory formatting
const MESSAGE_OVERHEAD = 30; // Tokens for message formatting
const DOCUMENT_OVERHEAD = 40; // Tokens for document chunk formatting

/**
 * Content type definitions for retrieved items
 */
interface RetrievedMemory extends Doc<'memories'> {
  score: number;
  itemType: 'memory';
  recencyScore: number;
  tokens: number;
}

interface RetrievedMessage extends Doc<'messages'> {
  score: number;
  itemType: 'message';
  recencyScore: number;
  tokens: number;
}

interface RetrievedDocument {
  chunk: Doc<'documentChunks'>;
  document: Doc<'documents'>;
  score: number;
  itemType: 'document';
  recencyScore: number;
  tokens: number;
}

type RetrievedItem = RetrievedMemory | RetrievedMessage | RetrievedDocument;

interface ContextItem {
  content: string;
  type: 'memory' | 'message' | 'document';
  score: number;
  timestamp: number;
  metadata: Record<string, string | number | boolean | null>;
  tokens: number;
}

interface AssembledContext {
  items: ContextItem[];
  totalTokens: number;
  summary: {
    memoriesCount: number;
    messagesCount: number;
    documentsCount: number;
    avgRelevanceScore: number;
    timeRange: { start: number; end: number } | null;
  };
}

/**
 * Enhanced query structure with expansion capabilities
 */
interface EnhancedQuery {
  originalQuery: string;
  expandedTerms: string[];
  semanticQuery: string;
  keywords: string[];
}

/**
 * Cache structure for frequently accessed contexts
 */
interface CachedContext {
  context: AssembledContext;
  timestamp: number;
  queryHash: string;
}

// In-memory cache for contexts (in production, consider Redis or similar)
const contextCache = new Map<string, CachedContext>();

/**
 * Main RAG retrieval pipeline - orchestrates all retrieval and assembly
 */
export const retrieveContext = action({
  args: {
    userId: v.string(),
    query: v.string(),
    chatId: v.optional(v.id('chats')),
    tokenBudget: v.optional(v.number()),
    includeMemories: v.optional(v.boolean()),
    includeMessages: v.optional(v.boolean()),
    includeDocuments: v.optional(v.boolean()),
    minRelevanceScore: v.optional(v.number()),
    maxItems: v.optional(v.number()),
    useCache: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tokenBudget = args.tokenBudget || DEFAULT_TOKEN_BUDGET;
    const minScore = args.minRelevanceScore || MIN_RELEVANCE_SCORE;
    const maxItems = Math.min(args.maxItems || MAX_CONTEXT_ITEMS, 100);

    const includeMemories = args.includeMemories !== false;
    const includeMessages = args.includeMessages !== false;
    const includeDocuments = args.includeDocuments !== false;
    const useCache = args.useCache !== false;

    // Generate cache key
    const cacheKey = generateCacheKey(args);

    // Check cache first
    if (useCache) {
      const cached = getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      // Step 1: Enhance the query with synonyms and related terms
      const enhancedQuery = await enhanceQuery(ctx, args.query);

      // Step 2: Retrieve content from all sources in parallel
      const [memories, messages, documents] = await Promise.all([
        includeMemories
          ? retrieveMemories(ctx, args.userId, enhancedQuery, maxItems)
          : [],
        includeMessages
          ? retrieveMessages(
              ctx,
              args.userId,
              args.chatId,
              enhancedQuery,
              maxItems
            )
          : [],
        includeDocuments
          ? retrieveDocuments(ctx, args.userId, enhancedQuery, maxItems)
          : [],
      ]);

      // Step 3: Combine and rank all retrieved items
      const allItems = [...memories, ...messages, ...documents];
      const rankedItems = await rankByRelevance(
        allItems,
        enhancedQuery,
        minScore
      );

      // Step 4: Apply recency filtering and boosting
      const recencyFiltered = filterByRecency(rankedItems);

      // Step 5: Ensure diversity in retrieved content
      const diversifiedItems = ensureDiversity(recencyFiltered, maxItems);

      // Step 5.5: Remove redundant/duplicate items
      const dedupedItems = removeDuplicateContent(diversifiedItems);

      // Step 6: Format context while respecting token budget
      const assembledContext = await formatForPrompt(dedupedItems, tokenBudget);

      // Step 7: Cache the result
      if (useCache) {
        cacheContext(cacheKey, assembledContext);
      }

      return assembledContext;
    } catch (error) {
      throw new Error(
        `RAG retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});

/**
 * Enhance query with synonyms, related terms, and semantic expansion
 */
async function enhanceQuery(
  _ctx: ActionCtx,
  originalQuery: string
): Promise<EnhancedQuery> {
  // Extract keywords (simple approach - in production, consider NLP libraries)
  const keywords = extractKeywords(originalQuery);

  // Create semantic query by expanding with related terms
  const semanticQuery = await expandSemanticQuery(originalQuery, keywords);

  return {
    originalQuery,
    expandedTerms: keywords,
    semanticQuery,
    keywords,
  };
}

/**
 * Extract important keywords from query using simple heuristics
 */
function extractKeywords(query: string): string[] {
  // Remove stop words and extract meaningful terms
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'being',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'could',
    'should',
    'may',
    'might',
    'must',
    'can',
    'this',
    'that',
    'these',
    'those',
  ]);

  const words = query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));

  // Get unique words and sort by length (longer words often more important)
  return [...new Set(words)].sort((a, b) => b.length - a.length).slice(0, 10);
}

/**
 * Expand semantic query with related terms
 */
async function expandSemanticQuery(
  originalQuery: string,
  keywords: string[]
): Promise<string> {
  // For now, just combine original query with keywords
  // In production, could use word embeddings or knowledge graphs for expansion
  const expanded = [originalQuery, ...keywords.slice(0, 5)].join(' ');
  return expanded;
}

/**
 * Retrieve relevant memories for the user
 */
async function retrieveMemories(
  ctx: ActionCtx,
  userId: string,
  enhancedQuery: EnhancedQuery,
  maxItems: number
): Promise<RetrievedMemory[]> {
  try {
    // Use hybrid search for better results
    const memories = (await ctx.runAction(api.vectorSearch.hybridSearch, {
      userId,
      query: enhancedQuery.semanticQuery,
      limit: Math.min(maxItems, 20),
    })) as Array<Doc<'memories'> & { score: number }>;

    return memories.map((memory: Doc<'memories'> & { score: number }) => ({
      ...memory,
      itemType: 'memory' as const,
      recencyScore: calculateRecencyScore(memory.createdAt),
      tokens: estimateTokens(memory.content, MEMORY_OVERHEAD),
    }));
  } catch (_error) {
    return [];
  }
}

/**
 * Retrieve relevant messages from chat history
 */
async function retrieveMessages(
  ctx: ActionCtx,
  userId: string,
  chatId: Id<'chats'> | undefined,
  enhancedQuery: EnhancedQuery,
  maxItems: number
): Promise<RetrievedMessage[]> {
  try {
    const messages = (await ctx.runAction(api.vectorSearch.searchMessages, {
      query: enhancedQuery.semanticQuery,
      chatId,
      walletAddress: userId,
      limit: Math.min(maxItems, 30),
      role: undefined,
    })) as Array<Doc<'messages'> & { score: number }>;

    return messages.map((message: Doc<'messages'> & { score: number }) => ({
      ...message,
      itemType: 'message' as const,
      recencyScore: calculateRecencyScore(message.createdAt),
      tokens: estimateTokens(message.content, MESSAGE_OVERHEAD),
    }));
  } catch (_error) {
    return [];
  }
}

/**
 * Retrieve relevant document chunks
 */
async function retrieveDocuments(
  ctx: ActionCtx,
  userId: string,
  enhancedQuery: EnhancedQuery,
  maxItems: number
): Promise<RetrievedDocument[]> {
  try {
    const documents = (await ctx.runAction(
      api.vectorSearch.searchDocumentChunks,
      {
        query: enhancedQuery.semanticQuery,
        limit: Math.min(maxItems, 15),
        ownerId: userId,
      }
    )) as Array<{
      chunk: Doc<'documentChunks'>;
      document: Doc<'documents'>;
      score: number;
    }>;

    return documents.map(
      (doc: {
        chunk: Doc<'documentChunks'>;
        document: Doc<'documents'>;
        score: number;
      }) => ({
        ...doc,
        itemType: 'document' as const,
        recencyScore: calculateRecencyScore(doc.document.createdAt),
        tokens: estimateTokens(doc.chunk.content, DOCUMENT_OVERHEAD),
      })
    );
  } catch (_error) {
    return [];
  }
}

/**
 * Rank retrieved items by combined relevance score
 */
async function rankByRelevance(
  items: RetrievedItem[],
  enhancedQuery: EnhancedQuery,
  minScore: number
): Promise<RetrievedItem[]> {
  // Filter by minimum relevance score
  const filtered = items.filter((item) => item.score >= minScore);

  // Calculate combined score (relevance + recency + importance)
  const scored = filtered.map((item) => {
    let combinedScore = item.score; // Base relevance score

    // Add recency boost
    combinedScore += item.recencyScore * RECENCY_BOOST_FACTOR;

    // Add importance boost for memories
    if (item.itemType === 'memory') {
      combinedScore += (item as RetrievedMemory).importance * 0.2;
    }

    // Boost for exact keyword matches
    const content = getContentFromItem(item).toLowerCase();
    const keywordMatches = enhancedQuery.keywords.filter((keyword) =>
      content.includes(keyword.toLowerCase())
    ).length;
    combinedScore += keywordMatches * 0.1;

    return {
      ...item,
      score: combinedScore,
    };
  });

  // Sort by combined score (highest first)
  return scored.sort((a, b) => b.score - a.score);
}

/**
 * Apply recency filtering - prioritize recent content
 */
function filterByRecency(items: RetrievedItem[]): RetrievedItem[] {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  // Prioritize items from last 7 days, then 30 days, then older
  const recent = items.filter(
    (item) => getTimestampFromItem(item) > sevenDaysAgo
  );
  const medium = items.filter((item) => {
    const timestamp = getTimestampFromItem(item);
    return timestamp <= sevenDaysAgo && timestamp > thirtyDaysAgo;
  });
  const older = items.filter(
    (item) => getTimestampFromItem(item) <= thirtyDaysAgo
  );

  // Take proportionally from each group
  const recentTake = Math.min(recent.length, Math.floor(items.length * 0.5));
  const mediumTake = Math.min(medium.length, Math.floor(items.length * 0.3));
  const olderTake = Math.min(
    older.length,
    items.length - recentTake - mediumTake
  );

  return [
    ...recent.slice(0, recentTake),
    ...medium.slice(0, mediumTake),
    ...older.slice(0, olderTake),
  ];
}

/**
 * Remove duplicate or highly similar content items
 */
function removeDuplicateContent(items: RetrievedItem[]): RetrievedItem[] {
  const seen = new Set<string>();
  const dedupedItems: RetrievedItem[] = [];

  for (const item of items) {
    const content = getContentFromItem(item).toLowerCase();
    const words = content.split(/\s+/);

    // Create a content signature for comparison
    const signature = words
      .filter((word) => word.length > 3) // Skip short words
      .sort()
      .slice(0, 10) // Use first 10 significant words
      .join('-');

    // Check for exact duplicates or very similar content
    let isDuplicate = false;

    // Check exact signature match
    if (seen.has(signature)) {
      isDuplicate = true;
    }

    // Check for substring relationships with existing items
    if (!isDuplicate) {
      for (const existingItem of dedupedItems) {
        const existingContent = getContentFromItem(existingItem).toLowerCase();

        // Skip if one contains the other (with some tolerance)
        if (content.length > 50 && existingContent.length > 50) {
          // Calculate similarity
          const contentWords = new Set(words);
          const existingWords = new Set(existingContent.split(/\s+/));
          const intersection = new Set(
            [...contentWords].filter((x) => existingWords.has(x))
          );
          const similarity =
            intersection.size / Math.min(contentWords.size, existingWords.size);

          // If >80% similar, consider it a duplicate
          if (similarity > 0.8) {
            // Keep the one with higher score
            if (item.score <= existingItem.score) {
              isDuplicate = true;
              break;
            }
            // Replace the existing item with this better one
            const index = dedupedItems.indexOf(existingItem);
            dedupedItems[index] = item;
            isDuplicate = true;
            break;
          }
        }
      }
    }

    if (!isDuplicate) {
      seen.add(signature);
      dedupedItems.push(item);
    }
  }

  return dedupedItems;
}

/**
 * Ensure diversity in content types and avoid redundancy
 */
function ensureDiversity(
  items: RetrievedItem[],
  maxItems: number
): RetrievedItem[] {
  const memories: RetrievedItem[] = [];
  const messages: RetrievedItem[] = [];
  const documents: RetrievedItem[] = [];

  // Separate by type
  for (const item of items) {
    switch (item.itemType) {
      case 'memory':
        memories.push(item);
        break;
      case 'message':
        messages.push(item);
        break;
      case 'document':
        documents.push(item);
        break;
    }
  }

  // Calculate proportional distribution
  const memoryCount = Math.min(memories.length, Math.ceil(maxItems * 0.4));
  const messageCount = Math.min(messages.length, Math.ceil(maxItems * 0.4));
  const documentCount = Math.min(
    documents.length,
    maxItems - memoryCount - messageCount
  );

  // Combine diverse selection
  return [
    ...memories.slice(0, memoryCount),
    ...messages.slice(0, messageCount),
    ...documents.slice(0, documentCount),
  ].sort((a, b) => b.score - a.score);
}

/**
 * Format retrieved items for prompt injection while respecting token budget
 */
async function formatForPrompt(
  items: RetrievedItem[],
  tokenBudget: number
): Promise<AssembledContext> {
  const contextItems: ContextItem[] = [];
  let totalTokens = 0;
  let memoriesCount = 0;
  let messagesCount = 0;
  let documentsCount = 0;
  let totalRelevanceScore = 0;
  let minTimestamp = Number.POSITIVE_INFINITY;
  let maxTimestamp = 0;

  for (const item of items) {
    // Check if we can fit this item within the token budget
    if (totalTokens + item.tokens > tokenBudget) {
      break;
    }

    const content = getContentFromItem(item);
    const timestamp = getTimestampFromItem(item);
    const metadata = getMetadataFromItem(item);

    contextItems.push({
      content: content.trim(),
      type: item.itemType,
      score: item.score,
      timestamp,
      metadata,
      tokens: item.tokens,
    });

    totalTokens += item.tokens;
    totalRelevanceScore += item.score;
    minTimestamp = Math.min(minTimestamp, timestamp);
    maxTimestamp = Math.max(maxTimestamp, timestamp);

    // Update counts
    switch (item.itemType) {
      case 'memory':
        memoriesCount++;
        break;
      case 'message':
        messagesCount++;
        break;
      case 'document':
        documentsCount++;
        break;
    }
  }

  const avgRelevanceScore =
    contextItems.length > 0 ? totalRelevanceScore / contextItems.length : 0;
  const timeRange =
    contextItems.length > 0 && minTimestamp !== Number.POSITIVE_INFINITY
      ? { start: minTimestamp, end: maxTimestamp }
      : null;

  return {
    items: contextItems,
    totalTokens,
    summary: {
      memoriesCount,
      messagesCount,
      documentsCount,
      avgRelevanceScore,
      timeRange,
    },
  };
}

/**
 * Helper functions for extracting data from retrieved items
 */
function getContentFromItem(item: RetrievedItem): string {
  switch (item.itemType) {
    case 'memory':
      return item.content;
    case 'message':
      return item.content;
    case 'document':
      return item.chunk.content;
    default:
      return '';
  }
}

function getTimestampFromItem(item: RetrievedItem): number {
  switch (item.itemType) {
    case 'memory':
      return item.createdAt;
    case 'message':
      return item.createdAt;
    case 'document':
      return item.chunk.createdAt;
    default:
      return 0;
  }
}

function getMetadataFromItem(
  item: RetrievedItem
): Record<string, string | number | boolean | null> {
  switch (item.itemType) {
    case 'memory':
      return {
        memoryType: item.type,
        importance: item.importance,
        tags: (item.tags || []).join(', '),
        accessCount: item.accessCount,
      };
    case 'message':
      return {
        role: item.role,
        chatId: item.chatId,
        tokenCount: item.tokenCount ?? 0,
      };
    case 'document':
      return {
        documentTitle: item.document.title,
        documentType: item.document.type,
        chunkIndex: item.chunk.chunkIndex,
        wordCount: item.chunk.metadata.wordCount,
      };
    default:
      return {};
  }
}

/**
 * Calculate recency score based on timestamp (more recent = higher score)
 */
function calculateRecencyScore(timestamp: number): number {
  const now = Date.now();
  const daysSinceCreation = (now - timestamp) / (24 * 60 * 60 * 1000);

  // Exponential decay: recent items get higher scores
  return Math.exp(-daysSinceCreation / 30); // 30-day half-life
}

/**
 * Estimate token count for content
 */
function estimateTokens(content: string, overhead = 0): number {
  return Math.ceil(content.length * TOKENS_PER_CHAR) + overhead;
}

/**
 * Generate cache key for context retrieval
 */
function generateCacheKey(args: {
  userId: string;
  query: string;
  chatId?: Id<'chats'>;
  tokenBudget?: number;
  includeMemories?: boolean;
  includeMessages?: boolean;
  includeDocuments?: boolean;
}): string {
  const keyComponents = [
    args.userId,
    args.query,
    args.chatId || 'no-chat',
    args.tokenBudget || DEFAULT_TOKEN_BUDGET,
    args.includeMemories !== false,
    args.includeMessages !== false,
    args.includeDocuments !== false,
  ];

  return keyComponents.join('|');
}

/**
 * Get context from cache if valid
 */
function getFromCache(key: string): AssembledContext | null {
  const cached = contextCache.get(key);
  if (!cached) {
    return null;
  }

  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    contextCache.delete(key);
    return null;
  }

  return cached.context;
}

/**
 * Cache assembled context
 */
function cacheContext(key: string, context: AssembledContext): void {
  // Clean up old cache entries periodically
  if (contextCache.size > 1000) {
    const cutoff = Date.now() - CACHE_TTL;
    for (const [k, v] of contextCache.entries()) {
      if (v.timestamp < cutoff) {
        contextCache.delete(k);
      }
    }
  }

  contextCache.set(key, {
    context,
    timestamp: Date.now(),
    queryHash: key,
  });
}

/**
 * Format context for LLM consumption with structured markdown
 */
export const formatContextForLLM = action({
  args: {
    context: v.object({
      items: v.array(
        v.object({
          content: v.string(),
          type: v.union(
            v.literal('memory'),
            v.literal('message'),
            v.literal('document')
          ),
          score: v.number(),
          timestamp: v.number(),
          metadata: v.record(
            v.string(),
            v.union(v.string(), v.number(), v.boolean(), v.null())
          ),
          tokens: v.number(),
        })
      ),
      totalTokens: v.number(),
      summary: v.object({
        memoriesCount: v.number(),
        messagesCount: v.number(),
        documentsCount: v.number(),
        avgRelevanceScore: v.number(),
        timeRange: v.union(
          v.object({
            start: v.number(),
            end: v.number(),
          }),
          v.null()
        ),
      }),
    }),
    includeMetadata: v.optional(v.boolean()),
  },
  handler: async (_ctx, args) => {
    const context = args.context as AssembledContext;
    const includeMetadata = args.includeMetadata !== false;

    if (context.items.length === 0) {
      return 'No relevant context found.';
    }

    let formatted = '## Relevant Context\n\n';

    if (includeMetadata) {
      formatted += `**Summary**: ${context.summary.memoriesCount} memories, ${context.summary.messagesCount} messages, ${context.summary.documentsCount} documents | Average relevance: ${context.summary.avgRelevanceScore.toFixed(2)} | Token budget: ${context.totalTokens}\n\n`;
    }

    // Group items by type for better organization
    const memories = context.items.filter((item) => item.type === 'memory');
    const messages = context.items.filter((item) => item.type === 'message');
    const documents = context.items.filter((item) => item.type === 'document');

    // Format memories
    if (memories.length > 0) {
      formatted += '### Personal Knowledge & Preferences\n';
      for (const item of memories.slice(0, 10)) {
        // Limit display
        const date = new Date(item.timestamp).toLocaleDateString();
        formatted += `- **${date}** (score: ${item.score.toFixed(2)}): ${item.content}\n`;
      }
      formatted += '\n';
    }

    // Format recent messages
    if (messages.length > 0) {
      formatted += '### Recent Conversation Context\n';
      for (const item of messages.slice(0, 8)) {
        // Limit display
        const date = new Date(item.timestamp).toLocaleDateString();
        const role = (item.metadata.role as string) || 'unknown';
        formatted += `- **${role.toUpperCase()}** (${date}): ${item.content.slice(0, 200)}${item.content.length > 200 ? '...' : ''}\n`;
      }
      formatted += '\n';
    }

    // Format document chunks
    if (documents.length > 0) {
      formatted += '### Relevant Documentation\n';
      for (const item of documents.slice(0, 6)) {
        // Limit display
        const title = item.metadata.documentTitle || 'Untitled';
        formatted += `- **${title}** (score: ${item.score.toFixed(2)}): ${item.content.slice(0, 300)}${item.content.length > 300 ? '...' : ''}\n`;
      }
      formatted += '\n';
    }

    return formatted;
  },
});

/**
 * Clear the context cache (for testing or maintenance)
 */
export const clearCache = action({
  args: {},
  handler: async (_ctx, _args) => {
    contextCache.clear();
    return { success: true, message: 'Context cache cleared' };
  },
});

/**
 * Get cache statistics
 */
export const getCacheStats = action({
  args: {},
  handler: async (_ctx, _args) => {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [_key, cached] of contextCache.entries()) {
      if (now - cached.timestamp > CACHE_TTL) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      totalEntries: contextCache.size,
      validEntries,
      expiredEntries,
      cacheHitRate: validEntries / (validEntries + expiredEntries) || 0,
      cacheTTL: CACHE_TTL,
    };
  },
});
