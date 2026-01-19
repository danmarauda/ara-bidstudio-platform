/**
 * API Validation Schemas using Zod
 * Comprehensive type-safe validation for all API endpoints
 * Ensures runtime type safety and automatic type inference
 */

import { z } from 'zod';
import {
  AICostTier,
  AIProvider,
  APIErrorCode,
  Language,
  MessageRole,
  SearchType,
  SortOrder,
  SubscriptionTier,
  Theme,
  WebhookEventType,
} from './api';

// =============================================================================
// Common Schemas
// =============================================================================

export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().email();
export const urlSchema = z.string().url();
export const timestampSchema = z.number().int().positive();
export const walletAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);

export const dateRangeSchema = z.object({
  start: timestampSchema,
  end: timestampSchema,
  timezone: z.string().optional(),
});

export const paginationParamsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// =============================================================================
// User Schemas
// =============================================================================

export const userPreferencesSchema = z.object({
  theme: z.enum([Theme.LIGHT, Theme.DARK, Theme.SYSTEM]),
  aiModel: z.string().min(1),
  notifications: z.boolean(),
  language: z
    .enum([
      Language.EN,
      Language.ES,
      Language.FR,
      Language.DE,
      Language.ZH,
      Language.JA,
      Language.KO,
      Language.PT,
      Language.RU,
      Language.AR,
    ])
    .optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(128_000).optional(),
  streamResponses: z.boolean().optional(),
  saveHistory: z.boolean().optional(),
  compactMode: z.boolean().optional(),
  // Chat/UI preferences
  fontSize: z.enum(['small', 'medium', 'large']).optional(),
  autoScroll: z.boolean().optional(),
  // Behavior/memory
  enableMemory: z.boolean().optional(),
  // Model defaults
  defaultModel: z.string().optional(),
});

export const userProfileSchema = z.object({
  walletAddress: walletAddressSchema,
  publicKey: z.string(),
  displayName: z.string().min(1).max(100).optional(),
  avatar: urlSchema.optional(),
  preferences: userPreferencesSchema,
  subscription: z.object({
    tier: z.enum([
      SubscriptionTier.FREE,
      SubscriptionTier.STARTER,
      SubscriptionTier.PRO,
      SubscriptionTier.TEAM,
      SubscriptionTier.ENTERPRISE,
    ]),
    expiresAt: timestampSchema.optional(),
    tokensUsed: z.number().int().min(0),
    tokensLimit: z.number().int().min(0),
    features: z.array(z.string()),
    billingCycle: z.enum(['monthly', 'yearly']).optional(),
    autoRenew: z.boolean().optional(),
  }),
  createdAt: timestampSchema,
  lastActiveAt: timestampSchema,
  isActive: z.boolean(),
});

// =============================================================================
// Authentication Schemas
// =============================================================================

export const walletAuthChallengeSchema = z.object({
  challenge: z.string().min(32),
  expiresAt: z.string().datetime(),
  nonce: z.string().min(16),
});

export const walletAuthVerificationSchema = z.object({
  message: z.string().min(1),
  signature: z.string().min(1),
  publicKey: z.string().min(1),
});

export const authSessionSchema = z.object({
  walletAddress: walletAddressSchema,
  publicKey: z.string(),
  token: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresAt: timestampSchema,
  user: userProfileSchema,
});

// =============================================================================
// Chat Schemas
// =============================================================================

export const createChatRequestSchema = z.object({
  title: z.string().min(1).max(200),
  model: z.string().min(1),
  systemPrompt: z.string().max(4000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(128_000).optional(),
  initialMessage: z.string().max(10_000).optional(),
});

export const updateChatRequestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  systemPrompt: z.string().max(4000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(128_000).optional(),
  isPinned: z.boolean().optional(),
});

export const chatMessageSchema = z.object({
  _id: z.string(),
  chatId: z.string(),
  walletAddress: walletAddressSchema,
  role: z.enum([
    MessageRole.USER,
    MessageRole.ASSISTANT,
    MessageRole.SYSTEM,
    MessageRole.TOOL,
    MessageRole.FUNCTION,
  ]),
  content: z.string(),
  tokenCount: z.number().int().min(0).optional(),
  embedding: z.array(z.number()).optional(),
  metadata: z
    .object({
      model: z.string().optional(),
      finishReason: z.string().optional(),
      usage: z
        .object({
          inputTokens: z.number().int().min(0),
          outputTokens: z.number().int().min(0),
          totalTokens: z.number().int().min(0),
        })
        .optional(),
      tools: z
        .array(
          z.object({
            id: z.string(),
            name: z.string(),
            args: z.record(
              z.string(),
              z.union([z.string(), z.number(), z.boolean(), z.null()])
            ),
            result: z
              .object({
                success: z.boolean(),
                data: z
                  .union([z.string(), z.number(), z.boolean(), z.null()])
                  .optional(),
                error: z.string().optional(),
                executionTime: z.number().optional(),
              })
              .optional(),
          })
        )
        .optional(),
      reasoning: z.string().optional(),
    })
    .optional(),
  status: z.string().optional(),
  parentMessageId: z.string().optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema.optional(),
  editedAt: timestampSchema.optional(),
});

