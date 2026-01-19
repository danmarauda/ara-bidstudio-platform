/**
 * Agentic AI Engine
 * Core orchestration engine for multi-step AI agents with tool calling and workflow management
 */

import { openai } from '@ai-sdk/openai';
import type { CoreMessage, ToolResultPart } from 'ai';
import { generateText, tool } from 'ai';
import { nanoid } from 'nanoid';
import { MCPClientFactory } from '@/lib/mcp/mcp-client-factory';
import type {
  Agent,
  AgentContext,
  AgentExecution,
  AgentExecutionResult,
  AgenticConfig,
  AgentStep,
  AgentTool,
  ApprovalRequest,
  ExecuteAgentRequest,
  ToolResult,
} from '@/lib/types/agentic';
import { createModuleLogger } from '@/lib/utils/logger';
import { getTool } from './tools';

const log = createModuleLogger('agentic-engine');

// =============================================================================
// Configuration
// =============================================================================

const DEFAULT_CONFIG: AgenticConfig = {
  maxStepsPerExecution: 10,
  defaultModel: 'gpt-4o-mini',
  defaultTemperature: 0.7,
  defaultMaxTokens: 2000,
  toolTimeout: 30_000, // 30 seconds
  approvalTimeout: 300_000, // 5 minutes
  enableParallelExecution: true,
  maxParallelTools: 3,
  enableHumanApproval: true,
  requiredApprovalTools: ['solana_wallet', 'document_write', 'web_request'],
};

// =============================================================================
// Agentic AI Engine
// =============================================================================

export class AgenticEngine {
  private config: AgenticConfig;
  private activeExecutions = new Map<string, AgentExecution>();
  private pendingApprovals = new Map<string, ApprovalRequest>();

