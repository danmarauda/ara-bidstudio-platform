/**
 * Workflow Engine
 * Complex task orchestration with conditional logic and parallel execution
 */

import type { tool } from 'ai';
import PQueue from 'p-queue';
import { v4 as uuidv4 } from 'uuid';
import type { Agent, AgentTask } from '@/lib/agents/core';

// Workflow data types
export type WorkflowValue =
  | string
  | number
  | boolean
  | null
  | WorkflowValue[]
  | { [key: string]: WorkflowValue };
export type WorkflowVariables = Record<string, WorkflowValue>;
export type WorkflowMetadata = Record<string, WorkflowValue>;

// Workflow Node Types
export type NodeType =
  | 'start'
  | 'end'
  | 'task'
  | 'condition'
  | 'parallel'
  | 'loop'
  | 'wait'
  | 'subworkflow';

// Workflow Node - Discriminated Union based on NodeType
export type WorkflowNode =
  | {
      id: string;
      type: 'task';
      name: string;
      description?: string;
      config?: TaskNodeConfig;
      next?: string | string[];
      condition?: (context: WorkflowContext) => boolean | Promise<boolean>;
      retryPolicy?: RetryPolicy;
    }
  | {
      id: string;
      type: 'condition';
      name: string;
      description?: string;
      config?: ConditionNodeConfig;
      next?: string | string[];
      condition?: (context: WorkflowContext) => boolean | Promise<boolean>;
      retryPolicy?: RetryPolicy;
    }
  | {
      id: string;
      type: 'parallel';
      name: string;
      description?: string;
      config?: ParallelNodeConfig;
      next?: string | string[];
      condition?: (context: WorkflowContext) => boolean | Promise<boolean>;
      retryPolicy?: RetryPolicy;
    }
  | {
      id: string;
      type: 'loop';
      name: string;
      description?: string;
      config?: LoopNodeConfig;
      next?: string | string[];
      condition?: (context: WorkflowContext) => boolean | Promise<boolean>;
      retryPolicy?: RetryPolicy;
    }
  | {
      id: string;
      type: 'start' | 'end' | 'wait' | 'subworkflow';
      name: string;
      description?: string;
      config?: Record<string, unknown>;
      next?: string | string[];
      condition?: (context: WorkflowContext) => boolean | Promise<boolean>;
      retryPolicy?: RetryPolicy;
    };

// Task Node Configuration
export interface TaskNodeConfig {
  agentId?: string;
  task: AgentTask;
  tools?: Record<string, ReturnType<typeof tool>>;
  timeout?: number;
}

// Condition Node Configuration
export interface ConditionNodeConfig {
  expression: string | ((context: WorkflowContext) => boolean);
  trueBranch: string;
  falseBranch?: string;
}

// Parallel Node Configuration
export interface ParallelNodeConfig {
  branches: string[];
  waitForAll: boolean;
  maxConcurrency?: number;
}

// Loop Node Configuration
export interface LoopNodeConfig {
  condition: (context: WorkflowContext) => boolean;
  body: string; // Node to execute in loop
  maxIterations?: number;
}

// Retry Policy
export interface RetryPolicy {
  maxRetries: number;
  backoffMs?: number;
  backoffMultiplier?: number;
  maxBackoffMs?: number;
}

// Workflow Definition
export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  version: string;
  nodes: WorkflowNode[];
  edges: Array<{ from: string; to: string; condition?: string }>;
  variables?: WorkflowVariables;
  timeout?: number;
  metadata?: WorkflowMetadata;
}

// Workflow Context
export interface WorkflowContext {
  workflowId: string;
  executionId: string;
  variables: WorkflowVariables;
  results: Map<string, WorkflowValue>;
  errors: Map<string, Error>;
  currentNode?: string;
  history: string[];
  startTime: number;
  metadata?: WorkflowMetadata;
}

// Workflow Execution State
export type WorkflowState =
  | 'pending'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

// Workflow Execution Result
export interface WorkflowExecutionResult {
  executionId: string;
  workflowId: string;
  state: WorkflowState;
  results: Record<string, WorkflowValue>;
  errors?: Record<string, string>;
  duration: number;
  nodesExecuted: string[];
  metadata?: WorkflowMetadata;
}

