/**
 * Execution Tracking System for ANUBIS Chat
 *
 * This module provides comprehensive tracking and logging of agent tool executions,
 * including both regular tools and MCP server tools. It maintains execution history,
 * performance metrics, and provides analytics for agent behavior.
 *
 * Features:
 * - Real-time execution tracking with session context
 * - Performance metrics and analytics
 * - Error tracking and debugging support
 * - Tool usage patterns and statistics
 * - Agent behavior analysis
 * - Execution approval workflow support
 */

import { ConvexError, v } from 'convex/values';
import { api, internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import {
  type ActionCtx,
  action,
  internalMutation,
  internalQuery,
  type MutationCtx,
  mutation,
  type QueryCtx,
  query,
} from './_generated/server';
import type { ToolExecutionResult } from './toolRegistry';
import { createModuleLogger } from './utils/logger';

// Create logger instance for this module
const logger = createModuleLogger('executionTracking');

// =============================================================================
// Types and Interfaces
// =============================================================================

/**
 * Tool execution tracking entry
 */
export interface ToolExecution {
  id: string;
  sessionId: string;
  chatId: Id<'chats'>;
  messageId?: Id<'messages'>;
  agentId: Id<'agents'>;
  userId: string; // walletAddress
  toolName: string;
  toolType: 'regular' | 'mcp' | 'builtin';
  serverId?: string; // For MCP tools
  input: any;
  output?: any;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
  startTime: number;
  endTime?: number;
  executionTime?: number;
  metadata?: {
    model?: string;
    temperature?: number;
    tokenUsage?: {
      input: number;
      output: number;
      total: number;
    };
    retryCount?: number;
    parentExecutionId?: string;
    childExecutionIds?: string[];
    approvalRequired?: boolean;
    approvedBy?: string;
    approvalTime?: number;
  };
}

/**
 * Execution context for tracking
 */
export interface ExecutionContext {
  sessionId: string;
  chatId: Id<'chats'>;
  messageId?: Id<'messages'>;
  agentId: Id<'agents'>;
  userId: string;
  model?: string;
  temperature?: number;
}

/**
 * Execution analytics summary
 */
export interface ExecutionAnalytics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  toolUsageBreakdown: Record<
    string,
    {
      count: number;
      successRate: number;
      averageTime: number;
      lastUsed: number;
    }
  >;
  agentPerformance: Record<
    string,
    {
      executionCount: number;
      successRate: number;
      averageTime: number;
      mostUsedTools: string[];
    }
  >;
  errorPatterns: Record<
    string,
    {
      count: number;
      lastOccurred: number;
      affectedTools: string[];
    }
  >;
  timeSeriesData: Array<{
    timestamp: number;
    executions: number;
    successes: number;
    failures: number;
    averageTime: number;
  }>;
}

// =============================================================================
// Rate Limiting Configuration
// =============================================================================

interface RateLimitConfig {
  maxExecutionsPerMinute: number;
  maxExecutionsPerHour: number;
  maxConcurrentExecutions: number;
}

const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  maxExecutionsPerMinute: 60,
  maxExecutionsPerHour: 1000,
  maxConcurrentExecutions: 10,
};

// =============================================================================
// Execution Tracking Manager
// =============================================================================

class ExecutionTracker {
  private activeExecutions = new Map<string, ToolExecution>();
  private executionHistory = new Map<string, ToolExecution[]>();
  private performanceMetrics = new Map<string, number[]>();
  private rateLimitTracking = new Map<string, number[]>(); // userId -> timestamps
  private rateLimitConfig: RateLimitConfig = DEFAULT_RATE_LIMITS;

