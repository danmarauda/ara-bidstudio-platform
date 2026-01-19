/**
 * API Types and Interfaces for anubis.chat
 * Forward-thinking design with extensibility and type safety
 * Strict TypeScript - No any, unknown, or void types allowed
 */

import type { Result } from './result';

// =============================================================================
// Core API Response Types
// =============================================================================

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: APIResponseMetadata;
}

export interface APIResponseMetadata {
  requestId: string;
  timestamp: number;
  version: string;
  correlationId?: string;
  duration?: number;
}

export interface APIError {
  code: APIErrorCode;
  message: string;
  details?: APIErrorDetails;
  timestamp: number;
  requestId: string;
  statusCode?: number;
  path?: string;
  method?: string;
}

export interface APIErrorDetails {
  field?: string;
  value?: string | number | boolean;
  constraint?: string;
  context?: Record<string, string | number | boolean>;
  stack?: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    cursor?: string;
    nextCursor?: string;
    hasMore: boolean;
    total?: number;
    limit: number;
  };
}

// =============================================================================
// Authentication Types
// =============================================================================

export interface WalletAuthChallenge {
  challenge: string;
  expiresAt: string;
  nonce: string;
}

export interface WalletAuthVerification {
  message: string;
  signature: string;
  publicKey: string;
}

export interface AuthSession {
  walletAddress: string;
  publicKey: string;
  token: string;
  refreshToken: string;
  expiresAt: number;
  user: UserProfile;
}

// =============================================================================
// User Types
// =============================================================================

export interface UserProfile {
  _id: string;
  walletAddress: string;
  publicKey: string;
  displayName?: string;
  avatar?: string;
  preferences: UserPreferences;
  subscription: UserSubscription;
  createdAt: number;
  lastActiveAt: number;
  isActive: boolean;
}

// Type alias for convenience
export type User = UserProfile;

export const Theme = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;
export type Theme = (typeof Theme)[keyof typeof Theme];

export const Language = {
  EN: 'en',
  ES: 'es',
  FR: 'fr',
  DE: 'de',
  ZH: 'zh',
  JA: 'ja',
  KO: 'ko',
  PT: 'pt',
  RU: 'ru',
  AR: 'ar',
} as const;
export type Language = (typeof Language)[keyof typeof Language];

export interface UserPreferences {
  theme: Theme;
  aiModel: string;
  notifications: boolean;
  language?: Language;
  temperature?: number;
  maxTokens?: number;
  streamResponses?: boolean;
  saveHistory?: boolean;
  compactMode?: boolean;
  // Chat/UI preferences
  fontSize?: 'small' | 'medium' | 'large';
  autoScroll?: boolean;
  // Behavior/memory
  enableMemory?: boolean;
  // Model defaults
  defaultModel?: string;
}

export const SubscriptionTier = {
  FREE: 'free',
  STARTER: 'starter',
  PRO: 'pro',
  TEAM: 'team',
  ENTERPRISE: 'enterprise',
} as const;
export type SubscriptionTier =
  (typeof SubscriptionTier)[keyof typeof SubscriptionTier];

export const SubscriptionFeature = {
  BASIC_CHAT: 'basic_chat',
  DOCUMENT_UPLOAD: 'document_upload',
  ADVANCED_MODELS: 'advanced_models',
  UNLIMITED_TOKENS: 'unlimited_tokens',
  PRIORITY_SUPPORT: 'priority_support',
  CUSTOM_TOOLS: 'custom_tools',
  TEAM_COLLABORATION: 'team_collaboration',
  API_ACCESS: 'api_access',
  WEBHOOK_INTEGRATION: 'webhook_integration',
  CUSTOM_BRANDING: 'custom_branding',
  AUDIT_LOGS: 'audit_logs',
} as const;
export type SubscriptionFeature =
  (typeof SubscriptionFeature)[keyof typeof SubscriptionFeature];

export interface UserSubscription {
  tier: SubscriptionTier;
  expiresAt?: number;
  tokensUsed: number;
  tokensLimit: number;
  features: SubscriptionFeature[];
  billingCycle?: 'monthly' | 'yearly';
  autoRenew?: boolean;
}

// =============================================================================
// Chat Types
// =============================================================================

export interface Chat {
  _id: string;
  walletAddress: string;
  title: string;
  description?: string;
  model: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  isArchived: boolean;
  isPinned: boolean;
  messageCount: number;
  tokensUsed: number;
  tokenUsage?: {
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalTokens: number;
    totalCachedTokens: number;
    totalEstimatedCost: number;
    messageCount: number;
  };
  createdAt: number;
  updatedAt: number;
  lastMessageAt?: number;
}

