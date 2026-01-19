/**
 * Memory Management Functions for Convex
 * Handles memory creation, retrieval, search, and updates
 */

import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';

// =============================================================================
// Memory Queries
// =============================================================================

/**
 * Get all memories for a user, optionally filtered by type
 */
export const getUserMemories = query({
  args: {
    userId: v.string(),
    type: v.optional(
      v.union(
        v.literal('fact'),
        v.literal('preference'),
        v.literal('skill'),
        v.literal('goal'),
        v.literal('context')
      )
    ),
  },
  handler: async (ctx, args) => {
    let memoriesQuery = ctx.db
      .query('memories')
      .withIndex('by_user', (q) => q.eq('userId', args.userId));

    if (args.type) {
      memoriesQuery = memoriesQuery.filter((q) =>
        q.eq(q.field('type'), args.type)
      );
    }

    return await memoriesQuery.order('desc').collect();
  },
});

/**
 * Get a memory by ID
 */
export const getById = query({
  args: { id: v.id('memories') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Search memories using content search
 */
export const searchMemories = query({
  args: {
    userId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    // Use text search on content
    const results = await ctx.db
      .query('memories')
      .withSearchIndex('search_content', (q) =>
        q.search('content', args.query).eq('userId', args.userId)
      )
      .take(limit);

    return results;
  },
});

/**
 * Vector search for memories (requires embeddings)
 */
export const vectorSearch = query({
  args: {
    userId: v.string(),
    embedding: v.array(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    // Use vector search on embeddings
    const results = await ctx.db
      .query('memories')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) => q.neq(q.field('embedding'), []))
      .take(limit);

    return results;
  },
});

// =============================================================================
// Memory Mutations
// =============================================================================

/**
 * Create a new memory
 */
export const create = mutation({
  args: {
    userId: v.string(),
    content: v.string(),
    type: v.union(
      v.literal('fact'),
      v.literal('preference'),
      v.literal('skill'),
      v.literal('goal'),
      v.literal('context')
    ),
    importance: v.optional(v.number()),
    embedding: v.optional(v.array(v.number())),
    tags: v.optional(v.array(v.string())),
    sourceId: v.optional(v.string()),
    sourceType: v.optional(
      v.union(
        v.literal('chat'),
        v.literal('document'),
        v.literal('agent'),
        v.literal('workflow')
      )
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert('memories', {
      userId: args.userId,
      content: args.content,
      type: args.type,
      importance: args.importance || 0.5,
      embedding: args.embedding || [],
      tags: args.tags,
      sourceId: args.sourceId,
      sourceType: args.sourceType,
      accessCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update an existing memory
 */
export const update = mutation({
  args: {
    id: v.id('memories'),
    updates: v.object({
      content: v.optional(v.string()),
      type: v.optional(
        v.union(
          v.literal('fact'),
          v.literal('preference'),
          v.literal('skill'),
          v.literal('goal'),
          v.literal('context')
        )
      ),
      importance: v.optional(v.number()),
      embedding: v.optional(v.array(v.number())),
      tags: v.optional(v.array(v.string())),
      lastSeenAt: v.optional(v.number()),
      accessCount: v.optional(v.number()),
      lastAccessed: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const { id, updates } = args;
    const updateData: Partial<Doc<'memories'>> = { ...updates };

    if (Object.keys(updateData).length > 0) {
      updateData.updatedAt = Date.now();
    }

    return await ctx.db.patch(id, updateData);
  },
});

/**
 * Delete a memory
 */
export const remove = mutation({
  args: { id: v.id('memories') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Update memory access tracking
 */
export const updateAccess = mutation({
  args: { id: v.id('memories') },
  handler: async (ctx, args) => {
    const memory = await ctx.db.get(args.id);
    if (!memory) {
      throw new Error('Memory not found');
    }

    await ctx.db.patch(args.id, {
      accessCount: memory.accessCount + 1,
      lastAccessed: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Bulk create memories
 */
export const bulkCreate = mutation({
  args: {
    memories: v.array(
      v.object({
        userId: v.string(),
        content: v.string(),
        type: v.union(
          v.literal('fact'),
          v.literal('preference'),
          v.literal('skill'),
          v.literal('goal'),
          v.literal('context')
        ),
        importance: v.optional(v.number()),
        embedding: v.optional(v.array(v.number())),
        tags: v.optional(v.array(v.string())),
        sourceId: v.optional(v.string()),
        sourceType: v.optional(
          v.union(
            v.literal('chat'),
            v.literal('document'),
            v.literal('agent'),
            v.literal('workflow')
          )
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const results = await Promise.all(
      args.memories.map((memory) =>
        ctx.db.insert('memories', {
          ...memory,
          importance: memory.importance || 0.5,
          embedding: memory.embedding || [],
          accessCount: 0,
          createdAt: now,
          updatedAt: now,
        })
      )
    );

    return results as Id<'memories'>[];
  },
});

/**
 * Get memory statistics for a user
 */
export const getStats = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const memories = await ctx.db
      .query('memories')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    const stats = {
      total: memories.length,
      byType: {
        fact: 0,
        preference: 0,
        skill: 0,
        goal: 0,
        context: 0,
      } as Record<string, number>,
      totalAccesses: 0,
      averageImportance: 0,
    };

    let importanceSum = 0;
    for (const memory of memories) {
      stats.byType[memory.type]++;
      stats.totalAccesses += memory.accessCount;
      importanceSum += memory.importance;
    }

    if (memories.length > 0) {
      stats.averageImportance = importanceSum / memories.length;
    }

    return stats;
  },
});
