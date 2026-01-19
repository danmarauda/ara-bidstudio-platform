import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // Legacy table - keeping for backward compatibility
  numbers: defineTable({
    value: v.number(),
  }),

  // User profiles and preferences
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    avatar: v.optional(v.string()),
    preferences: v.object({
      theme: v.string(),
      language: v.string(),
      notifications: v.boolean(),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_clerk_id', ['clerkId'])
    .index('by_email', ['email']),

  // AI Agents configuration and state
  agents: defineTable({
    userId: v.id('users'),
    name: v.string(),
    description: v.string(),
    model: v.string(),
    instructions: v.string(),
    tools: v.array(v.string()),
    isActive: v.boolean(),
    config: v.object({
      temperature: v.optional(v.number()),
      maxTokens: v.optional(v.number()),
      systemPrompt: v.optional(v.string()),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_active', ['isActive']),

  // Conversations and chat history
  conversations: defineTable({
    userId: v.id('users'),
    agentId: v.id('agents'),
    title: v.string(),
    messages: v.array(
      v.object({
        id: v.string(),
        role: v.string(),
        content: v.string(),
        timestamp: v.number(),
        metadata: v.optional(
          v.object({
            toolCalls: v.optional(v.array(v.any())),
            tokenUsage: v.optional(
              v.object({
                prompt: v.number(),
                completion: v.number(),
                total: v.number(),
              }),
            ),
          }),
        ),
      }),
    ),
    status: v.string(), // active, completed, archived
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_agent', ['agentId']),

  // Workflows for complex operations
  workflows: defineTable({
    userId: v.id('users'),
    name: v.string(),
    description: v.string(),
    steps: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        type: v.string(),
        config: v.any(),
        dependencies: v.array(v.string()),
        status: v.string(),
      }),
    ),
    triggers: v.array(v.string()),
    status: v.string(), // draft, active, paused, completed
    executionCount: v.number(),
    lastExecutedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_status', ['status']),

  // Workflow executions and results
  workflowExecutions: defineTable({
    workflowId: v.id('workflows'),
    userId: v.id('users'),
    status: v.string(), // running, completed, failed, cancelled
    steps: v.array(
      v.object({
        stepId: v.string(),
        status: v.string(),
        startedAt: v.optional(v.number()),
        completedAt: v.optional(v.number()),
        result: v.optional(v.any()),
        error: v.optional(v.string()),
      }),
    ),
    input: v.any(),
    output: v.optional(v.any()),
    error: v.optional(v.string()),
    executionTime: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_workflow', ['workflowId'])
    .index('by_user', ['userId'])
    .index('by_status', ['status']),

  // Memory and knowledge base
  memories: defineTable({
    userId: v.id('users'),
    type: v.string(), // conversation, fact, insight, pattern
    content: v.string(),
    metadata: v.object({
      source: v.string(),
      confidence: v.number(),
      tags: v.array(v.string()),
      embedding: v.optional(v.array(v.number())),
    }),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_type', ['type'])
    .index('by_tags', ['metadata.tags']),

  // Analytics and usage tracking
  analytics: defineTable({
    userId: v.id('users'),
    event: v.string(),
    category: v.string(),
    data: v.any(),
    sessionId: v.string(),
    timestamp: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_event', ['event'])
    .index('by_session', ['sessionId']),

  // File storage metadata
  files: defineTable({
    userId: v.id('users'),
    name: v.string(),
    type: v.string(),
    size: v.number(),
    url: v.string(),
    metadata: v.object({
      mimeType: v.string(),
      checksum: v.string(),
      processed: v.boolean(),
    }),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_type', ['type']),

  // API keys and integrations
  integrations: defineTable({
    userId: v.id('users'),
    provider: v.string(), // openai, github, slack, etc.
    name: v.string(),
    config: v.any(), // encrypted configuration
    isActive: v.boolean(),
    lastUsedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_provider', ['provider']),

  // Scheduled tasks and automation
  scheduledTasks: defineTable({
    userId: v.id('users'),
    name: v.string(),
    description: v.string(),
    schedule: v.string(), // cron expression
    action: v.object({
      type: v.string(),
      config: v.any(),
    }),
    isActive: v.boolean(),
    lastRunAt: v.optional(v.number()),
    nextRunAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_next_run', ['nextRunAt'])
    .index('by_active', ['isActive']),
});
