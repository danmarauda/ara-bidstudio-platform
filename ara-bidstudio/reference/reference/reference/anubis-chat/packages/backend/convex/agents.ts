/**
 * Convex Functions for Agentic AI System
 * Complete CRUD operations for agents, executions, and steps
 * Includes Solana blockchain-specific agent capabilities
 */

import { v } from 'convex/values';
import type { Doc } from './_generated/dataModel';
import { mutation, query } from './_generated/server';
import { requireAuth } from './authHelpers';
import { clearAgentCache } from './lib/agents/agentManager';
import { ANUBIS_OPTIMIZED_PROMPT, anubisAgent } from './lib/agents/anubisAgent';

// =============================================================================
// Agent Management
// =============================================================================

// Get agent by ID
export const getById = query({
  args: { id: v.id('agents') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get a specific agent by ID (alias for compatibility)
export const get = query({
  args: { id: v.id('agents') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// List all available agents for a user
// Includes both public agents and user's custom agents
export const list = query({
  args: {
    includePublic: v.optional(v.boolean()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agents: Doc<'agents'>[] = [];

    // Get public agents
    if (args.includePublic !== false) {
      const publicAgents = await ctx.db
        .query('agents')
        .withIndex('by_public', (q) =>
          q.eq('isPublic', true).eq('isActive', true)
        )
        .collect();
      agents.push(...publicAgents);
    }

    // Get user's custom agents
    if (args.userId) {
      const customAgents = await ctx.db
        .query('agents')
        .withIndex('by_creator', (q) => q.eq('createdBy', args.userId))
        .filter((q) => q.eq(q.field('isActive'), true))
        .collect();
      agents.push(...customAgents);
    }

    return agents.sort((a, b) => {
      // Sort by: public agents first, then by creation date
      if (a.isPublic && !b.isPublic) {
        return -1;
      }
      if (!a.isPublic && b.isPublic) {
        return 1;
      }
      return b.createdAt - a.createdAt;
    });
  },
});

// Get agents by owner (for upstream compatibility)
export const getByOwner = query({
  args: {
    walletAddress: v.string(),
    limit: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);

    let dbQuery = ctx.db
      .query('agents')
      .withIndex('by_creator', (q) => q.eq('createdBy', args.walletAddress));

    if (args.isActive !== undefined) {
      dbQuery = dbQuery.filter((q) => q.eq(q.field('isActive'), args.isActive));
    }

    return await dbQuery.order('desc').take(limit);
  },
});

// Create new agent
export const create = mutation({
  args: {
    name: v.string(),
    type: v.union(
      v.literal('general'),
      v.literal('trading'),
      v.literal('defi'),
      v.literal('nft'),
      v.literal('dao'),
      v.literal('portfolio'),
      v.literal('custom')
    ),
    description: v.string(),
    systemPrompt: v.string(),
    capabilities: v.array(v.string()),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    config: v.optional(
      v.object({
        rpcUrl: v.optional(v.string()),
        priorityFee: v.optional(v.number()),
        slippage: v.optional(v.number()),
        gasBudget: v.optional(v.number()),
      })
    ),
    mcpServers: v.optional(
      v.array(
        v.object({
          name: v.string(),
          enabled: v.boolean(),
          config: v.optional(
            v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))
          ),
        })
      )
    ),
    isPublic: v.optional(v.boolean()),
    createdBy: v.string(), // walletAddress
    tools: v.optional(v.array(v.string())), // For upstream compatibility
    maxSteps: v.optional(v.number()), // For upstream compatibility
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const agentId = await ctx.db.insert('agents', {
      name: args.name,
      type: args.type,
      description: args.description,
      systemPrompt: args.systemPrompt,
      capabilities: args.capabilities,
      temperature: args.temperature ?? 0.7,
      maxTokens: args.maxTokens,
      config: args.config,
      mcpServers: args.mcpServers,
      isActive: true,
      isPublic: args.isPublic ?? false,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(agentId);
  },
});

// Update agent
export const update = mutation({
  args: {
    id: v.id('agents'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    systemPrompt: v.optional(v.string()),
    capabilities: v.optional(v.array(v.string())),
    model: v.optional(v.string()),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    config: v.optional(
      v.object({
        rpcUrl: v.optional(v.string()),
        priorityFee: v.optional(v.number()),
        slippage: v.optional(v.number()),
        gasBudget: v.optional(v.number()),
      })
    ),
    mcpServers: v.optional(
      v.array(
        v.object({
          name: v.string(),
          enabled: v.boolean(),
          config: v.optional(
            v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))
          ),
        })
      )
    ),
    isActive: v.optional(v.boolean()),
    walletAddress: v.optional(v.string()), // For permission check
    tools: v.optional(v.array(v.string())), // For upstream compatibility
    maxSteps: v.optional(v.number()), // For upstream compatibility
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.id);

    if (!agent) {
      throw new Error('Agent not found');
    }

    // Check permissions if walletAddress provided
    if (args.walletAddress && agent.createdBy !== args.walletAddress) {
      throw new Error('Access denied');
    }

    const { id, walletAddress: _omitWallet, ...updates } = args;

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(id);
  },
});

// Delete agent
export const remove = mutation({
  args: {
    id: v.id('agents'),
    userId: v.string(), // walletAddress - only allow user to delete their own custom agents
    walletAddress: v.optional(v.string()), // Alias for upstream compatibility
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.id);

    if (!agent) {
      throw new Error('Agent not found');
    }

    const userWallet = args.userId || args.walletAddress;

    // Only allow deleting custom agents created by the user
    if (agent.isPublic || agent.createdBy !== userWallet) {
      throw new Error('Cannot delete this agent');
    }

    // Check if agent has active executions (from upstream)
    // If execution tables are not present in schema, skip active execution check gracefully
    let activeExecutions: Doc<'agentExecutions'>[] = [];
    try {
      activeExecutions = await ctx.db
        .query('agentExecutions')
        .withIndex('by_agent', (q) => q.eq('agentId', args.id))
        .filter((q) =>
          q.or(
            q.eq(q.field('status'), 'pending'),
            q.eq(q.field('status'), 'running'),
            q.eq(q.field('status'), 'waiting_approval')
          )
        )
        .collect();
    } catch {
      activeExecutions = [];
    }

    if (activeExecutions.length > 0) {
      throw new Error('Cannot delete agent with active executions');
    }

    await ctx.db.patch(args.id, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return { success: true, agentId: args.id };
  },
});

// List all public agents (admin view)
export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('agents')
      .withIndex('by_public', (q) => q.eq('isPublic', true))
      .order('desc')
      .collect();
  },
});

// Update public agent (admin only)
export const updatePublic = mutation({
  args: {
    id: v.id('agents'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    systemPrompt: v.optional(v.string()),
    model: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal('general'),
        v.literal('research'),
        v.literal('coding'),
        v.literal('analysis'),
        v.literal('trading'),
        v.literal('defi'),
        v.literal('nft'),
        v.literal('dao'),
        v.literal('portfolio'),
        v.literal('custom')
      )
    ),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.id);

    if (!agent) {
      throw new Error('Agent not found');
    }

    // Verify this is a public agent
    if (!agent.isPublic) {
      throw new Error('Can only update public agents');
    }

    // Admin authentication check
    const { user } = await requireAuth(ctx);
    if (!user.role || user.role === 'user') {
      throw new Error('Admin access required');
    }

    const { id, ...updates } = args;

    // Narrow type to the allowed agent type union
    type AllowedAgentType =
      | 'general'
      | 'trading'
      | 'defi'
      | 'nft'
      | 'dao'
      | 'portfolio'
      | 'custom';

    const allowedTypes: readonly AllowedAgentType[] = [
      'general',
      'trading',
      'defi',
      'nft',
      'dao',
      'portfolio',
      'custom',
    ] as const;

    const maybeType = (updates as { type?: string }).type;
    const normalizedType: AllowedAgentType | undefined = allowedTypes.includes(
      maybeType as AllowedAgentType
    )
      ? (maybeType as AllowedAgentType)
      : undefined;

    const { type: _omitType, ...rest } = updates as Record<string, unknown>;

    await ctx.db.patch(id, {
      ...(rest as Partial<Doc<'agents'>>),
      ...(normalizedType ? { type: normalizedType } : {}),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(id);
  },
});

// Update existing Anubis agent with improved prompt
export const updateAnubisAgent = mutation({
  args: {},
  handler: async (ctx) => {
    // Find the existing Anubis agent
    const existingAnubis = await ctx.db
      .query('agents')
      .withIndex('by_public', (q) => q.eq('isPublic', true))
      .filter((q) => q.eq(q.field('name'), 'Anubis'))
      .unique();

    if (!existingAnubis) {
      throw new Error('Anubis agent not found');
    }

    // Use the optimized system prompt from the agent configuration
    const improvedSystemPrompt = ANUBIS_OPTIMIZED_PROMPT;

    await ctx.db.patch(existingAnubis._id, {
      systemPrompt: improvedSystemPrompt,
      maxTokens: anubisAgent.maxTokens, // Also update max tokens
      updatedAt: Date.now(),
    });

    // Clear the agent cache to ensure fresh data
    clearAgentCache(existingAnubis._id);

    return 'Anubis agent updated successfully with optimized prompt';
  },
});

// Update all chats using Anubis agent with the new improved prompt
export const updateAllAnubisChats = mutation({
  args: {},
  handler: async (ctx) => {
    // Find the Anubis agent
    const anubisAgent = await ctx.db
      .query('agents')
      .withIndex('by_public', (q) => q.eq('isPublic', true))
      .filter((q) => q.eq(q.field('name'), 'Anubis'))
      .unique();

    if (!anubisAgent) {
      throw new Error('Anubis agent not found');
    }

    // Find all chats that have the Anubis agent selected
    const chatsWithAnubis = await ctx.db
      .query('chats')
      .filter((q) => q.eq(q.field('agentId'), anubisAgent._id))
      .collect();

    // Update each chat with the new agent prompt
    let updatedCount = 0;
    for (const chat of chatsWithAnubis) {
      await ctx.db.patch(chat._id, {
        agentPrompt: anubisAgent.systemPrompt,
        updatedAt: Date.now(),
      });
      updatedCount++;
    }

    return `Updated ${updatedCount} chats with new Anubis prompt`;
  },
});

// Initialize default public agents (run once)
export const initializeDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Check if agents already exist
    const existingAgents = await ctx.db
      .query('agents')
      .withIndex('by_public', (q) => q.eq('isPublic', true))
      .take(1);

    if (existingAgents.length > 0) {
      return 'Default agents already exist';
    }

    // Create only Anubis as the default public agent
    const defaultAgents: Array<
      Pick<
        Doc<'agents'>,
        | 'name'
        | 'type'
        | 'description'
        | 'systemPrompt'
        | 'capabilities'
        | 'temperature'
        | 'maxTokens'
      > & {
        isActive?: boolean;
        isPublic?: boolean;
        createdAt?: number;
        updatedAt?: number;
      }
    > = [
      {
        name: anubisAgent.name,
        type: anubisAgent.type,
        description: anubisAgent.description,
        systemPrompt: anubisAgent.systemPrompt,
        capabilities: anubisAgent.capabilities,
        temperature: anubisAgent.temperature,
        maxTokens: anubisAgent.maxTokens,
      },
    ];

    const inserted = await Promise.all(
      defaultAgents.map((agent) =>
        ctx.db.insert('agents', {
          ...agent,
          isActive: true,
          isPublic: true,
          createdAt: now,
          updatedAt: now,
        })
      )
    );

    const agentIds = inserted;

    return `Created ${agentIds.length} default agents`;
  },
});

