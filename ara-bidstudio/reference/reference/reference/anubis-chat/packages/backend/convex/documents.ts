import { v } from 'convex/values';
import type { Doc } from './_generated/dataModel';
import { mutation, query } from './_generated/server';

// Get documents by owner with pagination
export const getByOwner = query({
  args: {
    ownerId: v.string(),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    category: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal('text'),
        v.literal('markdown'),
        v.literal('pdf'),
        v.literal('url')
      )
    ),
  },
  handler: async (ctx, args) => {
    const page = args.page ?? 1;
    const limit = Math.min(args.limit ?? 10, 50); // Max 50 per page
    const offset = (page - 1) * limit;

    let dbQuery = ctx.db
      .query('documents')
      .withIndex('by_owner', (q) => q.eq('ownerId', args.ownerId));

    // Use the optimized category index when category is specified
    if (args.category) {
      dbQuery = ctx.db
        .query('documents')
        .withIndex('by_owner_category', (q) =>
          q.eq('ownerId', args.ownerId).eq('metadata.category', args.category)
        );
    }

    // Only apply type filter when not using category index (to maintain efficiency)
    if (args.type) {
      dbQuery = dbQuery.filter((q) => q.eq(q.field('type'), args.type));
    }

    const allDocs = await dbQuery.order('desc').collect();
    const total = allDocs.length;
    const documents = allDocs.slice(offset, offset + limit);

    return {
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: offset + limit < total,
        hasPrev: page > 1,
      },
    };
  },
});

// Get single document by ID
export const getById = query({
  args: { id: v.id('documents') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Search documents by content and title
export const search = query({
  args: {
    ownerId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
    type: v.optional(
      v.union(
        v.literal('text'),
        v.literal('markdown'),
        v.literal('pdf'),
        v.literal('url'),
        v.literal('json'),
        v.literal('csv')
      )
    ),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 10, 20); // Max 20 search results

    // Search in content
    const contentResults = await ctx.db
      .query('documents')
      .withSearchIndex('search_content', (q) =>
        q
          .search('content', args.query)
          .eq('ownerId', args.ownerId)
          .eq('type', args.type ?? 'text')
      )
      .take(limit);

    // Search in titles
    const titleResults = await ctx.db
      .query('documents')
      .withSearchIndex('search_title', (q) =>
        q
          .search('title', args.query)
          .eq('ownerId', args.ownerId)
          .eq('type', args.type ?? 'text')
      )
      .take(limit);

    // Combine and deduplicate results
    const allResults = [...contentResults, ...titleResults];
    const uniqueResults = allResults.filter(
      (doc, index, arr) => arr.findIndex((d) => d._id === doc._id) === index
    );

    // Score results based on relevance (title matches score higher)
    const scoredResults = uniqueResults.map((doc) => {
      const titleMatch = doc.title
        .toLowerCase()
        .includes(args.query.toLowerCase());
      const contentMatch = doc.content
        .toLowerCase()
        .includes(args.query.toLowerCase());

      let score = 0;
      if (titleMatch) {
        score += 10;
      }
      if (contentMatch) {
        score += 5;
      }

      // Count occurrences for better scoring
      const titleOccurrences = (
        doc.title
          .toLowerCase()
          .match(new RegExp(args.query.toLowerCase(), 'g')) || []
      ).length;
      const contentOccurrences = (
        doc.content
          .toLowerCase()
          .match(new RegExp(args.query.toLowerCase(), 'g')) || []
      ).length;

      score += titleOccurrences * 3 + contentOccurrences;

      return { ...doc, score };
    });

    return scoredResults
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ score, ...doc }) => doc); // Remove score from final result
  },
});

