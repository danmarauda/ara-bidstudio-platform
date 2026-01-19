/**
 * Vector Store Management Functions
 * Handles CRUD operations for vector stores in Convex
 */

import { ConvexError, v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';

// =============================================================================
// Queries
// =============================================================================

/**
 * List vector stores for a wallet address
 */
export const list = query({
  args: {
    walletAddress: v.string(),
    limit: v.optional(v.number()),
    order: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { walletAddress, limit = 20, order = 'desc', cursor } = args;

    // Build query
    let dbQuery = ctx.db
      .query('vectorStores')
      .withIndex('by_wallet', (q) => q.eq('walletAddress', walletAddress))
      .order(order === 'desc' ? 'desc' : 'asc');

    // Apply cursor if provided
    if (cursor) {
      // Parse cursor to get the last document ID
      try {
        const cursorId = cursor as Id<'vectorStores'>;
        const cursorDoc = await ctx.db.get(cursorId);
        if (cursorDoc) {
          // Continue from cursor
          dbQuery = dbQuery.filter((q) =>
            order === 'desc'
              ? q.lt(q.field('updatedAt'), cursorDoc.updatedAt)
              : q.gt(q.field('updatedAt'), cursorDoc.updatedAt)
          );
        }
      } catch (_error) {
        // ignore invalid cursor
      }
    }

    // Fetch items with limit + 1 to check for more
    const items = await dbQuery.take(limit + 1);

    // Check if there are more items
    const hasMore = items.length > limit;
    const returnItems = hasMore ? items.slice(0, limit) : items;

    // Get next cursor (avoid Array.at to support older lib targets)
    const nextCursor = hasMore ? returnItems.at(-1)?._id : undefined;

    return {
      items: returnItems,
      cursor,
      nextCursor,
      hasMore,
    };
  },
});

/**
 * Get a specific vector store
 */
export const get = query({
  args: {
    id: v.id('vectorStores'),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const vectorStore = await ctx.db.get(args.id);

    // Check ownership
    if (!vectorStore || vectorStore.walletAddress !== args.walletAddress) {
      return null;
    }

    return vectorStore;
  },
});

/**
 * Get vector stores by IDs (for batch operations)
 */
export const getMany = query({
  args: {
    ids: v.array(v.id('vectorStores')),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const vectorStores = await Promise.all(
      args.ids.map((id) => ctx.db.get(id))
    );

    // Filter out null values and check ownership
    return vectorStores.filter(
      (vs): vs is Doc<'vectorStores'> =>
        vs !== null && vs.walletAddress === args.walletAddress
    );
  },
});

/**
 * Search vector stores by name
 */
export const search = query({
  args: {
    walletAddress: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { walletAddress, query: searchQuery, limit = 10 } = args;

    const results = await ctx.db
      .query('vectorStores')
      .withSearchIndex('search_name', (q) =>
        q.search('name', searchQuery).eq('walletAddress', walletAddress)
      )
      .take(limit);

    return results;
  },
});

// =============================================================================
// Mutations
// =============================================================================

/**
 * Create a new vector store
 */
export const create = mutation({
  args: {
    walletAddress: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    fileIds: v.array(v.string()),
    expiresAfter: v.optional(
      v.object({
        anchor: v.literal('last_active_at'),
        days: v.number(),
      })
    ),
    metadata: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Calculate expiration if specified
    let expiresAt: number | undefined;
    if (args.expiresAfter) {
      expiresAt = now + args.expiresAfter.days * 24 * 60 * 60 * 1000;
    }

    // Create vector store
    const vectorStoreId = await ctx.db.insert('vectorStores', {
      walletAddress: args.walletAddress,
      name: args.name,
      description: args.description,
      fileCounts: {
        inProgress: args.fileIds.length,
        completed: 0,
        failed: 0,
        cancelled: 0,
        total: args.fileIds.length,
      },
      status: args.fileIds.length > 0 ? 'in_progress' : 'completed',
      expiresAfter: args.expiresAfter,
      expiresAt,
      lastActiveAt: now,
      metadata: args.metadata,
      createdAt: now,
      updatedAt: now,
    });

    return vectorStoreId;
  },
});

/**
 * Update a vector store
 */
export const update = mutation({
  args: {
    id: v.id('vectorStores'),
    walletAddress: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    expiresAfter: v.optional(
      v.object({
        anchor: v.literal('last_active_at'),
        days: v.number(),
      })
    ),
    metadata: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (ctx, args) => {
    const { id, walletAddress, ...updates } = args;

    // Get existing vector store
    const vectorStore = await ctx.db.get(id);

    // Check ownership
    if (!vectorStore || vectorStore.walletAddress !== walletAddress) {
      throw new ConvexError('Vector store not found or access denied');
    }

    const now = Date.now();

    // Calculate new expiration if specified
    let expiresAt: number | undefined;
    if (updates.expiresAfter) {
      expiresAt = now + updates.expiresAfter.days * 24 * 60 * 60 * 1000;
    }

    // Update vector store
    await ctx.db.patch(id, {
      ...updates,
      expiresAt,
      lastActiveAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Delete a vector store and all associated files
 */
export const deleteVectorStore = mutation({
  args: {
    id: v.id('vectorStores'),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, walletAddress } = args;

    // Get existing vector store
    const vectorStore = await ctx.db.get(id);

    // Check ownership
    if (!vectorStore || vectorStore.walletAddress !== walletAddress) {
      throw new ConvexError('Vector store not found or access denied');
    }

    // Delete all associated vector store files
    const files = await ctx.db
      .query('vectorStoreFiles')
      .withIndex('by_vector_store', (q) => q.eq('vectorStoreId', id))
      .collect();

    await Promise.all(files.map((file) => ctx.db.delete(file._id)));

    // Delete the vector store
    await ctx.db.delete(id);
  },
});

/**
 * Queue file processing for a vector store
 */
export const queueFileProcessing = mutation({
  args: {
    vectorStoreId: v.id('vectorStores'),
    fileIds: v.array(v.string()),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const { vectorStoreId, fileIds, walletAddress } = args;

    // Verify ownership
    const vectorStore = await ctx.db.get(vectorStoreId);
    if (!vectorStore || vectorStore.walletAddress !== walletAddress) {
      throw new ConvexError('Vector store not found or access denied');
    }

    const now = Date.now();

    // Create vector store file entries
    await Promise.all(
      fileIds.map((fileId) =>
        ctx.db.insert('vectorStoreFiles', {
          vectorStoreId,
          fileId,
          status: 'in_progress',
          chunkingStrategy: {
            type: 'auto',
          },
          createdAt: now,
        })
      )
    );

    // Update file counts
    await ctx.db.patch(vectorStoreId, {
      fileCounts: {
        ...vectorStore.fileCounts,
        inProgress: vectorStore.fileCounts.inProgress + fileIds.length,
        total: vectorStore.fileCounts.total + fileIds.length,
      },
      status: 'in_progress',
      updatedAt: now,
    });

    // TODO: Trigger async file processing job
    // This would integrate with your vector database (Qdrant/Pinecone)
    // and embedding generation service
  },
});

/**
 * Update file processing status
 */
export const updateFileStatus = mutation({
  args: {
    vectorStoreId: v.id('vectorStores'),
    fileId: v.string(),
    status: v.union(
      v.literal('completed'),
      v.literal('failed'),
      v.literal('cancelled')
    ),
    error: v.optional(
      v.object({
        code: v.union(
          v.literal('internal_error'),
          v.literal('file_not_found'),
          v.literal('parsing_error'),
          v.literal('unhandled_mime_type')
        ),
        message: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { vectorStoreId, fileId, status, error } = args;

    // Get the vector store file
    const vectorStoreFile = await ctx.db
      .query('vectorStoreFiles')
      .withIndex('by_vector_store', (q) => q.eq('vectorStoreId', vectorStoreId))
      .filter((q) => q.eq(q.field('fileId'), fileId))
      .first();

    if (!vectorStoreFile) {
      throw new ConvexError('Vector store file not found');
    }

    // Update file status
    await ctx.db.patch(vectorStoreFile._id, {
      status,
      lastError: error,
    });

    // Update vector store file counts
    const vectorStore = await ctx.db.get(vectorStoreId);
    if (!vectorStore) {
      throw new ConvexError('Vector store not found');
    }

    const fileCounts = { ...vectorStore.fileCounts };
    fileCounts.inProgress = Math.max(0, fileCounts.inProgress - 1);

    if (status === 'completed') {
      fileCounts.completed += 1;
    } else if (status === 'failed') {
      fileCounts.failed += 1;
    } else if (status === 'cancelled') {
      fileCounts.cancelled += 1;
    }

    // Determine overall status
    let overallStatus: 'in_progress' | 'expired' | 'completed';
    if (fileCounts.inProgress > 0) {
      overallStatus = 'in_progress';
    } else if (fileCounts.failed === fileCounts.total) {
      overallStatus = 'expired';
    } else {
      overallStatus = 'completed';
    }

    await ctx.db.patch(vectorStoreId, {
      fileCounts,
      status: overallStatus,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Touch vector store to update last active time
 */
export const touch = mutation({
  args: {
    id: v.id('vectorStores'),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, walletAddress } = args;

    // Get existing vector store
    const vectorStore = await ctx.db.get(id);

    // Check ownership
    if (!vectorStore || vectorStore.walletAddress !== walletAddress) {
      throw new ConvexError('Vector store not found or access denied');
    }

    const now = Date.now();

    // Update expiration if anchor is last_active_at
    let expiresAt = vectorStore.expiresAt;
    if (vectorStore.expiresAfter?.anchor === 'last_active_at') {
      expiresAt = now + vectorStore.expiresAfter.days * 24 * 60 * 60 * 1000;
    }

    // Update last active time
    await ctx.db.patch(id, {
      lastActiveAt: now,
      expiresAt,
      updatedAt: now,
    });
  },
});
