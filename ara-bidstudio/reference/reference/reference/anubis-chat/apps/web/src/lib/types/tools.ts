/**
 * Tool Type Definitions for AI SDK v5
 */

import type {
  dynamicTool,
  InferToolInput,
  InferToolOutput,
  InferUITool,
  InferUITools,
  TypedToolCall,
  TypedToolResult,
  tool,
} from 'ai';
import type { z } from 'zod';

// The proper tool type from AI SDK v5 - using ReturnType of tool() function
export type AITool = ReturnType<typeof tool>;

// Dynamic tool type for runtime-defined tools
export type DynamicTool = ReturnType<typeof dynamicTool>;

// Tool collection type
export type AIToolCollection = Record<string, AITool | DynamicTool>;

// Tool definition for creating tools
export interface ToolDefinition<
  TParameters = unknown,
  TExecuteResult = unknown,
> {
  description: string;
  inputSchema: z.ZodSchema<TParameters>;
  execute: (input: TParameters) => Promise<TExecuteResult> | TExecuteResult;
}

// Static tool type for compile-time known tools
export type StaticTool<T extends AITool = AITool> = T;

// Type helpers for working with tool inputs and outputs
export type ToolInput<T extends AITool> = InferToolInput<T>;
export type ToolOutput<T extends AITool> = InferToolOutput<T>;

// Type helpers for UI tools
export type UITool<T extends AITool> = InferUITool<T>;
export type UITools<T extends Record<string, AITool>> = InferUITools<T>;

// Type helpers for typed tool calls and results
export type ToolCall<T extends Record<string, AITool>> = TypedToolCall<T>;
export type ToolResult<T extends Record<string, AITool>> = TypedToolResult<T>;

// Tool metadata for registration
export interface ToolMetadata {
  name: string;
  description: string;
  requiresApproval?: boolean;
  category?: string;
}
