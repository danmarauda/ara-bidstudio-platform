/**
 * Enhanced Agentic AI System
 * Multi-agent coordination with specialized capabilities
 */

import type { CoreMessage, LanguageModel, LanguageModelUsage } from 'ai';
import { generateObject, generateText, streamText } from 'ai';
import PQueue from 'p-queue';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import type { AIToolCollection } from '@/lib/types/tools';

// Agent Types
export type AgentRole =
  | 'orchestrator'
  | 'researcher'
  | 'coder'
  | 'analyst'
  | 'creative'
  | 'reviewer'
  | 'executor';

// Agent Capability Flags
export interface AgentCapabilities {
  canUseTools: boolean;
  canDelegateToAgents: boolean;
  canAccessMemory: boolean;
  canStreamResponses: boolean;
  canGenerateStructuredData: boolean;
  maxConcurrentTasks: number;
}

// Agent Configuration
export interface AgentConfig {
  id: string;
  name: string;
  role: AgentRole;
  model: LanguageModel;
  systemPrompt: string;
  capabilities: AgentCapabilities;
  tools?: AIToolCollection;
  temperature?: number;
  maxRetries?: number;
  topP?: number;
  metadata?: Record<string, unknown>;
}

// Agent Task
export interface AgentTask {
  id: string;
  type: 'generate' | 'stream' | 'analyze' | 'execute';
  prompt: string;
  context?: CoreMessage[];
  tools?: AIToolCollection;
  outputFormat?: 'text' | 'json' | 'structured';
  schema?: z.ZodSchema;
  priority?: number;
  metadata?: Record<string, unknown>;
}

// Agent Result
export interface AgentResult {
  taskId: string;
  agentId: string;
  success: boolean;
  output?: unknown;
  error?: string;
  usage?: LanguageModelUsage;
  duration: number;
  metadata?: Record<string, unknown>;
}

// Base Agent Class
export class Agent {
  protected config: AgentConfig;
  protected taskQueue: PQueue;
  protected activeStreams: Map<string, AbortController> = new Map();

  constructor(config: AgentConfig) {
    this.config = config;
    this.taskQueue = new PQueue({
      concurrency: config.capabilities.maxConcurrentTasks || 1,
    });
  }

