/**
 * MCP Server Database Operations
 *
 * Convex database functions for managing MCP server configurations,
 * tool call logs, and server status tracking.
 */

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireAuth } from './authHelpers';
import { createModuleLogger } from './utils/logger';

// Create logger instance for this module
const logger = createModuleLogger('mcpServers');

// =============================================================================
// MCP Server Configuration Management
// =============================================================================

/**
 * Upsert MCP server configuration
 */
export const upsertServer = mutation({
  args: {
    userId: v.string(),
    serverId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    url: v.string(),
    apiKey: v.optional(v.string()),
    enabled: v.boolean(),
    tools: v.array(v.string()),
    status: v.union(
      v.literal('disconnected'),
      v.literal('connecting'),
      v.literal('connected'),
      v.literal('error'),
      v.literal('disabled')
    ),
    lastConnected: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if server already exists
    const existingServer = await ctx.db
      .query('mcpServers')
      .withIndex('by_server', (q) => q.eq('serverId', args.serverId))
      .first();

    const now = Date.now();

    if (existingServer) {
      // Update existing server
      await ctx.db.patch(existingServer._id, {
        name: args.name,
        description: args.description,
        url: args.url,
        apiKey: args.apiKey,
        enabled: args.enabled,
        tools: args.tools,
        status: args.status,
        lastConnected: args.lastConnected,
        errorMessage: args.errorMessage,
        updatedAt: now,
      });

      logger.info('MCP server configuration updated', {
        serverId: args.serverId,
        name: args.name,
        status: args.status,
      });

      return existingServer._id;
    }
    // Create new server
    const serverId = await ctx.db.insert('mcpServers', {
      userId: args.userId,
      serverId: args.serverId,
      name: args.name,
      description: args.description,
      url: args.url,
      apiKey: args.apiKey,
      enabled: args.enabled,
      tools: args.tools,
      status: args.status,
      lastConnected: args.lastConnected,
      errorMessage: args.errorMessage,
      createdAt: now,
      updatedAt: now,
    });

    logger.info('MCP server configuration created', {
      serverId: args.serverId,
      name: args.name,
      status: args.status,
    });

    return serverId;
  },
});

/**
 * Update server status
 */
export const updateServerStatus = mutation({
  args: {
    serverId: v.string(),
    status: v.union(
      v.literal('disconnected'),
      v.literal('connecting'),
      v.literal('connected'),
      v.literal('error'),
      v.literal('disabled')
    ),
    lastConnected: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const server = await ctx.db
      .query('mcpServers')
      .withIndex('by_server', (q) => q.eq('serverId', args.serverId))
      .first();

    if (!server) {
      throw new Error(`MCP server ${args.serverId} not found`);
    }

    await ctx.db.patch(server._id, {
      status: args.status,
      lastConnected: args.lastConnected,
      errorMessage: args.errorMessage,
      updatedAt: Date.now(),
    });

    logger.info('MCP server status updated', {
      serverId: args.serverId,
      name: server.name,
      status: args.status,
      errorMessage: args.errorMessage,
    });

    return server._id;
  },
});

/**
 * Get MCP servers for a user
 */
export const getServersByUser = query({
  args: {
    userId: v.string(),
    enabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query('mcpServers')
      .withIndex('by_user', (q) => q.eq('userId', args.userId));

    if (args.enabled !== undefined) {
      query = query.filter((q) => q.eq(q.field('enabled'), args.enabled));
    }

    const servers = await query.order('desc').collect();

    return servers.map((server) => ({
      _id: server._id,
      serverId: server.serverId,
      name: server.name,
      description: server.description,
      url: server.url,
      enabled: server.enabled,
      tools: server.tools,
      status: server.status,
      lastConnected: server.lastConnected,
      errorMessage: server.errorMessage,
      createdAt: server.createdAt,
      updatedAt: server.updatedAt,
    }));
  },
});

/**
 * Get MCP server by server ID
 */
export const getServerById = query({
  args: {
    serverId: v.string(),
  },
  handler: async (ctx, args) => {
    const server = await ctx.db
      .query('mcpServers')
      .withIndex('by_server', (q) => q.eq('serverId', args.serverId))
      .first();

    if (!server) {
      return null;
    }

    return {
      _id: server._id,
      serverId: server.serverId,
      name: server.name,
      description: server.description,
      url: server.url,
      enabled: server.enabled,
      tools: server.tools,
      status: server.status,
      lastConnected: server.lastConnected,
      errorMessage: server.errorMessage,
      createdAt: server.createdAt,
      updatedAt: server.updatedAt,
    };
  },
});

