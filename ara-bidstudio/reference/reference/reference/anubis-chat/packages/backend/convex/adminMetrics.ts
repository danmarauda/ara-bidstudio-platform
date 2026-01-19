/**
 * Admin metrics and analytics API
 * Comprehensive token usage, chat analytics, and system metrics
 */

import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';
import { query } from './_generated/server';
import { requireAdmin } from './authHelpers';

/**
 * Get system-wide token usage metrics
 */
export const getTokenUsageMetrics = query({
  args: {
    timeRange: v.optional(
      v.union(
        v.literal('24h'),
        v.literal('7d'),
        v.literal('30d'),
        v.literal('all')
      )
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const timeRange = args.timeRange || '7d';
    const now = Date.now();
    const startTime = (() => {
      switch (timeRange) {
        case '24h':
          return now - 24 * 60 * 60 * 1000;
        case '7d':
          return now - 7 * 24 * 60 * 60 * 1000;
        case '30d':
          return now - 30 * 24 * 60 * 60 * 1000;
        default:
          return 0;
      }
    })();

    // Get all chats with token usage
    const chats = await ctx.db
      .query('chats')
      .filter((q) => q.gte(q.field('createdAt'), startTime))
      .collect();

    // Calculate aggregate metrics
    const metrics = {
      totalTokens: 0,
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalCachedTokens: 0,
      totalEstimatedCost: 0,
      totalChatsWithUsage: 0,
      averageTokensPerChat: 0,
      averageTokensPerMessage: 0,
      cacheSavingsRate: 0,
      modelUsage: {} as Record<
        string,
        {
          count: number;
          tokens: number;
          cost: number;
        }
      >,
    };

    for (const chat of chats) {
      if (chat.tokenUsage) {
        metrics.totalTokens += chat.tokenUsage.totalTokens;
        metrics.totalPromptTokens += chat.tokenUsage.totalPromptTokens;
        metrics.totalCompletionTokens += chat.tokenUsage.totalCompletionTokens;
        metrics.totalCachedTokens += chat.tokenUsage.totalCachedTokens;
        metrics.totalEstimatedCost += chat.tokenUsage.totalEstimatedCost;
        metrics.totalChatsWithUsage++;

        // Track model-specific usage
        const model = chat.model || 'unknown';
        if (!metrics.modelUsage[model]) {
          metrics.modelUsage[model] = { count: 0, tokens: 0, cost: 0 };
        }
        metrics.modelUsage[model].count++;
        metrics.modelUsage[model].tokens += chat.tokenUsage.totalTokens;
        metrics.modelUsage[model].cost += chat.tokenUsage.totalEstimatedCost;
      }
    }

    // Calculate averages
    if (metrics.totalChatsWithUsage > 0) {
      metrics.averageTokensPerChat = Math.round(
        metrics.totalTokens / metrics.totalChatsWithUsage
      );

      // Get total message count for average calculation
      const totalMessages = await ctx.db
        .query('messages')
        .filter((q) => q.gte(q.field('createdAt'), startTime))
        .collect()
        .then((msgs) => msgs.length);

      if (totalMessages > 0) {
        metrics.averageTokensPerMessage = Math.round(
          metrics.totalTokens / totalMessages
        );
      }
    }

    // Calculate cache savings rate
    if (metrics.totalPromptTokens > 0) {
      metrics.cacheSavingsRate = Math.round(
        (metrics.totalCachedTokens / metrics.totalPromptTokens) * 100
      );
    }

    return metrics;
  },
});

/**
 * Get user-specific token usage breakdown
 */
export const getUserTokenMetrics = query({
  args: {
    limit: v.optional(v.number()),
    sortBy: v.optional(
      v.union(v.literal('tokens'), v.literal('cost'), v.literal('chats'))
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const limit = Math.min(args.limit || 50, 100);
    const sortBy = args.sortBy || 'tokens';

    // Get all users
    const users = await ctx.db.query('users').collect();

    // Build user metrics
    const userMetrics = await Promise.all(
      users.map(async (user) => {
        // Get user's chats
        const userChats = await ctx.db
          .query('chats')
          .withIndex('by_owner', (q) => q.eq('ownerId', user._id))
          .collect();

        let totalTokens = 0;
        let totalCost = 0;
        let totalCachedTokens = 0;
        let chatCount = 0;
        let messagesCount = 0;

        for (const chat of userChats) {
          if (chat.tokenUsage) {
            totalTokens += chat.tokenUsage.totalTokens;
            totalCost += chat.tokenUsage.totalEstimatedCost;
            totalCachedTokens += chat.tokenUsage.totalCachedTokens;
            messagesCount += chat.tokenUsage.messageCount;
            chatCount++;
          }
        }

        return {
          userId: user._id,
          walletAddress: user.walletAddress,
          displayName: user.displayName,
          subscription: user.subscription,
          metrics: {
            totalTokens,
            totalCost,
            totalCachedTokens,
            chatCount,
            messagesCount,
            averageTokensPerChat:
              chatCount > 0 ? Math.round(totalTokens / chatCount) : 0,
            averageTokensPerMessage:
              messagesCount > 0 ? Math.round(totalTokens / messagesCount) : 0,
            cacheSavingsRate:
              totalTokens > 0
                ? Math.round((totalCachedTokens / totalTokens) * 100)
                : 0,
          },
        };
      })
    );

    // Sort based on criteria
    userMetrics.sort((a, b) => {
      switch (sortBy) {
        case 'cost':
          return b.metrics.totalCost - a.metrics.totalCost;
        case 'chats':
          return b.metrics.chatCount - a.metrics.chatCount;
        default:
          return b.metrics.totalTokens - a.metrics.totalTokens;
      }
    });

    return userMetrics.slice(0, limit);
  },
});

/**
 * Get chat-level token usage details with pagination
 */
export const getChatTokenMetrics = query({
  args: {
    userId: v.optional(v.id('users')),
    includeEmpty: v.optional(v.boolean()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Filter by user if specified
    const chatsQuery = args.userId
      ? ctx.db
          .query('chats')
          .withIndex('by_owner', (q) => q.eq('ownerId', args.userId!))
      : ctx.db.query('chats');

    // Apply pagination
    const paginatedChats = await chatsQuery
      .order('desc')
      .paginate(args.paginationOpts);

    // Build chat metrics
    const chatMetrics = await Promise.all(
      paginatedChats.page
        .filter((chat) => args.includeEmpty || chat.tokenUsage)
        .map(async (chat) => {
          // Get owner info by wallet address
          const owner = await ctx.db
            .query('users')
            .withIndex('by_wallet', (q) => q.eq('walletAddress', chat.ownerId))
            .unique();

          // Get message count
          const messageCount = await ctx.db
            .query('messages')
            .withIndex('by_chat', (q) => q.eq('chatId', chat._id))
            .collect()
            .then((msgs) => msgs.length);

          return {
            chatId: chat._id,
            title: chat.title,
            model: chat.model,
            owner: owner
              ? {
                  walletAddress: owner.walletAddress,
                  displayName: owner.displayName,
                }
              : null,
            createdAt: chat.createdAt,
            lastMessageAt: chat.lastMessageAt,
            messageCount,
            tokenUsage: chat.tokenUsage || {
              totalPromptTokens: 0,
              totalCompletionTokens: 0,
              totalTokens: 0,
              totalCachedTokens: 0,
              totalEstimatedCost: 0,
              messageCount: 0,
            },
            efficiency:
              chat.tokenUsage && messageCount > 0
                ? Math.round(chat.tokenUsage.totalTokens / messageCount)
                : 0,
          };
        })
    );

    return {
      ...paginatedChats,
      page: chatMetrics,
    };
  },
});

/**
 * Get model usage statistics
 */
export const getModelUsageStats = query({
  args: {
    timeRange: v.optional(
      v.union(
        v.literal('24h'),
        v.literal('7d'),
        v.literal('30d'),
        v.literal('all')
      )
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const timeRange = args.timeRange || '7d';
    const now = Date.now();
    const startTime = (() => {
      switch (timeRange) {
        case '24h':
          return now - 24 * 60 * 60 * 1000;
        case '7d':
          return now - 7 * 24 * 60 * 60 * 1000;
        case '30d':
          return now - 30 * 24 * 60 * 60 * 1000;
        default:
          return 0;
      }
    })();

    // Get all chats in time range
    const chats = await ctx.db
      .query('chats')
      .filter((q) => q.gte(q.field('createdAt'), startTime))
      .collect();

    // Aggregate by model
    const modelStats: Record<
      string,
      {
        model: string;
        chatCount: number;
        messageCount: number;
        totalTokens: number;
        totalCost: number;
        averageTokensPerChat: number;
        averageTokensPerMessage: number;
        users: Set<string>;
      }
    > = {};

    for (const chat of chats) {
      const model = chat.model || 'unknown';

      if (!modelStats[model]) {
        modelStats[model] = {
          model,
          chatCount: 0,
          messageCount: 0,
          totalTokens: 0,
          totalCost: 0,
          averageTokensPerChat: 0,
          averageTokensPerMessage: 0,
          users: new Set(),
        };
      }

      modelStats[model].chatCount++;
      modelStats[model].users.add(chat.ownerId);

      if (chat.tokenUsage) {
        modelStats[model].totalTokens += chat.tokenUsage.totalTokens;
        modelStats[model].totalCost += chat.tokenUsage.totalEstimatedCost;
        modelStats[model].messageCount += chat.tokenUsage.messageCount;
      }
    }

    // Calculate averages and format
    const formattedStats = Object.values(modelStats).map((stat) => ({
      model: stat.model,
      chatCount: stat.chatCount,
      messageCount: stat.messageCount,
      totalTokens: stat.totalTokens,
      totalCost: stat.totalCost,
      averageTokensPerChat:
        stat.chatCount > 0 ? Math.round(stat.totalTokens / stat.chatCount) : 0,
      averageTokensPerMessage:
        stat.messageCount > 0
          ? Math.round(stat.totalTokens / stat.messageCount)
          : 0,
      uniqueUsers: stat.users.size,
    }));

    // Sort by total tokens
    formattedStats.sort((a, b) => b.totalTokens - a.totalTokens);

    return formattedStats;
  },
});

/**
 * Get token usage trends over time
 */
export const getTokenUsageTrends = query({
  args: {
    period: v.optional(
      v.union(v.literal('hour'), v.literal('day'), v.literal('week'))
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const period = args.period || 'day';
    const limit = Math.min(args.limit || 30, 90);

    // Calculate time buckets
    const now = Date.now();
    const bucketSize = (() => {
      switch (period) {
        case 'hour':
          return 60 * 60 * 1000;
        case 'week':
          return 7 * 24 * 60 * 60 * 1000;
        default:
          return 24 * 60 * 60 * 1000;
      }
    })();

    const startTime = now - limit * bucketSize;

    // Get all chats in time range
    const chats = await ctx.db
      .query('chats')
      .filter((q) => q.gte(q.field('createdAt'), startTime))
      .collect();

    // Group by time bucket
    const buckets: Record<
      number,
      {
        timestamp: number;
        tokens: number;
        cost: number;
        chats: number;
        messages: number;
      }
    > = {};

    for (const chat of chats) {
      const bucketKey = Math.floor(chat.createdAt / bucketSize) * bucketSize;

      if (!buckets[bucketKey]) {
        buckets[bucketKey] = {
          timestamp: bucketKey,
          tokens: 0,
          cost: 0,
          chats: 0,
          messages: 0,
        };
      }

      buckets[bucketKey].chats++;

      if (chat.tokenUsage) {
        buckets[bucketKey].tokens += chat.tokenUsage.totalTokens;
        buckets[bucketKey].cost += chat.tokenUsage.totalEstimatedCost;
        buckets[bucketKey].messages += chat.tokenUsage.messageCount;
      }
    }

    // Convert to array and sort
    const trends = Object.values(buckets)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-limit);

    return {
      period,
      data: trends,
    };
  },
});

/**
 * Get cost breakdown by subscription tier
 */
export const getCostBySubscriptionTier = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    // Get all users with their subscription info
    const users = await ctx.db.query('users').collect();

    // Initialize tier metrics
    const tierMetrics: Record<
      string,
      {
        tier: string;
        userCount: number;
        totalTokens: number;
        totalCost: number;
        totalChats: number;
        averageCostPerUser: number;
        averageTokensPerUser: number;
      }
    > = {
      free: {
        tier: 'free',
        userCount: 0,
        totalTokens: 0,
        totalCost: 0,
        totalChats: 0,
        averageCostPerUser: 0,
        averageTokensPerUser: 0,
      },
      pro: {
        tier: 'pro',
        userCount: 0,
        totalTokens: 0,
        totalCost: 0,
        totalChats: 0,
        averageCostPerUser: 0,
        averageTokensPerUser: 0,
      },
      pro_plus: {
        tier: 'pro_plus',
        userCount: 0,
        totalTokens: 0,
        totalCost: 0,
        totalChats: 0,
        averageCostPerUser: 0,
        averageTokensPerUser: 0,
      },
    };

    // Process each user
    for (const user of users) {
      const tier = user.subscription?.tier || 'free';
      tierMetrics[tier].userCount++;

      // Get user's chats
      const userChats = await ctx.db
        .query('chats')
        .withIndex('by_owner', (q) => q.eq('ownerId', user._id))
        .collect();

      for (const chat of userChats) {
        tierMetrics[tier].totalChats++;

        if (chat.tokenUsage) {
          tierMetrics[tier].totalTokens += chat.tokenUsage.totalTokens;
          tierMetrics[tier].totalCost += chat.tokenUsage.totalEstimatedCost;
        }
      }
    }

    // Calculate averages
    for (const tier of Object.values(tierMetrics)) {
      if (tier.userCount > 0) {
        tier.averageCostPerUser = tier.totalCost / tier.userCount;
        tier.averageTokensPerUser = Math.round(
          tier.totalTokens / tier.userCount
        );
      }
    }

    return Object.values(tierMetrics);
  },
});