// =============================================================================
// Agent Executions (from upstream)
// =============================================================================

// Create agent execution
export const createExecution = mutation({
  args: {
    agentId: v.id('agents'),
    walletAddress: v.string(),
    input: v.string(),
    metadata: v.optional(
      v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))
    ),
  },
  handler: async (ctx, args) => {
    // Verify agent exists and user has access
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    const executionId = await ctx.db.insert('agentExecutions', {
      agentId: args.agentId,
      walletAddress: args.walletAddress,
      status: 'pending',
      input: args.input,
      startedAt: Date.now(),
      metadata: args.metadata,
    });

    return await ctx.db.get(executionId);
  },
});

// Update execution status and result
export const updateExecution = mutation({
  args: {
    id: v.id('agentExecutions'),
    walletAddress: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('running'),
      v.literal('waiting_approval'),
      v.literal('completed'),
      v.literal('failed'),
      v.literal('cancelled')
    ),
    result: v.optional(
      v.object({
        success: v.boolean(),
        output: v.string(),
        finalStep: v.number(),
        totalSteps: v.number(),
        toolsUsed: v.array(v.string()),
        tokensUsed: v.object({
          input: v.number(),
          output: v.number(),
          total: v.number(),
        }),
        executionTime: v.number(),
      })
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const execution = await ctx.db.get(args.id);
    if (!execution || execution.walletAddress !== args.walletAddress) {
      throw new Error('Execution not found or access denied');
    }

    const updates: Partial<Doc<'agentExecutions'>> = {
      status: args.status,
    };

    if (args.result !== undefined) {
      updates.result = args.result;
    }
    if (args.error !== undefined) {
      updates.error = args.error;
    }

    if (['completed', 'failed', 'cancelled'].includes(args.status)) {
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.id, updates);
    return await ctx.db.get(args.id);
  },
});