/**
 * Enable/disable MCP server
 */
export const toggleServer = mutation({
  args: {
    serverId: v.string(),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const server = await ctx.db
      .query('mcpServers')
      .withIndex('by_server', (q) => q.eq('serverId', args.serverId))
      .first();

    if (!server) {
      throw new Error(`MCP server ${args.serverId} not found`);
    }

    await ctx.db.patch(server._id, {
      enabled: args.enabled,
      status: args.enabled ? 'disconnected' : 'disabled',
      updatedAt: Date.now(),
    });

    logger.info('MCP server toggled', {
      serverId: args.serverId,
      name: server.name,
      enabled: args.enabled,
    });

    return server._id;
  },
});

/**
 * Delete MCP server
 */
export const deleteServer = mutation({
  args: {
    serverId: v.string(),
  },
  handler: async (ctx, args) => {
    const server = await ctx.db
      .query('mcpServers')
      .withIndex('by_server', (q) => q.eq('serverId', args.serverId))
      .first();

    if (!server) {
      throw new Error(`MCP server ${args.serverId} not found`);
    }

    await ctx.db.delete(server._id);

    // Also delete related tool call logs
    const toolCalls = await ctx.db
      .query('mcpToolCalls')
      .withIndex('by_server', (q) => q.eq('serverId', args.serverId))
      .collect();

    for (const toolCall of toolCalls) {
      await ctx.db.delete(toolCall._id);
    }

    logger.info('MCP server deleted', {
      serverId: args.serverId,
      name: server.name,
      toolCallsDeleted: toolCalls.length,
    });

    return server._id;
  },
});

// =============================================================================
// MCP Tool Call Logging
// =============================================================================

/**
 * Log MCP tool call execution
 */