// Workflow Engine
export class WorkflowEngine {
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private executions: Map<string, WorkflowContext> = new Map();
  private agents: Map<string, Agent> = new Map();
  private nodeExecutors: Map<NodeType, NodeExecutor> = new Map();

  constructor() {
    this.initializeNodeExecutors();
  }

  /**
   * Initialize node executors for different node types
   */
  private initializeNodeExecutors(): void {
    this.nodeExecutors.set('task', new TaskNodeExecutor());
    this.nodeExecutors.set('condition', new ConditionNodeExecutor());
    this.nodeExecutors.set('parallel', new ParallelNodeExecutor());
    this.nodeExecutors.set('loop', new LoopNodeExecutor());
    this.nodeExecutors.set('subworkflow', new SubworkflowNodeExecutor(this));
  }

  /**
   * Register a workflow
   */
  registerWorkflow(workflow: WorkflowDefinition): void {
    this.workflows.set(workflow.id, workflow);
  }

  /**
   * Register an agent
   */
  registerAgent(agent: Agent): void {
    this.agents.set(agent.getConfig().id, agent);
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowId: string,
    inputs?: WorkflowVariables
  ): Promise<WorkflowExecutionResult> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const executionId = uuidv4();
    const context: WorkflowContext = {
      workflowId,
      executionId,
      variables: { ...workflow.variables, ...inputs },
      results: new Map(),
      errors: new Map(),
      history: [],
      startTime: Date.now(),
      metadata: workflow.metadata,
    };

    this.executions.set(executionId, context);

