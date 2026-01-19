/**
 * Vector Store Files Management Functions
 * Handles CRUD operations for files within vector stores
 */

import { ConvexError, v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';

// =============================================================================
// Queries
// =============================================================================

/**
 * List files in a vector store
 */
export const list = query({
  args: {
    vectorStoreId: v.id('vectorStores'),
    walletAddress: v.string(),
    limit: v.optional(v.number()),
    order: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
    cursor: v.optional(v.string()),
    filter: v.optional(
      v.union(
        v.literal('in_progress'),
        v.literal('completed'),
        v.literal('failed')
      )
    ),
  },
  handler: async (ctx, args) => {
    const {
      vectorStoreId,
      walletAddress,
      limit = 20,
      order = 'desc',
      cursor,
      filter,
    } = args;

    // Verify vector store ownership
    const vectorStore = await ctx.db.get(vectorStoreId);
    if (!vectorStore || vectorStore.walletAddress !== walletAddress) {
      throw new ConvexError('Vector store not found or access denied');
    }

    // Build query
    let dbQuery = ctx.db
      .query('vectorStoreFiles')
      .withIndex('by_vector_store', (q) => q.eq('vectorStoreId', vectorStoreId))
      .order(order === 'desc' ? 'desc' : 'asc');

    // Apply filter if provided
    if (filter) {
      dbQuery = dbQuery.filter((q) => q.eq(q.field('status'), filter));
    }

    // Apply cursor if provided
    if (cursor) {
      try {
        const cursorId = cursor as Id<'vectorStoreFiles'>;
        const cursorDoc = await ctx.db.get(cursorId);
        if (cursorDoc) {
          dbQuery = dbQuery.filter((q) =>
            order === 'desc'
              ? q.lt(q.field('createdAt'), cursorDoc.createdAt)
              : q.gt(q.field('createdAt'), cursorDoc.createdAt)
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

    // Get next cursor
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
 * Get a specific vector store file
 */
export const get = query({
  args: {
    id: v.id('vectorStoreFiles'),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.id);

    if (!file) {
      return null;
    }

    // Verify ownership via vector store
    const vectorStore = await ctx.db.get(file.vectorStoreId);
    if (!vectorStore || vectorStore.walletAddress !== args.walletAddress) {
      return null;
    }

    return file;
  },
});

/**
 * Get file by fileId and vectorStoreId
 */
export const getByFileId = query({
  args: {
    vectorStoreId: v.id('vectorStores'),
    fileId: v.string(),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const { vectorStoreId, fileId, walletAddress } = args;

    // Verify vector store ownership
    const vectorStore = await ctx.db.get(vectorStoreId);
    if (!vectorStore || vectorStore.walletAddress !== walletAddress) {
      return null;
    }

    // Find the file
    const file = await ctx.db
      .query('vectorStoreFiles')
      .withIndex('by_vector_store', (q) => q.eq('vectorStoreId', vectorStoreId))
      .filter((q) => q.eq(q.field('fileId'), fileId))
      .first();

    return file;
  },
});

/**
 * Get files by status
 */
export const getByStatus = query({
  args: {
    vectorStoreId: v.id('vectorStores'),
    status: v.union(
      v.literal('in_progress'),
      v.literal('completed'),
      v.literal('cancelled'),
      v.literal('failed')
    ),
    walletAddress: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { vectorStoreId, status, walletAddress, limit = 20 } = args;

    // Verify vector store ownership
    const vectorStore = await ctx.db.get(vectorStoreId);
    if (!vectorStore || vectorStore.walletAddress !== walletAddress) {
      throw new ConvexError('Vector store not found or access denied');
    }

    const files = await ctx.db
      .query('vectorStoreFiles')
      .withIndex('by_status', (q) => q.eq('status', status))
      .filter((q) => q.eq(q.field('vectorStoreId'), vectorStoreId))
      .order('desc')
      .take(limit);

    return files;
  },
});

// =============================================================================
// Mutations
// =============================================================================

/**
 * Add a file to a vector store
 */
export const create = mutation({
  args: {
    vectorStoreId: v.id('vectorStores'),
    fileId: v.string(),
    chunkingStrategy: v.object({
      type: v.union(v.literal('static'), v.literal('auto')),
      static: v.optional(
        v.object({
          maxChunkSizeTokens: v.number(),
          chunkOverlapTokens: v.number(),
        })
      ),
    }),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const { vectorStoreId, fileId, chunkingStrategy, walletAddress } = args;

    // Verify vector store ownership
    const vectorStore = await ctx.db.get(vectorStoreId);
    if (!vectorStore || vectorStore.walletAddress !== walletAddress) {
      throw new ConvexError('Vector store not found or access denied');
    }

    // Check if file already exists in this vector store
    const existingFile = await ctx.db
      .query('vectorStoreFiles')
      .withIndex('by_vector_store', (q) => q.eq('vectorStoreId', vectorStoreId))
      .filter((q) => q.eq(q.field('fileId'), fileId))
      .first();

    if (existingFile) {
      throw new ConvexError('File already exists in this vector store');
    }

    const now = Date.now();

    // Create vector store file entry
    const vectorStoreFileId = await ctx.db.insert('vectorStoreFiles', {
      vectorStoreId,
      fileId,
      status: 'in_progress',
      chunkingStrategy,
      createdAt: now,
    });

    // Update vector store file counts
    await ctx.db.patch(vectorStoreId, {
      fileCounts: {
        ...vectorStore.fileCounts,
        inProgress: vectorStore.fileCounts.inProgress + 1,
        total: vectorStore.fileCounts.total + 1,
      },
      status: 'in_progress',
      updatedAt: now,
    });

    return vectorStoreFileId;
  },
});

/**
 * Remove a file from a vector store
 */
export const deleteFile = mutation({
  args: {
    vectorStoreId: v.id('vectorStores'),
    fileId: v.string(),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const { vectorStoreId, fileId, walletAddress } = args;

    // Verify vector store ownership
    const vectorStore = await ctx.db.get(vectorStoreId);
    if (!vectorStore || vectorStore.walletAddress !== walletAddress) {
      throw new ConvexError('Vector store not found or access denied');
    }

    // Find the file
    const vectorStoreFile = await ctx.db
      .query('vectorStoreFiles')
      .withIndex('by_vector_store', (q) => q.eq('vectorStoreId', vectorStoreId))
      .filter((q) => q.eq(q.field('fileId'), fileId))
      .first();

    if (!vectorStoreFile) {
      throw new ConvexError('File not found in vector store');
    }

    // Delete the file entry
    await ctx.db.delete(vectorStoreFile._id);

    // Update vector store file counts
    const fileCounts = { ...vectorStore.fileCounts };
    fileCounts.total = Math.max(0, fileCounts.total - 1);

    if (vectorStoreFile.status === 'in_progress') {
      fileCounts.inProgress = Math.max(0, fileCounts.inProgress - 1);
    } else if (vectorStoreFile.status === 'completed') {
      fileCounts.completed = Math.max(0, fileCounts.completed - 1);
    } else if (vectorStoreFile.status === 'failed') {
      fileCounts.failed = Math.max(0, fileCounts.failed - 1);
    } else if (vectorStoreFile.status === 'cancelled') {
      fileCounts.cancelled = Math.max(0, fileCounts.cancelled - 1);
    }

    await ctx.db.patch(vectorStoreId, {
      fileCounts,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Cancel file processing
 */
export const cancel = mutation({
  args: {
    vectorStoreId: v.id('vectorStores'),
    fileId: v.string(),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const { vectorStoreId, fileId, walletAddress } = args;

    // Verify vector store ownership
    const vectorStore = await ctx.db.get(vectorStoreId);
    if (!vectorStore || vectorStore.walletAddress !== walletAddress) {
      throw new ConvexError('Vector store not found or access denied');
    }

    // Find the file
    const vectorStoreFile = await ctx.db
      .query('vectorStoreFiles')
      .withIndex('by_vector_store', (q) => q.eq('vectorStoreId', vectorStoreId))
      .filter((q) => q.eq(q.field('fileId'), fileId))
      .first();

    if (!vectorStoreFile) {
      throw new ConvexError('File not found in vector store');
    }

    // Only cancel if in progress
    if (vectorStoreFile.status !== 'in_progress') {
      throw new ConvexError('File is not currently being processed');
    }

    // Update file status
    await ctx.db.patch(vectorStoreFile._id, {
      status: 'cancelled',
    });

    // Update vector store file counts
    await ctx.db.patch(vectorStoreId, {
      fileCounts: {
        ...vectorStore.fileCounts,
        inProgress: Math.max(0, vectorStore.fileCounts.inProgress - 1),
        cancelled: vectorStore.fileCounts.cancelled + 1,
      },
      updatedAt: Date.now(),
    });
  },
});

/**
 * Batch delete files from a vector store
 */
export const batchDelete = mutation({
  args: {
    vectorStoreId: v.id('vectorStores'),
    fileIds: v.array(v.string()),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const { vectorStoreId, fileIds, walletAddress } = args;

    // Verify vector store ownership
    const vectorStore = await ctx.db.get(vectorStoreId);
    if (!vectorStore || vectorStore.walletAddress !== walletAddress) {
      throw new ConvexError('Vector store not found or access denied');
    }

    const fileCounts = { ...vectorStore.fileCounts };
    let deletedCount = 0;

    const deletions = await Promise.all(
      fileIds.map(async (fileId) => {
        const vectorStoreFile = await ctx.db
          .query('vectorStoreFiles')
          .withIndex('by_vector_store', (q) =>
            q.eq('vectorStoreId', vectorStoreId)
          )
          .filter((q) => q.eq(q.field('fileId'), fileId))
          .first();
        if (!vectorStoreFile) {
          return false;
        }
        await ctx.db.delete(vectorStoreFile._id);
        // Update counts based on status
        fileCounts.total = Math.max(0, fileCounts.total - 1);
        if (vectorStoreFile.status === 'in_progress') {
          fileCounts.inProgress = Math.max(0, fileCounts.inProgress - 1);
        } else if (vectorStoreFile.status === 'completed') {
          fileCounts.completed = Math.max(0, fileCounts.completed - 1);
        } else if (vectorStoreFile.status === 'failed') {
          fileCounts.failed = Math.max(0, fileCounts.failed - 1);
        } else if (vectorStoreFile.status === 'cancelled') {
          fileCounts.cancelled = Math.max(0, fileCounts.cancelled - 1);
        }
        return true;
      })
    );
    deletedCount = deletions.filter(Boolean).length;

    // Update vector store file counts
    if (deletedCount > 0) {
      await ctx.db.patch(vectorStoreId, {
        fileCounts,
        updatedAt: Date.now(),
      });
    }

    return deletedCount;
  },
});
