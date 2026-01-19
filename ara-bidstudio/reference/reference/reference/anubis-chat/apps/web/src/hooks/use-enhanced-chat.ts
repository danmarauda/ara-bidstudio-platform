'use client';

import { useChat } from '@ai-sdk/react';
import { api } from '@convex/_generated/api';
import type { Doc, Id } from '@convex/_generated/dataModel';
import { TextStreamChatTransport } from 'ai';
import { useAction, useMutation, useQuery } from 'convex/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MemoryManager } from '@/lib/memory/manager';
import type { MinimalMessage } from '@/lib/types/components';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('hooks/use-enhanced-chat');

interface UseEnhancedChatOptions {
  chatId?: string;
  walletAddress?: string;
  onError?: (error: Error) => void;
}

/**
 * Enhanced chat hook that integrates AI SDK with Convex WebSocket streaming
 * Provides seamless real-time updates with optimistic UI patterns
 */
export function useEnhancedChat({
  chatId,
  walletAddress,
  onError,
}: UseEnhancedChatOptions) {
  // Initialize memory manager instance
  const memoryManager = useRef(new MemoryManager()).current;

  // WebSocket streaming session state
  const [sessionId, setSessionId] = useState<Id<'streamingSessions'> | null>(
    null
  );
  const [isWebSocketStreaming, setIsWebSocketStreaming] = useState(false);

  // Convex WebSocket streaming actions
  const createSession = useMutation(api.streaming.createStreamingSession);
  const streamWithWebSocket = useAction(api.streaming.streamWithWebSocket);

  // Subscribe to streaming updates (real-time WebSocket!)
  const streamingSession = useQuery(
    api.streaming.subscribeToStream,
    sessionId ? { sessionId } : 'skip'
  );

  // Get Convex deployment URL for fallback HTTP endpoint
  const apiEndpoint = useMemo(() => {
    const deploymentUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.replace(
      'wss://',
      'https://'
    ).replace('.convex.cloud', '.convex.site');

    // Fallback HTTP endpoint if WebSocket fails
    return deploymentUrl ? `${deploymentUrl}/stream-chat` : '/api/chat';
  }, []);

  // Convex queries for existing messages
  const convexMessages = useQuery(
    api.messagesAuth.getMyMessages,
    chatId ? { chatId: chatId as Id<'chats'> } : 'skip'
  );

  // Create message mutation for persistence
  const createMessage = useMutation(api.messagesAuth.createMyMessage);

  // Convert Convex messages to AI SDK format
  const _initialMessages = useMemo(() => {
    if (!convexMessages) {
      return [];
    }

    return convexMessages.map((msg: Doc<'messages'>) => ({
      id: msg._id,
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      createdAt: new Date(msg.createdAt ?? msg._creationTime ?? Date.now()),
    }));
  }, [convexMessages]);

  // Manual input state for AI SDK v5
  const [input, setInput] = useState('');

  // Get memory context for current conversation
  const getMemoryContext = useCallback(async (): Promise<string> => {
    if (!chatId) {
      return '';
    }

    try {
      // Retrieve recent memories related to this conversation
      const memories = await memoryManager.retrieveMemories({
        conversationId: chatId,
        limit: 5,
        minImportance: 0.5,
      });

      // Get conversation context if available
      const conversationContext = memoryManager
        .exportMemories()
        .conversations.find((c) => c.id === chatId);

      const contextParts: string[] = [];

      // Add conversation summary if available
      if (conversationContext?.summary) {
        contextParts.push(
          `Previous conversation summary: ${conversationContext.summary}`
        );
      }

      // Add key topics if available
      if (
        conversationContext?.topics &&
        conversationContext.topics.length > 0
      ) {
        contextParts.push(
          `Key topics discussed: ${conversationContext.topics.join(', ')}`
        );
      }

      // Add relevant memories
      if (memories.length > 0) {
        const memoryTexts = memories.map((m) => m.content).join('; ');
        contextParts.push(`Relevant context: ${memoryTexts}`);
      }

      return contextParts.length > 0
        ? `[Memory Context: ${contextParts.join(' | ')}]`
        : '';
    } catch (err) {
      log.warn('Failed to retrieve memory context', { error: err });
      return '';
    }
  }, [chatId, memoryManager]);

  // Initialize memory system with existing messages
  const initializeMemoryFromConvex = useCallback(async () => {
    if (!(chatId && convexMessages) || convexMessages.length === 0) {
      return;
    }

    try {
      // Convert Convex messages to UIMessage format
      const uiMessages = convexMessages.map((msg: Doc<'messages'>) => ({
        id: msg._id,
        role: msg.role as 'user' | 'assistant' | 'system',
        parts: [{ type: 'text' as const, text: msg.content }],
      }));

      // Update memory system with existing conversation
      await memoryManager.updateConversation(chatId, uiMessages);
      log.debug('Initialized memory system from Convex messages', {
        messageCount: uiMessages.length,
      });
    } catch (err) {
      log.warn('Failed to initialize memory from Convex', { error: err });
    }
  }, [chatId, convexMessages, memoryManager]);

  // Initialize memory when Convex messages load
  useMemo(() => {
    initializeMemoryFromConvex();
  }, [initializeMemoryFromConvex]);

  // Track WebSocket streaming message
  const [webSocketMessage, setWebSocketMessage] =
    useState<MinimalMessage | null>(null);

  // Update message from WebSocket streaming session
  useEffect(() => {
    if (streamingSession && isWebSocketStreaming) {
      const _isActive =
        streamingSession.status === 'streaming' ||
        streamingSession.status === 'initializing';

      if (streamingSession.content || streamingSession.status === 'streaming') {
        setWebSocketMessage({
          _id: `stream-${sessionId}`,
          content: streamingSession.content,
          role: 'assistant',
          createdAt: Date.now(),
          isStreaming: streamingSession.status === 'streaming',
        } as MinimalMessage);
      }

      if (streamingSession.status === 'completed') {
        // Clear streaming state after completion
        setTimeout(() => {
          setWebSocketMessage(null);
          setSessionId(null);
          setIsWebSocketStreaming(false);
        }, 100);
      }

      if (streamingSession.status === 'error') {
        log.error('WebSocket streaming error', {
          error: streamingSession.error,
        });
        setIsWebSocketStreaming(false);
        setSessionId(null);
        onError?.(new Error(streamingSession.error || 'Streaming failed'));
      }
    }
  }, [streamingSession, sessionId, isWebSocketStreaming, onError]);

  // Use AI SDK's useChat hook for fallback HTTP streaming
  const {
    messages: aiMessages,
    sendMessage: aiSendMessage,
    stop,
    status: aiStatus,
    error,
  } = useChat({
    id: chatId,
    transport: new TextStreamChatTransport({
      api: apiEndpoint,
    }),
    onFinish: async ({ message }) => {
      log.debug('HTTP streaming finished', { message });

      // Extract content from AI SDK v5 message format
      const content =
        (message as any).parts
          ?.filter((part: any) => part.type === 'text')
          .map((part: any) => part.text)
          .join('') || '';

      // Persist assistant message to Convex after streaming completes
      if (chatId && message.role === 'assistant' && !isWebSocketStreaming) {
        try {
          await createMessage({
            chatId: chatId as Id<'chats'>,
            content,
            role: 'assistant',
            metadata: {
              model: (message as any).metadata?.model,
              usage: (message as any).metadata?.usage,
            },
          });

          // Update memory system with latest conversation context
          if (aiMessages && aiMessages.length > 0) {
            await memoryManager.updateConversation(chatId, aiMessages);
            log.debug('Updated memory system with conversation context', {
              messageCount: aiMessages.length,
            });
          }
        } catch (err) {
          log.error('Failed to persist assistant message or update memory', {
            error: err,
          });
        }
      }
    },
    onError: (err) => {
      log.error('HTTP streaming error', { error: err });
      if (!isWebSocketStreaming) {
        onError?.(err);
      }
    },
    experimental_throttle: 50, // Smooth streaming updates
  });

  // Determine active streaming status
  const _status = isWebSocketStreaming ? 'streaming' : aiStatus;

  // Enhanced send function with WebSocket streaming support
  const sendMessage = useCallback(
    async (
      content: string,
      model?: string,
      useReasoning?: boolean,
      attachments?: Array<{
        fileId: string;
        url?: string;
        mimeType: string;
        size: number;
        type: 'image' | 'file' | 'video';
      }>
    ) => {
      if (!(chatId && content.trim())) {
        return;
      }

      try {
        // Get memory context for this conversation
        const memoryContext = await getMemoryContext();

        // Persist user message to Convex first
        const userMessageId = await createMessage({
          chatId: chatId as Id<'chats'>,
          content,
          role: 'user',
          attachments,
        });

        if (!userMessageId) {
          throw new Error('Failed to create user message');
        }

        // Try WebSocket streaming first (preferred)
        try {
          setIsWebSocketStreaming(true);
          setWebSocketMessage(null);

          // Create streaming session
          const newSessionId = await createSession({
            chatId: chatId as Id<'chats'>,
            messageId: userMessageId,
          });

          if (!newSessionId) {
            throw new Error('Failed to create streaming session');
          }

          setSessionId(newSessionId);
          log.debug('WebSocket streaming session created', {
            sessionId: newSessionId,
          });

          // Start WebSocket streaming (runs in background)
          streamWithWebSocket({
            sessionId: newSessionId,
            chatId: chatId as Id<'chats'>,
            content: memoryContext
              ? `${memoryContext}\n\nUser: ${content}`
              : content,
            model,
            temperature: undefined,
            maxTokens: undefined,
            useReasoning,
            attachments,
          }).catch((err) => {
            log.error('WebSocket streaming failed, falling back to HTTP', err);
            setIsWebSocketStreaming(false);

            // Fallback to HTTP streaming
            const enhancedContent = memoryContext
              ? `${memoryContext}\n\nUser: ${content}`
              : content;

            aiSendMessage({
              role: 'user',
              parts: [{ type: 'text', text: enhancedContent }],
            });
          });
        } catch (wsError) {
          log.warn('WebSocket unavailable, using HTTP streaming', {
            error: wsError,
          });
          setIsWebSocketStreaming(false);

          // Fallback to HTTP streaming
          const enhancedContent = memoryContext
            ? `${memoryContext}\n\nUser: ${content}`
            : content;

          await aiSendMessage({
            role: 'user',
            parts: [{ type: 'text', text: enhancedContent }],
          });
        }

        log.debug('Sent message', {
          hasMemoryContext: !!memoryContext,
          streamingMethod: isWebSocketStreaming ? 'websocket' : 'http',
          model,
          useReasoning,
        });
      } catch (err) {
        log.error('Failed to send message', { error: err });
        setIsWebSocketStreaming(false);
        throw err;
      }
    },
    [
      chatId,
      aiSendMessage,
      createMessage,
      getMemoryContext,
      createSession,
      streamWithWebSocket,
      isWebSocketStreaming,
    ]
  );

  // Regenerate last assistant message
  const regenerateLastMessage = useCallback(() => {
    // AI SDK v5 doesn't have reload - would need to implement differently
    log.warn('Regenerate not implemented for AI SDK v5');
  }, []);

  // Convert AI SDK messages to MinimalMessage format
  const formattedMessages = useMemo((): MinimalMessage[] => {
    // If we have Convex messages, prefer them as source of truth
    if (convexMessages && convexMessages.length > 0) {
      const convexMsgs: MinimalMessage[] = convexMessages.map(
        (msg: Doc<'messages'>) => ({
          _id: msg._id,
          content: msg.content,
          role: msg.role,
          createdAt: msg.createdAt ?? msg._creationTime ?? Date.now(),
          attachments: (msg as any).attachments || [],
          metadata: msg.metadata,
        })
      );

      // Add WebSocket streaming message if active
      if (webSocketMessage) {
        convexMsgs.push(webSocketMessage);
      }
      // Otherwise add HTTP streaming message if active
      else if (aiStatus === 'streaming' && aiMessages.length > 0) {
        const lastAiMsg = aiMessages.at(-1);
        if (lastAiMsg?.role === 'assistant') {
          // Extract content from AI SDK v5 message format
          const content =
            lastAiMsg?.parts
              ?.filter((part: any) => part.type === 'text')
              .map((part: any) => part.text)
              .join('') || '';

          // Check if this is a new streaming message
          const isNew = !convexMsgs.some(
            (m) => m.content === content && m.role === 'assistant'
          );

          if (isNew) {
            convexMsgs.push({
              _id: `streaming-${Date.now()}`,
              content,
              role: 'assistant',
              createdAt: Date.now(),
              isStreaming: true,
            } as MinimalMessage);
          }
        }
      }

      return convexMsgs;
    }

    // Fallback to AI SDK messages
    return aiMessages.map((msg) => {
      // Extract content from AI SDK v5 message format
      const content =
        msg.parts
          ?.filter((part: any) => part.type === 'text')
          .map((part: any) => part.text)
          .join('') || '';

      return {
        _id: msg.id,
        content,
        role: msg.role as 'user' | 'assistant' | 'system',
        createdAt: Date.now(),
      };
    });
  }, [convexMessages, aiMessages, aiStatus, webSocketMessage]);

  return {
    // Messages
    messages: formattedMessages,
    streamingMessage:
      (isWebSocketStreaming && webSocketMessage) ||
      (aiStatus === 'streaming' ? formattedMessages.at(-1) : null),

    // Input management
    input,
    setInput,

    // Actions
    sendMessage,
    regenerate: regenerateLastMessage,
    stop: isWebSocketStreaming ? () => setIsWebSocketStreaming(false) : stop,

    // Status flags
    isStreaming: isWebSocketStreaming || aiStatus === 'streaming',
    isLoading: aiStatus === 'submitted',
    isReady: !isWebSocketStreaming && aiStatus === 'ready',
    streamingMethod: isWebSocketStreaming ? 'websocket' : 'http',

    // Error handling
    error,
  };
}