// Get execution by ID
export const getExecutionById = query({
  args: { id: v.id('agentExecutions') },
  handler: async (ctx, args) => {
    const execution = await ctx.db.get(args.id);
    if (!execution) {
      return null;
    }

    // Get associated agent
    const agent = await ctx.db.get(execution.agentId);

    // Get execution steps
    const steps = await ctx.db
      .query('agentSteps')
      .withIndex('by_execution', (q) => q.eq('executionId', args.id))
      .order('asc')
      .collect();

    return {
      ...execution,
      agent,
      steps,
    };
  },
});

// Get executions by agent
export const getExecutionsByAgent = query({
  args: {
    agentId: v.id('agents'),
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);

    let dbQuery = ctx.db
      .query('agentExecutions')
      .withIndex('by_agent', (q) => q.eq('agentId', args.agentId));

    if (args.status) {
      dbQuery = dbQuery.filter((q) => q.eq(q.field('status'), args.status));
    }

    return await dbQuery.order('desc').take(limit);
  },
});

// Get user's executions
export const getUserExecutions = query({
  args: {
    walletAddress: v.string(),
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);

    let dbQuery = ctx.db
      .query('agentExecutions')
      .withIndex('by_user', (q) => q.eq('walletAddress', args.walletAddress));

    if (args.status) {
      dbQuery = dbQuery.filter((q) => q.eq(q.field('status'), args.status));
    }

    const executions = await dbQuery.order('desc').take(limit);

    // Add agent info to each execution
    const executionsWithAgents = await Promise.all(
      executions.map(async (execution) => {
        const agent = await ctx.db.get(execution.agentId);
        return {
          ...execution,
          agentName: agent?.name || 'Unknown Agent',
        };
      })
    );

    return executionsWithAgents;
  },
});

