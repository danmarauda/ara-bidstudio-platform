import { v } from 'convex/values';
import { query, mutation, action } from './_generated/server';
import { api } from './_generated/api';

// Legacy functions for backward compatibility
export const listNumbers = query({
  args: { count: v.number() },
  handler: async (ctx, args) => {
    const numbers = await ctx.db.query('numbers').order('desc').take(args.count);
    return {
      viewer: (await ctx.auth.getUserIdentity())?.subject ?? null,
      numbers: numbers.reverse().map((number) => number.value),
    };
  },
});

export const addNumber = mutation({
  args: { value: v.number() },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('numbers', { value: args.value });
    console.log('Added new document with id:', id);
    return id;
  },
});

// User Management
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .first();

    if (existing) {
      return existing._id;
    }

    const now = Date.now();
    return await ctx.db.insert('users', {
      ...args,
      preferences: {
        theme: 'system',
        language: 'en',
        notifications: true,
      },
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .first();
  },
});

// Agent Management
export const createAgent = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    model: v.string(),
    instructions: v.string(),
    tools: v.array(v.string()),
    config: v.optional(
      v.object({
        temperature: v.optional(v.number()),
        maxTokens: v.optional(v.number()),
        systemPrompt: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first();
    if (!user) throw new Error('User not found');

    const now = Date.now();
    return await ctx.db.insert('agents', {
      userId: user._id,
      ...args,
      isActive: true,
      config: args.config || {},
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const listAgents = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first();
    if (!user) return [];

    return await ctx.db
      .query('agents')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();
  },
});

// Conversation Management
export const createConversation = mutation({
  args: {
    agentId: v.id('agents'),
    title: v.string(),
    initialMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first();
    if (!user) throw new Error('User not found');

    const now = Date.now();
    const messages = args.initialMessage
      ? [
          {
            id: `msg_${now}`,
            role: 'user',
            content: args.initialMessage,
            timestamp: now,
          },
        ]
      : [];

    return await ctx.db.insert('conversations', {
      userId: user._id,
      agentId: args.agentId,
      title: args.title,
      messages,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const addMessage = mutation({
  args: {
    conversationId: v.id('conversations'),
    role: v.string(),
    content: v.string(),
    metadata: v.optional(
      v.object({
        toolCalls: v.optional(v.array(v.any())),
        tokenUsage: v.optional(
          v.object({
            prompt: v.number(),
            completion: v.number(),
            total: v.number(),
          }),
        ),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error('Conversation not found');

    const newMessage = {
      id: `msg_${Date.now()}`,
      role: args.role,
      content: args.content,
      timestamp: Date.now(),
      metadata: args.metadata,
    };

    await ctx.db.patch(args.conversationId, {
      messages: [...conversation.messages, newMessage],
      updatedAt: Date.now(),
    });

    return newMessage.id;
  },
});

export const getConversation = query({
  args: { conversationId: v.id('conversations') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.conversationId);
  },
});

// Workflow Management
export const createWorkflow = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    steps: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        type: v.string(),
        config: v.any(),
        dependencies: v.array(v.string()),
        status: v.string(),
      }),
    ),
    triggers: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first();
    if (!user) throw new Error('User not found');

    const now = Date.now();
    return await ctx.db.insert('workflows', {
      userId: user._id,
      name: args.name,
      description: args.description,
      steps: args.steps.map((step) => ({ ...step, status: 'pending' })),
      triggers: args.triggers || [],
      status: 'draft',
      executionCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const executeWorkflow = action({
  args: { workflowId: v.id('workflows'), input: v.any() },
  handler: async (ctx, args): Promise<{ executionId: any; results: any[] }> => {
    const workflow = await ctx.runQuery(api.myFunctions.getWorkflow, { workflowId: args.workflowId });
    if (!workflow) throw new Error('Workflow not found');

    // Create execution record
    const executionId = await ctx.runMutation(api.myFunctions.createWorkflowExecution, {
      workflowId: args.workflowId,
      input: args.input,
    });

    // Execute workflow steps (simplified implementation)
    const results = [];
    for (const step of workflow.steps) {
      try {
        await ctx.runMutation(api.myFunctions.updateWorkflowStep, {
          executionId,
          stepId: step.id,
          status: 'running',
        });

        // Execute step logic based on type
        const result = await executeWorkflowStep(step, args.input);

        await ctx.runMutation(api.myFunctions.updateWorkflowStep, {
          executionId,
          stepId: step.id,
          status: 'completed',
          result,
        });

        results.push(result);
      } catch (error) {
        await ctx.runMutation(api.myFunctions.updateWorkflowStep, {
          executionId,
          stepId: step.id,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    }

    await ctx.runMutation(api.myFunctions.completeWorkflowExecution, {
      executionId,
      output: results,
    });

    return { executionId, results };
  },
});

// Helper functions for workflow execution
async function executeWorkflowStep(step: any, input: any) {
  switch (step.type) {
    case 'data-query':
      return await queryConvexData(step.config);
    case 'ai-generate':
      return await generateWithAI(step.config, input);
    case 'api-call':
      return await callExternalAPI(step.config);
    default:
      throw new Error(`Unknown step type: ${step.type}`);
  }
}

async function queryConvexData(config: any) {
  // Implementation for querying Convex data
  return { data: [], count: 0 };
}

async function generateWithAI(config: any, input: any) {
  // Implementation for AI generation
  return { generated: 'Mock AI response' };
}

async function callExternalAPI(config: any) {
  // Implementation for external API calls
  return { response: 'Mock API response' };
}

// Additional workflow functions
export const getWorkflow = query({
  args: { workflowId: v.id('workflows') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.workflowId);
  },
});

export const createWorkflowExecution = mutation({
  args: {
    workflowId: v.id('workflows'),
    input: v.any(),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow) throw new Error('Workflow not found');

    const now = Date.now();
    const steps = workflow.steps.map((step) => ({
      stepId: step.id,
      status: 'pending',
    }));

    return await ctx.db.insert('workflowExecutions', {
      workflowId: args.workflowId,
      userId: workflow.userId,
      status: 'running',
      steps,
      input: args.input,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateWorkflowStep = mutation({
  args: {
    executionId: v.id('workflowExecutions'),
    stepId: v.string(),
    status: v.string(),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const execution = await ctx.db.get(args.executionId);
    if (!execution) throw new Error('Execution not found');

    const updatedSteps = execution.steps.map((step) =>
      step.stepId === args.stepId
        ? {
            ...step,
            status: args.status,
            ...(args.status === 'running' && { startedAt: Date.now() }),
            ...(args.status === 'completed' && { completedAt: Date.now(), result: args.result }),
            ...(args.status === 'failed' && { completedAt: Date.now(), error: args.error }),
          }
        : step,
    );

    await ctx.db.patch(args.executionId, {
      steps: updatedSteps,
      updatedAt: Date.now(),
    });
  },
});

export const completeWorkflowExecution = mutation({
  args: {
    executionId: v.id('workflowExecutions'),
    output: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.executionId, {
      status: 'completed',
      output: args.output,
      executionTime: Date.now() - (await ctx.db.get(args.executionId))!.createdAt,
      updatedAt: Date.now(),
    });
  },
});

// Analytics and tracking
export const trackEvent = mutation({
  args: {
    event: v.string(),
    category: v.string(),
    data: v.optional(v.any()),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first();
    if (!user) return;

    return await ctx.db.insert('analytics', {
      userId: user._id,
      event: args.event,
      category: args.category,
      data: args.data ?? {},
      sessionId: args.sessionId,
      timestamp: Date.now(),
    });
  },
});

// Memory and knowledge base
export const addMemory = mutation({
  args: {
    type: v.string(),
    content: v.string(),
    metadata: v.object({
      source: v.string(),
      confidence: v.number(),
      tags: v.array(v.string()),
      embedding: v.optional(v.array(v.number())),
    }),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first();
    if (!user) throw new Error('User not found');

    const now = Date.now();
    return await ctx.db.insert('memories', {
      userId: user._id,
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const searchMemories = query({
  args: {
    query: v.string(),
    type: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first();
    if (!user) return [];

    let memoryQuery = ctx.db.query('memories').withIndex('by_user', (q) => q.eq('userId', user._id));

    if (args.type) {
      memoryQuery = memoryQuery.filter((q) => q.eq(q.field('type'), args.type));
    }

    // Note: Advanced filtering would require vector search for embeddings
    // and more complex query patterns. This is a simplified implementation.

    return await memoryQuery.order('desc').take(args.limit || 10);
  },
});
