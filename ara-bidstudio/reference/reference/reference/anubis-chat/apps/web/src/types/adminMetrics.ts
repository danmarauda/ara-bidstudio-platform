/**
 * Type definitions for admin metrics and dashboard
 */

import type { Id } from '@convex/_generated/dataModel';

// User metrics type returned from getUserTokenMetrics
export interface UserTokenMetrics {
  userId: Id<'users'>;
  walletAddress?: string;
  displayName?: string;
  subscription?: {
    tier?: 'free' | 'pro' | 'pro_plus';
    messagesUsed?: number;
    messagesLimit?: number;
    premiumMessagesUsed?: number;
    premiumMessagesLimit?: number;
  };
  metrics: {
    totalTokens: number;
    totalCost: number;
    totalCachedTokens: number;
    chatCount: number;
    messagesCount: number;
    averageTokensPerChat: number;
    averageTokensPerMessage: number;
    cacheSavingsRate: number;
  };
}

// Model usage statistics returned from getModelUsageStats
export interface ModelUsageStats {
  model: string;
  chatCount: number;
  messageCount: number;
  totalTokens: number;
  totalCost: number;
  averageTokensPerChat: number;
  averageTokensPerMessage: number;
  uniqueUsers: number;
}

// Token usage trends data point
export interface TokenUsageTrend {
  timestamp: number;
  tokens: number;
  cost: number;
  chats: number;
  messages: number;
}

// Subscription tier metrics returned from getCostBySubscriptionTier
export interface TierMetrics {
  tier: 'free' | 'pro' | 'pro_plus';
  userCount: number;
  totalTokens: number;
  totalCost: number;
  totalChats: number;
  averageCostPerUser: number;
  averageTokensPerUser: number;
}

// Chat token metrics for individual chats
export interface ChatTokenMetrics {
  chatId: Id<'chats'>;
  title: string;
  model: string;
  owner: {
    walletAddress?: string;
    displayName?: string;
  } | null;
  createdAt: number;
  lastMessageAt?: number;
  messageCount: number;
  tokenUsage: {
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalTokens: number;
    totalCachedTokens: number;
    totalEstimatedCost: number;
    messageCount: number;
  };
  efficiency: number;
}

// System-wide token usage metrics
export interface SystemTokenMetrics {
  totalTokens: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalCachedTokens: number;
  totalEstimatedCost: number;
  totalChatsWithUsage: number;
  averageTokensPerChat: number;
  averageTokensPerMessage: number;
  cacheSavingsRate: number;
  modelUsage: Record<
    string,
    {
      count: number;
      tokens: number;
      cost: number;
    }
  >;
}

// Export data result
export interface ExportResult {
  type: 'csv' | 'json';
  data: string;
  filename: string;
}
