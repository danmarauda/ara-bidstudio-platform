/**
 * Vector Search Actions for RAG System
 * Implements semantic search using Convex's vector indexes
 */

import { v } from 'convex/values';
import { api } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import type { ActionCtx } from './_generated/server';
import { action, query } from './_generated/server';

/**
 * Search memories using vector similarity
 * Must be an action because Convex vector search only works in actions
 */
export const searchMemories = action({
  args: {
    userId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
    type: v.optional(
      v.union(
        v.literal('fact'),
        v.literal('preference'),
        v.literal('skill'),
        v.literal('goal'),
        v.literal('context')
      )
    ),
    minImportance: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 10, 50);

    // Generate embedding for the query
    const { embedding } = await ctx.runAction(
      api.embeddings.generateEmbedding,
      { text: args.query }
    );

    // Perform vector search on memories
    const vectorResults = await ctx.vectorSearch('memories', 'by_embedding', {
      vector: embedding,
      limit: limit * 2, // Get more results for filtering
      filter: (q) => q.eq('userId', args.userId),
    });

    // Get the full documents in parallel using Promise.all()
    const memoryPromises = vectorResults.map((result) =>
      ctx
        .runQuery(api.vectorSearch.getMemoryById, { id: result._id })
        .then((memory) => (memory ? { memory, score: result._score } : null))
    );

    const memoryResults = await Promise.all(memoryPromises);
    const memories: Array<Doc<'memories'> & { score: number }> = [];

    for (const result of memoryResults) {
      if (result?.memory) {
        // Apply additional filters
        if (args.type && result.memory.type !== args.type) {
          continue;
        }
        if (
          args.minImportance &&
          result.memory.importance < args.minImportance
        ) {
          continue;
        }

        memories.push({
          ...result.memory,
          score: result.score,
        });

        if (memories.length >= limit) {
          break;
        }
      }
    }

    // Update access tracking for retrieved memories in parallel using Promise.all()
    // Skip direct db access; add a dedicated mutation if needed

    return memories;
  },
});

// Helper types
type DocumentSearchResult = {
  chunk: Doc<'documentChunks'>;
  document: Doc<'documents'>;
  score: number;
};

// Helper functions for document chunk search to reduce complexity

/**
 * Search within specific documents
 */
async function searchSpecificDocuments(
  ctx: ActionCtx,
  embedding: number[],
  documentIds: Id<'documents'>[],
  limit: number,
  ownerId?: string
): Promise<DocumentSearchResult[]> {
  const searchPromises = documentIds.map((documentId) =>
    searchSingleDocument(
      ctx,
      embedding,
      documentId,
      Math.ceil(limit / documentIds.length),
      ownerId
    )
  );

  const allResults = await Promise.all(searchPromises);
  return allResults.flat();
}

/**
 * Search within a single document
 */
async function searchSingleDocument(
  ctx: ActionCtx,
  embedding: number[],
  documentId: Id<'documents'>,
  limit: number,
  ownerId?: string
): Promise<DocumentSearchResult[]> {
  const vectorResults = await ctx.vectorSearch(
    'documentChunks',
    'by_embedding',
    {
      vector: embedding,
      limit,
      filter: (q) => q.eq('documentId', documentId),
    }
  );

  const chunkPromises = vectorResults.map(
    (result: { _id: Id<'documentChunks'>; _score: number }) =>
      ctx
        // Fallback to direct db.get via a small inline query function is not supported here; rely on a proper query
        .runQuery(api.vectorSearch.getChunkById, { id: result._id })
        .then((chunk: Doc<'documentChunks'> | null) =>
          chunk ? { chunk, score: result._score } : null
        )
  );

  const documentPromise = ctx.runQuery(api.documents.getById, {
    id: documentId,
  });

  const [chunkResults, document] = await Promise.all([
    Promise.all(chunkPromises),
    documentPromise,
  ]);

  if (!document || (ownerId && document.ownerId !== ownerId)) {
    return [];
  }

  return chunkResults
    .filter(
      (
        result: { chunk: Doc<'documentChunks'>; score: number } | null
      ): result is { chunk: Doc<'documentChunks'>; score: number } =>
        result !== null
    )
    .map(
      ({ chunk, score }: { chunk: Doc<'documentChunks'>; score: number }) => ({
        chunk,
        document,
        score,
      })
    );
}