  /**
   * Execute a task
   */
  async execute(task: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();
    const taskId = task.id || uuidv4();

    try {
      let result: unknown;
      let usage: LanguageModelUsage | undefined;

      // Build messages
      const messages: CoreMessage[] = [
        { role: 'system', content: this.config.systemPrompt },
        ...(task.context || []),
        { role: 'user', content: task.prompt },
      ];

      // Combine tools from agent config and task
      const tools = { ...this.config.tools, ...task.tools };

      switch (task.type) {
        case 'generate':
          result = await this.generateText(messages, tools);
          usage = (result as { usage?: LanguageModelUsage }).usage;
          break;

        case 'stream':
          if (!this.config.capabilities.canStreamResponses) {
            throw new Error('Agent does not support streaming');
          }
          result = await this.streamText(messages, tools, taskId);
          break;

        case 'analyze':
          if (!task.schema) {
            throw new Error('Schema required for analyze task');
          }
          result = await this.generateStructured(messages, task.schema);
          usage = (result as { usage?: LanguageModelUsage }).usage;
          break;

        case 'execute':
          result = await this.executeTools(messages, tools);
          usage = (result as { usage?: LanguageModelUsage }).usage;
          break;

        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      return {
        taskId,
        agentId: this.config.id,
        success: true,
        output: (result as { output?: unknown }).output || result,
        usage,
        duration: Date.now() - startTime,
        metadata: task.metadata,
      };
    } catch (error) {
      return {
        taskId,
        agentId: this.config.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
        metadata: task.metadata,
      };
    }
  }

  /**
   * Generate text
   */
  private async generateText(
    messages: CoreMessage[],
    tools?: AIToolCollection
  ) {
    const result = await generateText({
      model: this.config.model,
      messages,
      tools: this.config.capabilities.canUseTools ? tools : undefined,
      temperature: this.config.temperature,
      maxRetries: 3,
      topP: this.config.topP,
    });

    return {
      output: result.text,
      usage: result.usage,
      toolCalls: result.toolCalls,
      toolResults: result.toolResults,
    };
  }

  /**
   * Stream text
   */
  private async streamText(
    messages: CoreMessage[],
    tools: AIToolCollection | undefined,
    taskId: string
  ) {
    const abortController = new AbortController();
    this.activeStreams.set(taskId, abortController);

    try {
      const result = await streamText({
        model: this.config.model,
        messages,
        tools: this.config.capabilities.canUseTools ? tools : undefined,
        temperature: this.config.temperature,
        maxRetries: 3,
        topP: this.config.topP,
        abortSignal: abortController.signal,
      });

      // Return the stream for the caller to consume
      return {
        stream: result.textStream,
        fullStream: result.fullStream,
      };
    } finally {
      this.activeStreams.delete(taskId);
    }
  }

  /**
   * Generate structured data
   */
  private async generateStructured<T>(
    messages: CoreMessage[],
    schema: z.ZodSchema<T>
  ): Promise<{ output: T; usage: LanguageModelUsage }> {
    if (!this.config.capabilities.canGenerateStructuredData) {
      throw new Error('Agent does not support structured data generation');
    }

    // Convert messages to a simpler format for generateObject
    const prompt = messages
      .filter((m) => m.role === 'user')
      .map((m) =>
        typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
      )
      .join('\n');

    const systemMessage = messages.find((m) => m.role === 'system');
    const system =
      systemMessage && typeof systemMessage.content === 'string'
        ? systemMessage.content
        : undefined;

    // generateObject has complex conditional types, so we need to handle this carefully
    // Based on the AI SDK examples, we always pass schema which means output defaults to 'object'
    const result = await generateObject({
      model: this.config.model,
      prompt,
      system,
      schema,
      temperature: this.config.temperature,
      maxRetries: 3,
      topP: this.config.topP,
    } as Parameters<typeof generateObject>[0]);

    return {
      output: result.object as T,
      usage: result.usage,
    };
  }

  /**
   * Execute tools
   */
  private async executeTools(
    messages: CoreMessage[],
    tools: AIToolCollection | undefined
  ) {
    if (!(this.config.capabilities.canUseTools && tools)) {
      throw new Error('Agent does not support tool usage');
    }

    const result = await generateText({
      model: this.config.model,
      messages,
      tools,
      toolChoice: 'required' as const,
      temperature: this.config.temperature,
      maxRetries: 3,
    });

    return {
      output: result.text,
      toolCalls: result.toolCalls,
      toolResults: result.toolResults,
      usage: result.usage,
    };
  }

  /**
   * Abort a streaming task
   */
  abortStream(taskId: string): void {
    const controller = this.activeStreams.get(taskId);
    if (controller) {
      controller.abort();
      this.activeStreams.delete(taskId);
    }
  }

  /**
   * Queue a task for execution
   */
  async queueTask(task: AgentTask): Promise<AgentResult> {
    return this.taskQueue.add(() => this.execute(task), {
      priority: task.priority,
    }) as Promise<AgentResult>;
  }

  /**
   * Get agent configuration
   */
  getConfig(): AgentConfig {
    return this.config;
  }

  /**
   * Update agent configuration
   */
  updateConfig(updates: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...updates };

    // Update queue concurrency if changed
    if (updates.capabilities?.maxConcurrentTasks) {
      this.taskQueue.concurrency = updates.capabilities.maxConcurrentTasks;
    }
  }
}

// Orchestrator Agent - Coordinates other agents
export class OrchestratorAgent extends Agent {
  private agents: Map<string, Agent> = new Map();
  private taskDistributor: PQueue;

  constructor(config: AgentConfig) {
    super({
      ...config,
      role: 'orchestrator',
      capabilities: {
        ...config.capabilities,
        canDelegateToAgents: true,
      },
    });

    this.taskDistributor = new PQueue({
      concurrency: 5, // Can coordinate multiple agents
    });
  }

  /**
   * Register an agent
   */
  registerAgent(agent: Agent): void {
    this.agents.set(agent.getConfig().id, agent);
  }