export const MessageRole = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
  TOOL: 'tool',
  FUNCTION: 'function',
} as const;
export type MessageRole = (typeof MessageRole)[keyof typeof MessageRole];

export const MessageStatus = {
  PENDING: 'pending',
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
  DELETED: 'deleted',
} as const;
export type MessageStatus = (typeof MessageStatus)[keyof typeof MessageStatus];

export interface MessageAttachment {
  fileId: string;
  url?: string;
  mimeType: string;
  size: number;
  type: 'image' | 'file' | 'video';
}

export interface ChatMessage {
  _id: string;
  chatId: string;
  walletAddress: string;
  role: MessageRole;
  content: string;
  attachments?: MessageAttachment[];
  tokenCount?: number;
  embedding?: number[];
  metadata?: MessageMetadata;
  status?: MessageStatus;
  parentMessageId?: string;
  createdAt: number;
  updatedAt?: number;
  editedAt?: number;
}

// Lightweight message used during UI streaming before persistence
export type StreamingMessage = {
  id: string;
  content: string;
  role: MessageRole;
  isStreaming?: boolean;
};

export interface MessageMetadata {
  model?: string;
  finishReason?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  tools?: ToolCall[];
  reasoning?: string;
  citations?: string[];
}

export interface ToolCall {
  id: string;
  name: string;
  args: ToolCallArguments;
  result?: ToolCallResult;
}

export interface ToolCallArguments {
  [key: string]:
    | string
    | number
    | boolean
    | null
    | ToolCallArguments
    | ToolCallArguments[];
}

export interface ToolCallResult {
  success: boolean;
  data?: string | number | boolean | Record<string, unknown>;
  error?: string;
  executionTime?: number;
}

// =============================================================================
// AI Integration Types
// =============================================================================

export const AIProvider = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  DEEPSEEK: 'deepseek',
  GOOGLE: 'google',
  MISTRAL: 'mistral',
  COHERE: 'cohere',
  HUGGINGFACE: 'huggingface',
} as const;
export type AIProvider = (typeof AIProvider)[keyof typeof AIProvider];

export const AICostTier = {
  FREE: 'free',
  BUDGET: 'budget',
  STANDARD: 'standard',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise',
} as const;
export type AICostTier = (typeof AICostTier)[keyof typeof AICostTier];

export const AIModelCapability = {
  TEXT_GENERATION: 'text_generation',
  CODE_GENERATION: 'code_generation',
  REASONING: 'reasoning',
  VISION: 'vision',
  FUNCTION_CALLING: 'function_calling',
  STREAMING: 'streaming',
  EMBEDDINGS: 'embeddings',
} as const;
export type AIModelCapability =
  (typeof AIModelCapability)[keyof typeof AIModelCapability];

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  contextWindow: number;
  maxTokens: number;
  strengths: string[];
  capabilities: AIModelCapability[];
  costTier: AICostTier;
  isAvailable: boolean;
  version?: string;
  releaseDate?: number;
  deprecatedDate?: number;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: Tool[];
  systemPrompt?: string;
}

export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameters;
  required?: string[];
  category?: ToolCategory;
}