    try {
      // Find start node
      const startNode = workflow.nodes.find((n) => n.type === 'start');
      if (!startNode) {
        throw new Error('Workflow has no start node');
      }

      // Execute workflow
      await this.executeNode(startNode, context, workflow);

      return {
        executionId,
        workflowId,
        state: 'completed',
        results: Object.fromEntries(context.results),
        duration: Date.now() - context.startTime,
        nodesExecuted: context.history,
        metadata: context.metadata,
      };
    } catch (_error) {
      return {
        executionId,
        workflowId,
        state: 'failed',
        results: Object.fromEntries(context.results),
        errors: Object.fromEntries(
          Array.from(context.errors.entries()).map(([k, v]) => [k, v.message])
        ),
        duration: Date.now() - context.startTime,
        nodesExecuted: context.history,
        metadata: context.metadata,
      };
    } finally {
      this.executions.delete(executionId);
    }
  }

  /**
   * Execute a node
   */
  private async executeNode(
    node: WorkflowNode,
    context: WorkflowContext,
    workflow: WorkflowDefinition
  ): Promise<void> {
    // Update context
    context.currentNode = node.id;
    context.history.push(node.id);

    // Check for timeout
    this.checkWorkflowTimeout(context, workflow);

    // Execute based on node type
    const executor = this.nodeExecutors.get(node.type);
    if (!executor) {
      throw new Error(`No executor for node type: ${node.type}`);
    }

    // Execute with retry policy
    await this.runExecutorWithRetry(executor, node, context);

    // Determine next node(s)
    if (node.type === 'end') {
      return; // Workflow complete
    }

    const nextNodes = this.determineNextNodes(node, context, workflow);
    await this.executeNextNodes(nextNodes, context, workflow);
  }

  /**
   * Enforce workflow timeout if configured
   */
  private checkWorkflowTimeout(
    context: WorkflowContext,
    workflow: WorkflowDefinition
  ): void {
    if (!workflow.timeout) {
      return;
    }
    const elapsedMs = Date.now() - context.startTime;
    if (elapsedMs > workflow.timeout) {
      throw new Error('Workflow timeout exceeded');
    }
  }

  /**
   * Execute a node's executor honoring retry policy without await-in-loop
   */
  private runExecutorWithRetry(
    executor: NodeExecutor,
    node: WorkflowNode,
    context: WorkflowContext
  ): Promise<void> {
    const retryPolicy: RetryPolicy = node.retryPolicy || { maxRetries: 0 };

    const attempt = async (attemptIndex: number): Promise<void> => {
      try {
        await executor.execute(node, context, this.agents);
      } catch (rawError) {
        const error =
          rawError instanceof Error ? rawError : new Error(String(rawError));

        const hasRetriesRemaining = attemptIndex < retryPolicy.maxRetries;
        if (!hasRetriesRemaining) {
          context.errors.set(node.id, error);
          throw error;
        }

        const baseBackoff = retryPolicy.backoffMs ?? 1000;
        const multiplier = retryPolicy.backoffMultiplier ?? 2;
        const maxBackoff = retryPolicy.maxBackoffMs ?? 30_000;
        const delayMs = Math.min(
          baseBackoff * multiplier ** attemptIndex,
          maxBackoff
        );

        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return attempt(attemptIndex + 1);
      }
    };

    return attempt(0);
  }

  /**
   * Execute all next nodes without await-in-loop
   */
  private async executeNextNodes(
    nextNodeIds: string[],
    context: WorkflowContext,
    workflow: WorkflowDefinition
  ): Promise<void> {
    const nextNodes = nextNodeIds
      .map((id) => workflow.nodes.find((n) => n.id === id))
      .filter((n): n is WorkflowNode => Boolean(n));

    await Promise.all(
      nextNodes.map((n) => this.executeNode(n, context, workflow))
    );
  }

  /**
   * Determine next nodes to execute
   */
  private determineNextNodes(
    node: WorkflowNode,
    _context: WorkflowContext,
    workflow: WorkflowDefinition
  ): string[] {
    if (!node.next) {
      // Find edges from this node
      const edges = workflow.edges.filter((e) => e.from === node.id);
      return edges.map((e) => e.to);
    }

    if (Array.isArray(node.next)) {
      return node.next;
    }

    return [node.next];
  }

  /**
   * Pause a workflow execution
   */
  pauseExecution(executionId: string): void {
    const context = this.executions.get(executionId);
    if (context) {
      // Implementation for pausing
      // This would require persistent storage in production
    }
  }

  /**
   * Resume a workflow execution
   */
  async resumeExecution(_executionId: string): Promise<void> {
    // Implementation for resuming
    // This would require loading from persistent storage
  }

  /**
   * Cancel a workflow execution
   */
  cancelExecution(executionId: string): void {
    const context = this.executions.get(executionId);
    if (context) {
      this.executions.delete(executionId);
    }
  }

  /**
   * Get workflow status
   */
  getExecutionStatus(executionId: string): WorkflowContext | undefined {
    return this.executions.get(executionId);
  }
}

// Base Node Executor
abstract class NodeExecutor {
  abstract execute(
    node: WorkflowNode,
    context: WorkflowContext,
    agents: Map<string, Agent>
  ): Promise<void>;
}

// Task Node Executor
class TaskNodeExecutor extends NodeExecutor {
  async execute(
    node: WorkflowNode,
    context: WorkflowContext,
    agents: Map<string, Agent>
  ): Promise<void> {
    const config = node.config as TaskNodeConfig;
    if (!config) {
      throw new Error('Task node requires configuration');
    }

    // Get agent
    const agentId = config.agentId || 'default';
    const agent = agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Execute task
    const result = await agent.execute(config.task);

    if (result.success) {
      context.results.set(node.id, result.output as WorkflowValue);
    } else {
      throw new Error(result.error || 'Task execution failed');
    }
  }
}

// Condition Node Executor
class ConditionNodeExecutor extends NodeExecutor {
  async execute(
    node: WorkflowNode,
    context: WorkflowContext,
    _agents: Map<string, Agent>
  ): Promise<void> {
    const config = node.config as ConditionNodeConfig;
    if (!config) {
      throw new Error('Condition node requires configuration');
    }

    let result: boolean;
    if (typeof config.expression === 'function') {
      result = await config.expression(context);
    } else {
      // Evaluate expression string
      // In production, use a safe expression evaluator
      result = this.evaluateExpression(config.expression, context);
    }

    context.results.set(node.id, result);

    // Set next node based on condition
    if (result) {
      node.next = config.trueBranch;
    } else {
      node.next = config.falseBranch;
    }
  }