/**
 * Search across all accessible documents
 */
async function searchAllDocuments(
  ctx: ActionCtx,
  embedding: number[],
  limit: number,
  ownerId?: string
): Promise<DocumentSearchResult[]> {
  const vectorResults = await ctx.vectorSearch(
    'documentChunks',
    'by_embedding',
    {
      vector: embedding,
      limit: limit * 2,
    }
  );

  const chunkPromises = vectorResults.map((result) =>
    ctx
      .runQuery(api.vectorSearch.getChunkById, { id: result._id })
      .then((chunk) => (chunk ? { chunk, score: result._score } : null))
  );

  const chunkResults = await Promise.all(chunkPromises);

  const documentIds = new Set<Id<'documents'>>();
  const validChunks = chunkResults.filter(
    (result): result is { chunk: Doc<'documentChunks'>; score: number } => {
      if (result?.chunk) {
        documentIds.add(result.chunk.documentId);
        return true;
      }
      return false;
    }
  );

  const documentPromises = Array.from(documentIds).map((docId) =>
    ctx
      .runQuery(api.documents.getById, { id: docId })
      .then((doc) => ({ id: docId, doc }))
  );

  const documentResults = await Promise.all(documentPromises);
  const documentMap = new Map<Id<'documents'>, Doc<'documents'>>();

  for (const { id, doc } of documentResults) {
    if (doc) {
      documentMap.set(id, doc);
    }
  }

  const results: DocumentSearchResult[] = [];
  for (const { chunk, score } of validChunks) {
    const document = documentMap.get(chunk.documentId as Id<'documents'>);

    if (document) {
      if (ownerId && !document.isPublic && document.ownerId !== ownerId) {
        continue;
      }

      results.push({ chunk, document, score });
      if (results.length >= limit) {
        break;
      }
    }
  }

  return results;
}

/**
 * Search document chunks using vector similarity
 */
export const searchDocumentChunks = action({
  args: {
    query: v.string(),
    documentIds: v.optional(v.array(v.id('documents'))),
    limit: v.optional(v.number()),
    ownerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 10, 50);
    const { embedding } = await ctx.runAction(
      api.embeddings.generateEmbedding,
      { text: args.query }
    );

    let results: DocumentSearchResult[];

    if (args.documentIds && args.documentIds.length > 0) {
      results = await searchSpecificDocuments(
        ctx,
        embedding,
        args.documentIds,
        limit,
        args.ownerId
      );
    } else {
      results = await searchAllDocuments(ctx, embedding, limit, args.ownerId);
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  },
});

/**
 * Query function to get messages with embeddings by chat ID
 */
export const getMessagesByChat = query({
  args: {
    chatId: v.id('chats'),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('messages')
      .withIndex('by_chat', (q) => q.eq('chatId', args.chatId))
      .filter((q) => q.neq(q.field('embedding'), undefined))
      .take(1000);
  },
});

/**
 * Query function to get messages with embeddings by user
 */
export const getMessagesByUser = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('messages')
      .withIndex('by_user', (q) => q.eq('walletAddress', args.walletAddress))
      .filter((q) => q.neq(q.field('embedding'), undefined))
      .take(1000);
  },
});

/**
 * Query function to get all messages with embeddings
 */
export const getAllMessagesWithEmbeddings = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('messages')
      .filter((q) => q.neq(q.field('embedding'), undefined))
      .take(1000);
  },
});

/**
 * Search messages using vector similarity
 * Useful for finding similar conversations or contexts
 */
