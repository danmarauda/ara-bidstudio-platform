import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getCurrentUser, requireAuth } from './authHelpers';

// Query to get user by ID (for use in actions)
export const getUserById = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Get user by wallet address (used for streaming and legacy compatibility)
export const getUserByWallet = query({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Try to find user by wallet address
    const user = await ctx.db
      .query('users')
      .withIndex('by_wallet', (q) => q.eq('walletAddress', args.walletAddress))
      .first();

    return user;
  },
});

// Update user preferences (authenticated)
export const updatePreferences = mutation({
  args: {
    preferences: v.object({
      theme: v.union(v.literal('light'), v.literal('dark')),
      aiModel: v.string(),
      notifications: v.boolean(),
      language: v.optional(v.string()),
      temperature: v.optional(v.number()),
      maxTokens: v.optional(v.number()),
      streamResponses: v.optional(v.boolean()),
      saveHistory: v.optional(v.boolean()),
      compactMode: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuth(ctx);

    await ctx.db.patch(user._id, {
      preferences: {
        ...user.preferences,
        ...args.preferences,
      },
      lastActiveAt: Date.now(),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(user._id);
  },
});

// Update user profile (authenticated)
export const updateProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuth(ctx);

    await ctx.db.patch(user._id, {
      displayName: args.displayName ?? user.displayName,
      avatar: args.avatar ?? user.avatar,
      lastActiveAt: Date.now(),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(user._id);
  },
});

// Generate a presigned upload URL for avatar images (authenticated)
export const generateAvatarUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    // Clients will POST the (compressed) image blob to this URL.
    const url = await ctx.storage.generateUploadUrl();
    return url;
  },
});

// Save avatar from a Convex storageId by resolving to a public URL (authenticated)
export const setAvatarFromStorage = mutation({
  args: {
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuth(ctx);
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      return { success: false, error: 'Invalid storageId' } as const;
    }
    await ctx.db.patch(user._id, {
      avatar: url,
      updatedAt: Date.now(),
      lastActiveAt: Date.now(),
    });
    const updated = await ctx.db.get(user._id);
    return { success: true, user: updated } as const;
  },
});

// Get current user (authenticated)
export const getCurrentUserProfile = query({
  args: {},
  handler: async (ctx, _args) => {
    const user = await getCurrentUser(ctx);
    return user;
  },
});

// Get user usage statistics (authenticated)
export const getUsage = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      return null;
    }

    // Get usage for current month
    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).getTime();

    const usage = await ctx.db
      .query('usage')
      .withIndex('by_user', (q) =>
        q.eq('userId', user._id).gte('createdAt', startOfMonth)
      )
      .collect();

    const totalTokens = usage.reduce(
      (sum, record) => sum + record.tokensUsed,
      0
    );
    const totalCost = usage.reduce(
      (sum, record) => sum + (record.cost || 0),
      0
    );

    return {
      user: {
        walletAddress: user.walletAddress,
        displayName: user.displayName,
        subscription: user.subscription,
        createdAt: user.createdAt,
        lastActiveAt: user.lastActiveAt,
      },
      usage: {
        currentMonth: {
          tokens: totalTokens,
          cost: totalCost,
          requests: usage.length,
        },
        limit: user.subscription?.tokensLimit ?? 0,
        remaining: Math.max(
          0,
          (user.subscription?.tokensLimit ?? 0) -
            (user.subscription?.tokensUsed ?? 0)
        ),
      },
    };
  },
});

// Track token usage (authenticated user)
export const trackUsage = mutation({
  args: {
    operation: v.union(
      v.literal('completion'),
      v.literal('object_generation'),
      v.literal('stream'),
      v.literal('embedding'),
      v.literal('agent_execution'),
      v.literal('workflow_execution')
    ),
    model: v.string(),
    tokensUsed: v.number(),
    cost: v.optional(v.number()),
    duration: v.optional(v.number()),
    success: v.boolean(),
    metadata: v.optional(
      v.object({
        chatId: v.optional(v.id('chats')),
        messageId: v.optional(v.id('messages')),
        agentId: v.optional(v.id('agents')),
        workflowId: v.optional(v.id('workflows')),
        requestSize: v.optional(v.number()),
        responseSize: v.optional(v.number()),
        toolsUsed: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuth(ctx);

    // Record usage
    const usageId = await ctx.db.insert('usage', {
      userId: user._id,
      operation: args.operation,
      model: args.model,
      tokensUsed: args.tokensUsed,
      cost: args.cost,
      duration: args.duration,
      success: args.success,
      createdAt: Date.now(),
      metadata: args.metadata,
    });

    // Update user's token count
    await ctx.db.patch(user._id, {
      subscription: user.subscription
        ? {
            ...user.subscription,
            tokensUsed: (user.subscription.tokensUsed ?? 0) + args.tokensUsed,
          }
        : undefined,
      lastActiveAt: Date.now(),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(usageId);
  },
});

// Deactivate current user account (authenticated)
export const deactivateAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const { user } = await requireAuth(ctx);

    await ctx.db.patch(user._id, {
      isActive: false,
      lastActiveAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