export interface ToolParameters {
  type: 'object';
  properties: Record<string, ToolParameterProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface ToolParameterProperty {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: (string | number)[];
  default?: string | number | boolean | null;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  items?: ToolParameterProperty;
  properties?: Record<string, ToolParameterProperty>;
}

export const ToolCategory = {
  DATA_RETRIEVAL: 'data_retrieval',
  COMPUTATION: 'computation',
  COMMUNICATION: 'communication',
  FILE_SYSTEM: 'file_system',
  WEB_API: 'web_api',
  BLOCKCHAIN: 'blockchain',
  CUSTOM: 'custom',
} as const;
export type ToolCategory = (typeof ToolCategory)[keyof typeof ToolCategory];

export interface StreamingResponse {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: StreamingChoice[];
}

export interface StreamingChoice {
  index: number;
  delta: {
    content?: string;
    role?: string;
    tool_calls?: ToolCall[];
  };
  finish_reason?: string;
}

// =============================================================================
// Document Types - imported from documents.ts to avoid conflicts
// =============================================================================

// Import document types from the comprehensive documents module
export type {
  Document,
  DocumentChunk,
  DocumentMetadata,
  DocumentSearchRequest,
  DocumentSearchResponse,
  DocumentSearchResult,
  DocumentType,
} from './documents';

// =============================================================================
// Search Types
// =============================================================================

export const SearchType = {
  SEMANTIC: 'semantic',
  HYBRID: 'hybrid',
  KEYWORD: 'keyword',
  FUZZY: 'fuzzy',
  VECTOR: 'vector',
} as const;
export type SearchType = (typeof SearchType)[keyof typeof SearchType];

export interface SearchRequest {
  query: string;
  type: SearchType;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
  threshold?: number;
  sort?: SearchSort[];
  highlight?: boolean;
}

export interface SearchSort {
  field: string;
  order: SortOrder;
}

export interface SearchFilters {
  chatIds?: string[];
  documentIds?: string[];
  dateRange?: DateRange;
  messageTypes?: MessageRole[];
  tags?: string[];
  walletAddresses?: string[];
  models?: string[];
}

export interface DateRange {
  start: number;
  end: number;
  timezone?: string;
}

export const SearchResultType = {
  MESSAGE: 'message',
  DOCUMENT: 'document',
  CHAT: 'chat',
  USER: 'user',
  AGENT: 'agent',
} as const;
export type SearchResultType =
  (typeof SearchResultType)[keyof typeof SearchResultType];

export interface SearchResult {
  id: string;
  type: SearchResultType;
  content: string;
  score: number;
  highlights?: string[];
  metadata: SearchResultMetadata;
  relevance?: number;
}

export interface SearchResultMetadata {
  chatId?: string;
  messageId?: string;
  documentId?: string;
  chunkId?: string;
  title?: string;
  createdAt: number;
  context?: string;
}

// =============================================================================
// Request/Response Schemas
// =============================================================================

export interface CreateChatRequest {
  title: string;
  model: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  initialMessage?: string;
}

export interface UpdateChatRequest {
  title?: string;
  description?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  isPinned?: boolean;
}

export interface SendMessageRequest {
  content: string;
  role?: 'user';
  metadata?: Partial<MessageMetadata>;
}

export interface RegenerateMessageRequest {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

// =============================================================================
// Webhook Types
// =============================================================================

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  data: WebhookEventData;
  timestamp: number;
  signature: string;
  version?: string;
}

export const WebhookEventType = {
  CHAT_CREATED: 'chat.created',
  CHAT_UPDATED: 'chat.updated',
  CHAT_DELETED: 'chat.deleted',
  MESSAGE_SENT: 'message.sent',
  MESSAGE_RECEIVED: 'message.received',
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  SUBSCRIPTION_CHANGED: 'subscription.changed',
  TOKEN_LIMIT_REACHED: 'token_limit.reached',
  ERROR_OCCURRED: 'error.occurred',
} as const;
export type WebhookEventType =
  (typeof WebhookEventType)[keyof typeof WebhookEventType];

export interface WebhookEventData {
  resourceId: string;
  resourceType: 'chat' | 'message' | 'user' | 'subscription';
  action: 'created' | 'updated' | 'deleted' | 'sent' | 'received';
  payload: Record<string, string | number | boolean | null>;
  userId?: string;
  metadata?: Record<string, string | number | boolean>;
}

// =============================================================================
// Rate Limiting Types
// =============================================================================

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

// =============================================================================
// Result Type Integration
// =============================================================================

export type APIResult<T> = Result<T, APIError>;
export type AsyncAPIResult<T> = Promise<APIResult<T>>;

// =============================================================================
// Common Enums
// =============================================================================

export const SortOrder = {
  ASC: 'asc',
  DESC: 'desc',
} as const;
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];

export const FilterOperator = {
  EQUALS: 'eq',
  NOT_EQUALS: 'ne',
  GREATER_THAN: 'gt',
  GREATER_THAN_OR_EQUAL: 'gte',
  LESS_THAN: 'lt',
  LESS_THAN_OR_EQUAL: 'lte',
  IN: 'in',
  NOT_IN: 'nin',
  CONTAINS: 'contains',
  STARTS_WITH: 'starts_with',
  ENDS_WITH: 'ends_with',
} as const;
export type FilterOperator =
  (typeof FilterOperator)[keyof typeof FilterOperator];

export const CacheStrategy = {
  NO_CACHE: 'no-cache',
  NO_STORE: 'no-store',
  RELOAD: 'reload',
  FORCE_CACHE: 'force-cache',
  ONLY_IF_CACHED: 'only-if-cached',
} as const;
export type CacheStrategy = (typeof CacheStrategy)[keyof typeof CacheStrategy];

// =============================================================================
// Error Types
// =============================================================================

