// Workflow node and edge types for the visual editor
export type NodeType =
  | 'start'
  | 'end'
  | 'task'
  | 'condition'
  | 'parallel'
  | 'loop'
  | 'subworkflow'
  | 'agent'
  | 'webhook'
  | 'delay'
  | 'approval';

export type WorkflowCategory =
  | 'research'
  | 'automation'
  | 'data'
  | 'communication'
  | 'development'
  | 'custom';

export interface NodePosition {
  x: number;
  y: number;
}

export interface NodeConfig {
  agentId?: string;
  model?: string;
  rpcUrl?: string;
  priorityFee?: number;
  slippage?: number;
  gasBudget?: number;
  condition?: string;
  requiresApproval?: boolean;
  timeout?: number;
  retryCount?: number;
  webhookUrl?: string;
  delayMs?: number;
  loopCount?: number;
  subworkflowId?: string;
}

export interface NodeParameters {
  input?: string;
  output?: string;
  variables?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  body?: string | Record<string, unknown>;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
}

export interface WorkflowNodeData extends Record<string, unknown> {
  type: NodeType;
  label: string;
  description?: string;
  icon?: string;
  config?: NodeConfig;
  parameters?: NodeParameters;
}

export interface WorkflowNode {
  id: string;
  type: 'custom';
  position: NodePosition;
  data: WorkflowNodeData;
  selected?: boolean;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
  animated?: boolean;
  style?: {
    stroke?: string;
    strokeWidth?: number;
  };
}

export interface WorkflowVariables {
  [key: string]: string | number | boolean | null;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables?: WorkflowVariables;
  tags?: string[];
}

export interface NodeTypeDefinition {
  type: NodeType;
  label: string;
  icon: string;
  color: string;
}

export const nodeTypes: NodeTypeDefinition[] = [
  { type: 'start', label: 'Start', icon: 'Play', color: 'bg-green-500' },
  { type: 'end', label: 'End', icon: 'Flag', color: 'bg-red-500' },
  { type: 'task', label: 'Task', icon: 'CheckSquare', color: 'bg-blue-500' },
  { type: 'agent', label: 'AI Agent', icon: 'Bot', color: 'bg-purple-500' },
  {
    type: 'condition',
    label: 'Condition',
    icon: 'GitBranch',
    color: 'bg-yellow-500',
  },
  {
    type: 'parallel',
    label: 'Parallel',
    icon: 'GitPullRequest',
    color: 'bg-indigo-500',
  },
  { type: 'loop', label: 'Loop', icon: 'Repeat', color: 'bg-orange-500' },
  { type: 'webhook', label: 'Webhook', icon: 'Webhook', color: 'bg-cyan-500' },
  { type: 'delay', label: 'Delay', icon: 'Clock', color: 'bg-gray-500' },
  {
    type: 'approval',
    label: 'Approval',
    icon: 'UserCheck',
    color: 'bg-pink-500',
  },
  {
    type: 'subworkflow',
    label: 'Sub-workflow',
    icon: 'Layers',
    color: 'bg-teal-500',
  },
] as const;

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentNodeId?: string;
  startedAt: string;
  completedAt?: string;
  error?: string;
  results?: Record<string, unknown>;
}

export interface WorkflowAgent {
  id: string;
  name: string;
  model: string;
  description?: string;
  capabilities?: string[];
}