  /**
   * Check rate limits for a user
   */
  private checkRateLimits(userId: string): {
    allowed: boolean;
    reason?: string;
  } {
    const now = Date.now();
    const userTimestamps = this.rateLimitTracking.get(userId) || [];

    // Clean old timestamps
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentTimestamps = userTimestamps.filter((ts) => ts > oneHourAgo);

    // Check concurrent executions
    const activeUserExecutions = Array.from(
      this.activeExecutions.values()
    ).filter((e) => e.userId === userId && e.status === 'executing').length;

    if (activeUserExecutions >= this.rateLimitConfig.maxConcurrentExecutions) {
      return {
        allowed: false,
        reason: `Maximum concurrent executions (${this.rateLimitConfig.maxConcurrentExecutions}) reached`,
      };
    }

    // Check per-minute limit
    const oneMinuteAgo = now - 60 * 1000;
    const lastMinuteCount = recentTimestamps.filter(
      (ts) => ts > oneMinuteAgo
    ).length;

    if (lastMinuteCount >= this.rateLimitConfig.maxExecutionsPerMinute) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: ${this.rateLimitConfig.maxExecutionsPerMinute} executions per minute`,
      };
    }

    // Check per-hour limit
    if (recentTimestamps.length >= this.rateLimitConfig.maxExecutionsPerHour) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: ${this.rateLimitConfig.maxExecutionsPerHour} executions per hour`,
      };
    }

    return { allowed: true };
  }

  /**
   * Start tracking a tool execution
   */
  startExecution(
    context: ExecutionContext,
    toolName: string,
    input: any,
    toolType: 'regular' | 'mcp' | 'builtin' = 'regular',
    serverId?: string
  ): string {
    // Check rate limits
    const rateLimitCheck = this.checkRateLimits(context.userId);
    if (!rateLimitCheck.allowed) {
      throw new Error(`Rate limit exceeded: ${rateLimitCheck.reason}`);
    }

    const executionId = this.generateExecutionId();
    const startTime = Date.now();

    // Track for rate limiting
    const userTimestamps = this.rateLimitTracking.get(context.userId) || [];
    userTimestamps.push(startTime);
    this.rateLimitTracking.set(context.userId, userTimestamps);

    const execution: ToolExecution = {
      id: executionId,
      sessionId: context.sessionId,
      chatId: context.chatId,
      messageId: context.messageId,
      agentId: context.agentId,
      userId: context.userId,
      toolName,
      toolType,
      serverId,
      input,
      status: 'executing',
      startTime,
      metadata: {
        model: context.model,
        temperature: context.temperature,
      },
    };

    this.activeExecutions.set(executionId, execution);

    // Add to session history
    const sessionHistory = this.executionHistory.get(context.sessionId) || [];
    sessionHistory.push(execution);
    this.executionHistory.set(context.sessionId, sessionHistory);

    logger.info('Tool execution started', {
      executionId,
      toolName,
      toolType,
      sessionId: context.sessionId,
      agentId: context.agentId,
    });

    return executionId;
  }

  /**
   * Complete a tool execution
   */
  completeExecution(
    executionId: string,
    output: any,
    tokenUsage?: { input: number; output: number; total: number }
  ): void {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      logger.warn('Execution not found for completion', { executionId });
      return;
    }

    const endTime = Date.now();
    execution.status = 'completed';
    execution.output = output;
    execution.endTime = endTime;
    execution.executionTime = endTime - execution.startTime;

    if (tokenUsage && execution.metadata) {
      execution.metadata.tokenUsage = tokenUsage;
    }

    // Track performance metrics
    const metricsKey = `${execution.agentId}_${execution.toolName}`;
    const metrics = this.performanceMetrics.get(metricsKey) || [];
    metrics.push(execution.executionTime);
    this.performanceMetrics.set(metricsKey, metrics);

    this.activeExecutions.delete(executionId);

    logger.info('Tool execution completed', {
      executionId,
      toolName: execution.toolName,
      executionTime: execution.executionTime,
      tokenUsageTotal: tokenUsage?.total,
    });
  }

  /**
   * Fail a tool execution
   */
  failExecution(
    executionId: string,
    error: { code: string; message: string; stack?: string }
  ): void {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      logger.warn('Execution not found for failure', { executionId });
      return;
    }

    const endTime = Date.now();
    execution.status = 'failed';
    execution.error = error;
    execution.endTime = endTime;
    execution.executionTime = endTime - execution.startTime;

    this.activeExecutions.delete(executionId);

    logger.error('Tool execution failed', {
      executionId,
      toolName: execution.toolName,
      error: error.message,
      executionTime: execution.executionTime,
    });
  }

  /**
   * Get execution history for a session
   */
  getSessionHistory(sessionId: string): ToolExecution[] {
    return this.executionHistory.get(sessionId) || [];
  }

  /**
   * Get active executions
   */
  getActiveExecutions(): ToolExecution[] {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Calculate analytics for a time range
   */
  calculateAnalytics(
    startTime: number,
    endTime: number,
    agentId?: Id<'agents'>
  ): ExecutionAnalytics {
    const allExecutions: ToolExecution[] = [];

    // Collect all executions in time range
    for (const sessionExecutions of this.executionHistory.values()) {
      for (const execution of sessionExecutions) {
        if (
          execution.startTime >= startTime &&
          execution.startTime <= endTime &&
          (!agentId || execution.agentId === agentId)
        ) {
          allExecutions.push(execution);
        }
      }
    }

    // Calculate metrics
    const totalExecutions = allExecutions.length;
    const successfulExecutions = allExecutions.filter(
      (e) => e.status === 'completed'
    ).length;
    const failedExecutions = allExecutions.filter(
      (e) => e.status === 'failed'
    ).length;

    const totalTime = allExecutions
      .filter((e) => e.executionTime)
      .reduce((sum, e) => sum + (e.executionTime || 0), 0);

    const averageExecutionTime =
      totalExecutions > 0
        ? totalTime / allExecutions.filter((e) => e.executionTime).length
        : 0;

    // Tool usage breakdown
    const toolUsageBreakdown: Record<string, any> = {};
    for (const execution of allExecutions) {
      if (!toolUsageBreakdown[execution.toolName]) {
        toolUsageBreakdown[execution.toolName] = {
          count: 0,
          successes: 0,
          totalTime: 0,
          lastUsed: 0,
        };
      }

      const tool = toolUsageBreakdown[execution.toolName];
      tool.count++;
      if (execution.status === 'completed') tool.successes++;
      if (execution.executionTime) tool.totalTime += execution.executionTime;
      tool.lastUsed = Math.max(tool.lastUsed, execution.startTime);
    }

    // Convert to final format
    for (const toolName in toolUsageBreakdown) {
      const tool = toolUsageBreakdown[toolName];
      toolUsageBreakdown[toolName] = {
        count: tool.count,
        successRate: tool.count > 0 ? (tool.successes / tool.count) * 100 : 0,
        averageTime: tool.totalTime / Math.max(tool.count, 1),
        lastUsed: tool.lastUsed,
      };
    }

    // Agent performance
    const agentPerformance: Record<string, any> = {};
    for (const execution of allExecutions) {
      const agentKey = execution.agentId;
      if (!agentPerformance[agentKey]) {
        agentPerformance[agentKey] = {
          executionCount: 0,
          successes: 0,
          totalTime: 0,
          tools: new Set<string>(),
        };
      }

      const agent = agentPerformance[agentKey];
      agent.executionCount++;
      if (execution.status === 'completed') agent.successes++;
      if (execution.executionTime) agent.totalTime += execution.executionTime;
      agent.tools.add(execution.toolName);
    }

    // Convert agent performance to final format
    for (const agentKey in agentPerformance) {
      const agent = agentPerformance[agentKey];
      agentPerformance[agentKey] = {
        executionCount: agent.executionCount,
        successRate:
          agent.executionCount > 0
            ? (agent.successes / agent.executionCount) * 100
            : 0,
        averageTime: agent.totalTime / Math.max(agent.executionCount, 1),
        mostUsedTools: Array.from(agent.tools).slice(0, 5),
      };
    }

    // Error patterns
    const errorPatterns: Record<string, any> = {};
    for (const execution of allExecutions.filter(
      (e) => e.status === 'failed' && e.error
    )) {
      const errorCode = execution.error!.code;
      if (!errorPatterns[errorCode]) {
        errorPatterns[errorCode] = {
          count: 0,
          lastOccurred: 0,
          affectedTools: new Set<string>(),
        };
      }

      const error = errorPatterns[errorCode];
      error.count++;
      error.lastOccurred = Math.max(error.lastOccurred, execution.startTime);
      error.affectedTools.add(execution.toolName);
    }

    // Convert error patterns to final format
    for (const errorCode in errorPatterns) {
      const error = errorPatterns[errorCode];
      errorPatterns[errorCode] = {
        count: error.count,
        lastOccurred: error.lastOccurred,
        affectedTools: Array.from(error.affectedTools),
      };
    }

    // Generate time series data (hourly buckets)
    const timeSeriesData: Array<any> = [];
    const bucketSize = 60 * 60 * 1000; // 1 hour
    for (let time = startTime; time < endTime; time += bucketSize) {
      const bucketEnd = Math.min(time + bucketSize, endTime);
      const bucketExecutions = allExecutions.filter(
        (e) => e.startTime >= time && e.startTime < bucketEnd
      );

      if (bucketExecutions.length > 0) {
        const bucketSuccesses = bucketExecutions.filter(
          (e) => e.status === 'completed'
        ).length;
        const bucketFailures = bucketExecutions.filter(
          (e) => e.status === 'failed'
        ).length;
        const bucketTotalTime = bucketExecutions
          .filter((e) => e.executionTime)
          .reduce((sum, e) => sum + (e.executionTime || 0), 0);

        timeSeriesData.push({
          timestamp: time,
          executions: bucketExecutions.length,
          successes: bucketSuccesses,
          failures: bucketFailures,
          averageTime:
            bucketTotalTime /
            Math.max(bucketExecutions.filter((e) => e.executionTime).length, 1),
        });
      }
    }

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      averageExecutionTime,
      toolUsageBreakdown,
      agentPerformance,
      errorPatterns,
      timeSeriesData,
    };
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear old execution history
   */
  clearOldHistory(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoffTime = Date.now() - maxAge;

    for (const [sessionId, executions] of this.executionHistory.entries()) {
      const recentExecutions = executions.filter(
        (e) => e.startTime > cutoffTime
      );
      if (recentExecutions.length > 0) {
        this.executionHistory.set(sessionId, recentExecutions);
      } else {
        this.executionHistory.delete(sessionId);
      }
    }

    logger.info('Cleared old execution history', {
      remainingSessions: this.executionHistory.size,
    });
  }

  /**
   * Clean up memory and resources
   * This should be called periodically to prevent memory leaks
   */
  cleanup(): void {
    // Clear old history (older than 24 hours by default)
    this.clearOldHistory();

    // Clear completed executions from active map
    for (const [id, execution] of this.activeExecutions.entries()) {
      if (execution.status === 'completed' || execution.status === 'failed') {
        this.activeExecutions.delete(id);
      }
    }

    // Trim performance metrics to keep only recent data
    for (const [key, metrics] of this.performanceMetrics.entries()) {
      if (metrics.length > 100) {
        // Keep only last 100 metrics per key
        this.performanceMetrics.set(key, metrics.slice(-100));
      }
    }

    // Clean old rate limiting data (older than 1 hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [userId, timestamps] of this.rateLimitTracking.entries()) {
      const recentTimestamps = timestamps.filter((ts) => ts > oneHourAgo);
      if (recentTimestamps.length > 0) {
        this.rateLimitTracking.set(userId, recentTimestamps);
      } else {
        this.rateLimitTracking.delete(userId);
      }
    }

    logger.debug('ExecutionTracker cleanup completed', {
      activeExecutions: this.activeExecutions.size,
      sessionHistory: this.executionHistory.size,
      performanceMetrics: this.performanceMetrics.size,
      rateLimitTracking: this.rateLimitTracking.size,
    });
  }
}