export const APIErrorCode = {
  // Authentication
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
  MISSING_PARAMETERS: 'MISSING_PARAMETERS',

  // Resources
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  RESOURCE_LIMIT_EXCEEDED: 'RESOURCE_LIMIT_EXCEEDED',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',

  // AI/Model
  MODEL_UNAVAILABLE: 'MODEL_UNAVAILABLE',
  CONTEXT_TOO_LONG: 'CONTEXT_TOO_LONG',
  UNSAFE_CONTENT: 'UNSAFE_CONTENT',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
} as const;
export type APIErrorCode = (typeof APIErrorCode)[keyof typeof APIErrorCode];
// =============================================================================
// Assistant & Thread Management Types
// =============================================================================

export interface Assistant {
  id: string;
  name: string;
  description?: string;
  model: string;
  instructions?: string;
  tools: AssistantTool[];
  fileIds: string[];
  metadata?: Record<string, string>;
  temperature?: number;
  topP?: number;
  responseFormat?: ResponseFormat;
  createdAt: number;
  updatedAt: number;
  walletAddress: string;
}

export interface AssistantTool {
  type: 'code_interpreter' | 'file_search' | 'function';
  function?: FunctionDefinition;
}

export interface FunctionDefinition {
  name: string;
  description?: string;
  parameters: Record<string, unknown>;
}

export interface ResponseFormat {
  type: 'text' | 'json_object';
}

export interface Thread {
  id: string;
  metadata?: Record<string, string>;
  createdAt: number;
  updatedAt: number;
  walletAddress: string;
}

export interface ThreadMessage {
  id: string;
  threadId: string;
  role: 'user' | 'assistant';
  content: MessageContent[];
  assistantId?: string;
  runId?: string;
  fileIds: string[];
  metadata?: Record<string, string>;
  createdAt: number;
}

export interface MessageContent {
  type: 'text' | 'image_file' | 'image_url';
  text?: TextContent;
  imageFile?: ImageFileContent;
  imageUrl?: ImageUrlContent;
}

export interface TextContent {
  value: string;
  annotations?: Annotation[];
}

export interface Annotation {
  type: 'file_citation' | 'file_path';
  text: string;
  fileCitation?: FileCitation;
  filePath?: FilePath;
  startIndex: number;
  endIndex: number;
}

export interface FileCitation {
  fileId: string;
  quote?: string;
}

export interface FilePath {
  fileId: string;
}

export interface ImageFileContent {
  fileId: string;
  detail?: 'auto' | 'low' | 'high';
}

export interface ImageUrlContent {
  url: string;
  detail?: 'auto' | 'low' | 'high';
}

export interface Run {
  id: string;
  threadId: string;
  assistantId: string;
  status: RunStatus;
  requiredAction?: RequiredAction;
  lastError?: RunError;
  expiresAt?: number;
  startedAt?: number;
  cancelledAt?: number;
  failedAt?: number;
  completedAt?: number;
  model: string;
  instructions?: string;
  tools: AssistantTool[];
  fileIds: string[];
  metadata?: Record<string, string>;
  usage?: Usage;
  temperature?: number;
  topP?: number;
  maxPromptTokens?: number;
  maxCompletionTokens?: number;
  truncationStrategy?: TruncationStrategy;
  responseFormat?: ResponseFormat;
  toolChoice?: ToolChoice;
  createdAt: number;
}

export type RunStatus =
  | 'queued'
  | 'in_progress'
  | 'requires_action'
  | 'cancelling'
  | 'cancelled'
  | 'failed'
  | 'completed'
  | 'expired';

