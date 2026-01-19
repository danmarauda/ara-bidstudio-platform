/**
 * MCP (Model Context Protocol) Types and Interfaces
 * Type definitions for MCP server integration and tool management
 * Strict TypeScript - No any, unknown, or void types allowed
 */

import type { Result } from './result';

// =============================================================================
// JSON Value Types - Strict replacements for unknown
// =============================================================================

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonArray
  | JsonObject
  | Record<string, unknown>;

export interface JsonObject extends Record<string, JsonValue> {
  [key: string]: JsonValue;
}

export interface JsonArray extends Array<JsonValue> {}

// Type guards for safe type checking
export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isJsonArray(value: unknown): value is JsonArray {
  return Array.isArray(value);
}

export function isJsonValue(value: unknown): value is JsonValue {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null ||
    isJsonArray(value) ||
    isJsonObject(value)
  );
}

// =============================================================================
// MCP Transport Types
// =============================================================================

export const MCPTransportType = {
  STDIO: 'stdio',
  SSE: 'sse',
  HTTP: 'http',
  WEBSOCKET: 'websocket',
} as const;
export type MCPTransportType =
  (typeof MCPTransportType)[keyof typeof MCPTransportType];

export interface MCPTransportConfig {
  type: MCPTransportType;
  command?: string;
  args?: string[];
  url?: string;
  headers?: Record<string, string>;
  sessionId?: string;
  env?: Record<string, string>;
  timeout?: number;
  retryPolicy?: MCPRetryPolicy;
}

export interface MCPRetryPolicy {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter?: boolean;
}

// =============================================================================
// MCP Server Types
// =============================================================================

export interface MCPServer {
  id: string;
  name: string;
  description?: string;
  transport: MCPTransportConfig;
  status: MCPServerStatus;
  capabilities: MCPServerCapabilities;
  tools: MCPToolDefinition[];
  resources?: MCPResource[];
  version?: string;
  metadata?: MCPServerMetadata;
}

export const MCPServerStatus = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
  DISABLED: 'disabled',
} as const;
export type MCPServerStatus =
  (typeof MCPServerStatus)[keyof typeof MCPServerStatus];

export interface MCPServerCapabilities {
  tools: boolean;
  resources: boolean;
  prompts: boolean;
  logging: boolean;
  experimental?: Record<string, boolean>;
}

export interface MCPServerMetadata {
  author?: string;
  homepage?: string;
  documentation?: string;
  license?: string;
  supportedPlatforms?: string[];
  requiredPermissions?: string[];
}

// =============================================================================
// MCP Tool Types
// =============================================================================

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: MCPToolSchema;
  outputSchema?: MCPToolSchema;
  examples?: MCPToolExample[];
  metadata?: MCPToolMetadata;
}

export interface MCPToolSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  properties?: Record<string, MCPToolProperty>;
  items?: MCPToolProperty;
  required?: string[];
  additionalProperties?: boolean;
  description?: string;
  default?: JsonValue;
}

export interface MCPToolProperty {
  type:
    | 'string'
    | 'number'
    | 'integer'
    | 'boolean'
    | 'array'
    | 'object'
    | 'null';
  description?: string;
  enum?: (string | number | boolean | null)[];
  default?: string | number | boolean | null;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  items?: MCPToolProperty;
  properties?: Record<string, MCPToolProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface MCPToolExample {
  description: string;
  input: JsonObject;
  output?: JsonValue;
  explanation?: string;
}

export interface MCPToolMetadata {
  category?: string;
  tags?: string[];
  costEstimate?: MCPCostEstimate;
  rateLimit?: MCPRateLimit;
  permissions?: string[];
  deprecated?: boolean;
  deprecationMessage?: string;
}

export interface MCPCostEstimate {
  currency: string;
  amount: number;
  unit: 'per_call' | 'per_minute' | 'per_gb';
}

export interface MCPRateLimit {
  requestsPerMinute?: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  concurrentRequests?: number;
}

// =============================================================================
// MCP Resource Types
// =============================================================================

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  metadata?: MCPResourceMetadata;
}

export interface MCPResourceMetadata {
  size?: number;
  lastModified?: number;
  etag?: string;
  permissions?: MCPResourcePermissions;
}

export interface MCPResourcePermissions {
  read: boolean;
  write: boolean;
  execute: boolean;
}

// =============================================================================
// MCP Request/Response Types
// =============================================================================

export interface MCPRequest<T = JsonValue> {
  id: string;
  method: MCPMethod;
  params?: T;
  metadata?: MCPRequestMetadata;
}

export interface MCPRequestMetadata {
  timestamp: number;
  timeout?: number;
  retryCount?: number;
  correlationId?: string;
}