// =============================================================================
// Global Execution Tracker Instance
// =============================================================================

export const globalExecutionTracker = new ExecutionTracker();

// =============================================================================
// Convex Database Functions
// =============================================================================

/**
 * Log tool execution to database
 */
export const logExecution = internalMutation({
  args: {
    executionId: v.string(),
    sessionId: v.string(),
    chatId: v.id('chats'),
    messageId: v.optional(v.id('messages')),
    agentId: v.id('agents'),
    userId: v.string(),
    toolName: v.string(),
    toolType: v.union(
      v.literal('regular'),
      v.literal('mcp'),
      v.literal('builtin')
    ),
    serverId: v.optional(v.string()),
    input: v.any(),
    output: v.optional(v.any()),
    status: v.union(
      v.literal('pending'),
      v.literal('executing'),
      v.literal('completed'),
      v.literal('failed'),
      v.literal('cancelled')
    ),
    error: v.optional(
      v.object({
        code: v.string(),
        message: v.string(),
        stack: v.optional(v.string()),
      })
    ),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    executionTime: v.optional(v.number()),
    tokenUsage: v.optional(
      v.object({
        input: v.number(),
        output: v.number(),
        total: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Store execution in agentToolExecutions table
    await ctx.db.insert('agentToolExecutions', {
      sessionId: args.sessionId,
      chatId: args.chatId,
      messageId: args.messageId,
      agentId: args.agentId,
      userId: args.userId,
      toolName: args.toolName,
      input: JSON.stringify(args.input),
      output: args.output ? JSON.stringify(args.output) : undefined,
      status: args.status,
      executionTimeMs: args.executionTime,
      error: args.error ? JSON.stringify(args.error) : undefined,
      metadata: {
        executionId: args.executionId,
        toolType: args.toolType,
        serverId: args.serverId,
        startTime: args.startTime,
        endTime: args.endTime,
        tokenUsage: args.tokenUsage,
      },
      createdAt: Date.now(),
    });

    logger.debug('Execution logged to database', {
      executionId: args.executionId,
      toolName: args.toolName,
      status: args.status,
    });
  },
});

/**
 * Get execution history for a chat
 */
export const getExecutionHistory = query({
  args: {
    chatId: v.id('chats'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);

    const executions = await ctx.db
      .query('agentToolExecutions')
      .withIndex('by_chat', (q) => q.eq('chatId', args.chatId))
      .order('desc')
      .take(limit);

    return executions.map((exec) => ({
      ...exec,
      input: exec.input ? JSON.parse(exec.input) : undefined,
      output: exec.output ? JSON.parse(exec.output) : undefined,
      error: exec.error ? JSON.parse(exec.error) : undefined,
    }));
  },
});

/**
 * Get execution analytics for an agent
 */
export const getAgentAnalytics = query({
  args: {
    agentId: v.id('agents'),
    timeRange: v.optional(v.number()), // milliseconds from now
  },
  handler: async (ctx, args) => {
    const cutoffTime = args.timeRange
      ? Date.now() - args.timeRange
      : Date.now() - 24 * 60 * 60 * 1000; // Default to last 24 hours

    const executions = await ctx.db
      .query('agentToolExecutions')
      .withIndex('by_agent', (q) => q.eq('agentId', args.agentId))
      .filter((q) => q.gte(q.field('createdAt'), cutoffTime))
      .collect();

    // Calculate statistics
    const totalExecutions = executions.length;
    const completedExecutions = executions.filter(
      (e) => e.status === 'completed'
    ).length;
    const failedExecutions = executions.filter(
      (e) => e.status === 'failed'
    ).length;

    const averageExecutionTime =
      executions
        .filter((e) => e.executionTimeMs)
        .reduce((sum, e) => sum + (e.executionTimeMs || 0), 0) /
      Math.max(executions.filter((e) => e.executionTimeMs).length, 1);

    // Tool usage breakdown
    const toolUsage: Record<string, number> = {};
    for (const exec of executions) {
      toolUsage[exec.toolName] = (toolUsage[exec.toolName] || 0) + 1;
    }

    // Most used tools
    const mostUsedTools = Object.entries(toolUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tool, count]) => ({ tool, count }));

    return {
      totalExecutions,
      completedExecutions,
      failedExecutions,
      successRate:
        totalExecutions > 0 ? (completedExecutions / totalExecutions) * 100 : 0,
      averageExecutionTime: Math.round(averageExecutionTime),
      mostUsedTools,
      timeRange: args.timeRange || 24 * 60 * 60 * 1000,
    };
  },
});

/**
 * Helper function to track execution
 */
async function trackExecutionHelper(
  ctx: ActionCtx,
  args: {
    context: {
      sessionId: string;
      chatId: Id<'chats'>;
      messageId?: Id<'messages'>;
      agentId: Id<'agents'>;
      userId: string;
      model?: string;
      temperature?: number;
    };
    toolName: string;
    input: any;
    toolType?: 'regular' | 'mcp' | 'builtin';
    serverId?: string;
  }
): Promise<string> {
  const executionId = globalExecutionTracker.startExecution(
    args.context,
    args.toolName,
    args.input,
    args.toolType || 'regular',
    args.serverId
  );

  // Log to database directly using mutation
  await ctx.runMutation(internal.executionTracking.logExecution, {
    executionId,
    sessionId: args.context.sessionId,
    chatId: args.context.chatId,
    messageId: args.context.messageId,
    agentId: args.context.agentId,
    userId: args.context.userId,
    toolName: args.toolName,
    toolType: args.toolType || 'regular',
    serverId: args.serverId,
    input: args.input,
    status: 'executing',
    startTime: Date.now(),
  });

  return executionId;
}

/**
 * Track tool execution in real-time
 */
export const trackExecution = action({
  args: {
    context: v.object({
      sessionId: v.string(),
      chatId: v.id('chats'),
      messageId: v.optional(v.id('messages')),
      agentId: v.id('agents'),
      userId: v.string(),
      model: v.optional(v.string()),
      temperature: v.optional(v.number()),
    }),
    toolName: v.string(),
    input: v.any(),
    toolType: v.optional(
      v.union(v.literal('regular'), v.literal('mcp'), v.literal('builtin'))
    ),
    serverId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<string> => {
    return await trackExecutionHelper(ctx, args);
  },
});

/**
 * Helper function to complete tracked execution
 */
async function completeTrackedExecutionHelper(
  ctx: ActionCtx,
  args: {
    executionId: string;
    output: any;
    tokenUsage?: {
      input: number;
      output: number;
      total: number;
    };
  }
): Promise<void> {
  globalExecutionTracker.completeExecution(
    args.executionId,
    args.output,
    args.tokenUsage
  );

  // Update database record
  const endTime = Date.now();
  const executions = globalExecutionTracker.getSessionHistory(args.executionId);
  const execution = executions.find((e) => e.id === args.executionId);

  if (execution) {
    await ctx.runMutation(internal.executionTracking.logExecution, {
      executionId: args.executionId,
      sessionId: execution.sessionId,
      chatId: execution.chatId,
      messageId: execution.messageId,
      agentId: execution.agentId,
      userId: execution.userId,
      toolName: execution.toolName,
      toolType: execution.toolType,
      serverId: execution.serverId,
      input: execution.input,
      output: args.output,
      status: 'completed',
      startTime: execution.startTime,
      endTime,
      executionTime: endTime - execution.startTime,
      tokenUsage: args.tokenUsage,
    });
  }
}

/**
 * Complete tracked execution
 */
export const completeTrackedExecution = action({
  args: {
    executionId: v.string(),
    output: v.any(),
    tokenUsage: v.optional(
      v.object({
        input: v.number(),
        output: v.number(),
        total: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    return await completeTrackedExecutionHelper(ctx, args);
  },
});

/**
 * Helper function to fail tracked execution
 */
async function failTrackedExecutionHelper(
  ctx: ActionCtx,
  args: {
    executionId: string;
    error: {
      code: string;
      message: string;
      stack?: string;
    };
  }
): Promise<void> {
  globalExecutionTracker.failExecution(args.executionId, args.error);

  // Update database record
  const endTime = Date.now();
  const executions = globalExecutionTracker.getSessionHistory(args.executionId);
  const execution = executions.find((e) => e.id === args.executionId);

  if (execution) {
    await ctx.runMutation(internal.executionTracking.logExecution, {
      executionId: args.executionId,
      sessionId: execution.sessionId,
      chatId: execution.chatId,
      messageId: execution.messageId,
      agentId: execution.agentId,
      userId: execution.userId,
      toolName: execution.toolName,
      toolType: execution.toolType,
      serverId: execution.serverId,
      input: execution.input,
      status: 'failed',
      error: args.error,
      startTime: execution.startTime,
      endTime,
      executionTime: endTime - execution.startTime,
    });
  }
}

/**
 * Fail tracked execution
 */
export const failTrackedExecution = action({
  args: {
    executionId: v.string(),
    error: v.object({
      code: v.string(),
      message: v.string(),
      stack: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    return await failTrackedExecutionHelper(ctx, args);
  },
});

/**
 * Get real-time execution status
 */
export const getExecutionStatus = action({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const activeExecutions = globalExecutionTracker
      .getActiveExecutions()
      .filter((e) => e.sessionId === args.sessionId);

    const sessionHistory = globalExecutionTracker.getSessionHistory(
      args.sessionId
    );

    return {
      activeExecutions: activeExecutions.map((e) => ({
        id: e.id,
        toolName: e.toolName,
        status: e.status,
        startTime: e.startTime,
        elapsedTime: Date.now() - e.startTime,
      })),
      recentExecutions: sessionHistory.slice(-10).map((e) => ({
        id: e.id,
        toolName: e.toolName,
        status: e.status,
        executionTime: e.executionTime,
        error: e.error?.message,
      })),
      totalExecutions: sessionHistory.length,
    };
  },
});

/**
 * Get comprehensive analytics
 */
export const getComprehensiveAnalytics = action({
  args: {
    startTime: v.number(),
    endTime: v.number(),
    agentId: v.optional(v.id('agents')),
  },
  handler: async (ctx, args) => {
    return globalExecutionTracker.calculateAnalytics(
      args.startTime,
      args.endTime,
      args.agentId
    );
  },
});

/**
 * Helper function to clean up old execution history
 */
async function cleanupExecutionHistoryHelper(
  ctx: ActionCtx,
  args: {
    maxAge?: number;
  }
): Promise<{ deletedCount: number; maxAge: number }> {
  const maxAge = args.maxAge || 24 * 60 * 60 * 1000; // Default 24 hours
  globalExecutionTracker.clearOldHistory(maxAge);

  // Also clean up database records
  const cutoffTime = Date.now() - maxAge;
  const oldExecutions = await ctx.runQuery(
    internal.executionTracking.getOldExecutions,
    {
      cutoffTime,
    }
  );

  // Batch delete operations for efficiency
  const deletePromises = oldExecutions.map((exec) =>
    ctx.runMutation(internal.executionTracking.deleteExecution, {
      id: exec._id,
    })
  );

  await Promise.all(deletePromises);

  logger.info('Cleaned up execution history', {
    deletedCount: oldExecutions.length,
    maxAge,
  });

  return {
    deletedCount: oldExecutions.length,
    maxAge,
  };
}

/**
 * Clean up old execution history
 */
export const cleanupExecutionHistory = action({
  args: {
    maxAge: v.optional(v.number()), // milliseconds
  },
  handler: async (ctx, args) => {
    return await cleanupExecutionHistoryHelper(ctx, args);
  },
});

// =============================================================================
// Internal Helper Functions
// =============================================================================

export const getOldExecutions = internalQuery({
  args: {
    cutoffTime: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.cutoffTime < 0 || args.cutoffTime > Date.now()) {
      throw new ConvexError({
        code: 'INVALID_CUTOFF_TIME',
        message: 'Cutoff time must be a valid timestamp in the past',
      });
    }

    return await ctx.db
      .query('agentToolExecutions')
      .filter((q) => q.lt(q.field('createdAt'), args.cutoffTime))
      .take(100); // Process in batches
  },
});

export const deleteExecution = internalMutation({
  args: {
    id: v.id('agentToolExecutions'),
  },
  handler: async (ctx, args) => {
    const execution = await ctx.db.get(args.id);
    if (!execution) {
      throw new ConvexError({
        code: 'EXECUTION_NOT_FOUND',
        message: `Execution with id ${args.id} not found`,
      });
    }

    await ctx.db.delete(args.id);
  },
});

// =============================================================================
// Export for Integration
// =============================================================================

/**
 * Execution Tracking Module Exports
 *
 * This module provides comprehensive tracking and analytics for agent tool executions.
 * It includes real-time tracking, performance metrics, error handling, and rate limiting.
 *
 * Key Features:
 * - Real-time execution tracking with session context
 * - Performance metrics and analytics calculation
 * - Error tracking and debugging support
 * - Rate limiting to prevent abuse
 * - Memory management and cleanup
 * - Database persistence with Convex integration
 *
 * Usage:
 * ```typescript
 * import executionTracking from './executionTracking';
 *
 * // Track a tool execution
 * const executionId = await executionTracking.trackExecution({
 *   context: { sessionId, chatId, agentId, userId },
 *   toolName: 'webSearch',
 *   input: { query: 'example' }
 * });
 *
 * // Complete the execution
 * await executionTracking.completeTrackedExecution({
 *   executionId,
 *   output: result,
 *   tokenUsage: { input: 100, output: 200, total: 300 }
 * });
 * ```
 *
 * @see {@link ToolExecution} for execution data structure
 * @see {@link ExecutionAnalytics} for analytics format
 * @see {@link ExecutionContext} for execution context requirements
 */
export default {
  globalExecutionTracker,
  trackExecution,
  completeTrackedExecution,
  failTrackedExecution,
  getExecutionStatus,
  getExecutionHistory,
  getAgentAnalytics,
  getComprehensiveAnalytics,
  cleanupExecutionHistory,
};

// Export rate limiting configuration for reference
export { DEFAULT_RATE_LIMITS, type RateLimitConfig };
