// Comprehensive TypeScript interfaces for the Chat system
// This file provides type safety for all chat-related operations

import type { Id, Doc } from '../_generated/dataModel';

// =============================================================================
// Message Types
// =============================================================================

export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageReaction = 'like' | 'dislike' | 'love' | 'celebrate' | 'insightful';
export type AttachmentType = 'image' | 'file' | 'video';

export interface MessageAttachment {
  fileId: string;
  url?: string;
  mimeType: string;
  size: number;
  type: AttachmentType;
}

export interface ToolUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface ToolExecution {
  id: string;
  name: string;
  args: Record<string, string | number | boolean | null>;
  result?: {
    success: boolean;
    data?: Record<string, string | number | boolean | null>;
    error?: string;
    executionTime?: number;
  };
}

export interface MessageMetadata {
  model?: string;
  finishReason?: string;
  usage?: ToolUsage;
  tools?: ToolExecution[];
  reasoning?: string;
  citations?: string[]; // Document IDs for RAG
  attachments?: MessageAttachment[];
  // Message editing and regeneration tracking
  edited?: boolean;
  editedAt?: number;
  regenerated?: boolean;
  regeneratedAt?: number;
  // Message reactions system
  reactions?: Record<string, MessageReaction[]>; // userId -> reactions
  lastReactionAt?: number;
}

export interface MessageRating {
  userRating: 'like' | 'dislike';
  ratedAt: number;
  ratedBy: string; // walletAddress
}

export interface MessageActions {
  copiedCount?: number;
  sharedCount?: number;
  regeneratedCount?: number;
  lastActionAt?: number;
}

export type Message = Doc<'messages'>;

// =============================================================================
// Chat Types
// =============================================================================

export interface TokenUsage {
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalCachedTokens: number;
  totalEstimatedCost: number;
  messageCount: number;
}

export type Chat = Doc<'chats'>;

// =============================================================================
// Chat Operation Types
// =============================================================================

export interface CreateMessageParams {
  chatId: Id<'chats'>;
  walletAddress: string;
  role: MessageRole;
  content: string;
  attachments?: MessageAttachment[];
  tokenCount?: number;
  embedding?: number[];
  metadata?: MessageMetadata;
  status?: string;
  parentMessageId?: Id<'messages'>;
}

export interface CreateChatParams {
  title: string;
  description?: string;
  ownerId: string;
  model: string;
  systemPrompt?: string;
  agentPrompt?: string;
  agentId?: Id<'agents'>;
  temperature?: number;
  maxTokens?: number;
}

export interface UpdateChatParams {
  id: Id<'chats'>;
  ownerId: string;
  title?: string;
  model?: string;
  systemPrompt?: string;
  agentPrompt?: string;
  agentId?: Id<'agents'>;
  temperature?: number;
  maxTokens?: number;
  isActive?: boolean;
}

// =============================================================================
// Response Types
// =============================================================================

export interface MessageWithReactions extends Message {
  reactionCounts?: Record<MessageReaction, number>;
  userReactions?: MessageReaction[];
}

export interface ChatWithMessageCount extends Chat {
  messageCount: number;
}

export interface ChatStats {
  totalChats: number;
  activeChats: number;
  archivedChats: number;
  totalMessages: number;
  modelUsage: Record<string, number>;
  oldestChat: number | null;
  newestChat: number | null;
}

export interface MessageStats {
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  systemMessages: number;
  totalTokens: number;
  averageTokensPerMessage: number;
  totalProcessingTime: number;
  averageProcessingTime: number;
  modelsUsed: string[];
  messagesWithCitations: number;
  firstMessage: number | null;
  lastMessage: number | null;
}

// =============================================================================
// Error Types
// =============================================================================

export interface ChatError {
  code: string;
  message: string;
  context?: Record<string, unknown>;
}

export interface MessageError extends ChatError {
  messageId?: Id<'messages'>;
  field?: string;
}

// =============================================================================
// Streaming Types
// =============================================================================

export interface StreamingSession {
  chatId: Id<'chats'>;
  messageId: Id<'messages'>;
  userId: Id<'users'>;
  status: 'initializing' | 'streaming' | 'completed' | 'error';
  content: string;
  tokens: {
    input: number;
    output: number;
  };
  artifacts?: Array<{
    type: 'document' | 'code' | 'markdown';
    data: unknown;
  }>;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

// =============================================================================
// Utility Types
// =============================================================================

export type ChatEvent = 
  | { type: 'message_created'; message: Message }
  | { type: 'message_updated'; message: Message }
  | { type: 'message_deleted'; messageId: Id<'messages'> }
  | { type: 'chat_updated'; chat: Chat }
  | { type: 'typing_start'; userId: string }
  | { type: 'typing_stop'; userId: string };

export interface PaginationParams {
  limit?: number;
  before?: number; // timestamp
  after?: number; // timestamp
}

export interface MessageFilters {
  role?: MessageRole;
  hasAttachments?: boolean;
  hasCitations?: boolean;
  dateRange?: {
    start: number;
    end: number;
  };
}

// =============================================================================
// API Response Types
// =============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ChatError;
  pagination?: {
    hasMore: boolean;
    nextCursor?: string;
    total?: number;
  };
}

export type GetMessagesResponse = ApiResponse<Message[]>;
export type GetChatsResponse = ApiResponse<ChatWithMessageCount[]>;
export type CreateMessageResponse = ApiResponse<Message>;
export type CreateChatResponse = ApiResponse<Chat>;
export type UpdateChatResponse = ApiResponse<Chat>;
export type GetChatStatsResponse = ApiResponse<ChatStats>;
export type GetMessageStatsResponse = ApiResponse<MessageStats>;

// =============================================================================
// Real-time Update Types
// =============================================================================

export interface RealtimeUpdate {
  type: 'message' | 'chat' | 'reaction' | 'typing';
  action: 'created' | 'updated' | 'deleted';
  data: unknown;
  timestamp: number;
  userId: string;
}

export interface TypingIndicator {
  chatId: Id<'chats'>;
  userId: string;
  isTyping: boolean;
  timestamp: number;
}