export const MCPMethod = {
  // Tool methods
  LIST_TOOLS: 'tools/list',
  CALL_TOOL: 'tools/call',

  // Resource methods
  LIST_RESOURCES: 'resources/list',
  READ_RESOURCE: 'resources/read',
  WRITE_RESOURCE: 'resources/write',

  // Prompt methods
  LIST_PROMPTS: 'prompts/list',
  GET_PROMPT: 'prompts/get',

  // Server methods
  INITIALIZE: 'initialize',
  SHUTDOWN: 'shutdown',
  PING: 'ping',

  // Logging methods
  SET_LOG_LEVEL: 'logging/setLevel',
  GET_LOGS: 'logging/getLogs',
} as const;
export type MCPMethod = (typeof MCPMethod)[keyof typeof MCPMethod];

export interface MCPResponse<T = JsonValue> {
  id: string;
  result?: T;
  error?: MCPError;
  metadata?: MCPResponseMetadata;
}

export interface MCPResponseMetadata {
  timestamp: number;
  duration?: number;
  serverId?: string;
  serverVersion?: string;
}

export interface MCPError {
  code: MCPErrorCode;
  message: string;
  data?: JsonObject;
}

export const MCPErrorCode = {
  // Standard JSON-RPC errors
  PARSE_ERROR: -32_700,
  INVALID_REQUEST: -32_600,
  METHOD_NOT_FOUND: -32_601,
  INVALID_PARAMS: -32_602,
  INTERNAL_ERROR: -32_603,

  // Custom MCP errors
  SERVER_NOT_FOUND: -32_000,
  TOOL_NOT_FOUND: -32_001,
  RESOURCE_NOT_FOUND: -32_002,
  PERMISSION_DENIED: -32_003,
  RATE_LIMIT_EXCEEDED: -32_004,
  TIMEOUT: -32_005,
  CONNECTION_ERROR: -32_006,
  INVALID_RESPONSE: -32_007,
} as const;
export type MCPErrorCode = (typeof MCPErrorCode)[keyof typeof MCPErrorCode];

// =============================================================================
// MCP Tool Execution Types
// =============================================================================

export interface MCPToolCall {
  toolName: string;
  serverId: string;
  input: JsonObject;
  timeout?: number;
}

export interface MCPToolResult {
  success: boolean;
  output?: JsonValue;
  error?: MCPToolError;
  executionTime: number;
  metadata?: MCPToolResultMetadata;
}

export interface MCPToolError {
  code: string;
  message: string;
  details?: JsonObject;
  retryable?: boolean;
}

export interface MCPToolResultMetadata {
  serverId: string;
  serverVersion?: string;
  cached?: boolean;
  rateLimitRemaining?: number;
}

// =============================================================================
// MCP Configuration Types
// =============================================================================

export interface MCPConfig {
  servers: MCPServerConfig[];
  defaultTimeout?: number;
  maxConcurrentCalls?: number;
  retryPolicy?: MCPRetryPolicy;
  logging?: MCPLoggingConfig;
}

export interface MCPServerConfig {
  id: string;
  name: string;
  transport: MCPTransportConfig;
  enabled?: boolean;
  autoConnect?: boolean;
  priority?: number;
}

export interface MCPLoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  destination: 'console' | 'file' | 'remote';
  format: 'json' | 'text';
  includeTimestamp?: boolean;
  includeServerId?: boolean;
}

// =============================================================================
// MCP Manager Types
// =============================================================================

export interface MCPManager {
  servers: Map<string, MCPServer>;
  config: MCPConfig;
  status: MCPManagerStatus;
}

export const MCPManagerStatus = {
  IDLE: 'idle',
  INITIALIZING: 'initializing',
  READY: 'ready',
  BUSY: 'busy',
  ERROR: 'error',
  SHUTTING_DOWN: 'shutting_down',
} as const;
export type MCPManagerStatus =
  (typeof MCPManagerStatus)[keyof typeof MCPManagerStatus];

// =============================================================================
// Result Type Integration
// =============================================================================

export type MCPResult<T> = Result<T, MCPError>;
export type AsyncMCPResult<T> = Promise<MCPResult<T>>;

// =============================================================================
// MCP Event Types
// =============================================================================

export interface MCPEvent {
  type: MCPEventType;
  serverId?: string;
  data: JsonObject;
  timestamp: number;
}

export const MCPEventType = {
  SERVER_CONNECTED: 'server.connected',
  SERVER_DISCONNECTED: 'server.disconnected',
  SERVER_ERROR: 'server.error',
  TOOL_CALLED: 'tool.called',
  TOOL_COMPLETED: 'tool.completed',
  TOOL_FAILED: 'tool.failed',
  RESOURCE_ACCESSED: 'resource.accessed',
  RATE_LIMIT_WARNING: 'rateLimit.warning',
  CONFIGURATION_CHANGED: 'configuration.changed',
} as const;
export type MCPEventType = (typeof MCPEventType)[keyof typeof MCPEventType];