export const sendMessageRequestSchema = z.object({
  content: z.string().min(1).max(32_000),
  role: z
    .enum([
      MessageRole.USER,
      MessageRole.ASSISTANT,
      MessageRole.SYSTEM,
      MessageRole.TOOL,
      MessageRole.FUNCTION,
    ])
    .optional()
    .default(MessageRole.USER),
  metadata: z
    .record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean(), z.null()])
    )
    .optional(),
});

// =============================================================================
// AI Model Schemas
// =============================================================================

export const aiModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.enum([
    AIProvider.OPENAI,
    AIProvider.ANTHROPIC,
    AIProvider.DEEPSEEK,
    AIProvider.GOOGLE,
    AIProvider.MISTRAL,
    AIProvider.COHERE,
    AIProvider.HUGGINGFACE,
  ]),
  contextWindow: z.number().int().positive(),
  maxTokens: z.number().int().positive(),
  strengths: z.array(z.string()),
  capabilities: z.array(z.string()),
  costTier: z.enum([
    AICostTier.FREE,
    AICostTier.BUDGET,
    AICostTier.STANDARD,
    AICostTier.PREMIUM,
    AICostTier.ENTERPRISE,
  ]),
  isAvailable: z.boolean(),
  version: z.string().optional(),
  releaseDate: timestampSchema.optional(),
  deprecatedDate: timestampSchema.optional(),
});

export const chatCompletionRequestSchema = z.object({
  model: z.string(),
  messages: z.array(chatMessageSchema),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(128_000).optional(),
  stream: z.boolean().optional(),
  tools: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        parameters: z.object({
          type: z.literal('object'),
          properties: z.record(
            z.string(),
            z.union([z.string(), z.number(), z.boolean(), z.null()])
          ),
          required: z.array(z.string()).optional(),
          additionalProperties: z.boolean().optional(),
        }),
        required: z.array(z.string()).optional(),
        category: z.string().optional(),
      })
    )
    .optional(),
  systemPrompt: z.string().optional(),
});

// =============================================================================
// Search Schemas
// =============================================================================

export const searchRequestSchema = z.object({
  query: z.string().min(1).max(1000),
  type: z.enum([
    SearchType.SEMANTIC,
    SearchType.HYBRID,
    SearchType.KEYWORD,
    SearchType.FUZZY,
    SearchType.VECTOR,
  ]),
  filters: z
    .object({
      chatIds: z.array(z.string()).optional(),
      documentIds: z.array(z.string()).optional(),
      dateRange: dateRangeSchema.optional(),
      messageTypes: z
        .array(
          z.enum([
            MessageRole.USER,
            MessageRole.ASSISTANT,
            MessageRole.SYSTEM,
            MessageRole.TOOL,
            MessageRole.FUNCTION,
          ])
        )
        .optional(),
      tags: z.array(z.string()).optional(),
      walletAddresses: z.array(walletAddressSchema).optional(),
      models: z.array(z.string()).optional(),
    })
    .optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  threshold: z.number().min(0).max(1).optional(),
  sort: z
    .array(
      z.object({
        field: z.string(),
        order: z.enum([SortOrder.ASC, SortOrder.DESC]),
      })
    )
    .optional(),
  highlight: z.boolean().optional(),
});

// =============================================================================
// Document Schemas
// =============================================================================

export const documentUploadSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  type: z.enum(['text', 'markdown', 'pdf', 'json', 'csv']),
  tags: z.array(z.string()).optional(),
  metadata: z
    .record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean(), z.null()])
    )
    .optional(),
  isPublic: z.boolean().default(false),
});

export const documentUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z
    .record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean(), z.null()])
    )
    .optional(),
  isPublic: z.boolean().optional(),
});

// =============================================================================
// Webhook Schemas
// =============================================================================

export const webhookEventSchema = z.object({
  id: z.string(),
  type: z.enum([
    WebhookEventType.CHAT_CREATED,
    WebhookEventType.CHAT_UPDATED,
    WebhookEventType.CHAT_DELETED,
    WebhookEventType.MESSAGE_SENT,
    WebhookEventType.MESSAGE_RECEIVED,
    WebhookEventType.USER_CREATED,
    WebhookEventType.USER_UPDATED,
    WebhookEventType.SUBSCRIPTION_CHANGED,
    WebhookEventType.TOKEN_LIMIT_REACHED,
    WebhookEventType.ERROR_OCCURRED,
  ]),
  data: z.object({
    resourceId: z.string(),
    resourceType: z.enum(['chat', 'message', 'user', 'subscription']),
    action: z.enum(['created', 'updated', 'deleted', 'sent', 'received']),
    payload: z.record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean(), z.null()])
    ),
    userId: z.string().optional(),
    metadata: z
      .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
      .optional(),
  }),
  timestamp: timestampSchema,
  signature: z.string(),
  version: z.string().optional(),
});

