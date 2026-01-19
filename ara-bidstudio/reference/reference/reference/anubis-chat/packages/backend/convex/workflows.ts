/**
 * Convex Functions for Workflow Management System
 * Complete CRUD operations for workflows, steps, triggers, and executions
 */

import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server';

// Helpers to normalize records to satisfy schema constraints
function toStringNumberBooleanRecord(
  input: Record<string, string | number | boolean | null> | undefined
): Record<string, string | number | boolean> {
  const output: Record<string, string | number | boolean> = {};
  if (!input) {
    return output;
  }
  for (const [key, value] of Object.entries(input)) {
    if (value === null) {
      continue;
    }
    output[key] = value;
  }
  return output;
}

function toStringNumberRecord(
  input: Record<string, string | number | boolean | null> | undefined
): Record<string, string | number> | undefined {
  if (!input) {
    return;
  }
  const output: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === null) {
      continue;
    }
    if (typeof value === 'boolean') {
      output[key] = value ? 1 : 0;
    } else {
      output[key] = value;
    }
  }
  return output;
}

// =============================================================================
// Workflow Management
// =============================================================================

// Visual workflow node and edge types
export interface VisualNodeData {
  nodeId: string;
  nodeType: string;
  position: { x: number; y: number };
  data: {
    type: string;
    label: string;
    description?: string;
    icon?: string;
    config?: Record<string, unknown>;
    parameters?: Record<string, unknown>;
  };
}

export interface VisualEdgeData {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  animated?: boolean;
  style?: Record<string, unknown>;
}

// Get workflow by ID
export const getById = query({
  args: { id: v.id('workflows') },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.id);
    if (!workflow) {
      return null;
    }

    // Get workflow steps
    const steps = await ctx.db
      .query('workflowSteps')
      .withIndex('by_workflow', (q) => q.eq('workflowId', args.id))
      .order('asc')
      .collect();

    // Get workflow triggers
    const triggers = await ctx.db
      .query('workflowTriggers')
      .withIndex('by_workflow', (q) => q.eq('workflowId', args.id))
      .collect();

    return {
      ...workflow,
      steps,
      triggers,
    };
  },
});

// Get workflows by owner
export const getByOwner = query({
  args: {
    walletAddress: v.string(),
    limit: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);

    let dbQuery = ctx.db
      .query('workflows')
      .withIndex('by_owner', (q) => q.eq('walletAddress', args.walletAddress));

    if (args.isActive !== undefined) {
      dbQuery = dbQuery.filter((q) => q.eq(q.field('isActive'), args.isActive));
    }

    return await dbQuery.order('desc').take(limit);
  },
});

