import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { api } from './_generated/api';
import type { Id, Doc } from './_generated/dataModel';
import {
  mutation,
  query,
  type DatabaseReader,
  type DatabaseWriter,
} from './_generated/server';
import type { 
  MessageReaction, 
  MessageMetadata,
  CreateMessageParams,
  MessageWithReactions,
  MessageStats
} from './types/chat';

// Helper context types for database operations
type DatabaseReadContext = {
  db: DatabaseReader;
};

type DatabaseWriteContext = {
  db: DatabaseWriter;
};

type ReactionMap = Record<string, MessageReaction[]>;

// Get messages by chat ID
export const getByChatId = query({
  args: {
    chatId: v.id('chats'),
    limit: v.optional(v.number()),
    before: v.optional(v.number()), // timestamp for pagination
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 100); // Max 100 messages per request

    let dbQuery = ctx.db
      .query('messages')
      .withIndex('by_chat', (q) => q.eq('chatId', args.chatId));

    if (args.before !== undefined) {
      dbQuery = dbQuery.filter((q) =>
        q.lt(q.field('createdAt'), args.before ?? 0)
      );
    }

    const messages = await dbQuery.order('desc').take(limit);

    // Return in chronological order (oldest first)
    return messages.reverse();
  },
});

/**
 * Edit a message content
 */
export const editMessage = mutation({
  args: {
    messageId: v.id('messages'),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    // Get the message
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    // Get the chat to verify ownership
    const chat = await ctx.db.get(message.chatId);
    if (!chat || chat.ownerId !== userId) {
      throw new Error('Not authorized to edit this message');
    }

    // Only allow editing user messages
    if (message.role !== 'user') {
      throw new Error('Can only edit user messages');
    }

    // Update the message
    await ctx.db.patch(args.messageId, {
      content: args.content,
      metadata: {
        ...message.metadata,
        edited: true,
        editedAt: Date.now(),
      },
    });

    return { success: true };
  },
});

/**
 * Regenerate the last assistant message in a chat
 */
/**
 * Add or remove a reaction to a message
 */
export const toggleReaction = mutation({
  args: {
    messageId: v.id('messages'),
    reaction: v.union(
      v.literal('like'),
      v.literal('dislike'),
      v.literal('love'),
      v.literal('celebrate'),
      v.literal('insightful')
    ),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    // Get the message
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    // Get the chat to verify access
    const chat = await ctx.db.get(message.chatId);
    if (!chat || chat.ownerId !== userId) {
      throw new Error('Not authorized to react to this message');
    }

    // Get or initialize reactions
    const reactions: ReactionMap = message.metadata?.reactions || {};
    const userReactions = reactions[userId] || [];

    // Toggle the reaction
    const reactionIndex = userReactions.indexOf(args.reaction);
    if (reactionIndex > -1) {
      // Remove reaction
      userReactions.splice(reactionIndex, 1);
    } else {
      // Add reaction (max 3 reactions per user per message)
      if (userReactions.length >= 3) {
        throw new Error('Maximum reactions reached for this message');
      }
      userReactions.push(args.reaction);
    }

    // Update reactions
    if (userReactions.length > 0) {
      reactions[userId] = userReactions;
    } else {
      delete reactions[userId];
    }

    // Update the message
    await ctx.db.patch(args.messageId, {
      metadata: {
        ...message.metadata,
        reactions,
        lastReactionAt: Date.now(),
      },
    });

    return {
      success: true,
      added: reactionIndex === -1,
      reaction: args.reaction,
    };
  },
});

export const regenerateLastAssistant = mutation({
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

    // Get the last assistant message
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_chat', (q) => q.eq('chatId', args.chatId))
      .order('desc')
      .take(10); // Get last 10 messages to find the assistant one

    const lastAssistantMessage = messages.find((m) => m.role === 'assistant');

    if (!lastAssistantMessage) {
      throw new Error('No assistant message found to regenerate');
    }

    // Mark the old message as regenerated
    await ctx.db.patch(lastAssistantMessage._id, {
      metadata: {
        ...lastAssistantMessage.metadata,
        regenerated: true,
        regeneratedAt: Date.now(),
      },
    });

    // Delete the old assistant message
    await ctx.db.delete(lastAssistantMessage._id);

    return {
      success: true,
      deletedMessageId: lastAssistantMessage._id,
    };
  },
});