// =============================================================================
// Agent Steps
// =============================================================================

// Add step to execution
export const addStep = mutation({
  args: {
    executionId: v.id('agentExecutions'),
    stepNumber: v.number(),
    type: v.union(
      v.literal('reasoning'),
      v.literal('tool_call'),
      v.literal('parallel_tools'),
      v.literal('human_approval'),
      v.literal('workflow_step')
    ),
    input: v.optional(v.string()),
    toolCalls: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          parameters: v.record(
            v.string(),
            v.union(v.string(), v.number(), v.boolean(), v.null())
          ),
          requiresApproval: v.boolean(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const stepId = await ctx.db.insert('agentSteps', {
      executionId: args.executionId,
      stepNumber: args.stepNumber,
      type: args.type,
      status: 'pending',
      input: args.input,
      toolCalls: args.toolCalls,
      startedAt: Date.now(),
    });

    return await ctx.db.get(stepId);
  },
});

// Update step status and results
export const updateStep = mutation({
  args: {
    id: v.id('agentSteps'),
    status: v.union(
      v.literal('pending'),
      v.literal('running'),
      v.literal('completed'),
      v.literal('failed'),
      v.literal('waiting_approval')
    ),
    output: v.optional(v.string()),
    reasoning: v.optional(v.string()),
    toolResults: v.optional(
      v.array(
        v.object({
          id: v.string(),
          success: v.boolean(),
          result: v.record(
            v.string(),
            v.union(v.string(), v.number(), v.boolean())
          ),
          error: v.optional(
            v.object({
              code: v.string(),
              message: v.string(),
              details: v.optional(
                v.record(
                  v.string(),
                  v.union(v.string(), v.number(), v.boolean())
                )
              ),
              retryable: v.optional(v.boolean()),
            })
          ),
          executionTime: v.number(),
          metadata: v.optional(
            v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))
          ),
        })
      )
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Partial<Doc<'agentSteps'>> = {
      status: args.status,
    };

    if (args.output !== undefined) {
      updates.output = args.output;
    }
    if (args.reasoning !== undefined) {
      updates.reasoning = args.reasoning;
    }
    if (args.toolResults !== undefined) {
      updates.toolResults = args.toolResults;
    }
    if (args.error !== undefined) {
      updates.error = args.error;
    }

    if (['completed', 'failed'].includes(args.status)) {
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.id, updates);
    return await ctx.db.get(args.id);
  },
});