export const webhookSubscriptionSchema = z.object({
  url: urlSchema,
  events: z.array(
    z.enum([
      WebhookEventType.CHAT_CREATED,
      WebhookEventType.CHAT_UPDATED,
      WebhookEventType.CHAT_DELETED,
      WebhookEventType.MESSAGE_SENT,
      WebhookEventType.MESSAGE_RECEIVED,
      WebhookEventType.USER_CREATED,
      WebhookEventType.USER_UPDATED,
      WebhookEventType.SUBSCRIPTION_CHANGED,
      WebhookEventType.TOKEN_LIMIT_REACHED,
      WebhookEventType.ERROR_OCCURRED,
    ])
  ),
  secret: z.string().min(32),
  isActive: z.boolean().default(true),
  headers: z.record(z.string(), z.string()).optional(),
  retryPolicy: z
    .object({
      maxRetries: z.number().int().min(0).max(10).default(3),
      backoffMultiplier: z.number().min(1).max(5).default(2),
      initialDelay: z.number().int().min(100).max(60_000).default(1000),
    })
    .optional(),
});

// =============================================================================
// Error Schemas
// =============================================================================

export const apiErrorSchema = z.object({
  code: z.enum([
    APIErrorCode.UNAUTHORIZED,
    APIErrorCode.FORBIDDEN,
    APIErrorCode.INVALID_TOKEN,
    APIErrorCode.TOKEN_EXPIRED,
    APIErrorCode.INVALID_SIGNATURE,
    APIErrorCode.VALIDATION_ERROR,
    APIErrorCode.INVALID_REQUEST,
    APIErrorCode.MISSING_PARAMETERS,
    APIErrorCode.RESOURCE_NOT_FOUND,
    APIErrorCode.RESOURCE_CONFLICT,
    APIErrorCode.RESOURCE_LIMIT_EXCEEDED,
    APIErrorCode.RATE_LIMIT_EXCEEDED,
    APIErrorCode.QUOTA_EXCEEDED,
    APIErrorCode.MODEL_UNAVAILABLE,
    APIErrorCode.CONTEXT_TOO_LONG,
    APIErrorCode.UNSAFE_CONTENT,
    APIErrorCode.INTERNAL_ERROR,
    APIErrorCode.SERVICE_UNAVAILABLE,
    APIErrorCode.TIMEOUT,
  ]),
  message: z.string(),
  details: z
    .object({
      field: z.string().optional(),
      value: z.union([z.string(), z.number(), z.boolean()]).optional(),
      constraint: z.string().optional(),
      context: z
        .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
        .optional(),
      stack: z.string().optional(),
    })
    .optional(),
  timestamp: timestampSchema,
  requestId: z.string(),
  statusCode: z.number().int().min(100).max(599).optional(),
  path: z.string().optional(),
  method: z.string().optional(),
});

export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: apiErrorSchema.optional(),
    metadata: z
      .object({
        requestId: z.string(),
        timestamp: timestampSchema,
        version: z.string(),
        correlationId: z.string().optional(),
        duration: z.number().optional(),
      })
      .optional(),
  });

// =============================================================================
// Type Exports
// =============================================================================

export type UserPreferences = z.infer<typeof userPreferencesSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type WalletAuthChallenge = z.infer<typeof walletAuthChallengeSchema>;
export type WalletAuthVerification = z.infer<
  typeof walletAuthVerificationSchema
>;
export type AuthSession = z.infer<typeof authSessionSchema>;
export type CreateChatRequest = z.infer<typeof createChatRequestSchema>;
export type UpdateChatRequest = z.infer<typeof updateChatRequestSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type SendMessageRequest = z.infer<typeof sendMessageRequestSchema>;
export type AIModel = z.infer<typeof aiModelSchema>;
export type ChatCompletionRequest = z.infer<typeof chatCompletionRequestSchema>;
export type SearchRequest = z.infer<typeof searchRequestSchema>;
export type DocumentUpload = z.infer<typeof documentUploadSchema>;
export type DocumentUpdate = z.infer<typeof documentUpdateSchema>;
export type WebhookEvent = z.infer<typeof webhookEventSchema>;
export type WebhookSubscription = z.infer<typeof webhookSubscriptionSchema>;
export type APIError = z.infer<typeof apiErrorSchema>;
