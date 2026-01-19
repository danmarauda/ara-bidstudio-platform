/**
 * AI Integration Type Definitions
 * Comprehensive TypeScript definitions for AI endpoints and responses
 */

import type { LanguageModelUsage } from 'ai';

// =============================================================================
// Base AI Types
// =============================================================================

export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'deepseek';
  contextWindow: number;
  maxTokens: number;
  strengths: string[];
  costTier: 'free' | 'budget' | 'premium';
  isAvailable: boolean;
}

export interface AIUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

// Type alias for AI SDK usage
export type AISDKUsage = LanguageModelUsage;

export interface AIMetadata {
  generationId?: string;
  completionId?: string;
  walletAddress: string;
  timestamp: number;
  schemaType?: string;
}

// =============================================================================
// AI Completion Types
// =============================================================================

export interface CompletionRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  systemPrompt?: string;
}

export interface CompletionResponse {
  id: string;
  model: string;
  text: string;
  finishReason: string;
  usage: AIUsage;
  metadata: AIMetadata;
}

// =============================================================================
// AI Object Generation Types
// =============================================================================

// JSON Schema Property Definition
export interface JSONSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  required?: boolean;
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
  enum?: (string | number)[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
}

// Custom JSON Schema Definition
export interface CustomJSONSchema {
  type: 'object';
  properties: Record<string, JSONSchemaProperty>;
  required?: string[];
  description?: string;
}

// Predefined Schema Types
export type PredefinedSchemaType =
  | 'tasks'
  | 'meetingSummary'
  | 'articleSummary'
  | 'contactInfo'
  | 'jsonStructure';

export interface GenerateObjectRequest {
  prompt: string;
  model?: string;
  schema?: PredefinedSchemaType;
  customSchema?: CustomJSONSchema;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateObjectResponse {
  id: string;
  model: string;
  object: unknown; // The generated object structure depends on schema
  finishReason: string;
  usage: AIUsage;
  metadata: AIMetadata;
}

// =============================================================================
// AI Stream Object Types
// =============================================================================

// Streaming Schema Types
export type StreamingSchemaType =
  | 'notifications'
  | 'taskBreakdown'
  | 'contentAnalysis'
  | 'report'
  | 'quiz';

export interface StreamObjectRequest {
  prompt: string;
  model?: string;
  schema: StreamingSchemaType;
  output?: 'object' | 'array';
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

// Streaming response doesn't have a fixed structure since it streams
export interface StreamObjectHeaders {
  'X-Stream-ID': string;
  'X-Schema-Type': string;
  'X-Output-Type': string;
}

// =============================================================================
// Schema Definition Types for Predefined Schemas
// =============================================================================

// Task schema structure
export interface TaskSchema {
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    category: string;
    estimatedTime: number;
  }>;
}

// Meeting summary schema structure
export interface MeetingSummarySchema {
  title: string;
  date: string;
  participants: string[];
  keyPoints: string[];
  actionItems: Array<{
    task: string;
    assignee: string;
    dueDate: string;
  }>;
  nextSteps: string[];
}

// Article summary schema structure
export interface ArticleSummarySchema {
  title: string;
  mainPoints: string[];
  keyQuotes: string[];
  tags: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  summary: string;
}

// Contact info schema structure
export interface ContactInfoSchema {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  address?: string;
}

// JSON structure schema
export interface JSONStructureSchema {
  data: Record<string, unknown>;
}

// =============================================================================
// Streaming Schema Structures
// =============================================================================

// Notification schema structure
export interface NotificationSchema {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

// Task breakdown schema structure
export interface TaskBreakdownSchema {
  mainTask: string;
  subtasks: Array<{
    id: string;
    title: string;
    description: string;
    dependencies: string[];
    estimatedHours: number;
    priority: 'low' | 'medium' | 'high';
  }>;
}

// Content analysis schema structure
export interface ContentAnalysisSchema {
  summary: string;
  keyTopics: string[];
  sentiment: {
    overall: 'positive' | 'negative' | 'neutral';
    score: number; // -1 to 1
    confidence: number; // 0 to 1
  };
  entities: Array<{
    name: string;
    type: 'person' | 'organization' | 'location' | 'product';
    confidence: number;
  }>;
  categories: string[];
}

// Report schema structure
export interface ReportSchema {
  title: string;
  executive_summary: string;
  sections: Array<{
    heading: string;
    content: string;
    subsections: Array<{
      heading: string;
      content: string;
    }>;
  }>;
  recommendations: string[];
  next_steps: string[];
}

// Quiz schema structure
export interface QuizSchema {
  title: string;
  description: string;
  questions: Array<{
    id: string;
    question: string;
    type: 'multiple_choice' | 'true_false' | 'short_answer';
    options?: string[];
    correct_answer: string;
    explanation: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
}

// =============================================================================
// API Response Types
// =============================================================================

export interface ModelsListResponse {
  models: AIModel[];
  total: number;
  filters: {
    provider?: string;
    availableOnly?: boolean;
    tier?: 'free' | 'budget' | 'premium';
  };
}

export interface SchemasListResponse {
  availableSchemas: Array<{
    name: string;
    description: string;
  }>;
  customSchemaSupported: boolean;
  supportedModels: string[];
}

export interface StreamingSchemasResponse {
  availableSchemas: Array<{
    name: string;
    description: string;
    outputTypes: ('object' | 'array')[];
  }>;
  supportedOutputs: ('object' | 'array')[];
  supportedModels: string[];
  maxDuration: number;
}

// =============================================================================
// Error Types
// =============================================================================

export interface AIErrorResponse {
  error: string;
  details?: Record<string, string[]>;
  code?: string;
}

// =============================================================================
// Utility Types
// =============================================================================

// Union of all predefined schema structures
export type PredefinedSchemaStructure =
  | TaskSchema
  | MeetingSummarySchema
  | ArticleSummarySchema
  | ContactInfoSchema
  | JSONStructureSchema;

// Union of all streaming schema structures
export type StreamingSchemaStructure =
  | NotificationSchema
  | TaskBreakdownSchema
  | ContentAnalysisSchema
  | ReportSchema
  | QuizSchema;

// Generic API response wrapper
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Record<string, string[]>;
}