// Get agent statistics
export const getAgentStats = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const agents = await ctx.db
      .query('agents')
      .withIndex('by_creator', (q) => q.eq('createdBy', args.walletAddress))
      .collect();

    const activeAgents = agents.filter((agent) => agent.isActive);

    // Get execution counts
    let allExecutions: Doc<'agentExecutions'>[][] = [];
    try {
      allExecutions = await Promise.all(
        agents.map((agent) =>
          ctx.db
            .query('agentExecutions')
            .withIndex('by_agent', (q) => q.eq('agentId', agent._id))
            .collect()
        )
      );
    } catch {
      allExecutions = [];
    }

    const executions = allExecutions.flat();
    const completedExecutions = executions.filter(
      (exec) => exec.status === 'completed'
    );
    const failedExecutions = executions.filter(
      (exec) => exec.status === 'failed'
    );

    return {
      totalAgents: agents.length,
      activeAgents: activeAgents.length,
      totalExecutions: executions.length,
      completedExecutions: completedExecutions.length,
      failedExecutions: failedExecutions.length,
      successRate:
        executions.length > 0
          ? completedExecutions.length / executions.length
          : 0,
      averageExecutionTime:
        completedExecutions.length > 0
          ? completedExecutions
              .filter((exec) => exec.completedAt && exec.startedAt)
              .reduce(
                (sum, exec) => sum + ((exec.completedAt ?? 0) - exec.startedAt),
                0
              ) / completedExecutions.length
          : 0,
    };
  },
});

// =============================================================================
// Tool Registry Integration
// =============================================================================

/**
 * Get agent capabilities for tool registry integration
 */
export const getAgentCapabilities = query({
  args: {
    agentId: v.id('agents'),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      return {
        success: false,
        error: 'Agent not found',
        capabilities: [],
      };
    }

    return {
      success: true,
      capabilities: agent.capabilities || [],
      agentName: agent.name,
      agentType: agent.type,
    };
  },
});

/**
 * Update agent capabilities
 */
export const updateCapabilities = mutation({
  args: {
    agentId: v.id('agents'),
    capabilities: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    // Check ownership or admin permissions
    const actualUserId = typeof userId === 'string' ? userId : userId.userId;

    if (agent.createdBy !== actualUserId && !agent.isPublic) {
      throw new Error('Access denied: Cannot modify this agent');
    }

    await ctx.db.patch(args.agentId, {
      capabilities: args.capabilities,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: 'Agent capabilities updated successfully',
    };
  },
});
