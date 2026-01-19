import type { LucideIcon } from 'lucide-react';

export interface AgentPersonality {
  tone: string;
  style: string;
  traits: string[];
  customPrompts?: string[];
}

export interface AgentSettings {
  temperature: number;
  maxTokens: number;
  streamResponses: boolean;
  memoryEnabled: boolean;
  contextWindow: number;
}

export interface AgentPermissions {
  canExecuteTrades: boolean;
  maxTransactionValue: number;
  requiresApproval: boolean;
  allowedChains: string[];
}

export interface AgentTool {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  config: Record<string, unknown>;
  apiKey?: string;
  endpoint?: string;
  description?: string;
}

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: string;
  enabled?: boolean;
}

export interface Agent {
  id?: string;
  name: string;
  description: string;
  avatar: string;
  type: string;
  personality: AgentPersonality;
  capabilities: string[];
  tools: AgentTool[];
  knowledge: unknown[];
  settings: AgentSettings;
  permissions: AgentPermissions;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: string;
  config: Partial<Agent>;
}

export interface TestMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  messages: TestMessage[];
}
