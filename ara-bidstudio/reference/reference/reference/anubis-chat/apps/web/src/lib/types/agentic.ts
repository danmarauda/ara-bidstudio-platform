/**
 * Agentic AI Types and Interfaces
 * Comprehensive type definitions for multi-step AI agents, workflows, and tool calling
 * Strict TypeScript - No any, unknown, or void types allowed
 */

import type { z } from 'zod';
import type { Result } from './result';

// =============================================================================
// Core Agent Types
// =============================================================================

export interface Agent {
  id: string;
  name: string;
  description?: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  tools?: AgentTool[] | string[]; // Can be tool definitions or tool names
  maxSteps?: number;
  walletAddress: string;
  createdAt: number;
  updatedAt: number;
  mcpServers?: Array<{
    name: string;
    enabled: boolean;
    config?: Record<string, any>;
  }>;
}

export interface AgentExecution {
  id: string;
  agentId: string;
  walletAddress: string;
  status: AgentExecutionStatus;
  input: string;
  steps: AgentStep[];
  result?: AgentExecutionResult;
  error?: string;
  startedAt: number;
  completedAt?: number;
  metadata?: Record<string, unknown>;
}

export type AgentExecutionStatus =
  | 'pending'
  | 'running'
  | 'waiting_approval'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface AgentStep {
  id: string;
  type: AgentStepType;
  status: AgentStepStatus;
  input?: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  output?: string;
  reasoning?: string;
  startedAt: number;
  completedAt?: number;
  error?: string;
}

export type AgentStepType =
  | 'reasoning'
  | 'tool_call'
  | 'parallel_tools'
  | 'human_approval'
  | 'workflow_step';

export type AgentStepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'waiting_approval';

export interface AgentExecutionResult {
  success: boolean;
  output: string;
  finalStep: number;
  totalSteps: number;
  toolsUsed: string[];
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  executionTime: number;
  [key: string]: unknown;
}

// =============================================================================
// Tool System Types
// =============================================================================

export interface AgentTool<TParams = unknown> {
  name: string;
  description: string;
  parameters: z.ZodSchema<TParams>;
  execute: (params: TParams, context: AgentContext) => Promise<ToolResult>;
  requiresApproval?: boolean;
  category?: ToolCategory;
  metadata?: AgentToolMetadata;
}

export interface AgentToolMetadata {
  version?: string;
  author?: string;
  documentation?: string;
  examples?: ToolExample[];
  rateLimit?: ToolRateLimit;
}

export interface ToolExample {
  description: string;
  input: Record<string, unknown>;
  expectedOutput: ToolResultData;
}

export interface ToolRateLimit {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
}

export type ToolCategory =
  | 'data_retrieval'
  | 'computation'
  | 'communication'
  | 'file_system'
  | 'web_api'
  | 'blockchain'
  | 'custom';

export interface ToolCall {
  id: string;
  name: string;
  parameters: Record<string, unknown>;
  requiresApproval: boolean;
}

export interface ToolResult {
  id: string;
  success: boolean;
  result: ToolResultData;
  error?: ToolError;
  executionTime: number;
  metadata?: ToolResultMetadata;
}

export type ToolResultData =
  | string
  | number
  | boolean
  | null
  | Record<string, unknown>
  | unknown[];

export interface ToolError {
  code: string;
  message: string;
  details?: Record<string, string | number | boolean>;
  retryable?: boolean;
}

export interface ToolResultMetadata {
  cached?: boolean;
  source?: string;
  timestamp?: number;
  version?: string;
}

export interface AgentContext {
  executionId: string;
  agentId: string;
  walletAddress: string;
  stepNumber: number;
  previousSteps: AgentStep[];
  metadata: Record<string, unknown>;
}

// =============================================================================
// Workflow Types
// =============================================================================

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  triggers?: WorkflowTrigger[];
  walletAddress: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: WorkflowStepType;
  agentId?: string;
  condition?: string;
  parameters?: Record<string, unknown>;
  nextSteps?: string[];
  requiresApproval?: boolean;
}

export type WorkflowStepType =
  | 'agent_task'
  | 'condition'
  | 'parallel'
  | 'sequential'
  | 'human_approval'
  | 'delay'
  | 'webhook'
  | 'start'
  | 'end'
  | 'task'
  | 'loop'
  | 'subworkflow';

export interface WorkflowTrigger {
  id: string;
  type: WorkflowTriggerType;
  condition: string;
  parameters?: Record<string, unknown>;
}

export type WorkflowTriggerType =
  | 'manual'
  | 'schedule'
  | 'webhook'
  | 'completion'
  | 'condition';

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  walletAddress: string;
  status: AgentExecutionStatus;
  currentStep: string;
  stepResults: WorkflowStepResults;
  variables?: WorkflowVariables;
  startedAt: number;
  completedAt?: number;
  error?: WorkflowExecutionError;
}

export interface WorkflowStepResults {
  [stepId: string]: StepResult;
}

export interface StepResult {
  status: AgentStepStatus;
  output?: ToolResultData;
  error?: string;
  startedAt: number;
  completedAt?: number;
  retryCount?: number;
}

export interface WorkflowVariables {
  [key: string]: string | number | boolean | null;
}