  /**
   * Delegate task to an agent
   */
  async delegateTask(agentId: string, task: AgentTask): Promise<AgentResult> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    return this.taskDistributor.add(() =>
      agent.execute(task)
    ) as Promise<AgentResult>;
  }

  /**
   * Coordinate multiple agents for a complex task
   */
  async coordinateTask(
    task: string,
    agents: string[],
    parallel = false
  ): Promise<AgentResult[]> {
    const subtasks = await this.decomposeTask(task, agents);

    if (parallel) {
      // Execute tasks in parallel
      const promises = subtasks.map(({ agentId, task }) =>
        this.delegateTask(agentId, task)
      );
      return Promise.all(promises);
    }
    // Execute tasks sequentially
    const results: AgentResult[] = [];
    for (const { agentId, task } of subtasks) {
      const result = await this.delegateTask(agentId, task);
      results.push(result);

      // Pass result to next task as context
      if (subtasks.indexOf({ agentId, task }) < subtasks.length - 1) {
        const nextSubtask = subtasks[subtasks.indexOf({ agentId, task }) + 1];
        nextSubtask.task.context = [
          ...(nextSubtask.task.context || []),
          { role: 'assistant', content: JSON.stringify(result.output) },
        ];
      }
    }
    return results;
  }

  /**
   * Decompose a complex task into subtasks
   */
  private async decomposeTask(
    task: string,
    agents: string[]
  ): Promise<Array<{ agentId: string; task: AgentTask }>> {
    // Use the orchestrator's intelligence to decompose the task
    const decomposition = await this.execute({
      id: uuidv4(),
      type: 'analyze',
      prompt: `Decompose this task into subtasks for the following agents: ${agents.join(', ')}
               Task: ${task}
               
               For each subtask, specify:
               1. Which agent should handle it
               2. What the subtask is
               3. Any dependencies on other subtasks`,
      schema: z.object({
        subtasks: z.array(
          z.object({
            agentId: z.string(),
            description: z.string(),
            dependencies: z.array(z.string()).optional(),
            priority: z.number().optional(),
          })
        ),
      }),
    });

    if (!(decomposition.success && decomposition.output)) {
      throw new Error('Failed to decompose task');
    }

    interface Subtask {
      agentId: string;
      description: string;
      dependencies?: string[];
      priority?: number;
    }

    interface DecomposedTask {
      subtasks: Subtask[];
    }

    // Convert to agent tasks with proper typing
    const typedOutput = decomposition.output as DecomposedTask;
    return typedOutput.subtasks.map((subtask) => ({
      agentId: subtask.agentId,
      task: {
        id: uuidv4(),
        type: 'generate' as const,
        prompt: subtask.description,
        priority: subtask.priority,
      },
    }));
  }

  /**
   * Get registered agents
   */
  getAgents(): Map<string, Agent> {
    return this.agents;
  }
}

// Specialized Agent Factory
export class AgentFactory {
  /**
   * Create a researcher agent
   */
  static createResearcher(
    model: LanguageModel,
    tools?: AIToolCollection
  ): Agent {
    return new Agent({
      id: `researcher-${uuidv4()}`,
      name: 'Research Agent',
      role: 'researcher',
      model,
      systemPrompt: `You are a research specialist. Your role is to:
        1. Find and analyze information from various sources
        2. Verify facts and cross-reference information
        3. Provide comprehensive, well-researched answers
        4. Cite sources when available
        5. Identify gaps in available information`,
      capabilities: {
        canUseTools: true,
        canDelegateToAgents: false,
        canAccessMemory: true,
        canStreamResponses: true,
        canGenerateStructuredData: true,
        maxConcurrentTasks: 3,
      },
      tools,
      maxRetries: 3,
    });
  }

  /**
   * Create a coder agent
   */
  static createCoder(model: LanguageModel, tools?: AIToolCollection): Agent {
    return new Agent({
      id: `coder-${uuidv4()}`,
      name: 'Coding Agent',
      role: 'coder',
      model,
      systemPrompt: `You are a expert software developer. Your role is to:
        1. Write clean, efficient, and well-documented code
        2. Follow best practices and design patterns
        3. Handle errors gracefully
        4. Optimize for performance and maintainability
        5. Provide clear explanations of your code`,
      capabilities: {
        canUseTools: true,
        canDelegateToAgents: false,
        canAccessMemory: true,
        canStreamResponses: true,
        canGenerateStructuredData: true,
        maxConcurrentTasks: 2,
      },
      tools,
      maxRetries: 3,
    });
  }

  /**
   * Create an analyst agent
   */
  static createAnalyst(model: LanguageModel, tools?: AIToolCollection): Agent {
    return new Agent({
      id: `analyst-${uuidv4()}`,
      name: 'Analysis Agent',
      role: 'analyst',
      model,
      systemPrompt: `You are a data analyst. Your role is to:
        1. Analyze data and identify patterns
        2. Provide insights and recommendations
        3. Create structured reports
        4. Visualize findings when appropriate
        5. Validate conclusions with evidence`,
      capabilities: {
        canUseTools: true,
        canDelegateToAgents: false,
        canAccessMemory: true,
        canStreamResponses: true,
        canGenerateStructuredData: true,
        maxConcurrentTasks: 2,
      },
      tools,
      maxRetries: 3,
    });
  }

  /**
   * Create an orchestrator agent
   */
  static createOrchestrator(
    model: LanguageModel,
    tools?: AIToolCollection
  ): OrchestratorAgent {
    return new OrchestratorAgent({
      id: `orchestrator-${uuidv4()}`,
      name: 'Orchestrator Agent',
      role: 'orchestrator',
      model,
      systemPrompt: `You are an orchestrator agent. Your role is to:
        1. Understand complex tasks and break them down
        2. Delegate subtasks to appropriate specialized agents
        3. Coordinate agent activities and manage dependencies
        4. Synthesize results from multiple agents
        5. Ensure task completion and quality`,
      capabilities: {
        canUseTools: true,
        canDelegateToAgents: true,
        canAccessMemory: true,
        canStreamResponses: true,
        canGenerateStructuredData: true,
        maxConcurrentTasks: 5,
      },
      tools,
      maxRetries: 3,
    });
  }
}
