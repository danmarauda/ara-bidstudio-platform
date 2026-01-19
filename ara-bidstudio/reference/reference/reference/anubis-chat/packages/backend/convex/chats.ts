import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { api } from './_generated/api';
import type { Doc } from './_generated/dataModel';
import { action, mutation, query } from './_generated/server';

// Type definitions
type TitleGenerationResult =
  | { success: true; title: string; skipped?: boolean }
  | { success: false; error: string };

// Get chats by owner
export const getByOwner = query({
  args: {
    ownerId: v.string(), // This should be the user ID, not wallet address
    limit: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50);

    let dbQuery = ctx.db
      .query('chats')
      .withIndex('by_owner', (q) => q.eq('ownerId', args.ownerId));

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

// Get single chat by ID
export const getById = query({
  args: { id: v.id('chats') },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.id);

    if (!chat) {
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

// Create new chat
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    ownerId: v.string(), // This should be the user ID, not wallet address
    model: v.string(),
    systemPrompt: v.optional(v.string()),
    agentPrompt: v.optional(v.string()),
    agentId: v.optional(v.id('agents')),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const chatId = await ctx.db.insert('chats', {
      title: args.title,
      description: args.description,
      ownerId: args.ownerId,
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

// Update chat
export const update = mutation({
  args: {
    id: v.id('chats'),
    ownerId: v.string(), // For access control
    title: v.optional(v.string()),
    model: v.optional(v.string()),
    systemPrompt: v.optional(v.string()),
    agentPrompt: v.optional(v.string()),
    agentId: v.optional(v.id('agents')),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.id);

    if (!chat || chat.ownerId !== args.ownerId) {
      throw new Error('Chat not found or access denied');
    }

    const updates: Partial<Doc<'chats'>> = {
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

// Delete chat and all its messages
export const remove = mutation({
  args: {
    id: v.id('chats'),
    ownerId: v.string(), // For access control
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.id);

    if (!chat || chat.ownerId !== args.ownerId) {
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

// Archive chat (set inactive)
export const archive = mutation({
  args: {
    id: v.id('chats'),
    ownerId: v.string(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.id);

    if (!chat || chat.ownerId !== args.ownerId) {
      throw new Error('Chat not found or access denied');
    }

    await ctx.db.patch(args.id, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.id);
  },
});

// Restore archived chat
export const restore = mutation({
  args: {
    id: v.id('chats'),
    ownerId: v.string(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.id);

    if (!chat || chat.ownerId !== args.ownerId) {
      throw new Error('Chat not found or access denied');
    }

    await ctx.db.patch(args.id, {
      isActive: true,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.id);
  },
});

// Update last message timestamp and counters
export const updateLastMessageTime = mutation({
  args: {
    id: v.id('chats'),
    timestamp: v.number(),
    incrementMessageCount: v.optional(v.boolean()),
    addTokens: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.id);
    if (!chat) {
      throw new Error('Chat not found');
    }

    const updates: Partial<Doc<'chats'>> = {
      lastMessageAt: args.timestamp,
      updatedAt: Date.now(),
    };

    if (args.incrementMessageCount) {
      updates.messageCount = chat.messageCount + 1;
    }

    if (args.addTokens) {
      updates.totalTokens = chat.totalTokens + args.addTokens;
    }

    await ctx.db.patch(args.id, updates);
    return await ctx.db.get(args.id);
  },
});

// Pin or unpin a chat
export const togglePin = mutation({
  args: {
    id: v.id('chats'),
    ownerId: v.string(),
    isPinned: v.boolean(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.id);

    if (!chat || chat.ownerId !== args.ownerId) {
      throw new Error('Chat not found or access denied');
    }

    await ctx.db.patch(args.id, {
      isPinned: args.isPinned,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.id);
  },
});

// Get chat statistics for user
export const getStats = query({
  args: { ownerId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Return empty stats if no ownerId provided
    if (!args.ownerId) {
      return {
        totalChats: 0,
        activeChats: 0,
        archivedChats: 0,
        totalMessages: 0,
        modelUsage: [],
        recentActivity: [],
      };
    }

    // Narrow the optional value to a definite string for index filtering
    const ownerId = args.ownerId as string;

    const chats = await ctx.db
      .query('chats')
      .withIndex('by_owner', (q) => q.eq('ownerId', ownerId))
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

// Helper function to extract a title from a message
function extractTitleFromMessage(content: string): string {
  // Remove any markdown formatting
  let cleaned = content
    .replace(/^#{1,6}\s+/gm, '') // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .replace(/`([^`]+)`/g, '$1') // Remove code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
    .trim();

  // Remove common question prefixes
  const prefixPattern =
    /^(can you |could you |please |i want to |i need to |help me |how to |how do i |what is |what are |where is |where are |when is |when are |why is |why are |who is |who are )/i;
  cleaned = cleaned.replace(prefixPattern, '');

  // Get the first sentence or question
  const firstSentence = cleaned.match(/^[^.!?\n]{1,100}[.!?]?/);
  if (firstSentence) {
    cleaned = firstSentence[0].replace(/[.!?]+$/, '');
  }

  // Capitalize first letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // Limit to reasonable length
  if (cleaned.length > 50) {
    const words = cleaned.split(' ');
    cleaned = words.slice(0, 6).join(' ');
    if (cleaned.length > 50) {
      cleaned = `${cleaned.substring(0, 47)}...`;
    }
  }

  return cleaned || 'New Chat';
}

// Helper function to truncate a title to a maximum length
function truncateTitle(title: string, maxLength: number): string {
  if (title.length <= maxLength) {
    return title;
  }

  // Try to truncate at a word boundary
  const truncated = title.substring(0, maxLength - 3);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.7) {
    // If we have a reasonable word boundary, use it
    return `${truncated.substring(0, lastSpace)}...`;
  }

  // Otherwise just truncate
  return `${truncated}...`;
}

// Generate a title for a chat based on its messages
export const generateAndUpdateTitle = action({
  args: {
    chatId: v.id('chats'),
    ownerId: v.string(),
  },
  handler: async (ctx, args): Promise<TitleGenerationResult> => {
    // Get the chat to verify ownership and get model info
    const chat = await ctx.runQuery(api.chats.getById, {
      id: args.chatId,
    });

    if (!chat || chat.ownerId !== args.ownerId) {
      throw new Error('Chat not found or access denied');
    }

    // Check if title is already meaningful (not a default title)
    const defaultTitlePatterns = [
      /^New Chat/i,
      /^Untitled/i,
      /^Chat \d+$/i,
      /^Conversation$/i,
    ];

    const hasDefaultTitle = defaultTitlePatterns.some((pattern) =>
      pattern.test(chat.title || '')
    );

    if (!hasDefaultTitle && chat.title && chat.title.length > 5) {
      return { success: true, title: chat.title, skipped: true };
    }

    // Get the first few messages from the chat
    const messages = await ctx.runQuery(api.messages.getByChatId, {
      chatId: args.chatId,
      limit: 5,
    });

    if (!messages || messages.length === 0) {
      return { success: false, error: 'No messages to generate title from' };
    }

    // Filter to get only user and assistant messages (skip system messages)
    const conversationMessages = messages.filter(
      (msg: Doc<'messages'>) => msg.role === 'user' || msg.role === 'assistant'
    );

    if (conversationMessages.length === 0) {
      return { success: false, error: 'No conversation messages found' };
    }

    // Prepare the conversation context for title generation
    const conversationText = conversationMessages
      .slice(0, 3) // Use first 3 messages max
      .map(
        (msg: Doc<'messages'>) => `${msg.role}: ${msg.content.slice(0, 200)}`
      )
      .join('\n');

    try {
      // Generate title using AI - we'll use a simple prompt
      const _prompt = `Generate a concise, descriptive title (3-6 words) for this conversation. The title should capture the main topic or purpose. Return only the title text, nothing else.

Conversation:
${conversationText}

Title:`;

      // For now, we'll use a fallback approach since we need to integrate with the streaming API
      // Extract key topics from the first user message as a fallback
      const firstUserMessage = conversationMessages.find(
        (msg: Doc<'messages'>) => msg.role === 'user'
      );
      if (!firstUserMessage) {
        return { success: false, error: 'No user message found' };
      }

      // Simple title extraction from first message
      let generatedTitle = extractTitleFromMessage(firstUserMessage.content);

      // Validate the generated title
      if (!generatedTitle || generatedTitle.length < 2) {
        // Fallback to a simple title based on message length
        const words = firstUserMessage.content.trim().split(' ').slice(0, 4);
        generatedTitle = words.join(' ');

        if (!generatedTitle) {
          return {
            success: false,
            error: 'Could not generate a meaningful title',
          };
        }
      }

      // Ensure title is not too long
      if (generatedTitle.length > 100) {
        generatedTitle = truncateTitle(generatedTitle, 100);
      }

      // Update the chat title
      await ctx.runMutation(api.chats.updateTitle, {
        chatId: args.chatId,
        title: generatedTitle,
        ownerId: args.ownerId,
      });

      return { success: true, title: generatedTitle };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to generate title',
      };
    }
  },
});

// Internal mutation to update chat title
export const updateTitle = mutation({
  args: {
    chatId: v.id('chats'),
    title: v.string(),
    ownerId: v.string(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);

    if (!chat || chat.ownerId !== args.ownerId) {
      throw new Error('Chat not found or access denied');
    }

    await ctx.db.patch(args.chatId, {
      title: args.title,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.chatId);
  },
});

/**
 * Update token usage for a chat
 */
export const updateTokenUsage = mutation({
  args: {
    chatId: v.id('chats'),
    tokenUsage: v.object({
      promptTokens: v.number(),
      completionTokens: v.number(),
      totalTokens: v.number(),
      cachedTokens: v.number(),
      estimatedCost: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    // Get existing token usage or initialize
    const currentUsage = chat.tokenUsage || {
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalTokens: 0,
      totalCachedTokens: 0,
      totalEstimatedCost: 0,
      messageCount: 0,
    };

    // Update cumulative token usage
    await ctx.db.patch(args.chatId, {
      tokenUsage: {
        totalPromptTokens:
          currentUsage.totalPromptTokens + args.tokenUsage.promptTokens,
        totalCompletionTokens:
          currentUsage.totalCompletionTokens + args.tokenUsage.completionTokens,
        totalTokens: currentUsage.totalTokens + args.tokenUsage.totalTokens,
        totalCachedTokens:
          currentUsage.totalCachedTokens + args.tokenUsage.cachedTokens,
        totalEstimatedCost:
          currentUsage.totalEstimatedCost + args.tokenUsage.estimatedCost,
        messageCount: currentUsage.messageCount + 1,
      },
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Clear all messages from a chat (keeps the chat itself)
 */
export const clearHistory = mutation({
  args: {
    chatId: v.id('chats'),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    // Verify chat ownership
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.ownerId !== userId) {
      throw new Error('Chat not found or access denied');
    }

    // Get all messages for this chat
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_chat', (q) => q.eq('chatId', args.chatId))
      .collect();

    // Delete all messages
    await Promise.all(messages.map((message) => ctx.db.delete(message._id)));

    // Update chat's last message time
    await ctx.db.patch(args.chatId, {
      lastMessageAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      success: true,
      deletedCount: messages.length,
      chatId: args.chatId,
    };
  },
});

/**
 * Get token usage statistics for a chat
 */
export const getTokenUsage = query({
  args: {
    chatId: v.id('chats'),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    // Verify chat ownership
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.ownerId !== userId) {
      throw new Error('Chat not found or access denied');
    }

    return chat.tokenUsage || {
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalTokens: 0,
      totalCachedTokens: 0,
      totalEstimatedCost: 0,
      messageCount: 0,
    };
  },
});
