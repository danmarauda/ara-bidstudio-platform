import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { getAuthUserId } from '@convex-dev/auth/server';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';
import { v } from 'convex/values';
import { api } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import { action, httpAction, mutation, query } from './_generated/server';
import {
  estimateTokens,
  getAgentConfig,
  getCachedPrompt,
  TOKEN_OPTIMIZATION,
  truncateToTokenLimit,
} from './lib/agents/agentManager';
import { createModuleLogger } from './utils/logger';

// Create logger instance for this module
const logger = createModuleLogger('streaming');

/**
 * Calculate estimated cost based on model and token usage
 * Updated with actual models from your system (2025 pricing)
 */
function calculateEstimatedCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  // Model costs per 1K tokens based on OpenRouter and provider pricing
  const modelCosts: Record<string, { prompt: number; completion: number }> = {
    // OpenRouter Free Models (very low cost)
    'openrouter/openai/gpt-oss-20b:free': { prompt: 0, completion: 0 },
    'openrouter/z-ai/glm-4.5-air:free': { prompt: 0, completion: 0 },
    'openrouter/qwen/qwen3-coder:free': { prompt: 0, completion: 0 },
    'openrouter/moonshotai/kimi-k2:free': { prompt: 0, completion: 0 },

    // OpenRouter Premium Models
    'openrouter/openai/gpt-oss-120b': { prompt: 0.001, completion: 0.002 }, // Estimated
    'openrouter/anthropic/claude-3.7-sonnet:thinking': {
      prompt: 0.003,
      completion: 0.015,
    },
    'openrouter/openai/gpt-4o-mini': { prompt: 0.000_15, completion: 0.0006 },
    'openrouter/deepseek/deepseek-chat': {
      prompt: 0.000_14,
      completion: 0.000_28,
    },
    'openrouter/qwen/qwen2.5-coder:32b': { prompt: 0.0003, completion: 0.0006 },
    'openrouter/meta/llama-3.1-70b-instruct': {
      prompt: 0.000_64,
      completion: 0.000_64,
    },

    // OpenAI Models (direct)
    'gpt-5': { prompt: 0.03, completion: 0.06 }, // Estimated future pricing
    'gpt-5-mini': { prompt: 0.015, completion: 0.03 }, // Estimated
    'gpt-4.1-mini': { prompt: 0.000_15, completion: 0.0006 }, // Same as GPT-4o-mini
    'gpt-4o': { prompt: 0.0025, completion: 0.01 },
    'gpt-4o-mini': { prompt: 0.000_15, completion: 0.0006 },
    o3: { prompt: 0.03, completion: 0.06 }, // Estimated
    'o4-mini': { prompt: 0.015, completion: 0.03 }, // Estimated

    // Google Gemini Models
    'gemini-2.5-pro': { prompt: 0.001_25, completion: 0.005 },
    'gemini-2.5-flash': { prompt: 0.000_075, completion: 0.0003 },
    'gemini-2.5-flash-lite': { prompt: 0.000_05, completion: 0.000_15 },
    'gemini-2.0-flash': { prompt: 0.000_075, completion: 0.0003 },
    'gemini-2.0-flash-exp': { prompt: 0.000_075, completion: 0.0003 },

    // Claude Models (if using directly)
    'claude-3.5-sonnet': { prompt: 0.003, completion: 0.015 },
    'claude-opus-4.1': { prompt: 0.015, completion: 0.075 },
    'claude-sonnet-4': { prompt: 0.003, completion: 0.015 },

    // DeepSeek Models
    'deepseek-chat': { prompt: 0.000_14, completion: 0.000_28 },
    'deepseek-r1': { prompt: 0.000_55, completion: 0.0022 },

    // Default fallback
    default: { prompt: 0.001, completion: 0.002 },
  };

  // Find exact match first
  let cost = modelCosts[model];

  // If no exact match, try to find by partial match
  if (!cost) {
    for (const [key, value] of Object.entries(modelCosts)) {
      if (model.includes(key) || key.includes(model)) {
        cost = value;
        break;
      }
    }
  }

  // Use default if still no match
  if (!cost) {
    cost = modelCosts.default;
  }

  // Calculate cost (costs are per 1K tokens)
  const promptCost = (promptTokens / 1000) * cost.prompt;
  const completionCost = (completionTokens / 1000) * cost.completion;

  return promptCost + completionCost;
}

/**
 * Estimate token usage for tool executions
 * This is a simple heuristic - in production, you'd use a proper tokenizer
 */
function estimateTokenUsage(
  input: any,
  output: any
): {
  input: number;
  output: number;
  total: number;
} {
  // Simple token estimation: ~4 characters per token on average
  const inputStr = typeof input === 'string' ? input : JSON.stringify(input);
  const outputStr =
    typeof output === 'string' ? output : JSON.stringify(output);

  const inputTokens = Math.ceil(inputStr.length / 4);
  const outputTokens = Math.ceil(outputStr.length / 4);

  return {
    input: inputTokens,
    output: outputTokens,
    total: inputTokens + outputTokens,
  };
}

// Type definitions for tool calls
interface ToolCallWithInput {
  toolCallId: string;
  toolName: string;
  input: Record<string, unknown>;
}

// Tool call tracking with proper types for messages.create mutation
interface TrackedToolCall {
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

// Allowed OpenRouter model allowlist for security
const ALLOWED_OPENROUTER_MODELS = new Set<string>([
  // Newly requested free models
  'openai/gpt-oss-20b:free',
  'z-ai/glm-4.5-air:free',
  'qwen/qwen3-coder:free',
  'moonshotai/kimi-k2:free',
  // Existing curated models used in UI
  'anthropic/claude-3.7-sonnet:thinking',
  'openai/gpt-4o-mini',
  'deepseek/deepseek-chat',
  'qwen/qwen2.5-coder:32b',
  'meta/llama-3.1-70b-instruct',
  // Premium model via OpenRouter on Cerebras
  'openai/gpt-oss-120b',
]);

// Configure allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://www.anubis.chat',
  'https://anubis.chat',
  'https://anubis-chat-web.vercel.app',
  process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : null,
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
].filter(Boolean) as string[];

