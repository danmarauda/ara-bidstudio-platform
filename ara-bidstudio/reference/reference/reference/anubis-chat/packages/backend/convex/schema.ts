import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// =============================================================================
// Common Schema Definitions
// =============================================================================

// JSON-like values that can be stored (simple union type)
const _simpleJsonValue = v.union(v.string(), v.number(), v.boolean(), v.null());

// Tool execution arguments - commonly used parameter types
const toolParameters = v.union(
  v.string(),
  v.number(),
  v.boolean(),
  v.null(),
  v.object({
    // Common tool parameter structures
    query: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    filters: v.optional(v.record(v.string(), v.string())),
    options: v.optional(
      v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))
    ),
    data: v.optional(
      v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))
    ),
    config: v.optional(
      v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))
    ),
  }),
  v.array(v.union(v.string(), v.number(), v.boolean()))
);

// Tool execution results
const toolResult = v.union(
  v.string(),
  v.number(),
  v.boolean(),
  v.null(),
  v.object({
    status: v.optional(v.string()),
    message: v.optional(v.string()),
    data: v.optional(v.union(v.string(), v.number(), v.boolean())),
    metadata: v.optional(
      v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))
    ),
  }),
  v.array(v.union(v.string(), v.number(), v.boolean()))
);

// Error details for various error contexts
const errorDetails = v.object({
  code: v.optional(v.string()),
  message: v.optional(v.string()),
  stack: v.optional(v.string()),
  context: v.optional(v.record(v.string(), v.string())),
  timestamp: v.optional(v.number()),
  severity: v.optional(
    v.union(
      v.literal('low'),
      v.literal('medium'),
      v.literal('high'),
      v.literal('critical')
    )
  ),
});

// Workflow/Agent execution metadata
const _executionMetadata = v.object({
  source: v.optional(v.string()),
  priority: v.optional(
    v.union(
      v.literal('low'),
      v.literal('normal'),
      v.literal('high'),
      v.literal('urgent')
    )
  ),
  tags: v.optional(v.array(v.string())),
  environment: v.optional(v.string()),
  timeout: v.optional(v.number()),
  retryPolicy: v.optional(
    v.object({
      maxRetries: v.number(),
      backoffMultiplier: v.optional(v.number()),
      initialDelay: v.optional(v.number()),
    })
  ),
  custom: v.optional(
    v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))
  ),
});

// Workflow variables
const workflowVariables = v.object({
  inputs: v.optional(
    v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))
  ),
  outputs: v.optional(
    v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))
  ),
  context: v.optional(
    v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))
  ),
  state: v.optional(
    v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))
  ),
  temp: v.optional(
    v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))
  ),
});

// Search filters
const searchFilters = v.object({
  dateRange: v.optional(
    v.object({
      start: v.number(),
      end: v.number(),
    })
  ),
  type: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  owner: v.optional(v.string()),
  status: v.optional(v.string()),
  metadata: v.optional(v.record(v.string(), v.string())),
});

// HTTP headers for webhooks - using underscore-case for valid identifiers
const httpHeaders = v.object({
  content_type: v.optional(v.string()),
  authorization: v.optional(v.string()),
  user_agent: v.optional(v.string()),
  accept: v.optional(v.string()),
  x_api_key: v.optional(v.string()),
  // Allow additional custom headers as key-value pairs
  custom_headers: v.optional(
    v.array(
      v.object({
        key: v.string(),
        value: v.string(),
      })
    )
  ),
});

// Webhook payload structure
const webhookPayload = v.object({
  event: v.string(),
  timestamp: v.number(),
  data: v.record(v.string(), v.union(v.string(), v.number(), v.boolean())),
  metadata: v.optional(
    v.object({
      version: v.optional(v.string()),
      source: v.optional(v.string()),
      traceId: v.optional(v.string()),
    })
  ),
});

// Approval request data
const approvalData = v.object({
  action: v.string(),
  resource: v.optional(v.string()),
  parameters: v.optional(toolParameters),
  context: v.optional(
    v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))
  ),
  metadata: v.optional(v.record(v.string(), v.string())),
});

// Approval modifications
const approvalModifications = v.object({
  parameters: v.optional(toolParameters),
  conditions: v.optional(v.array(v.string())),
  restrictions: v.optional(v.array(v.string())),
  metadata: v.optional(v.record(v.string(), v.string())),
});