export interface RequiredAction {
  type: 'submit_tool_outputs';
  submitToolOutputs: {
    toolCalls: ToolCall[];
  };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface RunError {
  code: 'server_error' | 'rate_limit_exceeded' | 'invalid_prompt';
  message: string;
}

export interface Usage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface TruncationStrategy {
  type: 'auto' | 'last_messages';
  lastMessages?: number;
}

export type ToolChoice =
  | 'none'
  | 'auto'
  | 'required'
  | { type: 'function'; function: { name: string } };

// =============================================================================
// Vector Store & Embeddings Types
// =============================================================================

export interface VectorStore {
  id: string;
  name: string;
  description?: string;
  fileCounts: {
    inProgress: number;
    completed: number;
    failed: number;
    cancelled: number;
    total: number;
  };
  status: 'expired' | 'in_progress' | 'completed';
  expiresAfter?: ExpiresAfter;
  expiresAt?: number;
  lastActiveAt: number;
  metadata?: Record<string, string>;
  createdAt: number;
  updatedAt: number;
  walletAddress: string;
}

export interface ExpiresAfter {
  anchor: 'last_active_at';
  days: number;
}

export interface VectorStoreFile {
  id: string;
  vectorStoreId: string;
  fileId: string;
  status: 'in_progress' | 'completed' | 'cancelled' | 'failed';
  lastError?: VectorStoreFileError;
  chunkingStrategy?: ChunkingStrategy;
  createdAt: number;
}

export interface VectorStoreFileError {
  code:
    | 'internal_error'
    | 'file_not_found'
    | 'parsing_error'
    | 'unhandled_mime_type';
  message: string;
}

export interface ChunkingStrategy {
  type: 'static' | 'auto';
  static?: {
    maxChunkSizeTokens: number;
    chunkOverlapTokens: number;
  };
}

export interface Embedding {
  object: 'embedding';
  embedding: number[];
  index: number;
}

export interface EmbeddingRequest {
  input: string | string[];
  model:
    | 'text-embedding-ada-002'
    | 'text-embedding-3-small'
    | 'text-embedding-3-large';
  encodingFormat?: 'float' | 'base64';
  dimensions?: number;
  user?: string;
}

export interface EmbeddingResponse {
  object: 'list';
  data: Embedding[];
  model: string;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

// =============================================================================
// File Management Types
// =============================================================================

export interface FileObject {
  id: string;
  object: 'file';
  bytes: number;
  created_at: number;
  filename: string;
  purpose: 'assistants' | 'vision' | 'batch' | 'fine-tune';
  status:
    | 'uploaded'
    | 'processing'
    | 'processed'
    | 'error'
    | 'deleting'
    | 'deleted';
  status_details: string | null;
}

export interface FileUploadResponse extends FileObject {
  // Response from file upload
}

export interface FileListResponse {
  object: 'list';
  data: FileObject[];
  has_more: boolean;
  first_id?: string;
  last_id?: string;
}

export interface FileDeleteResponse {
  id: string;
  object: 'file';
  deleted: boolean;
}

// =============================================================================
// Knowledge Base Types
// =============================================================================

export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  type: 'documents' | 'urls' | 'api' | 'database';
  vectorStoreId?: string;
  sources: KnowledgeSource[];
  syncSchedule?: SyncSchedule;
  lastSyncAt?: number;
  status: 'active' | 'syncing' | 'error' | 'disabled';
  metadata?: Record<string, string>;
  createdAt: number;
  updatedAt: number;
  walletAddress: string;
}

export interface KnowledgeSource {
  id: string;
  type: 'file' | 'url' | 'api_endpoint' | 'database_query';
  name: string;
  config: SourceConfig;
  lastSyncAt?: number;
  status: 'active' | 'error' | 'disabled';
  errorMessage?: string;
}

export interface SourceConfig {
  // For files
  fileId?: string;

  // For URLs
  url?: string;
  crawlDepth?: number;
  includePatterns?: string[];
  excludePatterns?: string[];

  // For APIs
  endpoint?: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: unknown;

  // For databases
  connectionString?: string;
  query?: string;
}

export interface SyncSchedule {
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'manual';
  dayOfWeek?: number;
  hourOfDay?: number;
  timezone?: string;
}

// =============================================================================
// Team & Collaboration Types
// =============================================================================

export interface Team {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  ownerId: string;
  members: TeamMember[];
  settings: TeamSettings;
  subscription?: TeamSubscription;
  createdAt: number;
  updatedAt: number;
}

export interface TeamMember {
  walletAddress: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  displayName?: string;
  avatar?: string;
  joinedAt: number;
  lastActiveAt: number;
  permissions: Permission[];
}

export interface Permission {
  resource: 'chats' | 'agents' | 'documents' | 'workflows' | 'team_settings';
  actions: ('create' | 'read' | 'update' | 'delete' | 'share')[];
}

export interface TeamSettings {
  defaultModel?: string;
  sharedVectorStores: string[];
  sharedAgents: string[];
  allowGuestAccess: boolean;
  requireApproval: boolean;
  dataRetentionDays?: number;
}

export interface TeamSubscription {
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'past_due' | 'cancelled' | 'paused';
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  seats: number;
  usedSeats: number;
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  invitedBy: string;
  invitedEmail?: string;
  invitedWallet?: string;
  role: 'admin' | 'member' | 'viewer';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: number;
  createdAt: number;
}

// =============================================================================
// Voice & Multimodal Types
// =============================================================================

export interface TranscriptionRequest {
  file: File;
  model: 'whisper-1';
  language?: string;
  prompt?: string;
  responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  temperature?: number;
  timestampGranularities?: ('word' | 'segment')[];
}

export interface TranscriptionResponse {
  text: string;
  language?: string;
  duration?: number;
  words?: TranscriptionWord[];
  segments?: TranscriptionSegment[];
}

export interface TranscriptionWord {
  word: string;
  start: number;
  end: number;
}

export interface TranscriptionSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avgLogprob: number;
  compressionRatio: number;
  noSpeechProb: number;
}