// Create new document
export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    type: v.union(
      v.literal('text'),
      v.literal('markdown'),
      v.literal('pdf'),
      v.literal('url'),
      v.literal('json'),
      v.literal('csv')
    ),
    ownerId: v.string(),
    isPublic: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    metadata: v.optional(
      v.object({
        source: v.optional(v.string()),
        author: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        category: v.optional(v.string()),
        language: v.optional(v.string()),
        wordCount: v.optional(v.number()),
        characterCount: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Calculate word and character count if not provided
    const WORD_SPLIT_REGEX = /\s+/g;
    const wordCount =
      args.metadata?.wordCount ?? args.content.split(WORD_SPLIT_REGEX).length;
    const characterCount = args.metadata?.characterCount ?? args.content.length;

    const documentId = await ctx.db.insert('documents', {
      title: args.title,
      content: args.content,
      type: args.type,
      ownerId: args.ownerId,
      isPublic: args.isPublic ?? false,
      tags: args.tags,
      metadata: {
        ...args.metadata,
        wordCount,
        characterCount,
      },
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(documentId);
  },
});

// Update document
export const update = mutation({
  args: {
    id: v.id('documents'),
    ownerId: v.string(), // For access control
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    metadata: v.optional(
      v.object({
        source: v.optional(v.string()),
        author: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        category: v.optional(v.string()),
        language: v.optional(v.string()),
        wordCount: v.optional(v.number()),
        characterCount: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id);

    if (!document || document.ownerId !== args.ownerId) {
      throw new Error('Document not found or access denied');
    }

    const updates: Partial<Doc<'documents'>> = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) {
      updates.title = args.title;
    }

    if (args.content !== undefined) {
      updates.content = args.content;
      // Recalculate counts if content changed
      const WORD_SPLIT_REGEX = /\s+/g;
      updates.metadata = {
        ...document.metadata,
        ...args.metadata,
        wordCount: args.content.split(WORD_SPLIT_REGEX).length,
        characterCount: args.content.length,
      };
    } else if (args.metadata) {
      updates.metadata = {
        ...document.metadata,
        ...args.metadata,
      };
    }

    await ctx.db.patch(args.id, updates);
    return await ctx.db.get(args.id);
  },
});

// Delete document
export const remove = mutation({
  args: {
    id: v.id('documents'),
    ownerId: v.string(), // For access control
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id);

    if (!document || document.ownerId !== args.ownerId) {
      throw new Error('Document not found or access denied');
    }

    await ctx.db.delete(args.id);
    return { success: true, documentId: args.id };
  },
});

// Get documents by category
export const getByCategory = query({
  args: {
    ownerId: v.string(),
    category: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50);

    return await ctx.db
      .query('documents')
      .withIndex('by_owner_category', (q) =>
        q.eq('ownerId', args.ownerId).eq('metadata.category', args.category)
      )
      .order('desc')
      .take(limit);
  },
});

// Get all categories for a user
export const getCategories = query({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    const documents = await ctx.db
      .query('documents')
      .withIndex('by_owner', (q) => q.eq('ownerId', args.ownerId))
      .collect();

    const categories = new Set<string>();

    for (const doc of documents) {
      if (doc.metadata?.category) {
        categories.add(doc.metadata.category);
      }
    }

    return Array.from(categories).sort();
  },
});

// Get all tags for a user
export const getTags = query({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    const documents = await ctx.db
      .query('documents')
      .withIndex('by_owner', (q) => q.eq('ownerId', args.ownerId))
      .collect();

    const tags = new Set<string>();

    for (const doc of documents) {
      if (doc.tags) {
        for (const tag of doc.tags) {
          tags.add(tag);
        }
      }
    }

    return Array.from(tags).sort();
  },
});

// Get document statistics for a user
export const getStats = query({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    const documents = await ctx.db
      .query('documents')
      .withIndex('by_owner', (q) => q.eq('ownerId', args.ownerId))
      .collect();

    const stats = {
      total: documents.length,
      byType: {
        text: 0,
        markdown: 0,
        pdf: 0,
        url: 0,
        json: 0,
        csv: 0,
      },
      totalWords: 0,
      totalCharacters: 0,
      categories: new Set<string>(),
      tags: new Set<string>(),
    };

    for (const doc of documents) {
      stats.byType[doc.type]++;
      stats.totalWords += doc.metadata?.wordCount || 0;
      stats.totalCharacters += doc.metadata?.characterCount || 0;

      if (doc.metadata?.category) {
        stats.categories.add(doc.metadata.category);
      }

      if (doc.tags) {
        for (const tag of doc.tags) {
          stats.tags.add(tag);
        }
      }
    }

    return {
      ...stats,
      categories: Array.from(stats.categories),
      tags: Array.from(stats.tags),
    };
  },
});

// Create document chunk (for RAG processing)
export const createChunk = mutation({
  args: {
    documentId: v.id('documents'),
    content: v.string(),
    chunkIndex: v.number(),
    embedding: v.array(v.number()),
    metadata: v.optional(
      v.object({
        overlap: v.optional(v.number()),
        wordCount: v.number(),
        startOffset: v.number(),
        endOffset: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const chunkId = await ctx.db.insert('documentChunks', {
      documentId: args.documentId,
      content: args.content,
      chunkIndex: args.chunkIndex,
      embedding: args.embedding,
      metadata: args.metadata || {
        wordCount: 0,
        startOffset: 0,
        endOffset: 0,
      },
      createdAt: now,
      updatedAt: now,
    });

    return chunkId;
  },
});

// Delete all chunks for a document
export const deleteChunks = mutation({
  args: {
    documentId: v.id('documents'),
  },
  handler: async (ctx, args) => {
    const chunks = await ctx.db
      .query('documentChunks')
      .withIndex('by_document', (q) => q.eq('documentId', args.documentId))
      .collect();

    for (const chunk of chunks) {
      await ctx.db.delete(chunk._id);
    }

    return { success: true, deletedCount: chunks.length };
  },
});
