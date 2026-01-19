/**
 * Optimistic UI updates for message handling
 * Provides immediate UI feedback while API calls are in progress
 */

import { useOptimistic, useCallback } from 'react';
import type { ChatMessage, StreamingMessage } from '@/lib/types/api';
import type { MinimalMessage } from '@/lib/types/components';
import { nanoid } from 'nanoid';

type OptimisticMessageBase = {
  _id?: string;
  id?: string; // streaming id
  retryCount?: number;
};

type OptimisticMessage = (
  (Omit<ChatMessage, '_id'> & { _id: string }) |
  (StreamingMessage & { id?: string }) |
  (MinimalMessage & { _id: string })
) & OptimisticMessageBase & {
  isOptimistic?: boolean;
  isFailed?: boolean;
};

type OptimisticAction = 
  | { type: 'add_user_message'; content: string; chatId: string }
  | { type: 'add_assistant_message'; content: string; chatId: string; isStreaming?: boolean }
  | { type: 'update_streaming_content'; messageId: string; content: string }
  | { type: 'finalize_message'; messageId: string; finalContent: string }
  | { type: 'mark_failed'; messageId: string; error?: string }
  | { type: 'retry_message'; messageId: string }
  | { type: 'remove_optimistic'; messageId: string };

/**
 * Reducer for optimistic message updates
 */
function optimisticMessagesReducer(
  messages: OptimisticMessage[], 
  action: OptimisticAction
): OptimisticMessage[] {
  switch (action.type) {
    case 'add_user_message': {
      const optimisticUserMessage: OptimisticMessage = {
        _id: `optimistic-user-${nanoid()}`,
        content: action.content,
        role: 'user' as const,
        createdAt: Date.now(),
        isOptimistic: true,
      };
      return [...messages, optimisticUserMessage];
    }

    case 'add_assistant_message': {
      const optimisticAssistantMessage: OptimisticMessage = {
        _id: `optimistic-assistant-${nanoid()}`,
        content: action.content,
        role: 'assistant' as const,
        createdAt: Date.now(),
        isOptimistic: true,
        ...(action.isStreaming && {
          isStreaming: true,
          id: `streaming-${nanoid()}`
        })
      };
      return [...messages, optimisticAssistantMessage];
    }

    case 'update_streaming_content': {
      return messages.map(msg => 
        ((msg._id && msg._id === action.messageId) || (msg.id && msg.id === action.messageId))
          ? { ...msg, content: action.content }
          : msg
      );
    }

    case 'finalize_message': {
      return messages.map(msg => 
        ((msg._id && msg._id === action.messageId) || (msg.id && msg.id === action.messageId))
          ? { 
              ...msg, 
              content: action.finalContent,
              isOptimistic: false,
              isStreaming: false,
              isFailed: false
            }
          : msg
      );
    }

    case 'mark_failed': {
      return messages.map(msg => 
        ((msg._id && msg._id === action.messageId) || (msg.id && msg.id === action.messageId))
          ? { 
              ...msg, 
              isFailed: true,
              isOptimistic: false,
              retryCount: (msg.retryCount || 0) + 1
            }
          : msg
      );
    }

    case 'retry_message': {
      return messages.map(msg => 
        ((msg._id && msg._id === action.messageId) || (msg.id && msg.id === action.messageId))
          ? { 
              ...msg, 
              isFailed: false,
              isOptimistic: true
            }
          : msg
      );
    }

    case 'remove_optimistic': {
      return messages.filter(msg => 
        (msg._id && msg._id !== action.messageId) && 
        !(msg.id && msg.id === action.messageId)
      );
    }

    default:
      return messages;
  }
}

/**
 * Hook for managing optimistic message updates
 */
export function useOptimisticMessages(
  initialMessages: OptimisticMessage[] = []
) {
  const [optimisticMessages, updateOptimisticMessages] = useOptimistic(
    initialMessages,
    optimisticMessagesReducer
  );

  const addOptimisticUserMessage = useCallback((content: string, chatId: string) => {
    updateOptimisticMessages({ type: 'add_user_message', content, chatId });
  }, [updateOptimisticMessages]);

  const addOptimisticAssistantMessage = useCallback((
    content: string, 
    chatId: string, 
    isStreaming = false
  ) => {
    updateOptimisticMessages({ 
      type: 'add_assistant_message', 
      content, 
      chatId, 
      isStreaming 
    });
  }, [updateOptimisticMessages]);

  const updateStreamingContent = useCallback((messageId: string, content: string) => {
    updateOptimisticMessages({ type: 'update_streaming_content', messageId, content });
  }, [updateOptimisticMessages]);

  const finalizeMessage = useCallback((messageId: string, finalContent: string) => {
    updateOptimisticMessages({ type: 'finalize_message', messageId, finalContent });
  }, [updateOptimisticMessages]);

  const markMessageFailed = useCallback((messageId: string, error?: string) => {
    updateOptimisticMessages({ type: 'mark_failed', messageId, error });
  }, [updateOptimisticMessages]);

  const retryMessage = useCallback((messageId: string) => {
    updateOptimisticMessages({ type: 'retry_message', messageId });
  }, [updateOptimisticMessages]);

  const removeOptimisticMessage = useCallback((messageId: string) => {
    updateOptimisticMessages({ type: 'remove_optimistic', messageId });
  }, [updateOptimisticMessages]);

  return {
    optimisticMessages,
    addOptimisticUserMessage,
    addOptimisticAssistantMessage,
    updateStreamingContent,
    finalizeMessage,
    markMessageFailed,
    retryMessage,
    removeOptimisticMessage,
  };
}

export type { OptimisticMessage };