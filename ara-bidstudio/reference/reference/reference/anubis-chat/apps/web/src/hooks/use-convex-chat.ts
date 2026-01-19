'use client';

import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useAction, useMutation, useQuery } from 'convex/react';
import { useCallback, useEffect, useState } from 'react';
import type { StreamingMessage as UIStreamingMessage } from '@/lib/types/api';
import { MessageRole } from '@/lib/types/api';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('useConvexChat');

// Avoid duplicate identifier by reusing the imported name directly
type StreamingMessage = UIStreamingMessage;

/**
 * Convex-native chat hook with WebSocket streaming support
 * Uses Convex's real-time subscriptions for true WebSocket communication
 */
export function useConvexChat(chatId: string | undefined) {
  const [streamingMessage, setStreamingMessage] =
    useState<StreamingMessage | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<Id<'streamingSessions'> | null>(
    null
  );
  const [lastRequestAt, setLastRequestAt] = useState<number | null>(null);

  // Convex queries and mutations - using authenticated queries
  const messages = useQuery(
    api.messagesAuth.getMyMessages,
    chatId ? { chatId: chatId as Id<'chats'> } : 'skip'
  );

  const createMessage = useMutation(api.messagesAuth.createMyMessage);
  const createSession = useMutation(api.streaming.createStreamingSession);
  const streamWithWebSocket = useAction(api.streaming.streamWithWebSocket);

  // Subscribe to streaming updates (WebSocket connection!)
  const streamingSession = useQuery(
    api.streaming.subscribeToStream,
    sessionId ? { sessionId } : 'skip'
  );

  // Update streaming message when session updates
  useEffect(() => {
    if (streamingSession) {
      const isActive =
        streamingSession.status === 'streaming' ||
        streamingSession.status === 'initializing';
      setIsStreaming(isActive);

      if (streamingSession.content || streamingSession.status === 'streaming') {
        setStreamingMessage({
          id: `stream-${sessionId}`,
          content: streamingSession.content,
          role: MessageRole.ASSISTANT,
          isStreaming: streamingSession.status === 'streaming',
        });
      }

      if (streamingSession.status === 'completed') {
        // Clean up after completion with small delay for smooth transition
        setTimeout(() => {
          setStreamingMessage(null);
          setSessionId(null);
          setIsStreaming(false);
        }, 100);
      }

      if (streamingSession.status === 'error') {
        log.error('Streaming error', { error: streamingSession.error });
        setIsStreaming(false);
        setSessionId(null);
        setStreamingMessage(null);
      }
    }
  }, [streamingSession, sessionId]);

  // Send message with WebSocket streaming
  const sendMessage = useCallback(
    async (
      content: string,
      _walletAddress: string,
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
      if (!chatId) {
        return;
      }

      setIsStreaming(true);
      setStreamingMessage(null);
      setLastRequestAt(Date.now());

      try {
        // Create user message first
        const userMessageId = await createMessage({
          chatId: chatId as Id<'chats'>,
          content,
          role: 'user',
          attachments,
        });

        if (!userMessageId) {
          throw new Error('Failed to create user message');
        }

        // Create streaming session for WebSocket
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

        // Start streaming in background (WebSocket handles real-time updates)
        streamWithWebSocket({
          sessionId: newSessionId,
          chatId: chatId as Id<'chats'>,
          content,
          model,
          temperature: undefined,
          maxTokens: undefined,
          useReasoning,
          attachments,
        }).catch((err) => {
          log.error('WebSocket streaming failed', err);
          setIsStreaming(false);
          setStreamingMessage(null);
          setSessionId(null);
        });
      } catch (error: any) {
        log.error('Failed to send message', error);
        setIsStreaming(false);
        throw error;
      }
    },
    [chatId, createMessage, createSession, streamWithWebSocket]
  );

  // Combine regular messages with streaming message
  const allMessages = [
    ...(messages || []),
    ...(streamingMessage ? [streamingMessage] : []),
  ];

  // When a new assistant message arrives from Convex after a request, clear the placeholder
  // so the persisted message replaces the streaming UI seamlessly.
  // This ensures the 3-dot/streaming UI disappears only when the agent message appears.
  if (streamingMessage && lastRequestAt && Array.isArray(messages)) {
    const hasNewAssistant = (messages as any[]).some((m) => {
      try {
        const role = (m as any).role;
        const createdAt = (m as any).createdAt ?? (m as any)._creationTime ?? 0;
        return (
          role === 'assistant' &&
          typeof createdAt === 'number' &&
          createdAt >= lastRequestAt
        );
      } catch {
        return false;
      }
    });
    if (hasNewAssistant) {
      setStreamingMessage(null);
      setLastRequestAt(null);
    }
  }

  return {
    messages: allMessages,
    sendMessage,
    isStreaming,
    streamingMessage,
    sessionId,
    streamingStatus: streamingSession?.status,
  };
}