export interface TextToSpeechRequest {
  model: 'tts-1' | 'tts-1-hd';
  input: string;
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  responseFormat?: 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm';
  speed?: number;
}

export interface ImageGenerationRequest {
  prompt: string;
  model?: 'dall-e-2' | 'dall-e-3';
  n?: number;
  quality?: 'standard' | 'hd';
  responseFormat?: 'url' | 'b64_json';
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  style?: 'vivid' | 'natural';
  user?: string;
}

export interface ImageGenerationResponse {
  created: number;
  data: GeneratedImage[];
}

export interface GeneratedImage {
  url?: string;
  b64Json?: string;
  revisedPrompt?: string;
}

export interface ImageEditRequest {
  image: File;
  prompt: string;
  mask?: File;
  model?: 'dall-e-2';
  n?: number;
  size?: '256x256' | '512x512' | '1024x1024';
  responseFormat?: 'url' | 'b64_json';
  user?: string;
}

export interface VisionAnalysisRequest {
  model: 'gpt-4-vision-preview';
  messages: VisionMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface VisionMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | VisionContent[];
}

export interface VisionContent {
  type: 'text' | 'image_url';
  text?: string;
  imageUrl?: {
    url: string;
    detail?: 'auto' | 'low' | 'high';
  };
}

// =============================================================================
// Analytics & Monitoring Types
// =============================================================================

export interface UsageMetrics {
  period: 'day' | 'week' | 'month' | 'year';
  startDate: string;
  endDate: string;
  metrics: {
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    byModel: Record<string, ModelUsage>;
    byEndpoint: Record<string, EndpointUsage>;
    byUser?: Record<string, UserUsage>;
  };
}

export interface ModelUsage {
  requests: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

export interface EndpointUsage {
  requests: number;
  errors: number;
  avgLatency: number;
  p95Latency: number;
  p99Latency: number;
}

export interface UserUsage {
  requests: number;
  tokens: number;
  cost: number;
  lastActiveAt: number;
}

export interface PerformanceMetrics {
  endpoint: string;
  period: 'hour' | 'day' | 'week';
  metrics: {
    requestCount: number;
    errorRate: number;
    avgLatency: number;
    p50Latency: number;
    p95Latency: number;
    p99Latency: number;
    throughput: number;
  };
  timeSeries: TimeSeriesPoint[];
}

export interface TimeSeriesPoint {
  timestamp: number;
  value: number;
}

export interface AuditLog {
  id: string;
  timestamp: number;
  walletAddress: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

// =============================================================================
// Webhook Types
// =============================================================================

export interface Webhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  secret?: string;
  description?: string;
  active: boolean;
  headers?: Record<string, string>;
  retryPolicy?: RetryPolicy;
  lastTriggeredAt?: number;
  failureCount: number;
  metadata?: Record<string, string>;
  createdAt: number;
  updatedAt: number;
  walletAddress: string;
}

export type WebhookEventName =
  | 'chat.created'
  | 'chat.message.created'
  | 'chat.message.updated'
  | 'agent.created'
  | 'agent.executed'
  | 'workflow.started'
  | 'workflow.completed'
  | 'workflow.failed'
  | 'document.created'
  | 'document.processed'
  | 'vector_store.updated'
  | 'team.member.added'
  | 'team.member.removed';

export interface RetryPolicy {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: unknown;
  response?: {
    status: number;
    headers: Record<string, string>;
    body: string;
  };
  attempts: number;
  success: boolean;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

// =============================================================================
// Billing & Subscription Types
// =============================================================================

export interface Subscription {
  id: string;
  walletAddress: string;
  teamId?: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: number;
  trialStart?: number;
  trialEnd?: number;
  paymentMethod?: PaymentMethod;
  metadata?: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: PlanFeature[];
  limits: PlanLimits;
}

export interface PlanFeature {
  name: string;
  description?: string;
  enabled: boolean;
}

export interface PlanLimits {
  maxRequests?: number;
  maxTokens?: number;
  maxDocuments?: number;
  maxVectorStores?: number;
  maxTeamMembers?: number;
  maxFileSize?: number;
  dataRetentionDays?: number;
}

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'crypto' | 'bank_transfer';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  walletAddress?: string;
  isDefault: boolean;
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  walletAddress: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  dueDate: number;
  paidAt?: number;
  periodStart: number;
  periodEnd: number;
  items: InvoiceItem[];
  metadata?: Record<string, string>;
  createdAt: number;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  metadata?: Record<string, string>;
}

// =============================================================================
// Integration Types
// =============================================================================

export interface Integration {
  id: string;
  type: 'github' | 'slack' | 'discord' | 'notion' | 'linear' | 'jira';
  name: string;
  description?: string;
  config: IntegrationConfig;
  status: 'connected' | 'disconnected' | 'error';
  lastSyncAt?: number;
  errorMessage?: string;
  metadata?: Record<string, string>;
  createdAt: number;
  updatedAt: number;
  walletAddress: string;
}

export interface IntegrationConfig {
  // GitHub
  githubToken?: string;
  githubOrg?: string;
  githubRepo?: string;