export const searchMessages = action({
  args: {
    query: v.string(),
    chatId: v.optional(v.id('chats')),
    walletAddress: v.optional(v.string()),
    limit: v.optional(v.number()),
    role: v.optional(
      v.union(v.literal('user'), v.literal('assistant'), v.literal('system'))
    ),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 10, 50);

    // Generate embedding for the query
    const { embedding } = await ctx.runAction(
      api.embeddings.generateEmbedding,
      { text: args.query }
    );

    // Get messages with embeddings using proper query functions
    let messages: Doc<'messages'>[];
    if (args.chatId) {
      messages = await ctx.runQuery(api.vectorSearch.getMessagesByChat, {
        chatId: args.chatId,
      });
    } else if (args.walletAddress) {
      messages = await ctx.runQuery(api.vectorSearch.getMessagesByUser, {
        walletAddress: args.walletAddress,
      });
    } else {
      messages = await ctx.runQuery(
        api.vectorSearch.getAllMessagesWithEmbeddings,
        {}
      );
    }

    // Calculate similarity scores
    const scoredMessages = messages
      .map((message) => {
        if (!message.embedding) {
          return null;
        }

        // Apply role filter if specified
        if (args.role && message.role !== args.role) {
          return null;
        }

        // Calculate cosine similarity
        const score = cosineSimilarity(embedding, message.embedding);

        return {
          ...message,
          score,
        };
      })
      .filter((msg): msg is Doc<'messages'> & { score: number } => msg !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scoredMessages;
  },
});

/**
 * Query function for text-based memory search
 */
export const searchMemoriesText = query({
  args: {
    userId: v.string(),
    query: v.string(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('memories')
      .withSearchIndex('search_content', (q) =>
        q.search('content', args.query).eq('userId', args.userId)
      )
      .take(args.limit);
  },
});

/**
 * Query function to get a memory by ID
 */
export const getMemoryById = query({
  args: {
    id: v.id('memories'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Query function to get a document chunk by ID
 */
export const getChunkById = query({
  args: {
    id: v.id('documentChunks'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Hybrid search combining vector and text search
 * Provides better results by combining semantic and keyword matching
 */
export const hybridSearch = action({
  args: {
    userId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
    weights: v.optional(
      v.object({
        vector: v.number(), // Weight for vector search (0-1)
        text: v.number(), // Weight for text search (0-1)
      })
    ),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 10, 50);
    const weights = args.weights || { vector: 0.7, text: 0.3 };

    // Normalize weights
    const totalWeight = weights.vector + weights.text;
    weights.vector /= totalWeight;
    weights.text /= totalWeight;

    // Perform vector search inline to avoid circular action calls
    const { embedding } = await ctx.runAction(
      api.embeddings.generateEmbedding,
      { text: args.query }
    );

    const vectorResults = await ctx.vectorSearch('memories', 'by_embedding', {
      vector: embedding,
      limit: limit * 2,
      filter: (q) => q.eq('userId', args.userId),
    });

    // Get the full documents for vector results in parallel using Promise.all()
    const memoryPromises = vectorResults.map((result) =>
      ctx
        .runQuery(api.vectorSearch.getMemoryById, { id: result._id })
        .then((memory) => (memory ? { ...memory, score: result._score } : null))
    );

    const memoryResults = await Promise.all(memoryPromises);
    const vectorMemories = memoryResults.filter(
      (result): result is Doc<'memories'> & { score: number } => result !== null
    );

    // Perform text search using the query function
    const textResults = await ctx.runQuery(
      api.vectorSearch.searchMemoriesText,
      {
        userId: args.userId,
        query: args.query,
        limit: limit * 2,
      }
    );

    // Combine and score results
    const combinedScores = new Map<string, number>();
    const memoryMap = new Map<string, Doc<'memories'>>();

    // Add vector search results
    for (const result of vectorMemories) {
      const id = result._id.toString();
      combinedScores.set(id, result.score * weights.vector);
      memoryMap.set(id, result);
    }

    // Add text search results (with normalized scores)
    let maxTextScore = 0;
    for (let i = 0; i < textResults.length; i++) {
      const score = 1 - i / textResults.length; // Simple ranking score
      maxTextScore = Math.max(maxTextScore, score);
    }

    for (let i = 0; i < textResults.length; i++) {
      const result = textResults[i];
      const id = result._id.toString();
      const textScore = (1 - i / textResults.length) / (maxTextScore || 1);

      const currentScore = combinedScores.get(id) || 0;
      combinedScores.set(id, currentScore + textScore * weights.text);
      memoryMap.set(id, result);
    }

    // Sort by combined score
    const sortedResults = Array.from(combinedScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id, score]) => {
        const memory = memoryMap.get(id);
        if (!memory) {
          throw new Error(`Memory not found for id: ${id}`);
        }
        return {
          ...memory,
          score,
        };
      });

    return sortedResults;
  },
});

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same dimensions');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}