// Create new workflow
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    walletAddress: v.string(),
    steps: v.array(
      v.object({
        stepId: v.string(),
        name: v.string(),
        type: v.union(
          v.literal('agent_task'),
          v.literal('condition'),
          v.literal('parallel'),
          v.literal('sequential'),
          v.literal('human_approval'),
          v.literal('delay'),
          v.literal('webhook')
        ),
        agentId: v.optional(v.id('agents')),
        condition: v.optional(v.string()),
        parameters: v.optional(
          v.record(
            v.string(),
            v.union(v.string(), v.number(), v.boolean(), v.null())
          )
        ),
        nextSteps: v.optional(v.array(v.string())),
        requiresApproval: v.optional(v.boolean()),
        order: v.number(),
      })
    ),
    triggers: v.optional(
      v.array(
        v.object({
          triggerId: v.string(),
          type: v.union(
            v.literal('manual'),
            v.literal('schedule'),
            v.literal('webhook'),
            v.literal('completion'),
            v.literal('condition')
          ),
          condition: v.string(),
          parameters: v.optional(
            v.record(
              v.string(),
              v.union(v.string(), v.number(), v.boolean(), v.null())
            )
          ),
          isActive: v.boolean(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Create workflow
    const workflowId = await ctx.db.insert('workflows', {
      name: args.name,
      description: args.description,
      walletAddress: args.walletAddress,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Create workflow steps
    await Promise.all(
      args.steps.map((step) =>
        ctx.db.insert('workflowSteps', {
          workflowId,
          stepId: step.stepId,
          name: step.name,
          type: 'task',
          position: step.order,
          config: toStringNumberBooleanRecord({
            originalType: step.type,
            agentId: step.agentId ? String(step.agentId) : null,
            condition: step.condition ?? null,
            // Store presence of parameters rather than object
            parameters: step.parameters ? 1 : 0,
            // Store count for nextSteps instead of array
            nextSteps: Array.isArray(step.nextSteps)
              ? step.nextSteps.length
              : 0,
            requiresApproval: step.requiresApproval ?? null,
          }),
          createdAt: now,
          updatedAt: now,
          order: step.order,
        })
      )
    );

    // Create workflow triggers
    if (args.triggers) {
      await Promise.all(
        args.triggers.map((trigger) =>
          ctx.db.insert('workflowTriggers', {
            workflowId,
            triggerId: trigger.triggerId,
            type: trigger.type,
            condition: trigger.condition,
            parameters: trigger.parameters,
            isActive: trigger.isActive,
          })
        )
      );
    }

    return await ctx.db.get(workflowId);
  },
});

// Update workflow
export const update = mutation({
  args: {
    id: v.id('workflows'),
    walletAddress: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.id);

    if (!workflow || workflow.walletAddress !== args.walletAddress) {
      throw new Error('Workflow not found or access denied');
    }

    const updates: Partial<Doc<'workflows'>> = { updatedAt: Date.now() };

    if (args.name !== undefined) {
      updates.name = args.name;
    }
    if (args.description !== undefined) {
      updates.description = args.description;
    }
    if (args.isActive !== undefined) {
      updates.isActive = args.isActive;
    }

    await ctx.db.patch(args.id, updates);
    return await ctx.db.get(args.id);
  },
});

// Delete workflow and related data
export const remove = mutation({
  args: {
    id: v.id('workflows'),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.id);

    if (!workflow || workflow.walletAddress !== args.walletAddress) {
      throw new Error('Workflow not found or access denied');
    }

    // Check for active executions
    const activeExecutions = await ctx.db
      .query('workflowExecutions')
      .withIndex('by_workflow', (q) => q.eq('workflowId', args.id))
      .filter((q) =>
        q.or(
          q.eq(q.field('status'), 'pending'),
          q.eq(q.field('status'), 'running'),
          q.eq(q.field('status'), 'waiting_approval')
        )
      )
      .collect();

    if (activeExecutions.length > 0) {
      throw new Error('Cannot delete workflow with active executions');
    }

    // Delete workflow steps
    const steps = await ctx.db
      .query('workflowSteps')
      .withIndex('by_workflow', (q) => q.eq('workflowId', args.id))
      .collect();

    await Promise.all(steps.map((step) => ctx.db.delete(step._id)));

    // Delete workflow triggers
    const triggers = await ctx.db
      .query('workflowTriggers')
      .withIndex('by_workflow', (q) => q.eq('workflowId', args.id))
      .collect();

    await Promise.all(triggers.map((trigger) => ctx.db.delete(trigger._id)));

    // Delete the workflow
    await ctx.db.delete(args.id);

    return { success: true, workflowId: args.id };
  },
});

// =============================================================================
// Workflow Executions
// =============================================================================

// Create workflow execution
export const createExecution = mutation({
  args: {
    workflowId: v.id('workflows'),
    walletAddress: v.string(),
    variables: v.optional(
      v.record(
        v.string(),
        v.union(v.string(), v.number(), v.boolean(), v.null())
      )
    ),
  },
  handler: async (ctx, args) => {
    // Verify workflow exists and user has access
    const workflow = await ctx.db.get(args.workflowId);
    if (!workflow || workflow.walletAddress !== args.walletAddress) {
      throw new Error('Workflow not found or access denied');
    }

    if (!workflow.isActive) {
      throw new Error('Cannot execute inactive workflow');
    }

    const executionId = await ctx.db.insert('workflowExecutions', {
      workflowId: args.workflowId,
      walletAddress: args.walletAddress,
      status: 'pending',
      currentStep: '',
      variables: args.variables,
      startedAt: Date.now(),
    });

    return await ctx.db.get(executionId);
  },
});

// Update execution status
export const updateExecution = mutation({
  args: {
    id: v.id('workflowExecutions'),
    walletAddress: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('running'),
      v.literal('waiting_approval'),
      v.literal('completed'),
      v.literal('failed'),
      v.literal('cancelled')
    ),
    currentStep: v.optional(v.string()),
    variables: v.optional(
      v.record(
        v.string(),
        v.union(v.string(), v.number(), v.boolean(), v.null())
      )
    ),
    error: v.optional(
      v.object({
        stepId: v.string(),
        code: v.string(),
        message: v.string(),
        details: v.optional(
          v.record(
            v.string(),
            v.union(v.string(), v.number(), v.boolean(), v.null())
          )
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const execution = await ctx.db.get(args.id);
    if (!execution || execution.walletAddress !== args.walletAddress) {
      throw new Error('Execution not found or access denied');
    }

    const updates: Partial<Doc<'workflowExecutions'>> = {
      status: args.status,
    };

    if (args.currentStep !== undefined) {
      updates.currentStep = args.currentStep;
    }
    if (args.variables !== undefined) {
      updates.variables = args.variables;
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
  args: { id: v.id('workflowExecutions') },
  handler: async (ctx, args) => {
    const execution = await ctx.db.get(args.id);
    if (!execution) {
      return null;
    }

    // Get associated workflow
    const workflow = await ctx.db.get(execution.workflowId);

    // Get step results
    const stepResults = await ctx.db
      .query('workflowStepResults')
      .withIndex('by_execution', (q) => q.eq('executionId', args.id))
      .collect();

    return {
      ...execution,
      workflow,
      stepResults,
    };
  },
});

// Get executions by workflow
export const getExecutionsByWorkflow = query({
  args: {
    workflowId: v.id('workflows'),
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);

    let dbQuery = ctx.db
      .query('workflowExecutions')
      .withIndex('by_workflow', (q) => q.eq('workflowId', args.workflowId));

    if (args.status) {
      dbQuery = dbQuery.filter((q) => q.eq(q.field('status'), args.status));
    }

    return await dbQuery.order('desc').take(limit);
  },
});

// =============================================================================
// Workflow Step Results
// =============================================================================

// Add or update step result
export const updateStepResult = mutation({
  args: {
    executionId: v.id('workflowExecutions'),
    stepId: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('running'),
      v.literal('completed'),
      v.literal('failed'),
      v.literal('waiting_approval')
    ),
    output: v.optional(
      v.record(
        v.string(),
        v.union(v.string(), v.number(), v.boolean(), v.null())
      )
    ),
    error: v.optional(v.string()),
    retryCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if step result already exists
    const existing = await ctx.db
      .query('workflowStepResults')
      .withIndex('by_execution', (q) => q.eq('executionId', args.executionId))
      .filter((q) => q.eq(q.field('stepId'), args.stepId))
      .unique();

    const now = Date.now();

    if (existing) {
      // Update existing step result
      const updates: Partial<Doc<'workflowStepResults'>> = {
        status: args.status,
      };

      if (args.output !== undefined) {
        updates.output = args.output;
      }
      if (args.error !== undefined) {
        updates.error = args.error;
      }
      if (args.retryCount !== undefined) {
        updates.retryCount = args.retryCount;
      }

      if (['completed', 'failed'].includes(args.status)) {
        updates.completedAt = now;
      }

      await ctx.db.patch(existing._id, updates);
      return await ctx.db.get(existing._id);
    }
    // Create new step result
    const stepResultId = await ctx.db.insert('workflowStepResults', {
      executionId: args.executionId,
      stepId: args.stepId,
      status: args.status,
      output: args.output,
      error: args.error,
      retryCount: args.retryCount || 0,
      startedAt: now,
      completedAt: ['completed', 'failed'].includes(args.status)
        ? now
        : undefined,
    });

    return await ctx.db.get(stepResultId);
  },
});

// =============================================================================
// Analytics and Statistics
// =============================================================================

// Get workflow statistics
export const getWorkflowStats = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const workflows = await ctx.db
      .query('workflows')
      .withIndex('by_owner', (q) => q.eq('walletAddress', args.walletAddress))
      .collect();

    const activeWorkflows = workflows.filter((workflow) => workflow.isActive);

    // Get execution counts
    const allExecutions = await Promise.all(
      workflows.map((workflow) =>
        ctx.db
          .query('workflowExecutions')
          .withIndex('by_workflow', (q) => q.eq('workflowId', workflow._id))
          .collect()
      )
    );

    const executions = allExecutions.flat();
    const completedExecutions = executions.filter(
      (exec) => exec.status === 'completed'
    );
    const failedExecutions = executions.filter(
      (exec) => exec.status === 'failed'
    );
    const runningExecutions = executions.filter((exec) =>
      ['pending', 'running', 'waiting_approval'].includes(exec.status)
    );

    return {
      totalWorkflows: workflows.length,
      activeWorkflows: activeWorkflows.length,
      totalExecutions: executions.length,
      runningExecutions: runningExecutions.length,
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
              .reduce((sum, exec) => {
                const completedAt = exec.completedAt ?? exec.startedAt;
                return sum + (completedAt - exec.startedAt);
              }, 0) / completedExecutions.length
          : 0,
    };
  },
});

// Get recent workflow activity
export const getRecentActivity = query({
  args: {
    walletAddress: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 50);

    // Get user's workflow executions
    const executions = await ctx.db
      .query('workflowExecutions')
      .withIndex('by_user', (q) => q.eq('walletAddress', args.walletAddress))
      .order('desc')
      .take(limit);

    // Add workflow info to each execution
    const executionsWithWorkflows = await Promise.all(
      executions.map(async (execution) => {
        const workflow = await ctx.db.get(execution.workflowId);
        return {
          ...execution,
          workflowName: workflow?.name ?? 'Unknown Workflow',
        };
      })
    );

    return executionsWithWorkflows;
  },
});

// =============================================================================
// Visual Workflow Builder Functions
// =============================================================================

// Save or update visual workflow data
export const saveVisualWorkflow = mutation({
  args: {
    id: v.optional(v.id('workflows')),
    name: v.string(),
    description: v.optional(v.string()),
    walletAddress: v.string(),
    category: v.optional(
      v.union(
        v.literal('research'),
        v.literal('automation'),
        v.literal('data'),
        v.literal('communication'),
        v.literal('development'),
        v.literal('custom')
      )
    ),
    tags: v.optional(v.array(v.string())),
    isTemplate: v.optional(v.boolean()),
    isPublic: v.optional(v.boolean()),
    nodes: v.array(
      v.object({
        id: v.string(),
        type: v.string(),
        position: v.object({
          x: v.number(),
          y: v.number(),
        }),
        data: v.object({
          type: v.string(),
          label: v.string(),
          description: v.optional(v.string()),
          icon: v.optional(v.string()),
          config: v.optional(
            v.record(
              v.string(),
              v.union(v.string(), v.number(), v.boolean(), v.null())
            )
          ),
          parameters: v.optional(
            v.record(
              v.string(),
              v.union(v.string(), v.number(), v.boolean(), v.null())
            )
          ),
        }),
      })
    ),
    edges: v.array(
      v.object({
        id: v.string(),
        source: v.string(),
        target: v.string(),
        sourceHandle: v.optional(v.string()),
        targetHandle: v.optional(v.string()),
        label: v.optional(v.string()),
        animated: v.optional(v.boolean()),
        style: v.optional(
          v.record(
            v.string(),
            v.union(v.string(), v.number(), v.boolean(), v.null())
          )
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let workflowId = args.id;

    if (workflowId) {
      // Update existing workflow
      const workflow = await ctx.db.get(workflowId);
      if (!workflow || workflow.walletAddress !== args.walletAddress) {
        throw new Error('Workflow not found or access denied');
      }

      await ctx.db.patch(workflowId, {
        name: args.name,
        description: args.description,
        category: args.category,
        tags: args.tags,
        isTemplate: args.isTemplate,
        isPublic: args.isPublic,
        updatedAt: now,
      });

      // Delete existing steps and edges
      const existingSteps = await ctx.db
        .query('workflowSteps')
        .withIndex('by_workflow', (q) =>
          q.eq('workflowId', workflowId as Id<'workflows'>)
        )
        .collect();

      await Promise.all(existingSteps.map((s) => ctx.db.delete(s._id)));

      const existingEdges = await ctx.db
        .query('workflowEdges')
        .withIndex('by_workflow', (q) =>
          q.eq('workflowId', workflowId as Id<'workflows'>)
        )
        .collect();

      await Promise.all(existingEdges.map((e) => ctx.db.delete(e._id)));
    } else {
      // Create new workflow
      workflowId = await ctx.db.insert('workflows', {
        name: args.name,
        description: args.description,
        walletAddress: args.walletAddress,
        category: args.category,
        tags: args.tags,
        isTemplate: args.isTemplate,
        isPublic: args.isPublic,
        version: '1.0.0',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Save nodes as workflow steps
    await Promise.all(
      args.nodes.map((node, i) =>
        ctx.db.insert('workflowSteps', {
          workflowId,
          stepId: node.id,
          name: node.data.label,
          type:
            node.data.type === 'trigger' ||
            node.data.type === 'condition' ||
            node.data.type === 'action' ||
            node.data.type === 'task'
              ? node.data.type
              : 'task',
          position: i,
          config: toStringNumberBooleanRecord(node.data.config),
          visualData: {
            nodeId: node.id,
            nodeType: node.type,
            position: node.position,
            data: {
              ...node.data,
              // Ensure config and parameters match expected types
              config: toStringNumberBooleanRecord(node.data.config),
              parameters: node.data.parameters
                ? toStringNumberBooleanRecord(node.data.parameters)
                : undefined,
            },
          },
          createdAt: now,
          updatedAt: now,
          order: i,
        })
      )
    );

    // Save edges
    await Promise.all(
      args.edges.map((edge) =>
        ctx.db.insert('workflowEdges', {
          workflowId,
          sourceNodeId: edge.source,
          targetNodeId: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          label: edge.label,
          animated: edge.animated,
          style: toStringNumberRecord(edge.style),
          createdAt: now,
          updatedAt: now,
        })
      )
    );

    return workflowId;
  },
});

// Get visual workflow with nodes and edges
export const getVisualWorkflow = query({
  args: { id: v.id('workflows') },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.id);
    if (!workflow) {
      return null;
    }

    // Get all steps with visual data
    const steps = await ctx.db
      .query('workflowSteps')
      .withIndex('by_workflow', (q) => q.eq('workflowId', args.id))
      .collect();

    // Get all edges
    const edges = await ctx.db
      .query('workflowEdges')
      .withIndex('by_workflow', (q) => q.eq('workflowId', args.id))
      .collect();

    // Transform to React Flow format
    const nodes = steps.map((step) => ({
      id: step.visualData?.nodeId || step.stepId || step._id,
      type: step.visualData?.nodeType || 'custom',
      position: step.visualData?.position || { x: 100, y: 100 },
      data: step.visualData?.data || {
        type: step.type,
        label: step.name,
        config: step.config,
      },
    }));

    const flowEdges = edges.map((edge) => ({
      id: edge._id,
      source: edge.sourceNodeId,
      target: edge.targetNodeId,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      label: edge.label,
      animated: edge.animated,
      style: edge.style,
    }));

    return {
      ...workflow,
      nodes,
      edges: flowEdges,
    };
  },
});

// List visual workflows
export const listVisualWorkflows = query({
  args: {
    walletAddress: v.string(),
    includeTemplates: v.optional(v.boolean()),
    onlyPublic: v.optional(v.boolean()),
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 100);

    let workflows = await ctx.db
      .query('workflows')
      .withIndex('by_owner', (q) => q.eq('walletAddress', args.walletAddress))
      .order('desc')
      .take(limit);

    // Apply filters
    if (!args.includeTemplates) {
      workflows = workflows.filter((w) => !w.isTemplate);
    }

    if (args.onlyPublic) {
      workflows = workflows.filter((w) => w.isPublic);
    }

    if (args.category) {
      workflows = workflows.filter((w) => w.category === args.category);
    }

    // Get node and edge counts
    const workflowsWithCounts = await Promise.all(
      workflows.map(async (workflow) => {
        const steps = await ctx.db
          .query('workflowSteps')
          .withIndex('by_workflow', (q) => q.eq('workflowId', workflow._id))
          .collect();

        const edges = await ctx.db
          .query('workflowEdges')
          .withIndex('by_workflow', (q) => q.eq('workflowId', workflow._id))
          .collect();

        return {
          ...workflow,
          nodeCount: steps.length,
          edgeCount: edges.length,
        };
      })
    );

    return workflowsWithCounts;
  },
});

// Clone workflow (for templates)
export const cloneWorkflow = mutation({
  args: {
    sourceId: v.id('workflows'),
    newName: v.string(),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const sourceWorkflow = await ctx.db.get(args.sourceId);
    if (!sourceWorkflow) {
      throw new Error('Source workflow not found');
    }

    // Create new workflow
    const now = Date.now();
    const newWorkflowId = await ctx.db.insert('workflows', {
      name: args.newName,
      description: sourceWorkflow.description,
      walletAddress: args.walletAddress,
      category: sourceWorkflow.category,
      tags: sourceWorkflow.tags,
      isTemplate: false,
      isPublic: false,
      version: '1.0.0',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Copy steps
    const steps = await ctx.db
      .query('workflowSteps')
      .withIndex('by_workflow', (q) => q.eq('workflowId', args.sourceId))
      .collect();

    await Promise.all(
      steps.map((step) =>
        ctx.db.insert('workflowSteps', {
          workflowId: newWorkflowId,
          stepId: step.stepId,
          name: step.name,
          type: step.type,
          position: step.position,
          config: step.config,
          visualData: step.visualData,
          createdAt: now,
          updatedAt: now,
          agentId: step.agentId,
          condition: step.condition,
          parameters: step.parameters,
          nextSteps: step.nextSteps,
          requiresApproval: step.requiresApproval,
          order: step.order,
        })
      )
    );

    // Copy edges
    const edges = await ctx.db
      .query('workflowEdges')
      .withIndex('by_workflow', (q) => q.eq('workflowId', args.sourceId))
      .collect();

    await Promise.all(
      edges.map((edge) =>
        ctx.db.insert('workflowEdges', {
          workflowId: newWorkflowId,
          sourceNodeId: edge.sourceNodeId,
          targetNodeId: edge.targetNodeId,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          label: edge.label,
          animated: edge.animated,
          style: edge.style,
          createdAt: now,
          updatedAt: now,
        })
      )
    );

    return newWorkflowId;
  },
});

// Get workflow templates
export const getWorkflowTemplates = query({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);

    let templates = await ctx.db
      .query('workflows')
      .filter((q) => q.eq(q.field('isTemplate'), true))
      .order('desc')
      .take(limit);

    if (args.category) {
      templates = templates.filter((t) => t.category === args.category);
    }

    // Get counts
    const templatesWithCounts = await Promise.all(
      templates.map(async (template) => {
        const steps = await ctx.db
          .query('workflowSteps')
          .withIndex('by_workflow', (q) => q.eq('workflowId', template._id))
          .collect();

        const edges = await ctx.db
          .query('workflowEdges')
          .withIndex('by_workflow', (q) => q.eq('workflowId', template._id))
          .collect();

        return {
          ...template,
          nodeCount: steps.length,
          edgeCount: edges.length,
        };
      })
    );

    return templatesWithCounts;
  },
});