  // Slack
  slackToken?: string;
  slackChannel?: string;
  slackWebhookUrl?: string;

  // Discord
  discordToken?: string;
  discordGuildId?: string;
  discordChannelId?: string;

  // Notion
  notionToken?: string;
  notionDatabaseId?: string;

  // Linear
  linearApiKey?: string;
  linearTeamId?: string;

  // Jira
  jiraUrl?: string;
  jiraEmail?: string;
  jiraApiToken?: string;
  jiraProjectKey?: string;
}

// =============================================================================
// Export/Import Types
// =============================================================================

export interface DataExport {
  id: string;
  walletAddress: string;
  type: 'full' | 'chats' | 'documents' | 'agents' | 'workflows';
  format: 'json' | 'csv' | 'markdown';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  expiresAt?: number;
  errorMessage?: string;
  metadata?: Record<string, string>;
  createdAt: number;
  completedAt?: number;
}

export interface DataImport {
  id: string;
  walletAddress: string;
  type: 'full' | 'chats' | 'documents' | 'agents' | 'workflows';
  format: 'json' | 'csv';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl: string;
  processedItems: number;
  totalItems: number;
  errors: ImportError[];
  metadata?: Record<string, string>;
  createdAt: number;
  completedAt?: number;
}

export interface ImportError {
  line?: number;
  field?: string;
  value?: unknown;
  message: string;
}

// =============================================================================
// Fine-tuning Types
// =============================================================================

export interface FineTuningJob {
  id: string;
  model: string;
  trainingFile: string;
  validationFile?: string;
  hyperparameters?: HyperParameters;
  suffix?: string;
  status:
    | 'validating_files'
    | 'queued'
    | 'running'
    | 'succeeded'
    | 'failed'
    | 'cancelled';
  fineTunedModel?: string;
  error?: FineTuningError;
  createdAt: number;
  finishedAt?: number;
  walletAddress: string;
}

export interface HyperParameters {
  batchSize?: number | 'auto';
  learningRateMultiplier?: number | 'auto';
  nEpochs?: number | 'auto';
}

export interface FineTuningError {
  code: string;
  message: string;
  param?: string;
}

export interface TrainingData {
  id: string;
  fineTuningJobId: string;
  messages: TrainingMessage[];
  metadata?: Record<string, string>;
  createdAt: number;
}

export interface TrainingMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  weight?: number;
}

// =============================================================================
// Code Interpreter Types
// =============================================================================

export interface CodeExecution {
  id: string;
  language: 'python' | 'javascript' | 'typescript' | 'sql';
  code: string;
  output?: CodeOutput;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: CodeError;
  executionTime?: number;
  memoryUsed?: number;
  createdAt: number;
  completedAt?: number;
  walletAddress: string;
}

export interface CodeOutput {
  stdout?: string;
  stderr?: string;
  result?: unknown;
  files?: GeneratedFile[];
  images?: GeneratedImage[];
}

export interface CodeError {
  type: 'syntax' | 'runtime' | 'timeout' | 'memory_limit';
  message: string;
  line?: number;
  column?: number;
}

export interface GeneratedFile {
  name: string;
  content: string;
  mimeType: string;
  size: number;
}

// =============================================================================
// Request/Response Types for New Endpoints
// =============================================================================

// Assistant endpoints
export interface CreateAssistantRequest {
  model: string;
  name?: string;
  description?: string;
  instructions?: string;
  tools?: AssistantTool[];
  fileIds?: string[];
  metadata?: Record<string, string>;
  temperature?: number;
  topP?: number;
  responseFormat?: ResponseFormat;
}

export interface UpdateAssistantRequest
  extends Partial<CreateAssistantRequest> {}

export interface ListAssistantsRequest {
  limit?: number;
  order?: 'asc' | 'desc';
  after?: string;
  before?: string;
}

// Thread endpoints
export interface CreateThreadRequest {
  messages?: CreateMessageRequest[];
  metadata?: Record<string, string>;
}

export interface CreateMessageRequest {
  role: 'user' | 'assistant';
  content: string | MessageContent[];
  fileIds?: string[];
  metadata?: Record<string, string>;
}