// Get single message by ID
export const getById = query({
  args: { id: v.id('messages') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create new message with subscription checking
export const create = mutation({
  args: {
    chatId: v.id('chats'),
    walletAddress: v.string(),
    role: v.union(
      v.literal('user'),
      v.literal('assistant'),
      v.literal('system')
    ),
    content: v.string(),
    attachments: v.optional(
      v.array(
        v.object({
          fileId: v.string(),
          url: v.optional(v.string()),
          mimeType: v.string(),
          size: v.number(),
          type: v.union(
            v.literal('image'),
            v.literal('file'),
            v.literal('video')
          ),
        })
      )
    ),
    tokenCount: v.optional(v.number()),
    embedding: v.optional(v.array(v.number())),
    metadata: v.optional(
      v.object({
        model: v.optional(v.string()),
        finishReason: v.optional(v.string()),
        usage: v.optional(
          v.object({
            inputTokens: v.number(),
            outputTokens: v.number(),
            totalTokens: v.number(),
          })
        ),
        tools: v.optional(
          v.array(
            v.object({
              id: v.string(),
              name: v.string(),
              args: v.record(
                v.string(),
                v.union(v.string(), v.number(), v.boolean(), v.null())
              ),
              result: v.optional(
                v.object({
                  success: v.boolean(),
                  data: v.optional(
                    v.record(
                      v.string(),
                      v.union(v.string(), v.number(), v.boolean(), v.null())
                    )
                  ),
                  error: v.optional(v.string()),
                  executionTime: v.optional(v.number()),
                })
              ),
            })
          )
        ),
        reasoning: v.optional(v.string()),
        citations: v.optional(v.array(v.string())), // Document IDs for RAG
      })
    ),
    status: v.optional(v.string()),
    parentMessageId: v.optional(v.id('messages')),
  },
  handler: async (ctx, args) => {
    // For user messages, check subscription limits (assistant/system messages bypass limits)
    if (args.role === 'user') {
      await ensureUserCanSendMessage(
        ctx,
        args.walletAddress,
        args.metadata?.model
      );
    }

    const now = Date.now();

    const messageId = await ctx.db.insert('messages', {
      chatId: args.chatId,
      walletAddress: args.walletAddress,
      role: args.role,
      content: args.content,
      // Store attachment reference IDs only in metadata to avoid large payloads
      metadata: {
        ...(args.metadata || {}),
        attachments: (args.attachments || []).map((a) => ({
          fileId: a.fileId,
          url: a.url,
          mimeType: a.mimeType,
          size: a.size,
          type: a.type,
        })),
      },
      tokenCount: args.tokenCount,
      embedding: args.embedding,
      status: args.status,
      parentMessageId: args.parentMessageId,
      createdAt: now,
    });

    // Update chat's last message timestamp and counters
    const tokenCount =
      args.tokenCount ?? args.metadata?.usage?.totalTokens ?? 0;
    await incrementChatCounters(ctx, args.chatId, now, tokenCount);

    // Check if we should auto-generate a title
    if (args.role === 'user') {
      await checkAndScheduleTitleGeneration(
        ctx,
        args.chatId,
        args.walletAddress
      );
    }

    return await ctx.db.get(messageId);
  },
});

// Helper: validate if a user can send a message, including premium model checks
async function ensureUserCanSendMessage(
  ctx: DatabaseReadContext,
  walletAddress: string,
  model?: string
): Promise<void> {
  const user = await ctx.db
    .query('users')
    .withIndex('by_wallet', (q) => q.eq('walletAddress', walletAddress))
    .unique();

  const subscription = user?.subscription;
  if (!subscription) {
    return;
  }

  const overMonthly =
    (subscription.messagesUsed ?? 0) >= (subscription.messagesLimit ?? 0);
  if (overMonthly) {
    throw new Error(
      'Monthly message limit reached. Please upgrade your subscription.'
    );
  }

  const premiumList = ['gpt-4o', 'claude-3.5-sonnet', 'claude-sonnet-4'];
  const isPremium = model ? premiumList.includes(model) : false;

  if (isPremium && subscription.tier === 'free') {
    throw new Error('Premium models require Pro or Pro+ subscription.');
  }

  if (
    isPremium &&
    (subscription.premiumMessagesUsed ?? 0) >=
      (subscription.premiumMessagesLimit ?? 0)
  ) {
    throw new Error(
      'Premium message quota exhausted. Please upgrade or wait for next billing cycle.'
    );
  }
}

// Helper: increment chat counters atomically and safely
async function incrementChatCounters(
  ctx: DatabaseWriteContext,
  chatId: Id<'chats'>,
  now: number,
  tokenIncrement: number
): Promise<void> {
  const chat = await ctx.db.get(chatId);
  const currentCount = Math.max(0, chat?.messageCount ?? 0);
  const currentTokens = Math.max(0, chat?.totalTokens ?? 0);

  await ctx.db.patch(chatId, {
    lastMessageAt: now,
    updatedAt: now,
    messageCount: currentCount + 1,
    totalTokens: currentTokens + tokenIncrement,
  });
}

// Helper: check if we should generate a title for the chat
async function checkAndScheduleTitleGeneration(
  ctx: DatabaseReadContext & { scheduler: any },
  chatId: Id<'chats'>,
  walletAddress: string
): Promise<void> {
  try {
    // Get the chat to check its title
    const chat = await ctx.db.get(chatId);
    if (!chat) {
      return;
    }

    // Check if title is already meaningful (not a default "New Chat" title)
    // Also check for other common default patterns
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
      // Title seems meaningful already
      return;
    }

    // Get the user to check their preferences
    const user = await ctx.db
      .query('users')
      .withIndex('by_wallet', (q) => q.eq('walletAddress', walletAddress))
      .unique();

    if (!user) {
      return;
    }

    // Get user preferences
    const preferences = await ctx.db
      .query('userPreferences')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    // Check if auto-create titles is enabled (default to true if not set)
    const autoCreateTitles = preferences?.autoCreateTitles !== false;

    if (!autoCreateTitles) {
      return;
    }

    // Check if this is the first meaningful user message in the chat
    const userMessages = await ctx.db
      .query('messages')
      .withIndex('by_chat', (q) => q.eq('chatId', chatId))
      .filter((q) => q.eq(q.field('role'), 'user'))
      .take(2); // Get first 2 to check if this is really the first

    // Only generate title after the first user message that has meaningful content
    if (userMessages.length === 1) {
      const firstMessage = userMessages[0];

      // Check if message has enough content to generate a title from
      if (!firstMessage.content || firstMessage.content.trim().length < 3) {
        return;
      }

      // Schedule the title generation as a background action
      // Use a slight delay to ensure the message is fully saved
      await ctx.scheduler.runAfter(2000, api.chats.generateAndUpdateTitle, {
        chatId,
        ownerId: user._id,
      });
    }
  } catch (_error) {}
}

// Update message content (for editing)
export const update = mutation({
  args: {
    id: v.id('messages'),
    content: v.string(),
    metadata: v.optional(
      v.object({
        model: v.optional(v.string()),
        tokensUsed: v.optional(v.number()),
        finishReason: v.optional(v.string()),
        processingTime: v.optional(v.number()),
        citations: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.id);

    if (!message) {
      throw new Error('Message not found');
    }

    await ctx.db.patch(args.id, {
      content: args.content,
      metadata: args.metadata || message.metadata,
    });

    return await ctx.db.get(args.id);
  },
});

// Delete message
export const remove = mutation({
  args: { id: v.id('messages') },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.id);

    if (!message) {
      throw new Error('Message not found');
    }

    await ctx.db.delete(args.id);

    return { success: true, messageId: args.id };
  },
});

// Get messages with citations (for RAG context)
export const getWithCitations = query({
  args: {
    chatId: v.id('chats'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50);

    const messages = await ctx.db
      .query('messages')
      .withIndex('by_chat', (q) => q.eq('chatId', args.chatId))
      .filter((q) => q.neq(q.field('metadata.citations'), undefined))
      .order('desc')
      .take(limit);

    // Get document details for citations
    const messagesWithDocuments = await Promise.all(
      messages.map(async (message) => {
        if (!message.metadata?.citations) {
          return { ...message, documents: [] };
        }

        const documents = await Promise.all(
          message.metadata.citations.map(async (docId) => {
            try {
              return await ctx.db.get(docId as Id<'documents'>);
            } catch {
              return null; // Document might have been deleted
            }
          })
        );

        return {
          ...message,
          documents: documents.filter((doc) => doc !== null),
        };
      })
    );

    return messagesWithDocuments.reverse(); // Chronological order
  },
});

// Get message statistics for a chat
export const getStats = query({
  args: { chatId: v.id('chats') },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_chat', (q) => q.eq('chatId', args.chatId))
      .collect();

    const userMessages = messages.filter((m) => m.role === 'user');
    const assistantMessages = messages.filter((m) => m.role === 'assistant');
    const systemMessages = messages.filter((m) => m.role === 'system');

    const totalTokens = messages.reduce(
      (sum, msg) => sum + (msg.metadata?.usage?.totalTokens || 0),
      0
    );

    const totalProcessingTime = assistantMessages.reduce((sum, msg) => {
      // Calculate processing time from tool execution times
      const toolExecutionTime =
        msg.metadata?.tools?.reduce(
          (toolSum, tool) => toolSum + (tool.result?.executionTime || 0),
          0
        ) || 0;
      return sum + toolExecutionTime;
    }, 0);

    const modelsUsed = new Set(
      assistantMessages
        .map((msg) => msg.metadata?.model)
        .filter((model) => model !== undefined)
    );

    const messagesWithCitations = messages.filter(
      (msg) => msg.metadata?.citations && msg.metadata.citations.length > 0
    );

    return {
      totalMessages: messages.length,
      userMessages: userMessages.length,
      assistantMessages: assistantMessages.length,
      systemMessages: systemMessages.length,
      totalTokens,
      averageTokensPerMessage:
        totalTokens / Math.max(assistantMessages.length, 1),
      totalProcessingTime,
      averageProcessingTime:
        totalProcessingTime / Math.max(assistantMessages.length, 1),
      modelsUsed: Array.from(modelsUsed),
      messagesWithCitations: messagesWithCitations.length,
      firstMessage:
        messages.length > 0
          ? Math.min(...messages.map((m) => m.createdAt))
          : null,
      lastMessage:
        messages.length > 0
          ? Math.max(...messages.map((m) => m.createdAt))
          : null,
    };
  },
});

// Get recent messages across all chats (for activity feed)
export const getRecent = query({
  args: {
    limit: v.optional(v.number()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50);

    // First get user's chats
    const userChats = await ctx.db
      .query('chats')
      .withIndex('by_owner', (q) => q.eq('ownerId', args.userId))
      .collect();

    const chatIds = userChats.map((chat) => chat._id);

    // Get recent messages from user's chats
    const recentMessages = await ctx.db
      .query('messages')
      .withIndex('by_timestamp')
      .order('desc')
      .filter((q) => {
        // Check if message belongs to user's chats
        return q.or(
          ...chatIds.map((chatId) => q.eq(q.field('chatId'), chatId))
        );
      })
      .take(limit);

    // Add chat titles to messages
    const messagesWithChatInfo = recentMessages.map((message) => {
      const chat = userChats.find((c) => c._id === message.chatId);
      return {
        ...message,
        chatTitle: chat?.title || 'Unknown Chat',
        chatModel: chat?.model || 'unknown',
      };
    });

    return messagesWithChatInfo;
  },
});
