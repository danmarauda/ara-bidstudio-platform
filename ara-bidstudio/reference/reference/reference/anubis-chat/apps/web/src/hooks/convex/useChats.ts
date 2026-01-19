/**
 * Chat-related Convex hooks with Result pattern and real-time updates
 */

import { api } from '@convex/_generated/api';
import { useCallback } from 'react';
import { createModuleLogger } from '@/lib/utils/logger';
import type { Result } from '@/lib/utils/result';
import { success } from '@/lib/utils/result';

const log = createModuleLogger('hooks/convex/useChats');

import {
  useConvexMutation,
  useConvexQuery,
  useOptimisticMutation,
} from './useConvexResult';

type Id<T> = string & { __tableName: T };

// =============================================================================
// Chat Queries
// =============================================================================

/**
 * Get chats by owner with real-time updates
 */
export function useChats(
  ownerId: string,
  options?: {
    limit?: number;
    isActive?: boolean;
  }
) {
  return useConvexQuery(api.chats.getByOwner, {
    ownerId,
    limit: options?.limit,
    isActive: options?.isActive,
  });
}

/**
 * Get specific chat by ID with real-time updates
 */
export function useChat(id: Id<'chats'>) {
  return useConvexQuery(api.chats.getById, { id });
}

/**
 * Get chat statistics for owner
 */
export function useChatStats(ownerId: string) {
  return useConvexQuery(api.chats.getStats, { ownerId });
}

// =============================================================================
// Chat Mutations
// =============================================================================

/**
 * Create new chat with optimistic updates
 */
export function useCreateChat() {
  return useOptimisticMutation(api.chats.create, {
    rollbackOnError: true,
    onOptimisticSuccess: (chat: any) => {
      log.info('Chat created', { chatId: chat?._id });
    },
    onRollbackError: (error: Error) => {
      log.error('Chat creation failed', { error: error.message });
    },
  });
}

/**
 * Update existing chat with optimistic updates
 */
export function useUpdateChat() {
  return useOptimisticMutation(api.chats.update, {
    rollbackOnError: true,
    onOptimisticSuccess: (chat: any) => {
      log.info('Chat updated', { chatId: chat?._id });
    },
    onRollbackError: (error: Error) => {
      log.error('Chat update failed', { error: error.message });
    },
  });
}

/**
 * Delete chat permanently
 */
export function useDeleteChat() {
  return useOptimisticMutation(api.chats.remove, {
    rollbackOnError: true,
    onOptimisticSuccess: (chat: any) => {
      log.info('Chat deleted', { chatId: chat?.chatId });
    },
    onRollbackError: (error: Error) => {
      log.error('Chat deletion failed', { error: error.message });
    },
  });
}

/**
 * Archive chat (soft delete)
 */
export function useArchiveChat() {
  return useOptimisticMutation(api.chats.archive, {
    rollbackOnError: true,
    onOptimisticSuccess: (chat: any) => {
      log.info('Chat archived', { chatId: chat?._id });
    },
    onRollbackError: (error: Error) => {
      log.error('Chat archiving failed', { error: error.message });
    },
  });
}

/**
 * Restore archived chat
 */
export function useRestoreChat() {
  return useConvexMutation(api.chats.restore);
}

/**
 * Update last message timestamp
 */
export function useUpdateLastMessageTime() {
  return useConvexMutation(api.chats.updateLastMessageTime);
}

// =============================================================================
// Composite Chat Operations
// =============================================================================

/**
 * Create chat with initial message
 */
export function useCreateChatWithMessage() {
  const { mutate: createChat } = useCreateChat();

  return useCallback(
    async (chatData: {
      title: string;
      ownerId: string;
      model: string;
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
      initialMessage?: string;
    }): Promise<Result<any, Error>> => {
      // Create the chat first
      const chatResult = await createChat({
        title: chatData.title,
        ownerId: chatData.ownerId,
        model: chatData.model,
        systemPrompt: chatData.systemPrompt,
        temperature: chatData.temperature,
        maxTokens: chatData.maxTokens,
      });

      if (!chatResult.success) {
        return chatResult;
      }

      // If initial message provided, we would add message here
      // For now, just return the chat
      return success({
        chat: chatResult.data,
        initialMessage: chatData.initialMessage,
      });
    },
    [createChat]
  );
}

/**
 * Duplicate chat with all settings
 */
export function useDuplicateChat() {
  const { mutate: createChat } = useCreateChat();

  return useCallback(
    async (
      _originalChatId: Id<'chats'>,
      ownerId: string,
      newTitle?: string
    ): Promise<Result<any, Error>> => {
      // Note: In a real implementation, we'd need to fetch the original chat data
      // This is a simplified version
      const duplicateResult = await createChat({
        title: newTitle || 'Copy of Chat',
        ownerId,
        model: 'gpt-4o', // Default model
        systemPrompt: undefined,
        temperature: 0.7,
        maxTokens: 4000,
      });

      return duplicateResult;
    },
    [createChat]
  );
}

/**
 * Batch archive multiple chats
 */
export function useBatchArchiveChats() {
  const { mutate: archiveChat } = useArchiveChat();

  return useCallback(
    async (
      chatIds: Id<'chats'>[],
      ownerId: string
    ): Promise<Result<any[], Error>> => {
      const results = [];

      for (const chatId of chatIds) {
        const result = await archiveChat({ id: chatId, ownerId });

        if (!result.success) {
          return result;
        }

        results.push(result.data);
      }

      return success(results);
    },
    [archiveChat]
  );
}

/**
 * Batch delete multiple chats
 */
export function useBatchDeleteChats() {
  const { mutate: deleteChat } = useDeleteChat();

  return useCallback(
    async (
      chatIds: Id<'chats'>[],
      ownerId: string
    ): Promise<Result<any[], Error>> => {
      const results = [];

      for (const chatId of chatIds) {
        const result = await deleteChat({ id: chatId, ownerId });

        if (!result.success) {
          return result;
        }

        results.push(result.data);
      }

      return success(results);
    },
    [deleteChat]
  );
}

// =============================================================================
// Chat State Management Hooks
// =============================================================================

/**
 * Manage active chat state with real-time updates
 */
export function useActiveChatState(ownerId: string) {
  const {
    data: chats,
    isLoading,
    error,
  } = useChats(ownerId, { isActive: true });

  return {
    activeChats: chats || [],
    isLoading,
    error,
    hasActiveChats: (chats?.length || 0) > 0,
  };
}

/**
 * Manage archived chat state with real-time updates
 */
export function useArchivedChatState(ownerId: string) {
  const {
    data: chats,
    isLoading,
    error,
  } = useChats(ownerId, { isActive: false });

  return {
    archivedChats: chats || [],
    isLoading,
    error,
    hasArchivedChats: (chats?.length || 0) > 0,
  };
}

/**
 * Combined chat state management
 */
export function useChatState(ownerId: string) {
  const activeChatsState = useActiveChatState(ownerId);
  const archivedChatsState = useArchivedChatState(ownerId);
  const statsQuery = useChatStats(ownerId);

  return {
    active: activeChatsState,
    archived: archivedChatsState,
    stats: statsQuery,
    isLoading:
      activeChatsState.isLoading ||
      archivedChatsState.isLoading ||
      statsQuery.isLoading,
    hasError: !!(
      activeChatsState.error ||
      archivedChatsState.error ||
      statsQuery.error
    ),
    error:
      activeChatsState.error || archivedChatsState.error || statsQuery.error,
  };
}