// =============================================================================
// WebSocket Streaming via Convex Real-time Subscriptions
// =============================================================================

/**
 * Create a streaming session for real-time updates
 */
export const createStreamingSession = mutation({
  args: {
    chatId: v.id('chats'),
    messageId: v.id('messages'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    // Verify chat ownership
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.ownerId !== userId) {
      throw new Error('Chat not found or access denied');
    }

    // Create streaming session
    const sessionId = await ctx.db.insert('streamingSessions', {
      chatId: args.chatId,
      messageId: args.messageId,
      userId,
      status: 'initializing',
      content: '',
      tokens: { input: 0, output: 0 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return sessionId;
  },
});

/**
 * Subscribe to streaming updates (real-time WebSocket)
 */
export const subscribeToStream = query({
  args: {
    sessionId: v.id('streamingSessions'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== userId) {
      return null;
    }

    return session;
  },
});

/**
 * Update streaming content (called by the streaming action)
 */
export const updateStreamingContent = mutation({
  args: {
    sessionId: v.id('streamingSessions'),
    content: v.string(),
    tokens: v.optional(
      v.object({
        input: v.number(),
        output: v.number(),
      })
    ),
    status: v.optional(
      v.union(
        v.literal('streaming'),
        v.literal('completed'),
        v.literal('error')
      )
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    await ctx.db.patch(args.sessionId, {
      content: args.content,
      status: args.status || session.status,
      tokens: args.tokens || session.tokens,
      error: args.error,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update stream with artifact content (documents, code, etc.)
 */
export const updateStreamArtifact = mutation({
  args: {
    sessionId: v.id('streamingSessions'),
    artifact: v.object({
      type: v.union(
        v.literal('document'),
        v.literal('code'),
        v.literal('markdown')
      ),
      data: v.any(),
    }),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    await ctx.db.patch(args.sessionId, {
      artifacts: [args.artifact],
      updatedAt: Date.now(),
    });
  },
});

/**
 * Stream AI response with real-time WebSocket updates
 */
export const streamWithWebSocket = action({
  args: {
    sessionId: v.id('streamingSessions'),
    chatId: v.id('chats'),
    content: v.string(),
    model: v.optional(v.string()),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    useReasoning: v.optional(v.boolean()),
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
  },
  handler: async (ctx, args) => {
    try {
      // Update status to streaming
      await ctx.runMutation(api.streaming.updateStreamingContent, {
        sessionId: args.sessionId,
        content: '',
        status: 'streaming',
      });

      // Get chat and user for context
      const chat = await ctx.runQuery(api.chats.getById, {
        id: args.chatId,
      });

      if (!chat) {
        throw new Error('Chat not found');
      }

      // Get user directly from database
      const user = await ctx.runQuery(api.users.getCurrentUserProfile, {});

      // Process attachments for RAG if provided
      if (args.attachments && args.attachments.length > 0) {
        logger.info('Processing attachments for WebSocket streaming', {
          attachmentCount: args.attachments.length,
        });

        for (const attachment of args.attachments) {
          try {
            await ctx.runAction(api.fileProcessing.processFileForRAG, {
              messageId: args.sessionId as unknown as Id<'messages'>, // Use sessionId temporarily
              fileId: attachment.fileId,
              walletAddress: user?.walletAddress || '',
              fileName: attachment.fileId,
              mimeType: attachment.mimeType,
            });
          } catch (err) {
            logger.warn('Failed to process attachment for RAG', {
              error: String(err),
              fileId: attachment.fileId,
            });
          }
        }
      }

      // Get conversation history (optimized for token usage)
      const messages = await ctx.runQuery(api.messages.getByChatId, {
        chatId: args.chatId,
        limit: TOKEN_OPTIMIZATION.MAX_CONTEXT_MESSAGES, // Reduced from 20 to 10
      });

      // Get user preferences for memory
      let contextToInject = '';
      if (user) {
        const userPreferences = await ctx.runQuery(
          api.userPreferences.getByUserId,
          {
            userId: chat.ownerId,
          }
        );

        if (userPreferences?.enableMemory !== false) {
          try {
            const ragContext = await ctx.runAction(api.rag.retrieveContext, {
              userId: chat.ownerId,
              query: args.content,
              chatId: args.chatId,
              tokenBudget: 3000,
              includeMemories: true,
              includeMessages: true,
              includeDocuments: true,
              minRelevanceScore: 0.4,
              useCache: true,
            });

            if (ragContext.items.length > 0) {
              contextToInject = await ctx.runAction(
                api.rag.formatContextForLLM,
                {
                  context: ragContext,
                  includeMetadata: false,
                }
              );
            }
          } catch (error) {
            logger.warn('RAG context retrieval failed', {
              error: String(error),
            });
          }
        }
      }

      // Prepare AI model
      const modelName =
        args.model || chat.model || 'openrouter/openai/gpt-oss-20b:free';
      const aiModel = await prepareAIModel(modelName);

      if (!aiModel) {
        throw new Error('Model not available');
      }

      // Build system prompt with caching
      const cacheKey = `${chat._id}-${chat.agentId || 'default'}-${args.useReasoning}`;
      const { prompt: systemPrompt, cached: isPromptCached } = getCachedPrompt(
        cacheKey,
        () => buildSystemPrompt(chat, contextToInject, args.useReasoning)
      );

      logger.info('System prompt cache status', {
        cached: isPromptCached,
        cacheKey,
        savings: isPromptCached ? '90% token cost reduction' : 'none',
      });

      // Convert messages for AI SDK
      const conversationHistory = messages.map((msg: Doc<'messages'>) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      }));

      // Add the current user message to the conversation
      conversationHistory.push({
        role: 'user' as const,
        content: args.content,
      });

      // Import tool registry system and MCP integration
      const { getToolsForAgent, executeToolByName } = await import(
        './toolRegistry'
      );
      const { 
        shouldRouteThroughRealMcp, 
        getEnhancedCapabilitiesWithRealMcp 
      } = await import('./lib/mcp/realMcpIntegration');

      // Get agent and determine available tools
      let availableCapabilities: string[] = [
        'webSearch',
        'calculator',
        'createDocument',
        'generateCode',
        'summarizeText',
      ];
      let agent;

      if (chat.agentId) {
        try {
          agent = await ctx.runQuery(api.agents.getById, { id: chat.agentId });
          if (agent?.capabilities && agent.capabilities.length > 0) {
            availableCapabilities = agent.capabilities;
          }

          // Add MCP capabilities if configured
          if (agent?.mcpServers && agent.mcpServers.length > 0) {
            // Get enhanced capabilities including real MCP tools
            availableCapabilities = getEnhancedCapabilitiesWithRealMcp(
              availableCapabilities,
              agent.mcpServers
            );

            logger.info('Real MCP capabilities added for agent', {
              agentId: chat.agentId,
              mcpServerCount: agent.mcpServers.filter((s) => s.enabled).length,
              enhancedCapabilities: availableCapabilities.length,
            });
          }
        } catch (error) {
          // Fallback to default tools if agent lookup fails
          logger.warn('Agent lookup failed, using default capabilities', {
            error: String(error),
          });
        }
      }

      // Get tools for this agent's capabilities (including MCP tools)
      const { aiTools } = getToolsForAgent(availableCapabilities);

      // Stream with real-time updates and tool support
      let accumulatedContent = '';
      const toolCalls: TrackedToolCall[] = [];

      const result = await streamText({
        model: aiModel,
        system: systemPrompt,
        messages: conversationHistory,
        temperature: args.temperature ?? chat.temperature ?? 0.7,
        maxOutputTokens: args.maxTokens ?? chat.maxTokens ?? 2000,
        tools: aiTools,
      });

      // Stream chunks with real-time updates
      for await (const chunk of result.textStream) {
        accumulatedContent += chunk;

        // Update streaming content in real-time
        await ctx.runMutation(api.streaming.updateStreamingContent, {
          sessionId: args.sessionId,
          content: accumulatedContent,
          status: 'streaming',
        });
      }

      // Handle tool calls if any - await the promises for text and usage
      const text = await result.text;
      const usage = await result.usage;

      // Track token usage with cost estimation
      if (usage) {
        const promptTokens = usage.inputTokens || 0;
        const completionTokens = usage.outputTokens || 0;
        const totalTokens =
          usage.totalTokens || promptTokens + completionTokens;
        const cachedTokens = isPromptCached
          ? Math.floor(promptTokens * 0.9)
          : 0;
        const effectivePromptTokens = isPromptCached
          ? Math.floor(promptTokens * 0.1)
          : promptTokens;

        // Calculate estimated cost (basic estimation - you can customize based on your actual model costs)
        const estimatedCost = calculateEstimatedCost(
          modelName,
          effectivePromptTokens,
          completionTokens
        );

        // Update session with token usage
        await ctx.runMutation(api.streaming.updateStreamingContent, {
          sessionId: args.sessionId,
          content: accumulatedContent,
          status: 'completed',
          tokens: {
            input: effectivePromptTokens,
            output: completionTokens,
          },
        });

        // Update cumulative token usage for the chat
        await ctx.runMutation(api.chats.updateTokenUsage, {
          chatId: args.chatId,
          tokenUsage: {
            promptTokens: effectivePromptTokens,
            completionTokens,
            totalTokens: effectivePromptTokens + completionTokens,
            cachedTokens,
            estimatedCost,
          },
        });

        // Log token usage for monitoring
        logger.info('Token usage tracked', {
          model: modelName,
          promptTokens,
          completionTokens,
          totalTokens,
          cachedTokens,
          effectivePromptTokens,
          estimatedCost,
          cacheDiscount: isPromptCached ? '90%' : '0%',
        });
      }

      // In AI SDK v5, toolCalls is also a Promise
      const resultToolCalls = result.toolCalls
        ? await result.toolCalls
        : undefined;

      // Process any tool calls that occurred
      if (resultToolCalls && Array.isArray(resultToolCalls)) {
        for (const toolCall of resultToolCalls as ToolCallWithInput[]) {
          logger.info('Tool called', {
            toolName: toolCall.toolName,
            argsString: JSON.stringify(toolCall.input),
          });

          // Track this tool call
          const trackedToolCall: TrackedToolCall = {
            id: toolCall.toolCallId,
            name: toolCall.toolName,
            args: toolCall.input as Record<
              string,
              string | number | boolean | null
            >,
          };
          toolCalls.push(trackedToolCall);

          // Determine if this is an MCP tool and get the server ID
          const mcpServer = agent?.mcpServers?.find(
            (server) =>
              server.enabled &&
              shouldRouteThroughRealMcp(toolCall.toolName, [server])
          );
          const toolType = mcpServer ? 'mcp' : 'regular';
          const serverId = mcpServer?.name;

          // Track execution context
          const executionContext = {
            sessionId: args.sessionId,
            chatId: args.chatId,
            messageId: undefined, // Will be set after message creation
            agentId:
              agent?._id || chat.agentId || ('default-agent' as Id<'agents'>),
            userId: user?.walletAddress || 'anonymous',
            model: args.model,
            temperature: args.temperature,
          };

          // Start tracking the execution
          const executionId = await ctx.runAction(
            api.executionTracking.trackExecution,
            {
              context: executionContext,
              toolName: toolCall.toolName,
              input: toolCall.input,
              toolType,
              serverId,
            }
          );

          // Check if tool should be routed through MCP servers
          let toolResult;

          try {
            if (
              agent?.mcpServers &&
              shouldRouteThroughRealMcp(toolCall.toolName, agent.mcpServers)
            ) {
              // Execute through real MCP server
              logger.info('Routing tool through real MCP server', {
                toolName: toolCall.toolName,
                agentId: chat.agentId,
                executionId,
              });

              // Execute through real MCP integration directly
              const { globalMcpClient } = await import('./lib/mcp/mcpClient');
              
              // Ensure MCP server is connected
              try {
                await globalMcpClient.connectServer('websearch-mcp');
              } catch (error) {
                logger.warn('MCP server connection failed, continuing with mock response', {
                  error: error instanceof Error ? error.message : String(error),
                });
              }
              
              // Map tool name for MCP execution
              const mcpToolName = toolCall.toolName === 'webSearch' ? 'web_search' : toolCall.toolName;
              
              const mcpResult = await globalMcpClient.executeTool('websearch-mcp', {
                toolName: mcpToolName,
                arguments: toolCall.input,
              });
              
              if (mcpResult.success) {
                toolResult = {
                  success: true,
                  data: mcpResult.content as Record<string, string | number | boolean | null>,
                };
              } else {
                // MCP failed, fallback to regular tool
                logger.info('MCP tool failed, falling back to regular tool', {
                  toolName: toolCall.toolName,
                  mcpError: mcpResult.error,
                });
                
                toolResult = await executeToolByName(
                  toolCall.toolName,
                  toolCall.input,
                  { ctx, sessionId: args.sessionId }
                );
              }
            } else {
              // Execute through regular tool registry system
              toolResult = await executeToolByName(
                toolCall.toolName,
                toolCall.input,
                { ctx, sessionId: args.sessionId }
              );
            }

            // Estimate token usage for tracking
            const tokenUsage = estimateTokenUsage(
              toolCall.input,
              toolResult.data || toolResult
            );

            // Complete the tracked execution
            await ctx.runAction(
              api.executionTracking.completeTrackedExecution,
              {
                executionId,
                output: toolResult.data || toolResult,
                tokenUsage,
              }
            );
          } catch (error) {
            // Fail the tracked execution
            await ctx.runAction(api.executionTracking.failTrackedExecution, {
              executionId,
              error: {
                code: 'TOOL_EXECUTION_ERROR',
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
              },
            });

            // Re-throw the error
            throw error;
          }

          // Handle artifact storage for specific tool types
          if (toolResult.success && toolResult.data) {
            if (
              toolCall.toolName === 'createDocument' &&
              'document' in toolResult.data
            ) {
              await ctx.runMutation(api.streaming.updateStreamArtifact, {
                sessionId: args.sessionId,
                artifact: {
                  type: 'document',
                  data: toolResult.data.document,
                },
              });
            } else if (toolCall.toolName === 'generateCode') {
              await ctx.runMutation(api.streaming.updateStreamArtifact, {
                sessionId: args.sessionId,
                artifact: {
                  type: 'code',
                  data: toolResult.data,
                },
              });
            }
          }

          // Update the tracked tool call with results from registry
          trackedToolCall.result = {
            success: toolResult.success,
            data: toolResult.data,
            error: toolResult.error,
            executionTime: toolResult.executionTime,
          };
        }
      }

      // Save final message
      await ctx.runMutation(api.messages.create, {
        chatId: args.chatId,
        walletAddress: user?.walletAddress || '',
        role: 'assistant',
        content: text || accumulatedContent,
        metadata: {
          model: modelName,
          usage: usage
            ? {
                inputTokens: usage.inputTokens || 0,
                outputTokens: usage.outputTokens || 0,
                totalTokens: usage.totalTokens || 0,
              }
            : undefined,
          tools: toolCalls.length > 0 ? toolCalls : undefined,
        },
      });

      // Update session as completed
      await ctx.runMutation(api.streaming.updateStreamingContent, {
        sessionId: args.sessionId,
        content: text || accumulatedContent,
        status: 'completed',
        tokens: usage
          ? {
              input: usage.inputTokens || 0,
              output: usage.outputTokens || 0,
            }
          : undefined,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Streaming failed';
      logger.error(
        'WebSocket streaming error',
        error instanceof Error ? error : new Error(String(error))
      );

      // Update session with error
      await ctx.runMutation(api.streaming.updateStreamingContent, {
        sessionId: args.sessionId,
        content: '',
        status: 'error',
        error: errorMessage,
      });

      throw error;
    }
  },
});

// Helper function to prepare AI model
async function prepareAIModel(modelName: string) {
  try {
    if (modelName.startsWith('openrouter/')) {
      const openrouter = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY!,
        baseURL: 'https://openrouter.ai/api/v1',
      });

      const orModel = modelName.replace(/^openrouter\//, '');
      if (!ALLOWED_OPENROUTER_MODELS.has(orModel)) {
        return null;
      }

      return openrouter(orModel);
    }
    if (
      modelName.startsWith('gpt') ||
      modelName.startsWith('o3') ||
      modelName.startsWith('o4')
    ) {
      const openai = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      return openai(modelName);
    }
    if (modelName.startsWith('gemini')) {
      const google = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      });

      return google(modelName);
    }

    return null;
  } catch (error) {
    logger.error('Failed to prepare AI model', error);
    return null;
  }
}

// Helper function to build system prompt with token optimization
function buildSystemPrompt(
  chat: Doc<'chats'>,
  context: string,
  useReasoning?: boolean
): string {
  const prompts = [];

  // Use agent prompt if available
  if (chat.agentPrompt) {
    // Check if prompt is already optimized
    const isOptimized =
      chat.agentPrompt.includes('IDENTITY:') || chat.agentPrompt.length < 200;

    if (TOKEN_OPTIMIZATION.COMPRESS_SYSTEM_PROMPTS && !isOptimized) {
      // Compress long prompts
      const compressed = chat.agentPrompt
        .replace(/\n{3,}/g, '\n')
        .replace(/#{2,}\s*/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
      prompts.push(compressed);
    } else {
      prompts.push(chat.agentPrompt);
    }
  }

  // Add minimal behavioral instructions (optimized from ~300 tokens to ~80 tokens)
  prompts.push(`CONVERSATION RULES:
- No repetition of prior info
- Build on context naturally  
- Vary responses & vocabulary
- Reference past exchanges briefly`);

  if (chat.systemPrompt) {
    prompts.push(`# ADDITIONAL USER PREFERENCES\n\n${chat.systemPrompt}`);
  }

  if (context) {
    prompts.push(
      `# RELEVANT CONTEXT FROM MEMORY\n\n${context}\n\nUSE THIS CONTEXT to avoid repetition and maintain continuity. This shows what you've discussed before.`
    );
  }

  if (useReasoning) {
    prompts.push(`# REASONING MODE

Use structured reasoning with clear steps:
1. Think through the problem systematically
2. Break down complex issues into manageable parts
3. Consider multiple perspectives
4. Provide clear, logical conclusions
5. Ensure your reasoning doesn't repeat previous analyses
6. Build upon prior reasoning when applicable`);
  }

  return prompts.join('\n\n---\n\n');
}

// =============================================================================
// Legacy HTTP Streaming (for backward compatibility)
// =============================================================================

function getCorsHeaders(origin: string | null): HeadersInit {
  // Check if origin is allowed
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);
  const allowedOrigin = isAllowed ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export const streamChat = httpAction(async (ctx, request) => {
  const origin = request.headers.get('origin');

  // Handle OPTIONS preflight request
  if (request.method === 'OPTIONS') {
    // Validate pre-flight headers
    const requestMethod = request.headers.get('Access-Control-Request-Method');
    const requestHeaders = request.headers.get(
      'Access-Control-Request-Headers'
    );

    if (origin && requestMethod && requestHeaders) {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(origin),
      });
    }

    return new Response(null, { status: 400 });
  }

  // Parse request body
  const body = (await request.json()) as {
    chatId: string;
    walletAddress: string;
    content: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    useReasoning?: boolean;
    attachments?: Array<{
      fileId: string;
      url?: string;
      mimeType: string;
      size: number;
      type: 'image' | 'file' | 'video';
    }>;
  };

  const {
    chatId,
    walletAddress,
    content,
    model,
    temperature,
    maxTokens,
    useReasoning,
    attachments,
  } = body;

  // Authenticate user with proper Convex Auth
  const authHeader = request.headers.get('Authorization');

  // Extract JWT token from Bearer auth header
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : null;

  // First try to authenticate with JWT token if available
  let user = null;

  if (token) {
    try {
      // Verify JWT token and get user from Convex Auth
      const userId = await getAuthUserId(ctx);
      if (userId) {
        user = await ctx.runQuery(api.users.getUserById, {
          userId: userId as Id<'users'>,
        });
      }
    } catch (authError) {
      logger.warn('JWT authentication failed, falling back to wallet address', {
        error: String(authError),
      });
    }
  }

  // Fallback to wallet address verification if JWT auth fails or not provided
  if (!user && walletAddress) {
    user = await ctx.runQuery(api.users.getUserByWallet, {
      walletAddress,
    });
  }

  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Authentication required. Please sign in.' }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'WWW-Authenticate': 'Bearer realm="ANUBIS Chat"',
          ...getCorsHeaders(origin),
        },
      }
    );
  }

  // Verify chat exists and user has access (using user ID)
  const chat = await ctx.runQuery(api.chats.getById, {
    id: chatId as Id<'chats'>,
  });
  if (!chat || chat.ownerId !== user._id) {
    return new Response(
      JSON.stringify({ error: 'Chat not found or access denied' }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers':
            'Content-Type, Authorization, X-Requested-With, Accept',
          'Access-Control-Allow-Credentials': 'true',
        },
      }
    );
  }

  // Check subscription status
  const subscription = await ctx.runQuery(
    api.subscriptions.getSubscriptionStatusByWallet,
    {
      walletAddress,
    }
  );

  if (!subscription) {
    return new Response(
      JSON.stringify({ error: 'Subscription not found. Please sign up.' }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers':
            'Content-Type, Authorization, X-Requested-With, Accept',
          'Access-Control-Allow-Credentials': 'true',
        },
      }
    );
  }

  // Check if user is an admin - admins have unlimited access
  const adminStatus = await ctx.runQuery(
    api.adminAuth.checkAdminStatusByWallet,
    {
      walletAddress,
    }
  );

  // Check message limits (skip for admins)
  if (
    !adminStatus.isAdmin &&
    (subscription.messagesUsed ?? 0) >= (subscription.messagesLimit ?? 0)
  ) {
    return new Response(
      JSON.stringify({
        error:
          'Monthly message limit reached. Please upgrade your subscription.',
        code: 'QUOTA_EXCEEDED',
        details: {
          messagesUsed: subscription.messagesUsed,
          messagesLimit: subscription.messagesLimit,
          tier: subscription.tier,
          nextReset: subscription.currentPeriodEnd,
        },
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers':
            'Content-Type, Authorization, X-Requested-With, Accept',
          'Access-Control-Allow-Credentials': 'true',
        },
      }
    );
  }

  // Select AI model based on chat configuration
  const modelName = model || chat.model || 'openrouter/openai/gpt-oss-20b:free';

  // Create user message using the user ID
  const _userMessage = await ctx.runMutation(api.messages.create, {
    chatId: chatId as Id<'chats'>,
    walletAddress, // Still need wallet address for legacy compatibility
    role: 'user',
    content,
    attachments,
  });

  // Check user preferences for memory and RAG features
  const userPreferences = await ctx.runQuery(api.userPreferences.getByUserId, {
    userId: user._id,
  });
  const memoryEnabled = userPreferences?.enableMemory !== false; // Default to true

  // User message created - will process memory after assistant response
  if (_userMessage) {
    logger.debug('User message created', {
      messageId: _userMessage._id,
      memoryEnabled,
      userId: user._id,
    });

    // Process attachments for RAG integration (scheduled for after message creation)
    if (attachments && attachments.length > 0) {
      logger.info('Attachments detected, scheduling RAG processing', {
        messageId: _userMessage._id,
        attachmentCount: attachments.length,
        attachmentTypes: attachments
          .map((a: { mimeType?: string }) => a.mimeType)
          .filter(Boolean)
          .join(', '),
      });

      // Schedule file processing for RAG integration
      // Process each attachment individually for better error handling
      for (const attachment of attachments) {
        try {
          await ctx.runAction(api.fileProcessing.processFileForRAG, {
            messageId: _userMessage._id,
            fileId: attachment.fileId,
            walletAddress,
            fileName: attachment.fileId, // Use fileId as fileName if not provided
            mimeType: attachment.mimeType,
          });
          logger.debug('Scheduled RAG processing for attachment', {
            fileId: attachment.fileId,
            mimeType: attachment.mimeType,
          });
        } catch (err) {
          logger.error('Failed to schedule attachment processing', {
            error: err,
            fileId: attachment.fileId,
          });
          // Continue processing other attachments even if one fails
        }
      }
    }
  }

  // Initialize context to be injected into system prompt
  let contextToInject = '';

  // If memory is enabled, retrieve and format relevant context using the advanced RAG system
  if (memoryEnabled) {
    try {
      // Use the sophisticated RAG system for context retrieval
      const ragContext = await ctx.runAction(api.rag.retrieveContext, {
        userId: user._id,
        query: content,
        chatId: chatId as Id<'chats'>,
        tokenBudget: 3000, // Leave room for conversation
        includeMemories: true,
        includeMessages: true,
        includeDocuments: true,
        minRelevanceScore: 0.4, // Lower threshold for more context
        useCache: true,
      });

      // Format the RAG context for LLM consumption
      if (ragContext.items.length > 0) {
        contextToInject = await ctx.runAction(api.rag.formatContextForLLM, {
          context: ragContext,
          includeMetadata: false, // Keep it clean for the agent
        });
      }
    } catch (_error) {
      // Fallback to basic memory system if RAG fails
      try {
        const memories = await ctx.runQuery(api.memories.getUserMemories, {
          userId: user._id,
        });

        if (memories && memories.length > 0) {
          const importantMemories = memories
            .sort(
              (a: Doc<'memories'>, b: Doc<'memories'>) =>
                b.importance - a.importance
            )
            .slice(0, 5);

          contextToInject =
            '## User Context\n\nKey information about the user:\n';
          for (const memory of importantMemories) {
            contextToInject += `- ${memory.content}\n`;
          }
          contextToInject += '\n';
        }
      } catch (_fallbackError) {
        // Continue without context rather than failing the entire request
      }
    }
  }

  // Get recent messages for context (optimized for token usage)
  const messages = await ctx.runQuery(api.messages.getByChatId, {
    chatId: chatId as Id<'chats'>,
    limit: TOKEN_OPTIMIZATION.MAX_CONTEXT_MESSAGES, // Reduced from 20 to 10
  });

  // Convert messages to AI SDK format with enhanced file content for RAG
  const conversationHistory = [] as Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;

  for (const msg of messages) {
    let contentWithAttachments = msg.content;
    const att = msg.metadata?.attachments;

    // Enhanced file handling with RAG integration
    if (att && att.length > 0) {
      const resolved: string[] = [];

      for (const a of att) {
        let url = a.url;
        if (!url && a.fileId) {
          try {
            const u = await ctx.storage.getUrl(
              a.fileId as unknown as Id<'_storage'>
            );
            if (u) {
              url = u;
            }
          } catch (_e) {
            logger.warn('Failed to resolve attachment URL', {
              fileId: a.fileId,
              error: String(_e),
            });
          }
        }

        const label =
          a.type === 'image' ? 'Image' : a.type === 'video' ? 'Video' : 'File';

        if (url) {
          resolved.push(`${label}: ${url}`);

          // File will be processed for RAG after message creation
        }
      }

      if (resolved.length > 0) {
        contentWithAttachments += `\n\n[Attachments]\n${resolved.map((r) => `- ${r}`).join('\n')}`;
      }
    }

    conversationHistory.push({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: contentWithAttachments,
    });
  }

  // Prepare AI model
  let aiModel;

  // Check premium model access (gpt-5-nano is not premium, it's an efficient nano model)
  const isPremiumModel =
    [
      // 'gpt-4o',  // REMOVED
      // 'claude-3.5-sonnet',  // ANTHROPIC DISABLED
      // 'claude-sonnet-4',   // ANTHROPIC DISABLED
      'gpt-5',
      // 'gpt-5-pro',  // REMOVED
      // 'o3',  // REMOVED
      'gpt-4.1-mini',
    ].includes(modelName) || modelName === 'openrouter/openai/gpt-oss-120b';

  // Skip premium checks for admins - they have unlimited access
  if (isPremiumModel && !adminStatus.isAdmin) {
    if (subscription.tier === 'free') {
      return new Response(
        JSON.stringify({
          error: 'Premium models require Pro or Pro+ subscription.',
          code: 'FEATURE_RESTRICTED',
          details: {
            currentTier: subscription.tier,
            requiredTier: 'pro',
            model: modelName,
          },
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }

    if (
      (subscription.premiumMessagesUsed ?? 0) >=
      (subscription.premiumMessagesLimit ?? 0)
    ) {
      return new Response(
        JSON.stringify({
          error:
            'Premium message quota exhausted. Please upgrade or wait for next billing cycle.',
          code: 'QUOTA_EXCEEDED',
          details: {
            premiumMessagesUsed: subscription.premiumMessagesUsed,
            premiumMessagesLimit: subscription.premiumMessagesLimit,
            tier: subscription.tier,
            nextReset: subscription.currentPeriodEnd,
          },
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }
  }

  // Determine provider and create appropriate model
  if (
    modelName.startsWith('openrouter/') ||
    modelName.startsWith('gpt') ||
    modelName.startsWith('o3') ||
    modelName.startsWith('o4') ||
    modelName === 'gpt-5' ||
    modelName === 'gpt-5-pro' ||
    modelName === 'gpt-4.1' ||
    modelName === 'gpt-4o'
  ) {
    if (modelName.startsWith('openrouter/')) {
      const openrouter = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY!,
        baseURL: 'https://openrouter.ai/api/v1',
        fetch: async (input, init) => {
          try {
            const url = typeof input === 'string' ? input : input.toString();
            if (
              (url.includes('/chat/completions') ||
                url.includes('/responses')) &&
              init &&
              typeof init.body === 'string'
            ) {
              const payload = JSON.parse(init.body as string);
              if (
                payload &&
                typeof payload === 'object' &&
                payload.model === 'openai/gpt-oss-120b'
              ) {
                payload.provider = { only: ['Cerebras'] };
                init.body = JSON.stringify(payload);
                if (init.headers && typeof init.headers === 'object') {
                  (init.headers as Record<string, string>)['Content-Type'] =
                    'application/json';
                }
              }
            }
          } catch {
            // fall through to default fetch if anything goes wrong
          }
          return fetch(input as RequestInfo | URL, init as RequestInit);
        },
      });
      const orModel = modelName.replace(/^openrouter\//, '');

      if (!ALLOWED_OPENROUTER_MODELS.has(orModel)) {
        return new Response(
          JSON.stringify({
            error: 'Model not allowed',
            code: 'MODEL_NOT_ALLOWED',
            details: { provider: 'openrouter', model: orModel },
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type',
            },
          }
        );
      }

      // For Cerebras routing, pass provider preference via per-call options if supported
      // Otherwise rely on header above
      aiModel = openrouter(orModel);
    } else {
      // OpenAI models
      const openai = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Map our custom model IDs to actual API model names if needed
      let apiModelName = modelName;
      if (modelName === 'gpt-5' || modelName === 'gpt-5-pro') {
        apiModelName = 'gpt-4o';
      } else if (modelName === 'gpt-4.1') {
        apiModelName = 'gpt-4-turbo-preview';
      } else if (modelName === 'o3' || modelName === 'o4-mini') {
        apiModelName = 'gpt-4o';
      }
      // gpt-5-nano is now available and will be used directly

      aiModel = openai(apiModelName);
    }
  } else if (
    modelName.startsWith('claude') ||
    modelName === 'claude-opus-4.1' ||
    modelName === 'claude-sonnet-4'
  ) {
    // Anthropic models are not supported - use OpenRouter or Google AI instead
    return new Response(
      JSON.stringify({
        error:
          'Anthropic models are not supported. Please use OpenRouter or Google AI providers.',
        code: 'MODEL_NOT_SUPPORTED',
        details: {
          model: modelName,
          supportedProviders: ['openrouter', 'google', 'openai'],
        },
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers':
            'Content-Type, Authorization, X-Requested-With, Accept',
          'Access-Control-Allow-Credentials': 'true',
        },
      }
    );
  } else if (
    modelName.startsWith('gemini') ||
    modelName === 'gemini-2.5-pro' ||
    modelName === 'gemini-2.5-flash' ||
    modelName === 'gemini-2.5-flash-lite'
  ) {
    // Google models
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    // Map our custom model IDs to actual API model names
    let apiModelName = modelName;
    if (
      modelName === 'gemini-2.5-pro' ||
      modelName === 'gemini-2.5-flash' ||
      modelName === 'gemini-2.5-flash-lite'
    ) {
      // Gemini 2.5 models might not be available yet
      apiModelName = 'gemini-2.0-flash-exp';
    } else if (modelName === 'gemini-2.0-flash') {
      apiModelName = 'gemini-2.0-flash-exp';
    }

    aiModel = google(apiModelName);
  } else {
    // Default fallback to OpenAI
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    aiModel = openai('gpt-4o');
  }

  // Combine prompts: agent guidance + system directions + context
  const prompts = [];

  // Agent prompt provides personality and behavioral guidance (not absolute instructions)
  if (chat.agentPrompt) {
    prompts.push(`# AGENT PERSONALITY AND GUIDANCE\n\n${chat.agentPrompt}`);
  }

  // Always include core behavioral instructions for memory awareness
  const coreInstructions = `# CORE BEHAVIORAL INSTRUCTIONS

You are having an ongoing conversation with this user. Use the provided context below to:
- Avoid repeating information you've already shared (like introductions, capabilities, etc.)
- Reference previous conversations naturally when relevant
- Build upon established context and relationships
- Maintain conversational continuity

If the relevant context shows you've already introduced yourself or explained your capabilities to this user, do not repeat these introductions. Continue the conversation naturally based on your shared history.`;

  prompts.push(coreInstructions);

  // User's custom system prompt provides additional specific directions
  if (chat.systemPrompt) {
    prompts.push(`# ADDITIONAL USER PREFERENCES\n\n${chat.systemPrompt}`);
  }

  // RAG context provides conversation history and user information
  if (contextToInject) {
    prompts.push(`# RELEVANT CONTEXT\n\n${contextToInject}`);
  }

  const combinedSystemPrompt = prompts.join('\n\n---\n\n');

  // Log for debugging
  // Agent and system prompts are already included in the messages array above

  let result;
  // Reasoning step capture and usage tracking implemented below in onFinish callback

  // Determine maxSteps based on reasoning mode
  const maxSteps = useReasoning ? 10 : Math.floor(Math.random() * 3) + 1; // Reasoning: 10, Regular: 1-3
  const messagesConsumed = useReasoning ? 2 : 1; // Reasoning costs 2 messages, regular costs 1

  try {
    // Use unified system prompt based on reasoning mode
    const systemPrompt = useReasoning
      ? `${combinedSystemPrompt}

When responding to the user's message, use a structured reasoning process with up to ${maxSteps} steps:

1. First, think through the problem step by step in a <thinking> section
2. Break down your reasoning into clear, numbered steps (Step 1, Step 2, etc.)
3. Use as many steps as needed (up to ${maxSteps}) to thoroughly analyze the problem
4. Consider multiple perspectives or approaches if relevant
5. Then provide your final response

Format your response like this:
<thinking>
Step 1: [Your first reasoning step]
Step 2: [Your second reasoning step] 
Step 3: [Continue as needed...]
[Use up to ${maxSteps} steps to reach a thorough conclusion]
</thinking>

[Your final response to the user]`
      : `${combinedSystemPrompt}

When responding to the user's message, you may use up to ${maxSteps} reasoning steps if the problem is complex enough to benefit from step-by-step thinking. For simple queries, respond directly. For more complex ones, use this format:

<thinking>
Step 1: [First reasoning step if needed]
Step 2: [Second reasoning step if needed]
Step 3: [Third reasoning step if needed - only if really necessary]
</thinking>

[Your response to the user]

Use your judgment - only use the thinking section if the query truly benefits from multi-step reasoning.`;

    // Use the same streamText approach for both reasoning and normal modes
    result = await streamText({
      model: aiModel,
      system: systemPrompt,
      messages: conversationHistory,
      temperature: temperature ?? chat.temperature ?? 0.7,
      maxOutputTokens: maxTokens ?? chat.maxTokens ?? 2000,
      onFinish: async ({ text, finishReason, usage }) => {
        let sanitizedText = text || '';
        let reasoningSteps: string[] | undefined;

        if (useReasoning) {
          // For reasoning mode, keep the thinking content but format it nicely
          const thinkingMatch = sanitizedText.match(
            /<(thinking|think)>([\s\S]*?)<\/(thinking|think)>/
          );

          if (thinkingMatch?.[2]) {
            const raw = thinkingMatch[2];
            const parts = raw
              .split(/Step \d+:/)
              .map((p) => p.trim())
              .filter(Boolean);
            if (parts.length > 0) {
              reasoningSteps = parts.slice(
                0,
                Math.max(1, Math.min(parts.length, 10))
              );
            }

            // Format reasoning steps for display
            const formattedReasoning =
              reasoningSteps && reasoningSteps.length > 0
                ? '## Reasoning Process\n\n' +
                  reasoningSteps
                    .map((s, i) => `**Step ${i + 1}:** ${s}`)
                    .join('\n\n')
                : thinkingMatch[2];

            // Replace the thinking tags with formatted reasoning
            sanitizedText = sanitizedText.replace(
              /<(thinking|think)>[\s\S]*?<\/(thinking|think)>/,
              `${formattedReasoning}\n\n---\n\n## Response\n\n`
            );
          }
        } else {
          // Only strip thinking for non-reasoning mode
          const thinkingMatch = sanitizedText.match(
            /<(thinking|think)>([\s\S]*?)<\/(thinking|think)>/
          );

          // Capture reasoning steps for metadata
          if (thinkingMatch?.[2]) {
            const raw = thinkingMatch[2];
            const parts = raw
              .split(/Step \d+:/)
              .map((p) => p.trim())
              .filter(Boolean);
            if (parts.length > 0) {
              reasoningSteps = parts.slice(
                0,
                Math.max(1, Math.min(parts.length, 10))
              );
            }
          }

          // Strip thinking tags for non-reasoning mode
          sanitizedText = sanitizedText
            .replace(/<(thinking|think)>[\s\S]*?<\/(thinking|think)>/g, '')
            .trim();
        }

        // Prepare reasoning text for metadata
        const reasoningJoined =
          reasoningSteps && reasoningSteps.length > 0
            ? reasoningSteps.map((s, i) => `Step ${i + 1}: ${s}`).join('\n')
            : undefined;

        // Save assistant message to database
        const _assistantMessage = await ctx.runMutation(api.messages.create, {
          chatId: chatId as Id<'chats'>,
          walletAddress,
          role: 'assistant',
          content: sanitizedText,
          metadata: {
            model: modelName,
            finishReason: finishReason || 'stop',
            usage: usage
              ? {
                  inputTokens: usage.inputTokens || 0,
                  outputTokens: usage.outputTokens || 0,
                  totalTokens: usage.totalTokens || 0,
                }
              : undefined,
            reasoning: reasoningJoined,
          },
        });

        // Extract memories from conversation after AI response
        if (memoryEnabled && _userMessage && _assistantMessage) {
          logger.info('Starting memory extraction', {
            userMessageId: _userMessage._id,
            assistantMessageId: _assistantMessage._id,
            userId: user._id,
          });

          // Process memory extraction for both messages
          try {
            // Process user message
            await ctx.runAction(api.memoryExtraction.processNewMessage, {
              messageId: _userMessage._id,
            });
            logger.debug('User message memory extraction completed', {
              messageId: _userMessage._id,
            });

            // Also process assistant message for comprehensive memory
            await ctx.runAction(api.memoryExtraction.processNewMessage, {
              messageId: _assistantMessage._id,
            });
            logger.debug('Assistant message memory extraction completed', {
              messageId: _assistantMessage._id,
            });
          } catch (err) {
            logger.error('Memory extraction failed', err, {
              userMessageId: _userMessage._id,
              assistantMessageId: _assistantMessage._id,
            });
            // Memory extraction errors shouldn't break the chat flow
          }
        } else {
          logger.debug('Memory extraction skipped', {
            memoryEnabled,
            hasUserMessage: !!_userMessage,
            hasAssistantMessage: !!_assistantMessage,
            userId: user._id,
          });
        }

        // Track message usage for subscription (skip for admins) - consume appropriate number of messages
        if (!adminStatus.isAdmin) {
          // For reasoning mode, we need to consume 2 messages
          for (let i = 0; i < messagesConsumed; i++) {
            await ctx.runMutation(api.subscriptions.trackMessageUsageByWallet, {
              walletAddress,
              isPremiumModel,
            });
          }
        }
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to generate AI response',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers':
            'Content-Type, Authorization, X-Requested-With, Accept',
          'Access-Control-Allow-Credentials': 'true',
        },
      }
    );
  }

  // Handle regular streaming response (non-reasoning mode)
  if (result) {
    // Convert to a proper text stream response with CORS headers
    // The AI SDK provides toTextStreamResponse() which returns a properly formatted Response
    const response = result.toTextStreamResponse();

    // Add CORS headers to the response
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, Accept'
    );
    headers.set('Access-Control-Allow-Credentials', 'true');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  // Fallback error response
  return new Response(
    JSON.stringify({
      error: 'No response generated',
    }),
    {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers':
          'Content-Type, Authorization, X-Requested-With, Accept',
        'Access-Control-Allow-Credentials': 'true',
      },
    }
  );
});
