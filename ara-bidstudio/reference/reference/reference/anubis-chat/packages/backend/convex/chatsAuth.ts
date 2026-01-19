/**
 * Authenticated chat queries and mutations
 * These ensure proper user isolation by using the authenticated user ID
 */

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getCurrentUser, requireAuth } from './authHelpers';

// Get chats for the currently authenticated user
export const getMyChats = query({
  args: {
    limit: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return [];
    }

    const limit = Math.min(args.limit ?? 20, 50);

    let dbQuery = ctx.db
      .query('chats')
      .withIndex('by_owner', (q) => q.eq('ownerId', user._id));

    if (args.isActive !== undefined) {
      dbQuery = dbQuery.filter((q) => q.eq(q.field('isActive'), args.isActive));
    }

    const chats = await dbQuery.order('desc').take(limit);

    // Get message counts for each chat
    const chatsWithMessageCounts = await Promise.all(
      chats.map(async (chat) => {
        const messageCount = await ctx.db
          .query('messages')
          .withIndex('by_chat', (q) => q.eq('chatId', chat._id))
          .collect()
          .then((messages) => messages.length);

        return {
          ...chat,
          messageCount,
        };
      })
    );

    return chatsWithMessageCounts;
  },
});

// Create a new chat for the authenticated user
export const createMyChat = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    model: v.string(),
    systemPrompt: v.optional(v.string()), // User's custom system prompt
    agentPrompt: v.optional(v.string()), // Agent's base prompt (copy)
    agentId: v.optional(v.id('agents')), // Reference to selected agent
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuth(ctx);

    const now = Date.now();

    const chatId = await ctx.db.insert('chats', {
      title: args.title,
      description: args.description,
      ownerId: user._id, // Use actual user ID, not wallet address
      model: args.model,
      systemPrompt: args.systemPrompt,
      agentPrompt: args.agentPrompt,
      agentId: args.agentId,
      temperature: args.temperature,
      maxTokens: args.maxTokens,
      isPinned: false,
      isActive: true,
      messageCount: 0,
      totalTokens: 0,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(chatId);
  },
});

// Update a chat (with ownership verification)
export const updateMyChat = mutation({
  args: {
    id: v.id('chats'),
    title: v.optional(v.string()),
    model: v.optional(v.string()),
    systemPrompt: v.optional(v.string()), // Only system prompt is editable by users
    agentPrompt: v.optional(v.string()), // Agent prompt can be updated when agent changes
    agentId: v.optional(v.id('agents')), // Agent reference can be updated
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuth(ctx);

    const chat = await ctx.db.get(args.id);

    if (!chat || chat.ownerId !== user._id) {
      throw new Error('Chat not found or access denied');
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) {
      updates.title = args.title;
    }
    if (args.model !== undefined) {
      updates.model = args.model;
    }
    if (args.systemPrompt !== undefined) {
      updates.systemPrompt = args.systemPrompt;
    }
    if (args.agentPrompt !== undefined) {
      updates.agentPrompt = args.agentPrompt;
    }
    if (args.agentId !== undefined) {
      updates.agentId = args.agentId;
    }
    if (args.temperature !== undefined) {
      updates.temperature = args.temperature;
    }
    if (args.maxTokens !== undefined) {
      updates.maxTokens = args.maxTokens;
    }
    if (args.isActive !== undefined) {
      updates.isActive = args.isActive;
    }

    await ctx.db.patch(args.id, updates);
    return await ctx.db.get(args.id);
  },
});

// Delete a chat (with ownership verification)
export const deleteMyChat = mutation({
  args: {
    id: v.id('chats'),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuth(ctx);

    const chat = await ctx.db.get(args.id);

    if (!chat || chat.ownerId !== user._id) {
      throw new Error('Chat not found or access denied');
    }

    // Delete all messages in this chat
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_chat', (q) => q.eq('chatId', args.id))
      .collect();

    await Promise.all(messages.map((m) => ctx.db.delete(m._id)));

    // Delete the chat
    await ctx.db.delete(args.id);

    return { success: true, chatId: args.id };
  },
});

// Get a specific chat (with ownership verification)
export const getMyChat = query({
  args: { id: v.id('chats') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    const chat = await ctx.db.get(args.id);

    if (!chat || chat.ownerId !== user._id) {
      return null;
    }

    // Get message count
    const messageCount = await ctx.db
      .query('messages')
      .withIndex('by_chat', (q) => q.eq('chatId', args.id))
      .collect()
      .then((messages) => messages.length);

    return {
      ...chat,
      messageCount,
    };
  },
});

// Get chat statistics for the authenticated user
export const getMyChatStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      return {
        totalChats: 0,
        activeChats: 0,
        archivedChats: 0,
        totalMessages: 0,
        modelUsage: [],
        recentActivity: [],
      };
    }

    const chats = await ctx.db
      .query('chats')
      .withIndex('by_owner', (q) => q.eq('ownerId', user._id))
      .collect();

    const activeChats = chats.filter((chat) => chat.isActive);
    const archivedChats = chats.filter((chat) => !chat.isActive);

    // Get total message count across all chats
    const allMessages = await Promise.all(
      chats.map((chat) =>
        ctx.db
          .query('messages')
          .withIndex('by_chat', (q) => q.eq('chatId', chat._id))
          .collect()
      )
    );

    const totalMessages = allMessages.flat().length;
    const modelUsage = new Map<string, number>();
    for (const chat of chats) {
      modelUsage.set(chat.model, (modelUsage.get(chat.model) || 0) + 1);
    }

    return {
      totalChats: chats.length,
      activeChats: activeChats.length,
      archivedChats: archivedChats.length,
      totalMessages,
      modelUsage: Object.fromEntries(modelUsage),
      oldestChat:
        chats.length > 0 ? Math.min(...chats.map((c) => c.createdAt)) : null,
      newestChat:
        chats.length > 0 ? Math.max(...chats.map((c) => c.createdAt)) : null,
    };
  },
});