export interface CreateRunRequest {
  assistantId: string;
  model?: string;
  instructions?: string;
  additionalInstructions?: string;
  additionalMessages?: CreateMessageRequest[];
  tools?: AssistantTool[];
  metadata?: Record<string, string>;
  temperature?: number;
  topP?: number;
  stream?: boolean;
  maxPromptTokens?: number;
  maxCompletionTokens?: number;
  truncationStrategy?: TruncationStrategy;
  toolChoice?: ToolChoice;
  responseFormat?: ResponseFormat;
}

// Vector Store endpoints
export interface CreateVectorStoreRequest {
  fileIds?: string[];
  name?: string;
  expiresAfter?: ExpiresAfter;
  metadata?: Record<string, string>;
}

export interface UpdateVectorStoreRequest {
  name?: string;
  expiresAfter?: ExpiresAfter;
  metadata?: Record<string, string>;
}

export interface CreateVectorStoreFileRequest {
  fileId: string;
  chunkingStrategy?: ChunkingStrategy;
}

// Knowledge Base endpoints
export interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string;
  type: 'documents' | 'urls' | 'api' | 'database';
  sources: Omit<
    KnowledgeSource,
    'id' | 'lastSyncAt' | 'status' | 'errorMessage'
  >[];
  syncSchedule?: SyncSchedule;
  metadata?: Record<string, string>;
}

export interface UpdateKnowledgeBaseRequest
  extends Partial<CreateKnowledgeBaseRequest> {}

// Team endpoints
export interface CreateTeamRequest {
  name: string;
  description?: string;
  avatar?: string;
}

export interface UpdateTeamRequest extends Partial<CreateTeamRequest> {
  settings?: Partial<TeamSettings>;
}

export interface InviteTeamMemberRequest {
  email?: string;
  walletAddress?: string;
  role: 'admin' | 'member' | 'viewer';
  message?: string;
}

export interface UpdateTeamMemberRequest {
  role?: 'admin' | 'member' | 'viewer';
  permissions?: Permission[];
}

// Webhook endpoints
export interface CreateWebhookRequest {
  url: string;
  events: WebhookEvent[];
  secret?: string;
  description?: string;
  headers?: Record<string, string>;
  retryPolicy?: RetryPolicy;
  metadata?: Record<string, string>;
}

export interface UpdateWebhookRequest extends Partial<CreateWebhookRequest> {
  active?: boolean;
}

export interface TestWebhookRequest {
  event: WebhookEvent;
  payload?: unknown;
}

// Analytics endpoints
export interface GetUsageMetricsRequest {
  period: 'day' | 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
  groupBy?: 'model' | 'endpoint' | 'user';
}

export interface GetPerformanceMetricsRequest {
  endpoint?: string;
  period: 'hour' | 'day' | 'week';
  startTime?: number;
  endTime?: number;
}

export interface GetAuditLogsRequest {
  startTime?: number;
  endTime?: number;
  walletAddress?: string;
  action?: string;
  resource?: string;
  limit?: number;
  cursor?: string;
}

// Export/Import endpoints
export interface CreateExportRequest {
  type: 'full' | 'chats' | 'documents' | 'agents' | 'workflows';
  format: 'json' | 'csv' | 'markdown';
  dateRange?: {
    start: number;
    end: number;
  };
  metadata?: Record<string, string>;
}

export interface CreateImportRequest {
  type: 'full' | 'chats' | 'documents' | 'agents' | 'workflows';
  format: 'json' | 'csv';
  fileUrl: string;
  options?: {
    overwrite?: boolean;
    skipErrors?: boolean;
  };
  metadata?: Record<string, string>;
}

// Integration endpoints
export interface CreateIntegrationRequest {
  type: 'github' | 'slack' | 'discord' | 'notion' | 'linear' | 'jira';
  name: string;
  description?: string;
  config: IntegrationConfig;
  metadata?: Record<string, string>;
}

export interface UpdateIntegrationRequest
  extends Partial<CreateIntegrationRequest> {}

// Fine-tuning endpoints
export interface CreateFineTuningJobRequest {
  model: string;
  trainingFile: string;
  validationFile?: string;
  hyperparameters?: HyperParameters;
  suffix?: string;
}

export interface CreateTrainingDataRequest {
  messages: TrainingMessage[];
  metadata?: Record<string, string>;
}

// Code execution endpoints
export interface ExecuteCodeRequest {
  language: 'python' | 'javascript' | 'typescript' | 'sql';
  code: string;
  timeout?: number;
  memoryLimit?: number;
}