  private evaluateExpression(
    expression: string,
    context: WorkflowContext
  ): boolean {
    // Simple expression evaluation
    // In production, use a proper expression parser
    try {
      const func = new Function('context', `return ${expression}`);
      return func(context);
    } catch {
      return false;
    }
  }
}

// Parallel Node Executor
class ParallelNodeExecutor extends NodeExecutor {
  async execute(
    node: WorkflowNode,
    context: WorkflowContext,
    _agents: Map<string, Agent>
  ): Promise<void> {
    const config = node.config as ParallelNodeConfig;
    if (!config) {
      throw new Error('Parallel node requires configuration');
    }

    const queue = new PQueue({
      concurrency: config.maxConcurrency || config.branches.length,
    });

    const results = await Promise.allSettled(
      config.branches.map((branchId) =>
        queue.add(() => {
          // Execute branch logic
          // This would need to execute the branch nodes
          return Promise.resolve({ branchId, result: 'branch result' });
        })
      )
    );

    if (config.waitForAll) {
      // Check if all branches succeeded
      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length > 0) {
        throw new Error(`${failures.length} parallel branches failed`);
      }
    }

    // Extract results in a format compatible with WorkflowValue
    const processedResults = results.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value as WorkflowValue;
      }
      return {
        error:
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason),
        status: 'rejected',
      } as WorkflowValue;
    });

    context.results.set(node.id, processedResults);
  }
}

// Loop Node Executor
class LoopNodeExecutor extends NodeExecutor {
  execute(
    node: WorkflowNode,
    context: WorkflowContext,
    _agents: Map<string, Agent>
  ): Promise<void> {
    const config = node.config as LoopNodeConfig;
    if (!config) {
      throw new Error('Loop node requires configuration');
    }

    let iterations = 0;
    const maxIterations = config.maxIterations || 1000;
    const results: WorkflowValue[] = [];

    while (iterations < maxIterations && config.condition(context)) {
      // Execute loop body
      // This would need to execute the body node
      results.push(`iteration ${iterations}`);
      iterations++;
    }

    context.results.set(node.id, results);
    return Promise.resolve();
  }
}

// Subworkflow Node Executor
class SubworkflowNodeExecutor extends NodeExecutor {
  private engine: WorkflowEngine;

  constructor(engine: WorkflowEngine) {
    super();
    this.engine = engine;
  }

  async execute(
    node: WorkflowNode,
    context: WorkflowContext,
    _agents: Map<string, Agent>
  ): Promise<void> {
    // For subworkflow nodes, config should contain workflowId and inputs
    const config = node.config as {
      workflowId?: string;
      inputs?: WorkflowVariables;
    };
    const subworkflowId = config?.workflowId;
    if (!subworkflowId) {
      throw new Error('Subworkflow node requires workflowId');
    }

    const inputs = config?.inputs || context.variables;
    const result = await this.engine.executeWorkflow(subworkflowId, inputs);

    context.results.set(node.id, result as unknown as WorkflowValue);
  }
}

// Workflow Builder Helper
export class WorkflowBuilder {
  private workflow: WorkflowDefinition;

  constructor(name: string, description?: string) {
    this.workflow = {
      id: uuidv4(),
      name,
      description,
      version: '1.0.0',
      nodes: [],
      edges: [],
      variables: {},
    };
  }

  addNode(node: WorkflowNode): WorkflowBuilder {
    this.workflow.nodes.push(node);
    return this;
  }

  addEdge(from: string, to: string, condition?: string): WorkflowBuilder {
    this.workflow.edges.push({ from, to, condition });
    return this;
  }

  setVariables(variables: WorkflowVariables): WorkflowBuilder {
    this.workflow.variables = variables;
    return this;
  }

  setTimeout(timeout: number): WorkflowBuilder {
    this.workflow.timeout = timeout;
    return this;
  }

  build(): WorkflowDefinition {
    return this.workflow;
  }
}
