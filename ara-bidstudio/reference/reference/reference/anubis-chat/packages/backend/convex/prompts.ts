import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getCurrentUser, requireAuth } from './authHelpers';

export const listFolders = query({
  args: { parentId: v.optional(v.id('promptFolders')) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }
    const q = ctx.db
      .query('promptFolders')
      .withIndex('by_parent', (x) =>
        x.eq('ownerId', user._id).eq('parentId', args.parentId ?? (null as any))
      );
    return await q.order('desc').collect();
  },
});

export const listPrompts = query({
  args: {
    folderId: v.optional(v.id('promptFolders')),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }
    const limit = Math.min(args.limit ?? 100, 200);
    if (args.search && args.search.trim() !== '') {
      const byTitle = await ctx.db
        .query('prompts')
        .withSearchIndex('search_title', (q) =>
          q.search('title', args.search!).eq('ownerId', user._id)
        )
        .take(limit);
      const byContent = await ctx.db
        .query('prompts')
        .withSearchIndex('search_content', (q) =>
          q.search('content', args.search!).eq('ownerId', user._id)
        )
        .take(limit);
      const merged = [...byTitle, ...byContent];
      const seen = new Set<string>();
      return merged.filter((p) =>
        seen.has(p._id) ? false : (seen.add(p._id), true)
      );
    }
    const q = ctx.db
      .query('prompts')
      .withIndex('by_folder', (x) =>
        x.eq('ownerId', user._id).eq('folderId', args.folderId ?? (null as any))
      );
    return await q.order('desc').take(limit);
  },
});

export const getTopPrompts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }
    const limit = Math.min(args.limit ?? 3, 10);
    return await ctx.db
      .query('prompts')
      .withIndex('by_usage', (q) => q.eq('ownerId', user._id))
      .order('desc')
      .take(limit);
  },
});

export const createFolder = mutation({
  args: { name: v.string(), parentId: v.optional(v.id('promptFolders')) },
  handler: async (ctx, args) => {
    const { user } = await requireAuth(ctx);
    const now = Date.now();
    const id = await ctx.db.insert('promptFolders', {
      ownerId: user._id,
      name: args.name,
      parentId: args.parentId,
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(id);
  },
});

export const savePrompt = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    folderId: v.optional(v.id('promptFolders')),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuth(ctx);
    const now = Date.now();
    const id = await ctx.db.insert('prompts', {
      ownerId: user._id,
      title: args.title,
      content: args.content,
      folderId: args.folderId,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(id);
  },
});

export const updatePrompt = mutation({
  args: {
    id: v.id('prompts'),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    folderId: v.optional(v.id('promptFolders')),
    archived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuth(ctx);
    const prompt = await ctx.db.get(args.id);
    if (!prompt || prompt.ownerId !== user._id) {
      throw new Error('Not found');
    }
    const updates: Record<string, any> = { updatedAt: Date.now() };
    if (args.title !== undefined) {
      updates.title = args.title;
    }
    if (args.content !== undefined) {
      updates.content = args.content;
    }
    if (args.folderId !== undefined) {
      updates.folderId = args.folderId;
    }
    if (args.archived !== undefined) {
      updates.isArchived = args.archived;
    }
    await ctx.db.patch(args.id, updates);
    return await ctx.db.get(args.id);
  },
});

export const deletePrompt = mutation({
  args: { id: v.id('prompts') },
  handler: async (ctx, args) => {
    const { user } = await requireAuth(ctx);
    const prompt = await ctx.db.get(args.id);
    if (!prompt || prompt.ownerId !== user._id) {
      throw new Error('Not found');
    }
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const recordUsage = mutation({
  args: { id: v.id('prompts') },
  handler: async (ctx, args) => {
    const { user } = await requireAuth(ctx);
    const prompt = await ctx.db.get(args.id);
    if (!prompt || prompt.ownerId !== user._id) {
      throw new Error('Not found');
    }
    await ctx.db.patch(args.id, {
      usageCount: (prompt.usageCount || 0) + 1,
      lastUsedAt: Date.now(),
    });
    return { success: true };
  },
});

export const updateFolder = mutation({
  args: {
    id: v.id('promptFolders'),
    name: v.optional(v.string()),
    parentId: v.optional(v.id('promptFolders')),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuth(ctx);
    const folder = await ctx.db.get(args.id);
    if (!folder || folder.ownerId !== user._id) {
      throw new Error('Not found');
    }

    const updates: Record<string, any> = { updatedAt: Date.now() };
    if (args.name !== undefined) {
      updates.name = args.name;
    }
    if (args.parentId !== undefined) {
      updates.parentId = args.parentId;
    }

    await ctx.db.patch(args.id, updates);
    return await ctx.db.get(args.id);
  },
});

export const deleteFolder = mutation({
  args: { id: v.id('promptFolders') },
  handler: async (ctx, args) => {
    const { user } = await requireAuth(ctx);
    const folder = await ctx.db.get(args.id);
    if (!folder || folder.ownerId !== user._id) {
      throw new Error('Not found');
    }

    // Check if folder has child folders
    const childFolders = await ctx.db
      .query('promptFolders')
      .withIndex('by_parent', (x) =>
        x.eq('ownerId', user._id).eq('parentId', args.id)
      )
      .first();

    if (childFolders) {
      throw new Error('Cannot delete folder with child folders');
    }

    // Check if folder has prompts
    const prompts = await ctx.db
      .query('prompts')
      .withIndex('by_folder', (x) =>
        x.eq('ownerId', user._id).eq('folderId', args.id)
      )
      .first();

    if (prompts) {
      throw new Error('Cannot delete folder with prompts');
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const movePrompt = mutation({
  args: {
    promptId: v.id('prompts'),
    targetFolderId: v.optional(v.id('promptFolders')),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuth(ctx);
    const prompt = await ctx.db.get(args.promptId);
    if (!prompt || prompt.ownerId !== user._id) {
      throw new Error('Prompt not found');
    }

    // If moving to a folder, verify the folder exists and belongs to user
    if (args.targetFolderId) {
      const targetFolder = await ctx.db.get(args.targetFolderId);
      if (!targetFolder || targetFolder.ownerId !== user._id) {
        throw new Error('Target folder not found');
      }
    }

    await ctx.db.patch(args.promptId, {
      folderId: args.targetFolderId,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.promptId);
  },
});

export const getFolderHierarchy = query({
  args: {},
  handler: async (ctx, _args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    // Get all folders for the user
    const allFolders = await ctx.db
      .query('promptFolders')
      .withIndex('by_owner', (x) => x.eq('ownerId', user._id))
      .collect();

    // Build hierarchy tree
    const folderMap = new Map();
    const rootFolders = [];

    // First pass: create all folder entries
    for (const folder of allFolders) {
      folderMap.set(folder._id, { ...folder, children: [] });
    }

    // Second pass: organize into hierarchy
    for (const folder of allFolders) {
      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId);
        if (parent) {
          parent.children.push(folderMap.get(folder._id));
        }
      } else {
        rootFolders.push(folderMap.get(folder._id));
      }
    }

    return rootFolders;
  },
});