export default defineSchema({
  // =============================================================================
  // Convex Auth Tables (Required) - Temporarily disabled due to undefined validator
  // =============================================================================
  ...authTables,

  // =============================================================================
  // Token Price Cache
  // =============================================================================
  tokenPrices: defineTable({
    symbol: v.string(), // e.g., 'SOL', 'USDC'
    priceUsd: v.number(),
    priceChange24h: v.optional(v.number()),
    marketCap: v.optional(v.number()),
    volume24h: v.optional(v.number()),
    mintAddress: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_symbol', ['symbol'])
    .index('by_updated', ['updatedAt']),

  // =============================================================================
  // Extended User Profile & Admin Control
  // =============================================================================

  // User interface preferences (separate from core user data)
  userPreferences: defineTable({
    userId: v.string(), // user ID from users table
    // Interface Settings
    theme: v.optional(
      v.union(v.literal('light'), v.literal('dark'), v.literal('system'))
    ),
    language: v.optional(v.string()),
    fontSize: v.optional(
      v.union(v.literal('small'), v.literal('medium'), v.literal('large'))
    ),
    soundEnabled: v.optional(v.boolean()),
    autoScroll: v.optional(v.boolean()),
    // Accessibility Settings
    highContrast: v.optional(v.boolean()),
    reducedMotion: v.optional(v.boolean()),
    // Notification Settings
    emailNotifications: v.optional(v.boolean()),
    pushNotifications: v.optional(v.boolean()),
    // Behavior Settings
    streamResponses: v.optional(v.boolean()),
    saveHistory: v.optional(v.boolean()),
    enableMemory: v.optional(v.boolean()),
    responseFormat: v.optional(
      v.union(v.literal('text'), v.literal('markdown'), v.literal('json'))
    ),
    // Model Preferences (defaults for new chats)
    defaultModel: v.optional(v.string()),
    defaultTemperature: v.optional(v.number()),
    defaultMaxTokens: v.optional(v.number()),
    defaultTopP: v.optional(v.number()),
    defaultFrequencyPenalty: v.optional(v.number()),
    defaultPresencePenalty: v.optional(v.number()),
    contextWindow: v.optional(v.number()),
    // Advanced Settings
    compactMode: v.optional(v.boolean()),
    showModelDetails: v.optional(v.boolean()),
    enableNotifications: v.optional(v.boolean()),
    autoCreateTitles: v.optional(v.boolean()),
    // Privacy & Analytics Settings
    analytics: v.optional(v.boolean()),
    dataCollection: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_user', ['userId']),

  // Extended user profiles with Solana wallet integration and admin roles
  users: defineTable({
    // Convex Auth will handle the core user fields
    // We extend with our custom fields for wallets, subscriptions, and admin roles
    walletAddress: v.optional(v.string()), // Solana wallet address
    publicKey: v.optional(v.string()), // Solana public key
    displayName: v.optional(v.string()),
    avatar: v.optional(v.string()),

    // Referral tracking - permanent relationship for recurring commissions
    referredBy: v.optional(v.id('users')), // Who referred this user (for lifetime commissions)
    referredByCode: v.optional(v.string()), // The referral code used
    referredAt: v.optional(v.number()), // When they were referred/attributed

    // Admin role system integrated with Convex Auth
    role: v.optional(
      v.union(
        v.literal('user'),
        v.literal('moderator'),
        v.literal('admin'),
        v.literal('super_admin')
      )
    ),
    permissions: v.optional(
      v.array(
        v.union(
          v.literal('user_management'),
          v.literal('subscription_management'),
          v.literal('content_moderation'),
          v.literal('system_settings'),
          v.literal('financial_data'),
          v.literal('usage_analytics'),
          v.literal('admin_management')
        )
      )
    ),

    preferences: v.optional(
      v.object({
        theme: v.union(v.literal('light'), v.literal('dark')),
        aiModel: v.string(),
        notifications: v.boolean(),
        language: v.optional(v.string()),
        temperature: v.optional(v.number()),
        maxTokens: v.optional(v.number()),
        streamResponses: v.optional(v.boolean()),
        saveHistory: v.optional(v.boolean()),
        compactMode: v.optional(v.boolean()),
      })
    ),

    subscription: v.optional(
      v.object({
        tier: v.union(
          v.literal('free'),
          v.literal('pro'),
          v.literal('pro_plus')
        ),
        // Plan message limits (from subscription tiers)
        messagesUsed: v.optional(v.number()),
        messagesLimit: v.optional(v.number()),
        premiumMessagesUsed: v.optional(v.number()), // GPT-4o, Claude usage
        premiumMessagesLimit: v.optional(v.number()),
        // Purchased message credits (stacking, not subscription-based)
        messageCredits: v.optional(v.number()), // Standard message credits purchased
        premiumMessageCredits: v.optional(v.number()), // Premium message credits purchased
        // Billing information
        currentPeriodStart: v.optional(v.number()),
        currentPeriodEnd: v.optional(v.number()),
        subscriptionTxSignature: v.optional(v.string()), // Solana transaction
        autoRenew: v.optional(v.boolean()),
        planPriceSol: v.optional(v.number()), // Price in SOL
        // Legacy token fields (will migrate)
        tokensUsed: v.optional(v.number()),
        tokensLimit: v.optional(v.number()),
        features: v.optional(v.array(v.string())),
        billingCycle: v.optional(
          v.union(v.literal('monthly'), v.literal('yearly'))
        ),
      })
    ),

    createdAt: v.optional(v.number()), // User creation timestamp
    lastActiveAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()), // Last update timestamp
    isActive: v.optional(v.boolean()),
  })
    .index('by_wallet', ['walletAddress'])
    .index('by_active', ['isActive', 'lastActiveAt'])
    .index('by_role', ['role'])
    .index('by_referrer', ['referredBy']) // For querying users referred by someone
    .index('by_tier', ['subscription.tier']),

  // =============================================================================
  // Additional Authentication & Security (Custom)
  // =============================================================================
  // Convex Auth handles most authentication, we keep custom tables for Solana-specific features

  // Solana wallet challenges for signature verification (custom addition to Convex Auth)
  solanaWalletChallenges: defineTable({
    publicKey: v.string(),
    nonce: v.string(),
    challenge: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    used: v.boolean(),
  })
    .index('by_key', ['publicKey'])
    .index('by_nonce', ['nonce'])
    .index('by_expires', ['expiresAt'])
    .index('by_used', ['used']),

  // Blacklisted tokens for auth/session invalidation
  blacklistedTokens: defineTable({
    token: v.optional(v.string()), // Made optional for migration
    tokenId: v.optional(v.string()), // Legacy field
    userId: v.optional(v.string()), // Legacy field
    blacklistedAt: v.optional(v.number()), // Legacy field
    reason: v.optional(v.string()),
    expiresAt: v.number(),
    createdAt: v.optional(v.number()), // Made optional for migration
  }).index('by_expires', ['expiresAt']),

  // Nonces for wallet login / challenge flows
  nonces: defineTable({
    walletAddress: v.string(),
    nonce: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index('by_expires', ['expiresAt'])
    .index('by_wallet', ['walletAddress']),

  // =============================================================================
  // Chat System
  // =============================================================================

  // Chat conversations
  chats: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    ownerId: v.string(), // walletAddress
    model: v.string(),
    systemPrompt: v.optional(v.string()), // User's custom system prompt (editable)
    agentPrompt: v.optional(v.string()), // Agent's base prompt (read-only copy)
    agentId: v.optional(v.id('agents')), // Reference to the selected agent
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    isPinned: v.optional(v.boolean()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastMessageAt: v.optional(v.number()),
    messageCount: v.number(),
    totalTokens: v.number(),
    tokenUsage: v.optional(
      v.object({
        totalPromptTokens: v.number(),
        totalCompletionTokens: v.number(),
        totalTokens: v.number(),
        totalCachedTokens: v.number(),
        totalEstimatedCost: v.number(),
        messageCount: v.number(),
      })
    ),
  })
    .index('by_owner', ['ownerId', 'updatedAt'])
    .index('by_active', ['isActive', 'lastMessageAt'])
    .index('by_pinned', ['ownerId', 'isPinned', 'updatedAt'])
    .searchIndex('search_title', {
      searchField: 'title',
      filterFields: ['ownerId', 'isActive'],
    }),

  // Messages within chats
  messages: defineTable({
    chatId: v.id('chats'),
    walletAddress: v.string(),
    role: v.union(
      v.literal('user'),
      v.literal('assistant'),
      v.literal('system')
    ),
    content: v.string(),
    tokenCount: v.optional(v.number()),
    embedding: v.optional(v.array(v.number())),
    metadata: v.optional(
      v.object({
        model: v.optional(v.string()),
        finishReason: v.optional(v.string()),
        usage: v.optional(
          v.object({
            inputTokens: v.number(),
            outputTokens: v.number(),
            totalTokens: v.number(),
          })
        ),
        tools: v.optional(
          v.array(
            v.object({
              id: v.string(),
              name: v.string(),
              args: toolParameters,
              result: v.optional(
                v.object({
                  success: v.boolean(),
                  data: v.optional(toolResult),
                  error: v.optional(v.string()),
                  executionTime: v.optional(v.number()),
                })
              ),
            })
          )
        ),
        reasoning: v.optional(v.string()),
        citations: v.optional(v.array(v.string())), // Document IDs for RAG
        attachments: v.optional(
          v.array(
            v.object({
              fileId: v.string(),
              url: v.optional(v.string()),
              mimeType: v.string(),
              size: v.number(),
              type: v.union(
                v.literal('image'),
                v.literal('file'),
                v.literal('video')
              ),
            })
          )
        ),
        // Message editing and regeneration tracking
        edited: v.optional(v.boolean()),
        editedAt: v.optional(v.number()),
        regenerated: v.optional(v.boolean()),
        regeneratedAt: v.optional(v.number()),
        // Message reactions system
        reactions: v.optional(
          v.record(
            v.string(), // userId (walletAddress)
            v.array(
              v.union(
                v.literal('like'),
                v.literal('dislike'),
                v.literal('love'),
                v.literal('celebrate'),
                v.literal('insightful')
              )
            )
          )
        ),
        lastReactionAt: v.optional(v.number()),
      })
    ),
    status: v.optional(v.string()),
    parentMessageId: v.optional(v.id('messages')),
    // Message rating system
    rating: v.optional(
      v.object({
        userRating: v.union(v.literal('like'), v.literal('dislike')),
        ratedAt: v.number(),
        ratedBy: v.string(), // walletAddress
      })
    ),
    // Message actions tracking
    actions: v.optional(
      v.object({
        copiedCount: v.optional(v.number()),
        sharedCount: v.optional(v.number()),
        regeneratedCount: v.optional(v.number()),
        lastActionAt: v.optional(v.number()),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    editedAt: v.optional(v.number()),
  })
    .index('by_chat', ['chatId', 'createdAt'])
    .index('by_user', ['walletAddress', 'createdAt'])
    .index('by_timestamp', ['createdAt'])
    .index('by_parent', ['parentMessageId'])
    .searchIndex('search_content', {
      searchField: 'content',
      filterFields: ['chatId', 'walletAddress', 'role'],
    }),

  // =============================================================================
  // Document & Knowledge Management
  // =============================================================================

  // Documents for RAG system
  documents: defineTable({
    title: v.string(),
    content: v.string(),
    type: v.union(
      v.literal('text'),
      v.literal('markdown'),
      v.literal('pdf'),
      v.literal('json'),
      v.literal('csv'),
      v.literal('url')
    ),
    ownerId: v.string(), // walletAddress
    isPublic: v.boolean(),
    embedding: v.optional(v.array(v.number())),
    tags: v.optional(v.array(v.string())),
    metadata: v.optional(
      v.object({
        source: v.optional(v.string()),
        author: v.optional(v.string()),
        category: v.optional(v.string()),
        language: v.optional(v.string()),
        wordCount: v.optional(v.number()),
        characterCount: v.optional(v.number()),
        mimeType: v.optional(v.string()),
        fileSize: v.optional(v.number()),
        checksum: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_owner', ['ownerId', 'createdAt'])
    .index('by_owner_category', ['ownerId', 'metadata.category', 'createdAt'])
    .index('by_type', ['type'])
    .index('by_public', ['isPublic', 'createdAt'])
    .index('by_tags', ['tags'])
    .searchIndex('search_content', {
      searchField: 'content',
      filterFields: ['ownerId', 'type', 'isPublic'],
    })
    .searchIndex('search_title', {
      searchField: 'title',
      filterFields: ['ownerId', 'type', 'isPublic'],
    }),

  // =============================================================================
  // Book of the Dead (Prompts)
  // =============================================================================

  // Hierarchical folders to organize prompts
  promptFolders: defineTable({
    ownerId: v.string(), // users._id
    name: v.string(),
    parentId: v.optional(v.id('promptFolders')),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_owner', ['ownerId', 'updatedAt'])
    .index('by_parent', ['ownerId', 'parentId', 'updatedAt']),

  // Saved prompts
  prompts: defineTable({
    ownerId: v.string(), // users._id
    title: v.string(),
    content: v.string(),
    folderId: v.optional(v.id('promptFolders')),
    usageCount: v.number(),
    lastUsedAt: v.optional(v.number()),
    isArchived: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_owner', ['ownerId', 'updatedAt'])
    .index('by_folder', ['ownerId', 'folderId', 'updatedAt'])
    .index('by_usage', ['ownerId', 'usageCount'])
    .searchIndex('search_title', {
      searchField: 'title',
      filterFields: ['ownerId', 'isArchived'],
    })
    .searchIndex('search_content', {
      searchField: 'content',
      filterFields: ['ownerId', 'isArchived'],
    }),

  // Document chunks for RAG retrieval
  documentChunks: defineTable({
    documentId: v.id('documents'),
    chunkIndex: v.number(),
    content: v.string(),
    embedding: v.array(v.number()),
    metadata: v.object({
      startOffset: v.number(),
      endOffset: v.number(),
      wordCount: v.number(),
      overlap: v.optional(v.number()),
    }),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index('by_document', ['documentId', 'chunkIndex'])
    .vectorIndex('by_embedding', {
      vectorField: 'embedding',
      dimensions: 1536, // OpenAI embedding dimensions
      filterFields: ['documentId'],
    }),

  // =============================================================================
  // Subscription & Payment Management
  // =============================================================================

  // Subscription payments tracking
  subscriptionPayments: defineTable({
    userId: v.string(), // walletAddress
    tier: v.union(v.literal('pro'), v.literal('pro_plus')),
    amountSol: v.number(),
    amountUsd: v.optional(v.number()), // USD value at time of payment
    txSignature: v.string(), // Solana transaction signature
    paymentDate: v.number(),
    periodStart: v.number(),
    periodEnd: v.number(),
    status: v.union(
      v.literal('pending'),
      v.literal('confirmed'),
      v.literal('failed'),
      v.literal('refunded')
    ),
    confirmations: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    verificationDetails: v.optional(
      v.object({
        signature: v.string(),
        recipient: v.string(),
        sender: v.string(),
        amount: v.number(),
        timestamp: v.number(),
        slot: v.number(),
        confirmationStatus: v.string(),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId', 'paymentDate'])
    .index('by_signature', ['txSignature'])
    .index('by_status', ['status', 'paymentDate']),

  // Message usage tracking per model
  messageUsage: defineTable({
    userId: v.string(), // walletAddress
    model: v.string(), // e.g., 'gpt-4o', 'claude-3.5-sonnet', 'deepseek-chat'
    modelCategory: v.union(v.literal('premium'), v.literal('standard')),
    messageCount: v.number(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    estimatedCost: v.number(), // in USD
    date: v.number(), // Daily aggregation
    createdAt: v.number(),
  })
    .index('by_user_date', ['userId', 'date'])
    .index('by_user_model', ['userId', 'model', 'date'])
    .index('by_category', ['userId', 'modelCategory', 'date']),

  // Message credit purchases tracking
  messageCreditPurchases: defineTable({
    userId: v.string(), // walletAddress
    packType: v.literal('standard'), // Only one type for now: 150 standard + 25 premium
    standardCredits: v.number(), // Number of standard message credits in pack
    premiumCredits: v.number(), // Number of premium message credits in pack
    priceSOL: v.number(), // Price paid in SOL
    txSignature: v.string(), // Solana transaction signature
    status: v.union(
      v.literal('pending'),
      v.literal('confirmed'),
      v.literal('failed'),
      v.literal('refunded')
    ),
    confirmations: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    verificationDetails: v.optional(
      v.object({
        signature: v.string(),
        recipient: v.string(),
        sender: v.string(),
        amount: v.number(),
        timestamp: v.number(),
        slot: v.number(),
        confirmationStatus: v.string(),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId', 'createdAt'])
    .index('by_signature', ['txSignature'])
    .index('by_status', ['status', 'createdAt']),

  // Model access quotas per tier
  modelQuotas: defineTable({
    tier: v.union(v.literal('free'), v.literal('pro'), v.literal('pro_plus')),
    model: v.string(),
    modelCategory: v.union(v.literal('premium'), v.literal('standard')),
    monthlyLimit: v.number(), // -1 for unlimited within total tier limit
    isAvailable: v.boolean(),
    priority: v.number(), // Higher priority = preferred for routing
    costPerMessage: v.number(), // For internal tracking
    updatedAt: v.number(),
  })
    .index('by_tier', ['tier', 'isAvailable'])
    .index('by_model', ['model', 'tier']),

  // Upgrade prompts and suggestions tracking
  upgradeSuggestions: defineTable({
    userId: v.string(), // walletAddress
    triggerType: v.union(
      v.literal('limit_reached'),
      v.literal('premium_model_request'),
      v.literal('feature_request'),
      v.literal('usage_milestone')
    ),
    currentTier: v.union(
      v.literal('free'),
      v.literal('pro'),
      v.literal('pro_plus')
    ),
    suggestedTier: v.union(v.literal('pro'), v.literal('pro_plus')),
    context: v.optional(v.string()), // What the user was trying to do
    shown: v.boolean(),
    converted: v.boolean(),
    dismissedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_user', ['userId', 'createdAt'])
    .index('by_conversion', ['converted', 'suggestedTier']),

  // =============================================================================
  // Agentic AI System - Feature Branch Version with Blockchain Extensions
  // =============================================================================

  // AI Agents for specialized tasks
  agents: defineTable({
    name: v.string(),
    type: v.union(
      v.literal('general'),
      v.literal('trading'),
      v.literal('defi'),
      v.literal('nft'),
      v.literal('dao'),
      v.literal('portfolio'),
      v.literal('custom')
    ),
    description: v.string(),
    systemPrompt: v.string(),
    capabilities: v.array(v.string()), // List of available tools/actions
    model: v.optional(v.string()),
    version: v.optional(v.string()),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    config: v.optional(
      v.object({
        rpcUrl: v.optional(v.string()),
        priorityFee: v.optional(v.number()),
        slippage: v.optional(v.number()),
        gasBudget: v.optional(v.number()),
      })
    ),
    // MCP Server Configuration
    mcpServers: v.optional(
      v.array(
        v.object({
          name: v.string(), // Server name (e.g., 'context7', 'filesystem')
          enabled: v.boolean(),
          config: v.optional(
            v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))
          ), // Server-specific configuration
        })
      )
    ),
    isActive: v.boolean(),
    isPublic: v.boolean(), // Whether available to all users or custom
    createdBy: v.optional(v.string()), // walletAddress for custom agents
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_type', ['type', 'isActive'])
    .index('by_creator', ['createdBy', 'createdAt'])
    .index('by_public', ['isPublic', 'isActive']),

  // Agent Sessions - tracks active agent contexts
  agentSessions: defineTable({
    chatId: v.id('chats'),
    agentId: v.id('agents'),
    userId: v.string(), // walletAddress
    context: v.optional(
      v.object({
        lastAction: v.optional(v.string()),
        pendingTransactions: v.optional(v.array(v.string())),
        walletBalance: v.optional(v.number()),
        activePositions: v.optional(v.array(v.string())),
        preferences: v.optional(
          v.object({
            riskLevel: v.optional(
              v.union(v.literal('low'), v.literal('medium'), v.literal('high'))
            ),
            maxSlippage: v.optional(v.number()),
            autoConfirm: v.optional(v.boolean()),
          })
        ),
      })
    ),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_chat', ['chatId'])
    .index('by_agent', ['agentId', 'isActive'])
    .index('by_user', ['userId', 'isActive']),

  // Agent Executions (runtime execution records for agents)
  agentExecutions: defineTable({
    agentId: v.id('agents'),
    walletAddress: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('running'),
      v.literal('waiting_approval'),
      v.literal('completed'),
      v.literal('failed'),
      v.literal('cancelled')
    ),
    input: v.string(),
    result: v.optional(
      v.object({
        success: v.boolean(),
        output: v.string(),
        finalStep: v.number(),
        totalSteps: v.number(),
        toolsUsed: v.array(v.string()),
        tokensUsed: v.object({
          input: v.number(),
          output: v.number(),
          total: v.number(),
        }),
        executionTime: v.number(),
      })
    ),
    error: v.optional(v.string()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    metadata: v.optional(
      v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))
    ),
  })
    .index('by_agent', ['agentId'])
    .index('by_user', ['walletAddress'])
    .index('by_status', ['status']),

  // Agent Steps (detailed steps within an execution)
  agentSteps: defineTable({
    executionId: v.id('agentExecutions'),
    stepNumber: v.number(),
    type: v.union(
      v.literal('reasoning'),
      v.literal('tool_call'),
      v.literal('parallel_tools'),
      v.literal('human_approval'),
      v.literal('workflow_step')
    ),
    status: v.union(
      v.literal('pending'),
      v.literal('running'),
      v.literal('completed'),
      v.literal('failed'),
      v.literal('waiting_approval')
    ),
    input: v.optional(v.string()),
    toolCalls: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          parameters: toolParameters,
          requiresApproval: v.boolean(),
        })
      )
    ),
    output: v.optional(v.string()),
    reasoning: v.optional(v.string()),
    toolResults: v.optional(
      v.array(
        v.object({
          id: v.string(),
          success: v.boolean(),
          result: toolResult,
          error: v.optional(
            v.object({
              code: v.string(),
              message: v.string(),
              details: v.optional(
                v.record(
                  v.string(),
                  v.union(v.string(), v.number(), v.boolean())
                )
              ),
              retryable: v.optional(v.boolean()),
            })
          ),
          executionTime: v.number(),
          metadata: v.optional(
            v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))
          ),
        })
      )
    ),
    error: v.optional(v.string()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index('by_execution', ['executionId', 'stepNumber'])
    .index('by_status', ['status']),

  // Blockchain Transactions initiated by agents
  blockchainTransactions: defineTable({
    chatId: v.optional(v.id('chats')),
    messageId: v.optional(v.id('messages')),
    agentId: v.optional(v.id('agents')),
    userId: v.string(), // walletAddress
    signature: v.optional(v.string()), // Transaction signature
    type: v.union(
      v.literal('transfer'),
      v.literal('swap'),
      v.literal('stake'),
      v.literal('unstake'),
      v.literal('lend'),
      v.literal('borrow'),
      v.literal('mint_nft'),
      v.literal('buy_nft'),
      v.literal('sell_nft'),
      v.literal('vote'),
      v.literal('create_token'),
      v.literal('liquidity_add'),
      v.literal('liquidity_remove'),
      v.literal('other')
    ),
    operation: v.string(), // Specific operation name (e.g., 'deployToken', 'swapTokens')
    parameters: v.object({
      amount: v.optional(v.string()),
      tokenMint: v.optional(v.string()),
      targetAddress: v.optional(v.string()),
      slippage: v.optional(v.number()),
      priority: v.optional(v.number()),
    }),
    status: v.union(
      v.literal('pending'),
      v.literal('confirmed'),
      v.literal('failed'),
      v.literal('cancelled')
    ),
    errorMessage: v.optional(v.string()),
    fee: v.optional(v.number()), // Transaction fee in SOL
    blockTime: v.optional(v.number()),
    confirmations: v.optional(v.number()),
    metadata: v.optional(
      v.object({
        tokensBefore: v.optional(
          v.array(
            v.object({
              mint: v.string(),
              amount: v.string(),
            })
          )
        ),
        tokensAfter: v.optional(
          v.array(
            v.object({
              mint: v.string(),
              amount: v.string(),
            })
          )
        ),
        priceImpact: v.optional(v.number()),
        executionTime: v.optional(v.number()),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId', 'createdAt'])
    .index('by_status', ['status', 'createdAt'])
    .index('by_type', ['type', 'createdAt'])
    .index('by_chat', ['chatId', 'createdAt'])
    .index('by_signature', ['signature']),

  // Tool usage tracking for Solana Agent Kit
  toolUsage: defineTable({
    agentId: v.id('agents'),
    userId: v.string(), // walletAddress
    toolName: v.string(), // e.g., 'deployToken', 'swapTokens', 'getBalance'
    category: v.union(
      v.literal('wallet'),
      v.literal('trading'),
      v.literal('defi'),
      v.literal('nft'),
      v.literal('governance'),
      v.literal('social'),
      v.literal('utility')
    ),
    parameters: v.optional(toolParameters), // Tool-specific parameters
    result: v.optional(toolResult), // Tool execution result
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
    executionTime: v.optional(v.number()), // milliseconds
    gasUsed: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_agent', ['agentId', 'createdAt'])
    .index('by_user', ['userId', 'createdAt'])
    .index('by_tool', ['toolName', 'createdAt'])
    .index('by_category', ['category', 'success', 'createdAt']),

  // Agent Capabilities - defines what each agent can do
  agentCapabilities: defineTable({
    agentId: v.id('agents'),
    capability: v.string(), // Tool or action name
    enabled: v.boolean(),
    config: v.optional(
      v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))
    ), // Capability-specific configuration
    permissions: v.optional(v.array(v.string())), // Required permissions
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_agent', ['agentId', 'enabled'])
    .index('by_capability', ['capability', 'enabled']),

  // =============================================================================
  // Workflow System (from upstream - for future compatibility)
  // =============================================================================

  // Workflows
  workflows: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    walletAddress: v.string(),
    isActive: v.boolean(),
    category: v.optional(
      v.union(
        v.literal('research'),
        v.literal('automation'),
        v.literal('data'),
        v.literal('communication'),
        v.literal('development'),
        v.literal('custom')
      )
    ),
    tags: v.optional(v.array(v.string())),
    version: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    isTemplate: v.optional(v.boolean()),
    parentWorkflowId: v.optional(v.id('workflows')), // For versioning
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_owner', ['walletAddress', 'updatedAt'])
    .index('by_active', ['isActive', 'updatedAt'])
    .index('by_category', ['category', 'isPublic'])
    .index('by_template', ['isTemplate', 'category'])
    .index('by_version', ['parentWorkflowId', 'version'])
    .searchIndex('search_name', {
      searchField: 'name',
      filterFields: ['walletAddress', 'isActive'],
    }),

  // Workflow steps
  workflowSteps: defineTable({
    workflowId: v.id('workflows'),
    stepId: v.string(),
    name: v.string(),
    type: v.union(
      v.literal('agent_task'),
      v.literal('condition'),
      v.literal('parallel'),
      v.literal('sequential'),
      v.literal('human_approval'),
      v.literal('delay'),
      v.literal('webhook'),
      v.literal('start'),
      v.literal('end'),
      v.literal('task'),
      v.literal('loop'),
      v.literal('subworkflow'),
      v.literal('agent'),
      v.literal('trigger'),
      v.literal('action')
    ),
    agentId: v.optional(v.id('agents')),
    condition: v.optional(v.string()),
    parameters: v.optional(toolParameters),
    nextSteps: v.optional(v.array(v.string())),
    requiresApproval: v.optional(v.boolean()),
    order: v.number(),
    position: v.number(), // For ordering
    // Visual editor data - complete structure
    visualData: v.optional(
      v.object({
        nodeId: v.string(),
        nodeType: v.string(),
        position: v.object({
          x: v.number(),
          y: v.number(),
        }),
        data: v.object({
          type: v.string(),
          label: v.string(),
          description: v.optional(v.string()),
          icon: v.optional(v.string()),
          config: v.optional(
            v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))
          ),
          parameters: v.optional(toolParameters),
        }),
      })
    ),
    config: v.optional(
      v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_workflow', ['workflowId', 'order'])
    .index('by_step_id', ['stepId']),

  // Workflow edges (connections between nodes)
  workflowEdges: defineTable({
    workflowId: v.id('workflows'),
    sourceNodeId: v.string(),
    targetNodeId: v.string(),
    sourceHandle: v.optional(v.string()),
    targetHandle: v.optional(v.string()),
    label: v.optional(v.string()),
    animated: v.optional(v.boolean()),
    style: v.optional(v.record(v.string(), v.union(v.string(), v.number()))),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_workflow', ['workflowId'])
    .index('by_source', ['sourceNodeId'])
    .index('by_target', ['targetNodeId']),

  // Workflow triggers
  workflowTriggers: defineTable({
    workflowId: v.id('workflows'),
    triggerId: v.string(),
    type: v.union(
      v.literal('manual'),
      v.literal('schedule'),
      v.literal('webhook'),
      v.literal('completion'),
      v.literal('condition')
    ),
    condition: v.string(),
    parameters: v.optional(toolParameters),
    isActive: v.boolean(),
  })
    .index('by_workflow', ['workflowId'])
    .index('by_type', ['type', 'isActive']),

  // Workflow executions
  workflowExecutions: defineTable({
    workflowId: v.id('workflows'),
    walletAddress: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('running'),
      v.literal('waiting_approval'),
      v.literal('completed'),
      v.literal('failed'),
      v.literal('cancelled')
    ),
    currentStep: v.string(),
    variables: v.optional(workflowVariables),
    error: v.optional(
      v.object({
        stepId: v.string(),
        code: v.string(),
        message: v.string(),
        details: v.optional(errorDetails),
      })
    ),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index('by_workflow', ['workflowId', 'startedAt'])
    .index('by_user', ['walletAddress', 'startedAt'])
    .index('by_status', ['status', 'startedAt']),

  // Workflow step results
  workflowStepResults: defineTable({
    executionId: v.id('workflowExecutions'),
    stepId: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('running'),
      v.literal('completed'),
      v.literal('failed'),
      v.literal('waiting_approval')
    ),
    output: v.optional(toolResult),
    error: v.optional(v.string()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    retryCount: v.optional(v.number()),
  })
    .index('by_execution', ['executionId', 'stepId'])
    .index('by_status', ['status']),

  // =============================================================================
  // Human-in-the-Loop System
  // =============================================================================

  // Approval requests
  approvalRequests: defineTable({
    executionId: v.string(), // Can be agent or workflow execution
    executionType: v.union(v.literal('agent'), v.literal('workflow')),
    stepId: v.string(),
    walletAddress: v.string(),
    type: v.union(
      v.literal('tool_execution'),
      v.literal('workflow_step'),
      v.literal('sensitive_action'),
      v.literal('resource_usage'),
      v.literal('custom')
    ),
    message: v.string(),
    data: approvalData,
    status: v.union(
      v.literal('pending'),
      v.literal('approved'),
      v.literal('rejected'),
      v.literal('expired')
    ),
    response: v.optional(
      v.object({
        approved: v.boolean(),
        message: v.optional(v.string()),
        modifications: v.optional(approvalModifications),
      })
    ),
    expiresAt: v.number(),
    createdAt: v.number(),
    respondedAt: v.optional(v.number()),
  })
    .index('by_user', ['walletAddress', 'status', 'createdAt'])
    .index('by_execution', ['executionId', 'executionType'])
    .index('by_expires', ['expiresAt'])
    .index('by_status', ['status', 'createdAt']),

  // =============================================================================
  // Usage & Analytics
  // =============================================================================

  // AI usage tracking
  usage: defineTable({
    userId: v.string(), // walletAddress
    operation: v.union(
      v.literal('completion'),
      v.literal('object_generation'),
      v.literal('stream'),
      v.literal('embedding'),
      v.literal('agent_execution'),
      v.literal('workflow_execution')
    ),
    model: v.string(),
    tokensUsed: v.number(),
    cost: v.optional(v.number()),
    duration: v.optional(v.number()),
    success: v.boolean(),
    createdAt: v.number(),
    metadata: v.optional(
      v.object({
        chatId: v.optional(v.id('chats')),
        messageId: v.optional(v.id('messages')),
        agentId: v.optional(v.id('agents')),
        workflowId: v.optional(v.id('workflows')),
        requestSize: v.optional(v.number()),
        responseSize: v.optional(v.number()),
        toolsUsed: v.optional(v.array(v.string())),
      })
    ),
  })
    .index('by_user', ['userId', 'createdAt'])
    .index('by_operation', ['operation', 'createdAt'])
    .index('by_model', ['model', 'createdAt'])
    .index('by_success', ['success', 'createdAt']),

  // Search and analytics
  searchQueries: defineTable({
    userId: v.string(), // walletAddress
    query: v.string(),
    type: v.union(
      v.literal('semantic'),
      v.literal('keyword'),
      v.literal('hybrid'),
      v.literal('vector')
    ),
    resultsCount: v.number(),
    executionTime: v.number(),
    filters: v.optional(searchFilters),
    createdAt: v.number(),
  })
    .index('by_user', ['userId', 'createdAt'])
    .index('by_type', ['type', 'createdAt'])
    .searchIndex('search_queries', {
      searchField: 'query',
      filterFields: ['userId', 'type'],
    }),

  // =============================================================================
  // Memory & Context Management
  // =============================================================================

  // Memory entries for long-term context
  memories: defineTable({
    userId: v.string(), // walletAddress
    content: v.string(),
    embedding: v.array(v.number()),
    importance: v.number(), // 0-1 relevance score
    type: v.union(
      v.literal('fact'),
      v.literal('preference'),
      v.literal('skill'),
      v.literal('goal'),
      v.literal('context')
    ),
    tags: v.optional(v.array(v.string())),
    sourceId: v.optional(v.string()), // Source chat/document ID
    sourceType: v.optional(
      v.union(
        v.literal('chat'),
        v.literal('document'),
        v.literal('agent'),
        v.literal('workflow')
      )
    ),
    accessCount: v.number(),
    lastAccessed: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId', 'importance'])
    .index('by_type', ['type', 'importance'])
    .index('by_source', ['sourceId', 'sourceType'])
    .index('by_access', ['lastAccessed'])
    .vectorIndex('by_embedding', {
      vectorField: 'embedding',
      dimensions: 1536,
      filterFields: ['userId', 'type'],
    })
    .searchIndex('search_content', {
      searchField: 'content',
      filterFields: ['userId', 'type'],
    }),

  // =============================================================================
  // Integration & External Services
  // =============================================================================

  // Webhook subscriptions
  webhooks: defineTable({
    userId: v.string(), // walletAddress
    url: v.string(),
    events: v.array(v.string()),
    secret: v.string(),
    isActive: v.boolean(),
    headers: v.optional(httpHeaders),
    retryPolicy: v.optional(
      v.object({
        maxRetries: v.number(),
        backoffMultiplier: v.number(),
        initialDelay: v.number(),
      })
    ),
    createdAt: v.number(),
    lastTriggered: v.optional(v.number()),
    failureCount: v.number(),
  })
    .index('by_user', ['userId', 'isActive'])
    .index('by_active', ['isActive']),

  // Webhook delivery logs
  webhookDeliveries: defineTable({
    webhookId: v.id('webhooks'),
    eventType: v.string(),
    payload: webhookPayload,
    responseStatus: v.optional(v.number()),
    responseBody: v.optional(v.string()),
    success: v.boolean(),
    attemptCount: v.number(),
    createdAt: v.number(),
    deliveredAt: v.optional(v.number()),
    error: v.optional(v.string()),
  })
    .index('by_webhook', ['webhookId', 'createdAt'])
    .index('by_success', ['success', 'createdAt']),

  // =============================================================================
  // MCP Server Integration
  // =============================================================================

  // MCP Server configurations
  mcpServers: defineTable({
    userId: v.string(), // walletAddress
    serverId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    url: v.string(),
    apiKey: v.optional(v.string()),
    enabled: v.boolean(),
    tools: v.array(v.string()),
    status: v.union(
      v.literal('disconnected'),
      v.literal('connecting'),
      v.literal('connected'),
      v.literal('error'),
      v.literal('disabled')
    ),
    lastConnected: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId', 'enabled'])
    .index('by_server', ['serverId'])
    .index('by_status', ['status']),

  // MCP Tool call logs
  mcpToolCalls: defineTable({
    serverId: v.string(),
    toolName: v.string(),
    userId: v.string(), // walletAddress
    input: toolParameters,
    output: v.optional(toolResult),
    success: v.boolean(),
    executionTime: v.number(),
    error: v.optional(
      v.object({
        code: v.string(),
        message: v.string(),
        details: v.optional(errorDetails),
      })
    ),
    createdAt: v.number(),
  })
    .index('by_server', ['serverId', 'createdAt'])
    .index('by_tool', ['toolName', 'createdAt'])
    .index('by_user', ['userId', 'createdAt'])
    .index('by_success', ['success', 'createdAt']),

  // Agent Tool Execution Tracking
  agentToolExecutions: defineTable({
    sessionId: v.string(),
    chatId: v.id('chats'),
    messageId: v.optional(v.id('messages')),
    agentId: v.id('agents'),
    userId: v.string(), // walletAddress
    toolName: v.string(),
    input: v.string(), // JSON stringified
    output: v.optional(v.string()), // JSON stringified
    status: v.union(
      v.literal('pending'),
      v.literal('executing'),
      v.literal('completed'),
      v.literal('failed'),
      v.literal('cancelled')
    ),
    executionTimeMs: v.optional(v.number()),
    error: v.optional(v.string()), // JSON stringified error object
    metadata: v.optional(
      v.object({
        executionId: v.string(),
        toolType: v.union(
          v.literal('regular'),
          v.literal('mcp'),
          v.literal('builtin')
        ),
        serverId: v.optional(v.string()),
        startTime: v.number(),
        endTime: v.optional(v.number()),
        tokenUsage: v.optional(
          v.object({
            input: v.number(),
            output: v.number(),
            total: v.number(),
          })
        ),
        retryCount: v.optional(v.number()),
        parentExecutionId: v.optional(v.string()),
      })
    ),
    createdAt: v.number(),
  })
    .index('by_session', ['sessionId', 'createdAt'])
    .index('by_chat', ['chatId', 'createdAt'])
    .index('by_agent', ['agentId', 'createdAt'])
    .index('by_user', ['userId', 'createdAt'])
    .index('by_status', ['status', 'createdAt'])
    .index('by_tool', ['toolName', 'createdAt']),

  // =============================================================================
  // NEW TABLES FOR V2 API ENDPOINTS
  // =============================================================================

  // Assistants (OpenAI-style persistent AI assistants)
  assistants: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    model: v.string(),
    instructions: v.optional(v.string()),
    tools: v.array(
      v.object({
        type: v.union(
          v.literal('code_interpreter'),
          v.literal('file_search'),
          v.literal('function')
        ),
        function: v.optional(
          v.object({
            name: v.string(),
            description: v.optional(v.string()),
            parameters: v.record(
              v.string(),
              v.union(v.string(), v.number(), v.boolean())
            ),
          })
        ),
      })
    ),
    fileIds: v.array(v.string()),
    metadata: v.optional(v.record(v.string(), v.string())),
    temperature: v.optional(v.number()),
    topP: v.optional(v.number()),
    responseFormat: v.optional(
      v.object({
        type: v.union(v.literal('text'), v.literal('json_object')),
      })
    ),
    walletAddress: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_wallet', ['walletAddress', 'updatedAt'])
    .searchIndex('search_name', {
      searchField: 'name',
      filterFields: ['walletAddress'],
    }),

  // Threads (conversation sessions with assistants)
  threads: defineTable({
    metadata: v.optional(v.record(v.string(), v.string())),
    walletAddress: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_wallet', ['walletAddress', 'updatedAt']),

  // Thread messages
  threadMessages: defineTable({
    threadId: v.id('threads'),
    role: v.union(v.literal('user'), v.literal('assistant')),
    content: v.array(
      v.object({
        type: v.union(
          v.literal('text'),
          v.literal('image_file'),
          v.literal('image_url')
        ),
        text: v.optional(
          v.object({
            value: v.string(),
            annotations: v.optional(
              v.array(
                v.record(
                  v.string(),
                  v.union(v.string(), v.number(), v.boolean())
                )
              )
            ),
          })
        ),
        imageFile: v.optional(
          v.object({
            fileId: v.string(),
            detail: v.optional(
              v.union(v.literal('auto'), v.literal('low'), v.literal('high'))
            ),
          })
        ),
        imageUrl: v.optional(
          v.object({
            url: v.string(),
            detail: v.optional(
              v.union(v.literal('auto'), v.literal('low'), v.literal('high'))
            ),
          })
        ),
      })
    ),
    assistantId: v.optional(v.id('assistants')),
    runId: v.optional(v.id('runs')),
    fileIds: v.array(v.string()),
    metadata: v.optional(v.record(v.string(), v.string())),
    createdAt: v.number(),
  })
    .index('by_thread', ['threadId', 'createdAt'])
    .index('by_assistant', ['assistantId', 'createdAt']),

  // Runs (assistant executions on threads)
  runs: defineTable({
    threadId: v.id('threads'),
    assistantId: v.id('assistants'),
    status: v.union(
      v.literal('queued'),
      v.literal('in_progress'),
      v.literal('requires_action'),
      v.literal('cancelling'),
      v.literal('cancelled'),
      v.literal('failed'),
      v.literal('completed'),
      v.literal('expired')
    ),
    requiredAction: v.optional(
      v.object({
        type: v.literal('submit_tool_outputs'),
        submitToolOutputs: v.object({
          toolCalls: v.array(
            v.object({
              id: v.string(),
              type: v.literal('function'),
              function: v.object({
                name: v.string(),
                arguments: v.string(),
              }),
            })
          ),
        }),
      })
    ),
    lastError: v.optional(
      v.object({
        code: v.union(
          v.literal('server_error'),
          v.literal('rate_limit_exceeded'),
          v.literal('invalid_prompt')
        ),
        message: v.string(),
      })
    ),
    expiresAt: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    failedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    model: v.string(),
    instructions: v.optional(v.string()),
    tools: v.array(
      v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))
    ),
    fileIds: v.array(v.string()),
    metadata: v.optional(v.record(v.string(), v.string())),
    usage: v.optional(
      v.object({
        promptTokens: v.number(),
        completionTokens: v.number(),
        totalTokens: v.number(),
      })
    ),
    temperature: v.optional(v.number()),
    topP: v.optional(v.number()),
    maxPromptTokens: v.optional(v.number()),
    maxCompletionTokens: v.optional(v.number()),
    truncationStrategy: v.optional(
      v.object({
        type: v.union(v.literal('auto'), v.literal('last_messages')),
        lastMessages: v.optional(v.number()),
      })
    ),
    responseFormat: v.optional(
      v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))
    ),
    toolChoice: v.optional(
      v.union(
        v.string(),
        v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))
      )
    ),
    createdAt: v.number(),
  })
    .index('by_thread', ['threadId', 'createdAt'])
    .index('by_assistant', ['assistantId', 'createdAt'])
    .index('by_status', ['status', 'createdAt']),

  // Vector stores
  vectorStores: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    fileCounts: v.object({
      inProgress: v.number(),
      completed: v.number(),
      failed: v.number(),
      cancelled: v.number(),
      total: v.number(),
    }),
    status: v.union(
      v.literal('expired'),
      v.literal('in_progress'),
      v.literal('completed')
    ),
    expiresAfter: v.optional(
      v.object({
        anchor: v.literal('last_active_at'),
        days: v.number(),
      })
    ),
    expiresAt: v.optional(v.number()),
    lastActiveAt: v.number(),
    metadata: v.optional(v.record(v.string(), v.string())),
    walletAddress: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_wallet', ['walletAddress', 'updatedAt'])
    .index('by_status', ['status', 'updatedAt'])
    .searchIndex('search_name', {
      searchField: 'name',
      filterFields: ['walletAddress', 'status'],
    }),

  // Vector store files
  vectorStoreFiles: defineTable({
    vectorStoreId: v.id('vectorStores'),
    fileId: v.string(),
    status: v.union(
      v.literal('in_progress'),
      v.literal('completed'),
      v.literal('cancelled'),
      v.literal('failed')
    ),
    lastError: v.optional(
      v.object({
        code: v.union(
          v.literal('internal_error'),
          v.literal('file_not_found'),
          v.literal('parsing_error'),
          v.literal('unhandled_mime_type')
        ),
        message: v.string(),
      })
    ),
    chunkingStrategy: v.optional(
      v.object({
        type: v.union(v.literal('static'), v.literal('auto')),
        static: v.optional(
          v.object({
            maxChunkSizeTokens: v.number(),
            chunkOverlapTokens: v.number(),
          })
        ),
      })
    ),
    createdAt: v.number(),
  })
    .index('by_vector_store', ['vectorStoreId', 'createdAt'])
    .index('by_file', ['fileId'])
    .index('by_status', ['status', 'createdAt']),

  // Knowledge bases
  knowledgeBases: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal('documents'),
      v.literal('urls'),
      v.literal('api'),
      v.literal('database')
    ),
    vectorStoreId: v.optional(v.id('vectorStores')),
    sources: v.array(
      v.object({
        id: v.string(),
        type: v.union(
          v.literal('file'),
          v.literal('url'),
          v.literal('api_endpoint'),
          v.literal('database_query')
        ),
        name: v.string(),
        config: v.record(
          v.string(),
          v.union(v.string(), v.number(), v.boolean())
        ),
        lastSyncAt: v.optional(v.number()),
        status: v.union(
          v.literal('active'),
          v.literal('error'),
          v.literal('disabled')
        ),
        errorMessage: v.optional(v.string()),
      })
    ),
    syncSchedule: v.optional(
      v.object({
        frequency: v.union(
          v.literal('hourly'),
          v.literal('daily'),
          v.literal('weekly'),
          v.literal('monthly'),
          v.literal('manual')
        ),
        dayOfWeek: v.optional(v.number()),
        hourOfDay: v.optional(v.number()),
        timezone: v.optional(v.string()),
      })
    ),
    lastSyncAt: v.optional(v.number()),
    status: v.union(
      v.literal('active'),
      v.literal('syncing'),
      v.literal('error'),
      v.literal('disabled')
    ),
    metadata: v.optional(v.record(v.string(), v.string())),
    walletAddress: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_wallet', ['walletAddress', 'updatedAt'])
    .index('by_status', ['status', 'updatedAt'])
    .searchIndex('search_name', {
      searchField: 'name',
      filterFields: ['walletAddress', 'status'],
    }),

  // Teams
  teams: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    avatar: v.optional(v.string()),
    ownerId: v.string(),
    settings: v.object({
      defaultModel: v.optional(v.string()),
      sharedVectorStores: v.array(v.id('vectorStores')),
      sharedAgents: v.array(v.id('agents')),
      allowGuestAccess: v.boolean(),
      requireApproval: v.boolean(),
      dataRetentionDays: v.optional(v.number()),
    }),
    subscription: v.optional(
      v.object({
        plan: v.union(
          v.literal('free'),
          v.literal('starter'),
          v.literal('professional'),
          v.literal('enterprise')
        ),
        status: v.union(
          v.literal('active'),
          v.literal('past_due'),
          v.literal('cancelled'),
          v.literal('paused')
        ),
        currentPeriodEnd: v.number(),
        cancelAtPeriodEnd: v.boolean(),
        seats: v.number(),
        usedSeats: v.number(),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_owner', ['ownerId', 'updatedAt'])
    .searchIndex('search_name', {
      searchField: 'name',
      filterFields: ['ownerId'],
    }),

  // Team members
  teamMembers: defineTable({
    teamId: v.id('teams'),
    walletAddress: v.string(),
    role: v.union(
      v.literal('owner'),
      v.literal('admin'),
      v.literal('member'),
      v.literal('viewer')
    ),
    displayName: v.optional(v.string()),
    avatar: v.optional(v.string()),
    permissions: v.array(
      v.object({
        resource: v.union(
          v.literal('chats'),
          v.literal('agents'),
          v.literal('documents'),
          v.literal('workflows'),
          v.literal('team_settings')
        ),
        actions: v.array(
          v.union(
            v.literal('create'),
            v.literal('read'),
            v.literal('update'),
            v.literal('delete'),
            v.literal('share')
          )
        ),
      })
    ),
    joinedAt: v.number(),
    lastActiveAt: v.number(),
  })
    .index('by_team', ['teamId', 'joinedAt'])
    .index('by_wallet', ['walletAddress', 'joinedAt'])
    .index('by_role', ['role', 'teamId']),

  // Team invitations
  teamInvitations: defineTable({
    teamId: v.id('teams'),
    invitedBy: v.string(),
    invitedEmail: v.optional(v.string()),
    invitedWallet: v.optional(v.string()),
    role: v.union(v.literal('admin'), v.literal('member'), v.literal('viewer')),
    status: v.union(
      v.literal('pending'),
      v.literal('accepted'),
      v.literal('declined'),
      v.literal('expired')
    ),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index('by_team', ['teamId', 'status'])
    .index('by_email', ['invitedEmail', 'status'])
    .index('by_wallet', ['invitedWallet', 'status']),

  // Embeddings
  embeddings: defineTable({
    text: v.string(),
    model: v.string(),
    embedding: v.array(v.number()),
    dimensions: v.number(),
    metadata: v.optional(v.record(v.string(), v.string())),
    walletAddress: v.string(),
    createdAt: v.number(),
  })
    .index('by_wallet', ['walletAddress', 'createdAt'])
    .index('by_model', ['model', 'createdAt']),

  // Fine-tuning jobs
  fineTuningJobs: defineTable({
    model: v.string(),
    trainingFile: v.string(),
    validationFile: v.optional(v.string()),
    hyperparameters: v.optional(
      v.object({
        batchSize: v.optional(v.union(v.number(), v.literal('auto'))),
        learningRateMultiplier: v.optional(
          v.union(v.number(), v.literal('auto'))
        ),
        nEpochs: v.optional(v.union(v.number(), v.literal('auto'))),
      })
    ),
    suffix: v.optional(v.string()),
    status: v.union(
      v.literal('validating_files'),
      v.literal('queued'),
      v.literal('running'),
      v.literal('succeeded'),
      v.literal('failed'),
      v.literal('cancelled')
    ),
    fineTunedModel: v.optional(v.string()),
    error: v.optional(
      v.object({
        code: v.string(),
        message: v.string(),
        param: v.optional(v.string()),
      })
    ),
    walletAddress: v.string(),
    createdAt: v.number(),
    finishedAt: v.optional(v.number()),
  })
    .index('by_wallet', ['walletAddress', 'createdAt'])
    .index('by_status', ['status', 'createdAt']),

  // Training data
  trainingData: defineTable({
    fineTuningJobId: v.id('fineTuningJobs'),
    messages: v.array(
      v.object({
        role: v.union(
          v.literal('system'),
          v.literal('user'),
          v.literal('assistant')
        ),
        content: v.string(),
        weight: v.optional(v.number()),
      })
    ),
    metadata: v.optional(v.record(v.string(), v.string())),
    createdAt: v.number(),
  }).index('by_job', ['fineTuningJobId', 'createdAt']),

  // Code executions
  codeExecutions: defineTable({
    language: v.union(
      v.literal('python'),
      v.literal('javascript'),
      v.literal('typescript'),
      v.literal('sql')
    ),
    code: v.string(),
    output: v.optional(
      v.object({
        stdout: v.optional(v.string()),
        stderr: v.optional(v.string()),
        result: v.optional(v.union(v.string(), v.number(), v.boolean())),
        files: v.optional(
          v.array(
            v.object({
              name: v.string(),
              content: v.string(),
              mimeType: v.string(),
              size: v.number(),
            })
          )
        ),
        images: v.optional(
          v.array(
            v.object({
              url: v.optional(v.string()),
              b64Json: v.optional(v.string()),
              revisedPrompt: v.optional(v.string()),
            })
          )
        ),
      })
    ),
    status: v.union(
      v.literal('pending'),
      v.literal('running'),
      v.literal('completed'),
      v.literal('failed')
    ),
    error: v.optional(
      v.object({
        type: v.union(
          v.literal('syntax'),
          v.literal('runtime'),
          v.literal('timeout'),
          v.literal('memory_limit')
        ),
        message: v.string(),
        line: v.optional(v.number()),
        column: v.optional(v.number()),
      })
    ),
    executionTime: v.optional(v.number()),
    memoryUsed: v.optional(v.number()),
    walletAddress: v.string(),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index('by_wallet', ['walletAddress', 'createdAt'])
    .index('by_status', ['status', 'createdAt'])
    .index('by_language', ['language', 'createdAt']),

  // Subscriptions
  subscriptions: defineTable({
    walletAddress: v.string(),
    teamId: v.optional(v.id('teams')),
    plan: v.object({
      id: v.string(),
      name: v.string(),
      description: v.optional(v.string()),
      price: v.number(),
      currency: v.string(),
      interval: v.union(v.literal('month'), v.literal('year')),
      features: v.array(
        v.object({
          name: v.string(),
          description: v.optional(v.string()),
          enabled: v.boolean(),
        })
      ),
      limits: v.object({
        maxRequests: v.optional(v.number()),
        maxTokens: v.optional(v.number()),
        maxDocuments: v.optional(v.number()),
        maxVectorStores: v.optional(v.number()),
        maxTeamMembers: v.optional(v.number()),
        maxFileSize: v.optional(v.number()),
        dataRetentionDays: v.optional(v.number()),
      }),
    }),
    status: v.union(
      v.literal('trialing'),
      v.literal('active'),
      v.literal('past_due'),
      v.literal('canceled'),
      v.literal('unpaid'),
      v.literal('incomplete'),
      v.literal('incomplete_expired'),
      v.literal('paused')
    ),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
    cancelledAt: v.optional(v.number()),
    trialStart: v.optional(v.number()),
    trialEnd: v.optional(v.number()),
    metadata: v.optional(v.record(v.string(), v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_wallet', ['walletAddress', 'updatedAt'])
    .index('by_team', ['teamId', 'updatedAt'])
    .index('by_status', ['status', 'updatedAt']),

  // Invoices
  invoices: defineTable({
    subscriptionId: v.id('subscriptions'),
    walletAddress: v.string(),
    amount: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal('draft'),
      v.literal('open'),
      v.literal('paid'),
      v.literal('void'),
      v.literal('uncollectible')
    ),
    dueDate: v.number(),
    paidAt: v.optional(v.number()),
    periodStart: v.number(),
    periodEnd: v.number(),
    items: v.array(
      v.object({
        description: v.string(),
        quantity: v.number(),
        unitPrice: v.number(),
        amount: v.number(),
        metadata: v.optional(v.record(v.string(), v.string())),
      })
    ),
    metadata: v.optional(v.record(v.string(), v.string())),
    createdAt: v.number(),
  })
    .index('by_wallet', ['walletAddress', 'createdAt'])
    .index('by_subscription', ['subscriptionId', 'createdAt'])
    .index('by_status', ['status', 'createdAt']),

  // Integrations
  integrations: defineTable({
    type: v.union(
      v.literal('github'),
      v.literal('slack'),
      v.literal('discord'),
      v.literal('notion'),
      v.literal('linear'),
      v.literal('jira')
    ),
    name: v.string(),
    description: v.optional(v.string()),
    config: v.record(v.string(), v.union(v.string(), v.number(), v.boolean())),
    status: v.union(
      v.literal('connected'),
      v.literal('disconnected'),
      v.literal('error')
    ),
    lastSyncAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.string())),
    walletAddress: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_wallet', ['walletAddress', 'updatedAt'])
    .index('by_type', ['type', 'walletAddress'])
    .index('by_status', ['status', 'updatedAt']),

  // Data exports
  dataExports: defineTable({
    walletAddress: v.string(),
    type: v.union(
      v.literal('full'),
      v.literal('chats'),
      v.literal('documents'),
      v.literal('agents'),
      v.literal('workflows')
    ),
    format: v.union(v.literal('json'), v.literal('csv'), v.literal('markdown')),
    status: v.union(
      v.literal('pending'),
      v.literal('processing'),
      v.literal('completed'),
      v.literal('failed')
    ),
    fileUrl: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.string())),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index('by_wallet', ['walletAddress', 'createdAt'])
    .index('by_status', ['status', 'createdAt']),

  // Data imports
  dataImports: defineTable({
    walletAddress: v.string(),
    type: v.union(
      v.literal('full'),
      v.literal('chats'),
      v.literal('documents'),
      v.literal('agents'),
      v.literal('workflows')
    ),
    format: v.union(v.literal('json'), v.literal('csv')),
    status: v.union(
      v.literal('pending'),
      v.literal('processing'),
      v.literal('completed'),
      v.literal('failed')
    ),
    fileUrl: v.string(),
    processedItems: v.number(),
    totalItems: v.number(),
    errors: v.array(
      v.object({
        line: v.optional(v.number()),
        field: v.optional(v.string()),
        value: v.optional(v.union(v.string(), v.number(), v.boolean())),
        message: v.string(),
      })
    ),
    metadata: v.optional(v.record(v.string(), v.string())),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index('by_wallet', ['walletAddress', 'createdAt'])
    .index('by_status', ['status', 'createdAt']),

  // =============================================================================
  // Referral System (Enhanced with Auto-Scaling & Direct Payouts)
  // =============================================================================

  // Referral codes created by Pro+ members with tier-based commission scaling
  referralCodes: defineTable({
    userId: v.id('users'), // Pro+ member who created the code
    code: v.string(), // Unique 8-character code (e.g., "ANUB1S23")
    customCode: v.optional(v.string()), // Optional user-chosen code
    isActive: v.boolean(),
    totalReferrals: v.number(), // Count of successful conversions
    currentCommissionRate: v.number(), // Dynamic rate 3-5% (0.03-0.05)
    totalEarnings: v.number(), // Total SOL earned from referrals
    lifetimePayouts: v.number(), // Total actually paid out to referrer
    tier: v.number(), // Commission tier (0-10)
    nextTierAt: v.number(), // Referrals needed for next tier
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_code', ['code'])
    .index('by_user', ['userId'])
    .index('by_earnings_desc', ['totalEarnings']) // For leaderboard sorting
    .index('by_active', ['isActive']),

  // Track referral attribution from click to conversion
  referralAttributions: defineTable({
    referralCode: v.string(),
    referrerId: v.id('users'),
    referredUserId: v.optional(v.id('users')), // Set when user signs up
    referredWalletAddress: v.optional(v.string()),
    status: v.union(
      v.literal('pending'), // Clicked link, not signed up
      v.literal('attributed'), // User signed up
      v.literal('converted') // User made first payment
    ),
    ipAddress: v.optional(v.string()), // For fraud detection
    userAgent: v.optional(v.string()),
    source: v.optional(v.string()), // Tracking source
    expiresAt: v.number(), // 30 days from click
    createdAt: v.number(),
    convertedAt: v.optional(v.number()),
  })
    .index('by_code', ['referralCode'])
    .index('by_referrer', ['referrerId'])
    .index('by_referred_wallet', ['referredWalletAddress'])
    .index('by_status', ['status'])
    .index('by_expires', ['expiresAt']),

  // Track commission payouts with direct wallet transfers
  referralPayouts: defineTable({
    paymentId: v.union(
      v.id('subscriptionPayments'),
      v.id('messageCreditPurchases')
    ),
    referralCode: v.string(),
    referrerId: v.id('users'),
    referrerWalletAddress: v.string(), // For direct payout verification
    referredUserId: v.id('users'),
    paymentAmount: v.number(), // Original payment in SOL
    commissionRate: v.number(), // Actual rate used (3-5%)
    commissionAmount: v.number(), // Actual payout (paymentAmount * commissionRate)
    payoutTxSignature: v.optional(v.string()), // Solana tx for payout
    status: v.union(
      v.literal('pending'),
      v.literal('paid'),
      v.literal('failed')
    ),
    paidAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_referrer', ['referrerId'])
    .index('by_referred', ['referredUserId'])
    .index('by_payment', ['paymentId'])
    .index('by_status', ['status'])
    .index('by_payout_tx', ['payoutTxSignature']),

  // Referrer balance tracking for dashboard
  referralBalances: defineTable({
    userId: v.id('users'),
    totalEarned: v.number(), // All-time earnings in SOL
    availableBalance: v.number(), // Available for withdrawal
    totalWithdrawn: v.number(), // Withdrawn amount
    lastPayoutAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_user', ['userId']),

  // System-wide referral statistics for leaderboard
  referralSystemStats: defineTable({
    totalReferrers: v.number(),
    totalReferrals: v.number(),
    totalPayoutsSOL: v.number(),
    totalPayoutsUSD: v.optional(v.number()),
    averageCommissionRate: v.number(),
    topTierReferrers: v.number(), // Count at max 5% tier
    lastUpdated: v.number(),
  }),

  // Fraud detection and monitoring
  referralFraudAlerts: defineTable({
    type: v.union(
      v.literal('suspicious_ip_activity'),
      v.literal('rate_limit_exceeded'),
      v.literal('self_referral_attempt'),
      v.literal('duplicate_attribution')
    ),
    referralCode: v.string(),
    referrerId: v.id('users'),
    details: v.object({
      ipAddress: v.optional(v.string()),
      attributionCount: v.optional(v.number()),
      timeWindow: v.optional(v.string()),
      additionalInfo: v.optional(v.string()),
    }),
    severity: v.union(
      v.literal('low'),
      v.literal('medium'),
      v.literal('high'),
      v.literal('critical')
    ),
    resolved: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_referrer', ['referrerId'])
    .index('by_severity', ['severity', 'resolved'])
    .index('by_type', ['type', 'createdAt']),

  // =============================================================================
  // File Storage System
  // =============================================================================

  // Files table for direct file management
  files: defineTable({
    walletAddress: v.string(),
    fileId: v.string(),
    fileName: v.string(),
    mimeType: v.string(),
    size: v.number(),
    hash: v.string(),
    // Prefer Convex storage for file bytes. Keep base64 `data` optional for legacy uploads.
    data: v.optional(v.string()), // Base64 encoded file data (legacy)
    storageId: v.optional(v.string()), // Convex storage ID
    url: v.optional(v.string()), // Public URL from storage.getUrl
    purpose: v.union(
      v.literal('assistants'),
      v.literal('vision'),
      v.literal('batch'),
      v.literal('fine-tune')
    ),
    description: v.optional(v.string()),
    tags: v.array(v.string()),
    status: v.union(
      v.literal('uploaded'),
      v.literal('processed'),
      v.literal('error')
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_wallet', ['walletAddress', 'createdAt'])
    .index('by_fileId', ['fileId'])
    .index('by_hash', ['hash', 'walletAddress'])
    .index('by_purpose', ['purpose', 'walletAddress'])
    .searchIndex('search_name', {
      searchField: 'fileName',
      filterFields: ['walletAddress', 'purpose'],
    }),

  // =============================================================================
  // Payment Monitoring & Logging
  // =============================================================================

  // Payment system events for monitoring
  paymentEvents: defineTable({
    eventType: v.union(
      v.literal('payment_initiated'),
      v.literal('payment_processing'),
      v.literal('payment_verified'),
      v.literal('payment_failed'),
      v.literal('payment_timeout'),
      v.literal('payment_retry'),
      v.literal('wallet_connected'),
      v.literal('wallet_disconnected'),
      v.literal('verification_started'),
      v.literal('verification_completed'),
      v.literal('verification_failed'),
      v.literal('blockchain_error'),
      v.literal('rpc_error')
    ),
    timestamp: v.number(),
    userId: v.optional(v.id('users')),
    sessionId: v.optional(v.string()),
    metadata: v.object({
      txSignature: v.optional(v.string()),
      tier: v.optional(v.union(v.literal('pro'), v.literal('pro_plus'))),
      amount: v.optional(v.number()),
      walletAddress: v.optional(v.string()),
      errorMessage: v.optional(v.string()),
      errorCode: v.optional(v.string()),
      retryAttempt: v.optional(v.number()),
      processingTime: v.optional(v.number()),
      network: v.optional(v.string()),
      rpcEndpoint: v.optional(v.string()),
      // Added fields to align with MonitoringEvent in monitoring.ts
      paymentId: v.optional(v.string()),
      isUpgrade: v.optional(v.boolean()),
      isProrated: v.optional(v.boolean()),
      previousTier: v.optional(
        v.union(v.literal('free'), v.literal('pro'), v.literal('pro_plus'))
      ),
    }),
    severity: v.union(
      v.literal('info'),
      v.literal('warning'),
      v.literal('error'),
      v.literal('critical')
    ),
    createdAt: v.number(),
  })
    .index('by_timestamp', ['timestamp'])
    .index('by_severity_timestamp', ['severity', 'timestamp'])
    .index('by_event_type', ['eventType', 'timestamp'])
    .index('by_user', ['userId', 'timestamp']),

  // =============================================================================
  // Streaming Sessions for Real-time WebSocket Updates
  // =============================================================================
  streamingSessions: defineTable({
    chatId: v.id('chats'),
    messageId: v.id('messages'),
    userId: v.id('users'),
    status: v.union(
      v.literal('initializing'),
      v.literal('streaming'),
      v.literal('completed'),
      v.literal('error')
    ),
    content: v.string(),
    tokens: v.object({
      input: v.number(),
      output: v.number(),
    }),
    artifacts: v.optional(
      v.array(
        v.object({
          type: v.union(
            v.literal('document'),
            v.literal('code'),
            v.literal('markdown')
          ),
          data: v.any(),
        })
      )
    ),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_chat', ['chatId'])
    .index('by_status', ['status'])
    .index('by_created', ['createdAt']),
});