export interface WorkflowExecutionError {
  stepId: string;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// =============================================================================
// Human-in-the-Loop Types
// =============================================================================

export interface ApprovalRequest {
  id: string;
  executionId: string;
  stepId: string;
  walletAddress: string;
  type: ApprovalType;
  message: string;
  data: Record<string, unknown>;
  status: ApprovalStatus;
  createdAt: number;
  respondedAt?: number;
  response?: ApprovalResponse;
}

export type ApprovalType =
  | 'tool_execution'
  | 'workflow_step'
  | 'sensitive_action'
  | 'resource_usage'
  | 'custom';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface ApprovalResponse {
  approved: boolean;
  message?: string;
  modifications?: Record<string, unknown>;
}

// =============================================================================
// Request/Response Types
// =============================================================================

export interface CreateAgentRequest {
  name: string;
  description?: string;
  model: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  maxSteps?: number;
  tools?: string[]; // Tool names to enable
}

export interface ExecuteAgentRequest {
  agentId: string;
  input: string;
  model?: string; // Model to use for this execution
  maxSteps?: number;
  autoApprove?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  steps: Omit<WorkflowStep, 'id'>[];
  triggers?: Omit<WorkflowTrigger, 'id'>[];
}

export interface ExecuteWorkflowRequest {
  workflowId: string;
  input?: Record<string, unknown>;
  autoApprove?: boolean;
}

// =============================================================================
// Configuration Types
// =============================================================================

export interface AgenticConfig {
  maxStepsPerExecution: number;
  defaultModel: string;
  defaultTemperature: number;
  defaultMaxTokens: number;
  toolTimeout: number;
  approvalTimeout: number;
  enableParallelExecution: boolean;
  maxParallelTools: number;
  enableHumanApproval: boolean;
  requiredApprovalTools: string[];
}

// =============================================================================
// Event Types
// =============================================================================

export interface AgentEvent {
  id: string;
  type: AgentEventType;
  executionId: string;
  agentId: string;
  walletAddress: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export type AgentEventType =
  | 'execution_started'
  | 'step_completed'
  | 'tool_called'
  | 'approval_requested'
  | 'execution_completed'
  | 'execution_failed'
  | 'execution_cancelled';

// =============================================================================
// Advanced Types
// =============================================================================

export interface AgentCapabilities {
  supportedModels: string[];
  maxConcurrentTools: number;
  supportedToolCategories: ToolCategory[];
  features: AgentFeature[];
}

export const AgentFeature = {
  PARALLEL_TOOLS: 'parallel_tools',
  CONDITIONAL_EXECUTION: 'conditional_execution',
  HUMAN_IN_THE_LOOP: 'human_in_the_loop',
  MEMORY_PERSISTENCE: 'memory_persistence',
  CUSTOM_TOOLS: 'custom_tools',
  WORKFLOW_INTEGRATION: 'workflow_integration',
  STREAMING_RESPONSES: 'streaming_responses',
  FUNCTION_CALLING: 'function_calling',
} as const;
export type AgentFeature = (typeof AgentFeature)[keyof typeof AgentFeature];

export interface AgentMetrics {
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  averageSteps: number;
  tokenUsage: TokenUsage;
  costEstimate: number;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cachedTokens?: number;
}

// =============================================================================
// Result Type Integration
// =============================================================================

export type AgentOperationResult<T> = Result<T, AgentError>;
export type AsyncAgentOperationResult<T> = Promise<AgentOperationResult<T>>;

export interface AgentError {
  code: AgentErrorCode;
  message: string;
  details?: Record<string, unknown>;
  retryable?: boolean;
  suggestion?: string;
}

export const AgentErrorCode = {
  INVALID_INPUT: 'INVALID_INPUT',
  TOOL_EXECUTION_FAILED: 'TOOL_EXECUTION_FAILED',
  MAX_STEPS_EXCEEDED: 'MAX_STEPS_EXCEEDED',
  TIMEOUT: 'TIMEOUT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  MODEL_UNAVAILABLE: 'MODEL_UNAVAILABLE',
  WORKFLOW_FAILED: 'WORKFLOW_FAILED',
  APPROVAL_REJECTED: 'APPROVAL_REJECTED',
  CONTEXT_TOO_LONG: 'CONTEXT_TOO_LONG',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
export type AgentErrorCode =
  (typeof AgentErrorCode)[keyof typeof AgentErrorCode];

// =============================================================================
// Utility Types
// =============================================================================

export interface PaginationParams {
  cursor?: string;
  limit: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMetadata {
  cursor?: string;
  nextCursor?: string;
  prevCursor?: string;
  hasMore: boolean;
  hasPrevious?: boolean;
  total?: number;
  limit: number;
  offset?: number;
  page?: number;
  totalPages?: number;
}

export interface PaginatedAgentsResponse {
  agents: Agent[];
  pagination: PaginationMetadata;
}

export interface PaginatedExecutionsResponse {
  executions: AgentExecution[];
  pagination: PaginationMetadata;
}

export interface PaginatedWorkflowsResponse {
  workflows: Workflow[];
  pagination: PaginationMetadata;
}

// =============================================================================
// MCP Integration Types
// =============================================================================

export interface MCPTool<TParams = unknown> extends AgentTool<TParams> {
  mcpServerId: string;
  mcpToolName: string;
  mcpVersion?: string;
  mcpEndpoint?: string;
}

export interface MCPServerConfig {
  id: string;
  name: string;
  url: string;
  apiKey?: string;
  enabled: boolean;
  tools: string[];
}

export interface MCPClientConfig {
  servers: MCPServerConfig[];
  enableAutoDiscovery: boolean;
  timeout: number;
}