export const logToolCall = mutation({
  args: {
    serverId: v.string(),
    toolName: v.string(),
    userId: v.string(),
    input: v.any(),
    output: v.optional(v.any()),
    success: v.boolean(),
    executionTime: v.number(),
    error: v.optional(
      v.object({
        code: v.string(),
        message: v.string(),
        details: v.optional(v.any()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const toolCallId = await ctx.db.insert('mcpToolCalls', {
      serverId: args.serverId,
      toolName: args.toolName,
      userId: args.userId,
      input: args.input,
      output: args.output,
      success: args.success,
      executionTime: args.executionTime,
      error: args.error,
      createdAt: Date.now(),
    });

    // Log based on success/failure
    if (args.success) {
      logger.debug('MCP tool call logged', {
        toolCallId,
        serverId: args.serverId,
        toolName: args.toolName,
        executionTime: args.executionTime,
      });
    } else {
      logger.warn('MCP tool call failed', {
        toolCallId,
        serverId: args.serverId,
        toolName: args.toolName,
        error: args.error?.message,
        executionTime: args.executionTime,
      });
    }

    return toolCallId;
  },
});

/**
 * Get MCP tool call history for a user
 */
export const getToolCallHistory = query({
  args: {
    userId: v.string(),
    serverId: v.optional(v.string()),
    toolName: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 200);

    let query = ctx.db
      .query('mcpToolCalls')
      .withIndex('by_user', (q) => q.eq('userId', args.userId));

    if (args.serverId) {
      query = ctx.db
        .query('mcpToolCalls')
        .withIndex('by_server', (q) => q.eq('serverId', args.serverId!))
        .filter((q) => q.eq(q.field('userId'), args.userId));
    }

    if (args.toolName) {
      query = query.filter((q) => q.eq(q.field('toolName'), args.toolName));
    }

    const toolCalls = await query.order('desc').take(limit);

    return toolCalls.map((call) => ({
      _id: call._id,
      serverId: call.serverId,
      toolName: call.toolName,
      input: call.input,
      output: call.output,
      success: call.success,
      executionTime: call.executionTime,
      error: call.error,
      createdAt: call.createdAt,
    }));
  },
});

/**
 * Get MCP tool call statistics
 */
export const getToolCallStats = query({
  args: {
    userId: v.string(),
    serverId: v.optional(v.string()),
    timeRange: v.optional(v.number()), // milliseconds from now
  },
  handler: async (ctx, args) => {
    const timeThreshold = args.timeRange ? Date.now() - args.timeRange : 0;

    let query = ctx.db
      .query('mcpToolCalls')
      .withIndex('by_user', (q) => q.eq('userId', args.userId));

    if (args.serverId) {
      query = ctx.db
        .query('mcpToolCalls')
        .withIndex('by_server', (q) => q.eq('serverId', args.serverId!))
        .filter((q) => q.eq(q.field('userId'), args.userId));
    }

    if (timeThreshold > 0) {
      query = query.filter((q) => q.gte(q.field('createdAt'), timeThreshold));
    }

    const toolCalls = await query.collect();

    // Calculate statistics
    const totalCalls = toolCalls.length;
    const successfulCalls = toolCalls.filter((call) => call.success).length;
    const failedCalls = totalCalls - successfulCalls;
    const averageExecutionTime =
      totalCalls > 0
        ? toolCalls.reduce((sum, call) => sum + call.executionTime, 0) /
          totalCalls
        : 0;

    // Tool usage breakdown
    const toolUsage: Record<
      string,
      { count: number; successRate: number; avgExecutionTime: number }
    > = {};

    for (const call of toolCalls) {
      if (!toolUsage[call.toolName]) {
        toolUsage[call.toolName] = {
          count: 0,
          successRate: 0,
          avgExecutionTime: 0,
        };
      }
      toolUsage[call.toolName].count++;
    }

    // Calculate success rates and average execution times
    for (const toolName of Object.keys(toolUsage)) {
      const toolCallsForTool = toolCalls.filter(
        (call) => call.toolName === toolName
      );
      const successful = toolCallsForTool.filter((call) => call.success).length;
      toolUsage[toolName].successRate =
        toolCallsForTool.length > 0
          ? (successful / toolCallsForTool.length) * 100
          : 0;
      toolUsage[toolName].avgExecutionTime =
        toolCallsForTool.length > 0
          ? toolCallsForTool.reduce(
              (sum, call) => sum + call.executionTime,
              0
            ) / toolCallsForTool.length
          : 0;
    }

    // Server usage breakdown
    const serverUsage: Record<string, { count: number; successRate: number }> =
      {};

    for (const call of toolCalls) {
      if (!serverUsage[call.serverId]) {
        serverUsage[call.serverId] = { count: 0, successRate: 0 };
      }
      serverUsage[call.serverId].count++;
    }

    // Calculate server success rates
    for (const serverId of Object.keys(serverUsage)) {
      const serverCalls = toolCalls.filter(
        (call) => call.serverId === serverId
      );
      const successful = serverCalls.filter((call) => call.success).length;
      serverUsage[serverId].successRate =
        serverCalls.length > 0 ? (successful / serverCalls.length) * 100 : 0;
    }

    return {
      overview: {
        totalCalls,
        successfulCalls,
        failedCalls,
        successRate: totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0,
        averageExecutionTime: Math.round(averageExecutionTime),
      },
      toolUsage,
      serverUsage,
      timeRange: args.timeRange,
      generatedAt: Date.now(),
    };
  },
});

// =============================================================================
// MCP Server Health & Monitoring
// =============================================================================

/**
 * Get MCP server health overview
 */
export const getServerHealthOverview = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const servers = await ctx.db
      .query('mcpServers')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    const healthData = {
      totalServers: servers.length,
      connectedServers: servers.filter((s) => s.status === 'connected').length,
      disconnectedServers: servers.filter((s) => s.status === 'disconnected')
        .length,
      errorServers: servers.filter((s) => s.status === 'error').length,
      disabledServers: servers.filter((s) => s.status === 'disabled').length,
      servers: servers.map((server) => ({
        name: server.name,
        status: server.status,
        lastConnected: server.lastConnected,
        errorMessage: server.errorMessage,
        toolCount: server.tools.length,
      })),
    };

    return healthData;
  },
});

/**
 * Get servers needing attention (errors or long disconnection)
 */
export const getServersNeedingAttention = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const servers = await ctx.db
      .query('mcpServers')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const needingAttention = servers.filter((server) => {
      // Server has error status
      if (server.status === 'error') return true;

      // Server is enabled but disconnected for more than 1 hour
      if (
        server.enabled &&
        server.status === 'disconnected' &&
        server.lastConnected &&
        server.lastConnected < oneHourAgo
      ) {
        return true;
      }

      return false;
    });

    return needingAttention.map((server) => ({
      serverId: server.serverId,
      name: server.name,
      status: server.status,
      lastConnected: server.lastConnected,
      errorMessage: server.errorMessage,
      issue: server.status === 'error' ? 'error' : 'long_disconnect',
    }));
  },
});

export default {
  upsertServer,
  updateServerStatus,
  getServersByUser,
  getServerById,
  toggleServer,
  deleteServer,
  logToolCall,
  getToolCallHistory,
  getToolCallStats,
  getServerHealthOverview,
  getServersNeedingAttention,
};
