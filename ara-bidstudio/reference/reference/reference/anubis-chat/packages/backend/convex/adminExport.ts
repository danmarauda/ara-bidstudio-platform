/**
 * Admin data export functionality
 * Allows admins to export metrics and analytics data
 */

import { v } from 'convex/values';
import { api } from './_generated/api';
import { action } from './_generated/server';

/**
 * Export token usage metrics as CSV
 */
export const exportTokenMetrics = action({
  args: {
    timeRange: v.optional(
      v.union(
        v.literal('24h'),
        v.literal('7d'),
        v.literal('30d'),
        v.literal('all')
      )
    ),
    format: v.optional(v.union(v.literal('csv'), v.literal('json'))),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ type: string; data: string; filename: string }> => {
    // Verify admin access
    const adminCheck = await ctx.runQuery(
      api.adminAuth.checkCurrentUserAdminStatus
    );
    if (!adminCheck?.isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }

    const format = args.format || 'csv';

    // Get metrics data
    const metrics = await ctx.runQuery(api.adminMetrics.getTokenUsageMetrics, {
      timeRange: args.timeRange,
    });

    const userMetrics = await ctx.runQuery(
      api.adminMetrics.getUserTokenMetrics,
      {
        limit: 1000,
        sortBy: 'tokens',
      }
    );

    if (format === 'json') {
      return {
        type: 'json',
        data: JSON.stringify({ metrics, userMetrics }, null, 2),
        filename: `token-metrics-${new Date().toISOString()}.json`,
      };
    }

    // Generate CSV
    const csvLines: string[] = [];

    // System metrics section
    csvLines.push('SYSTEM METRICS');
    csvLines.push('Metric,Value');
    csvLines.push(`Total Tokens,${metrics.totalTokens}`);
    csvLines.push(`Total Prompt Tokens,${metrics.totalPromptTokens}`);
    csvLines.push(`Total Completion Tokens,${metrics.totalCompletionTokens}`);
    csvLines.push(`Total Cached Tokens,${metrics.totalCachedTokens}`);
    csvLines.push(
      `Total Estimated Cost,$${metrics.totalEstimatedCost.toFixed(2)}`
    );
    csvLines.push(`Cache Savings Rate,${metrics.cacheSavingsRate}%`);
    csvLines.push(`Average Tokens per Chat,${metrics.averageTokensPerChat}`);
    csvLines.push(
      `Average Tokens per Message,${metrics.averageTokensPerMessage}`
    );
    csvLines.push(`Total Chats with Usage,${metrics.totalChatsWithUsage}`);
    csvLines.push('');

    // User metrics section
    csvLines.push('USER METRICS');
    csvLines.push(
      'Wallet Address,Display Name,Tier,Total Tokens,Total Cost,Chats,Messages,Avg per Chat,Avg per Message,Cache Rate'
    );

    for (const user of userMetrics) {
      csvLines.push(
        [
          user.walletAddress || 'N/A',
          user.displayName || 'Anonymous',
          user.subscription?.tier || 'free',
          user.metrics.totalTokens,
          `$${user.metrics.totalCost.toFixed(3)}`,
          user.metrics.chatCount,
          user.metrics.messagesCount,
          user.metrics.averageTokensPerChat,
          user.metrics.averageTokensPerMessage,
          `${user.metrics.cacheSavingsRate}%`,
        ].join(',')
      );
    }

    return {
      type: 'csv',
      data: csvLines.join('\n'),
      filename: `token-metrics-${new Date().toISOString()}.csv`,
    };
  },
});

/**
 * Export model usage statistics as CSV
 */
export const exportModelStats = action({
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
  handler: async (
    ctx,
    args
  ): Promise<{ type: string; data: string; filename: string }> => {
    // Verify admin access
    const adminCheck = await ctx.runQuery(
      api.adminAuth.checkCurrentUserAdminStatus
    );
    if (!adminCheck?.isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }

    // Get model stats
    const modelStats = await ctx.runQuery(api.adminMetrics.getModelUsageStats, {
      timeRange: args.timeRange,
    });

    // Generate CSV
    const csvLines: string[] = [];
    csvLines.push(
      'Model,Chats,Messages,Total Tokens,Total Cost,Avg per Message,Unique Users'
    );

    for (const model of modelStats) {
      csvLines.push(
        [
          model.model,
          model.chatCount,
          model.messageCount,
          model.totalTokens,
          `$${model.totalCost.toFixed(3)}`,
          model.averageTokensPerMessage,
          model.uniqueUsers,
        ].join(',')
      );
    }

    return {
      type: 'csv',
      data: csvLines.join('\n'),
      filename: `model-stats-${new Date().toISOString()}.csv`,
    };
  },
});

/**
 * Export subscription tier analysis
 */
export const exportTierAnalysis = action({
  args: {},
  handler: async (
    ctx
  ): Promise<{ type: string; data: string; filename: string }> => {
    // Verify admin access
    const adminCheck = await ctx.runQuery(
      api.adminAuth.checkCurrentUserAdminStatus
    );
    if (!adminCheck?.isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }

    // Get tier metrics
    const tierMetrics = await ctx.runQuery(
      api.adminMetrics.getCostBySubscriptionTier
    );

    // Generate CSV
    const csvLines: string[] = [];
    csvLines.push(
      'Tier,Users,Total Tokens,Total Cost,Total Chats,Avg Cost per User,Avg Tokens per User'
    );

    for (const tier of tierMetrics) {
      csvLines.push(
        [
          tier.tier,
          tier.userCount,
          tier.totalTokens,
          `$${tier.totalCost.toFixed(2)}`,
          tier.totalChats,
          `$${tier.averageCostPerUser.toFixed(3)}`,
          tier.averageTokensPerUser,
        ].join(',')
      );
    }

    return {
      type: 'csv',
      data: csvLines.join('\n'),
      filename: `tier-analysis-${new Date().toISOString()}.csv`,
    };
  },
});