  constructor(config: Partial<AgenticConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Execute an agent with multi-step reasoning and tool calling
   */
  async executeAgent(
    agent: Agent,
    request: ExecuteAgentRequest
  ): Promise<AgentExecution> {
    // Create execution record
    const execution: AgentExecution = {
      id: nanoid(),
      agentId: agent.id,
      walletAddress: agent.walletAddress,
      status: 'running',
      input: request.input,
      steps: [],
      startedAt: Date.now(),
      metadata: request.metadata || {},
    };

    this.activeExecutions.set(execution.id, execution);

    try {
      // Execute agent with step-by-step reasoning
      const result = await this.runAgentSteps(agent, execution, request);

      execution.result = result;
      execution.status = result.success ? 'completed' : 'failed';
      execution.completedAt = Date.now();

      return execution;
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : String(error);
      execution.completedAt = Date.now();

      throw error;
    } finally {
      this.activeExecutions.delete(execution.id);

      // Clean up MCP clients for this agent
      if (agent.mcpServers && agent.mcpServers.length > 0) {
        for (const server of agent.mcpServers) {
          if (server.enabled) {
            try {
              await MCPClientFactory.closeClient(server.name);
            } catch (error) {
              log.warn(`Failed to close MCP client for ${server.name}`, {
                error: error instanceof Error ? error.message : String(error),
              });
            }
          }
        }
      }
    }
  }

  /**
   * Execute agent steps with AI SDK integration
   */
  private async runAgentSteps(
    agent: Agent,
    execution: AgentExecution,
    request: ExecuteAgentRequest
  ): Promise<AgentExecutionResult> {
    const maxSteps =
      request.maxSteps || agent.maxSteps || this.config.maxStepsPerExecution;
    const totalStartTime = Date.now();

    // Get MCP tools if agent has MCP servers configured
    let mcpTools: Record<string, any> = {};

    if (agent.mcpServers && agent.mcpServers.length > 0) {
      try {
        // Get all tools from configured MCP servers
        mcpTools = await MCPClientFactory.getToolsForServers(agent.mcpServers);

        if (Object.keys(mcpTools).length > 0) {
          log.info(
            `Loaded ${Object.keys(mcpTools).length} MCP tools from ${agent.mcpServers.filter((s) => s.enabled).length} servers`
          );
        }
      } catch (error) {
        log.error('Failed to load MCP tools', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Convert agent tools to AI SDK format
    const toolsMap = this.createToolsMap(agent.tools || []);
    const aiTools = Object.fromEntries(
      Array.from(toolsMap.entries()).map(([name, agentTool]) => [
        name,
        tool({
          description: agentTool.description,
          inputSchema: agentTool.parameters,
          execute: async (params) => {
            const context: AgentContext = {
              executionId: execution.id,
              agentId: agent.id,
              walletAddress: agent.walletAddress,
              stepNumber: execution.steps.length + 1,
              previousSteps: execution.steps,
              metadata: execution.metadata || {},
            };

            return await this.executeToolWithApproval(
              agentTool,
              params,
              context,
              Boolean(request.autoApprove)
            );
          },
        }),
      ])
    );

    // Combine regular tools with MCP tools
    const allTools = { ...aiTools, ...mcpTools };

    let currentStep = 1;
    const messages: CoreMessage[] = [
      {
        role: 'system',
        content: agent.systemPrompt,
      },
      {
        role: 'user',
        content: request.input,
      },
    ];

    const toolsUsed = new Set<string>();
    const totalTokensUsed = { input: 0, output: 0, total: 0 };

    while (currentStep <= maxSteps) {
      const step: AgentStep = {
        id: nanoid(),
        type: 'reasoning',
        status: 'running',
        startedAt: Date.now(),
      };

      execution.steps.push(step);

      try {
        // Generate AI response with tools
        const result = await generateText({
          model: openai(request.model || this.config.defaultModel),
          messages,
          tools: allTools, // Use combined tools including MCP
          temperature: agent.temperature || this.config.defaultTemperature,
          maxRetries: 3,
        });

        // Update token usage
        if (result.usage) {
          totalTokensUsed.input += result.usage.inputTokens || 0;
          totalTokensUsed.output += result.usage.outputTokens || 0;
          totalTokensUsed.total += result.usage.totalTokens || 0;
        }

        // Update step with result
        step.output = result.text;
        step.status = 'completed';
        step.completedAt = Date.now();

        // Add AI response to messages
        messages.push({
          role: 'assistant',
          content: result.text,
        });

        // Process tool calls if any
        if (result.toolCalls && result.toolCalls.length > 0) {
          step.type =
            result.toolCalls.length > 1 ? 'parallel_tools' : 'tool_call';
          step.toolCalls = result.toolCalls.map((tc) => ({
            id: tc.toolCallId,
            name: tc.toolName,
            parameters: (tc as any).input ?? {},
            requiresApproval: this.requiresApproval(tc.toolName),
          }));

          // Process tool results
          const toolResults: ToolResult[] = [];

          for (let i = 0; i < result.toolCalls.length; i++) {
            const toolCall = result.toolCalls[i];
            const toolResult = result.toolResults?.[i];
            const startTime = Date.now();

            toolsUsed.add(toolCall.toolName);

            // Check if this is an MCP tool
            const isMCPTool =
              toolCall.toolName.includes('_') &&
              (toolCall.toolName.startsWith('context7_') ||
                toolCall.toolName.startsWith('solana_'));

            if (isMCPTool) {
              log.info(`Executing MCP tool: ${toolCall.toolName}`, {
                parameters: (toolCall as any).input,
              });
            }

            // Tool results are already processed by the execute function above
            // We just need to record them
            toolResults.push({
              id: toolCall.toolCallId,
              success: true,
              result: toolResult || null,
              executionTime: Date.now() - startTime,
            });
          }

          step.toolResults = toolResults;

          // Add tool results to messages using correct Vercel AI SDK v5 format
          if (result.toolResults && result.toolResults.length > 0) {
            messages.push({
              role: 'tool',
              content: result.toolResults.map((toolResult, i) => ({
                type: 'tool-result',
                toolCallId: result.toolCalls[i].toolCallId,
                toolName: result.toolCalls[i].toolName,
                output:
                  (toolResult as any).output ??
                  (toolResult as any).result ??
                  (toolResult as any),
              })) as ToolResultPart[],
            });
          }
        }

        // Check if we should continue or if the task is complete
        if (this.isTaskComplete(result.text, result.toolCalls)) {
          break;
        }

        currentStep++;
      } catch (error) {
        step.status = 'failed';
        step.error = error instanceof Error ? error.message : String(error);
        step.completedAt = Date.now();

        throw new Error(`Step ${currentStep} failed: ${step.error}`);
      }
    }

    // Create final result
    const finalResult: AgentExecutionResult = {
      success: true,
      output: execution.steps.at(-1)?.output || 'No output generated',
      finalStep: currentStep - 1,
      totalSteps: execution.steps.length,
      toolsUsed: Array.from(toolsUsed),
      tokensUsed: totalTokensUsed,
      executionTime: Date.now() - totalStartTime,
    };

    return finalResult;
  }

  /**
   * Execute a tool with approval workflow if required
   */
  private async executeToolWithApproval(
    agentTool: AgentTool<unknown>,
    params: unknown,
    context: AgentContext,
    autoApprove: boolean
  ): Promise<unknown> {
    // Check if tool requires approval
    if (agentTool.requiresApproval && !autoApprove) {
      const approvalRequest: ApprovalRequest = {
        id: nanoid(),
        executionId: context.executionId,
        stepId: `step-${context.stepNumber}`,
        walletAddress: context.walletAddress,
        type: 'tool_execution',
        message: `Requesting approval to execute tool: ${agentTool.name}`,
        data: { toolName: agentTool.name, parameters: params },
        status: 'pending',
        createdAt: Date.now(),
      };

      this.pendingApprovals.set(approvalRequest.id, approvalRequest);

      // In a real implementation, this would notify the user and wait for approval
      // For now, we'll simulate auto-approval after a short delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate approval
      approvalRequest.status = 'approved';
      approvalRequest.respondedAt = Date.now();
      approvalRequest.response = { approved: true };

      this.pendingApprovals.delete(approvalRequest.id);
    }

    // Execute the tool
    const result = await agentTool.execute(params, context);

    if (!result.success) {
      const errorMessage =
        typeof result.error === 'string'
          ? result.error
          : result.error &&
              typeof result.error === 'object' &&
              'message' in result.error
            ? result.error.message
            : 'Tool execution failed';
      throw new Error(errorMessage as string);
    }

    return result.result;
  }

  /**
   * Create tools map from agent tool definitions
   */
  private createToolsMap(
    tools: string[] | AgentTool<unknown>[]
  ): Map<string, AgentTool<unknown>> {
    const toolsMap = new Map();

    for (const toolItem of tools) {
      if (typeof toolItem === 'string') {
        const tool = getTool(toolItem);
        if (tool) {
          toolsMap.set(toolItem, tool);
        }
      } else {
        // toolItem is already an AgentTool
        toolsMap.set(toolItem.name, toolItem);
      }
    }

    return toolsMap;
  }

  /**
   * Check if a tool requires approval
   */
  private requiresApproval(toolName: string): boolean {
    const tool = getTool(toolName);
    return (
      tool?.requiresApproval ||
      this.config.requiredApprovalTools.includes(toolName)
    );
  }

  /**
   * Determine if the task is complete based on AI response
   */
  private isTaskComplete(
    text: string,
    toolCalls: unknown[] | undefined
  ): boolean {
    // Simple heuristics to determine task completion
    const completionIndicators = [
      'task completed',
      'finished',
      'done',
      'completed successfully',
      'final answer',
      'conclusion',
    ];

    const textLower = text.toLowerCase();
    const hasCompletionIndicator = completionIndicators.some((indicator) =>
      textLower.includes(indicator)
    );

    // If no tool calls and has completion indicators, likely done
    return (!toolCalls || toolCalls.length === 0) && hasCompletionIndicator;
  }

  /**
   * Get execution status
   */
  getExecution(executionId: string): AgentExecution | undefined {
    return this.activeExecutions.get(executionId);
  }

  /**
   * Cancel execution
   */
  async cancelExecution(executionId: string): Promise<boolean> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      return false;
    }

    execution.status = 'cancelled';
    execution.completedAt = Date.now();
    execution.error = 'Execution cancelled by user';

    this.activeExecutions.delete(executionId);
    return true;
  }

  /**
   * Get pending approvals for a wallet
   */
  getPendingApprovals(walletAddress: string): ApprovalRequest[] {
    return Array.from(this.pendingApprovals.values()).filter(
      (approval) => approval.walletAddress === walletAddress
    );
  }

  /**
   * Respond to approval request
   */
  async respondToApproval(
    approvalId: string,
    approved: boolean,
    message?: string
  ): Promise<boolean> {
    const approval = this.pendingApprovals.get(approvalId);
    if (!approval) {
      return false;
    }

    approval.status = approved ? 'approved' : 'rejected';
    approval.respondedAt = Date.now();
    approval.response = { approved, message };

    // Remove from pending approvals
    this.pendingApprovals.delete(approvalId);

    return true;
  }

  /**
   * Stream agent execution (for real-time updates)
   */
  async *streamExecution(
    agent: Agent,
    request: ExecuteAgentRequest
  ): AsyncIterable<{ type: string; data: unknown }> {
    // This would be implemented for streaming execution updates
    // For now, we'll just execute and yield the final result

    yield { type: 'execution_started', data: { agentId: agent.id } };

    try {
      const result = await this.executeAgent(agent, request);
      yield { type: 'execution_completed', data: result };
    } catch (error) {
      yield {
        type: 'execution_failed',
        data: { error: error instanceof Error ? error.message : String(error) },
      };
    }
  }
}

// =============================================================================
// Default Engine Instance
// =============================================================================

export const agenticEngine = new AgenticEngine();

// =============================================================================
// Agent Management Utilities
// =============================================================================

export function createAgentFromTemplate(
  name: string,
  template: 'general' | 'research' | 'analysis' | 'blockchain' | 'custom',
  walletAddress: string,
  customPrompt?: string
): Agent {
  const templates = {
    general: {
      systemPrompt:
        'You are a helpful AI assistant that can use various tools to complete tasks. Break down complex tasks into steps and use the appropriate tools to gather information, perform calculations, and provide comprehensive answers.',
      tools: [
        'calculator',
        'text_analyzer',
        'timestamp',
        'web_search',
        'chat_completion',
      ],
    },
    research: {
      systemPrompt:
        'You are a research assistant specialized in finding, analyzing, and synthesizing information. Use web search and document retrieval tools to gather comprehensive information on topics and present well-structured findings.',
      tools: [
        'web_search',
        'document_retrieval',
        'text_analyzer',
        'chat_completion',
      ],
    },
    analysis: {
      systemPrompt:
        'You are a data analysis expert. Use available tools to analyze text, perform calculations, and provide insights. Focus on accuracy and provide detailed explanations of your analysis process.',
      tools: ['calculator', 'text_analyzer', 'timestamp', 'chat_completion'],
    },
    blockchain: {
      systemPrompt:
        'You are a blockchain and cryptocurrency assistant. Help users understand their wallets, transactions, and token holdings. Always request approval for sensitive blockchain operations.',
      tools: ['solana_wallet', 'calculator', 'timestamp', 'web_search'],
    },
    custom: {
      systemPrompt:
        customPrompt ||
        'You are a specialized AI assistant. Use the available tools to complete tasks effectively.',
      tools: ['calculator', 'text_analyzer', 'timestamp', 'chat_completion'],
    },
  };

  const template_config = templates[template];

  return {
    id: nanoid(),
    name,
    description: `AI agent based on ${template} template`,
    systemPrompt: template_config.systemPrompt,
    temperature: 0.7,
    maxTokens: 2000,
    tools: template_config.tools,
    maxSteps: 10,
    walletAddress,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function validateAgentConfig(agent: Partial<Agent>): string[] {
  const errors: string[] = [];

  if (!agent.name || agent.name.trim().length === 0) {
    errors.push('Agent name is required');
  }

  if (!agent.systemPrompt || agent.systemPrompt.trim().length === 0) {
    errors.push('System prompt is required');
  }

  if (
    agent.temperature !== undefined &&
    (agent.temperature < 0 || agent.temperature > 2)
  ) {
    errors.push('Temperature must be between 0 and 2');
  }

  if (
    agent.maxTokens !== undefined &&
    (agent.maxTokens < 1 || agent.maxTokens > 8000)
  ) {
    errors.push('Max tokens must be between 1 and 8000');
  }

  if (
    agent.maxSteps !== undefined &&
    (agent.maxSteps < 1 || agent.maxSteps > 10)
  ) {
    errors.push('Max steps must be between 1 and 10');
  }

  if (agent.tools) {
    for (const toolItem of agent.tools) {
      if (typeof toolItem === 'string' && !getTool(toolItem)) {
        errors.push(`Unknown tool: ${toolItem}`);
      }
    }
  }

  return errors;
}
