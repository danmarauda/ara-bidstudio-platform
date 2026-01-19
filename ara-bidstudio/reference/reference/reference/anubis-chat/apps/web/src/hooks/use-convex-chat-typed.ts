/**
 * Type-safe Convex hooks for the chat system
 * This file provides strongly typed wrappers around Convex queries and mutations
 */

import { api } from '@convex/_generated/api';
import type { Id, Doc } from '@convex/_generated/dataModel';
import { useQuery, useMutation, useAction } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
// Re-export commonly used types
export type { 
  MessageReaction,
  MessageMetadata,
  CreateMessageParams,
  CreateChatParams,
  UpdateChatParams,
  MessageWithReactions,
  ChatWithMessageCount,
  ChatStats,
  MessageStats,
  ChatEvent,
  RealtimeUpdate,
  TokenUsage,
  ToolUsage,
  ToolExecution,
  MessageAttachment,
  MessageRating,
  MessageActions,
  StreamingSession,
  PaginationParams,
  MessageFilters,
  ApiResponse
} from '../../../../packages/backend/convex/types/chat';

// =============================================================================
// User Preferences Types & Hooks
// =============================================================================

export type UserPreferences = FunctionReturnType<typeof api.userPreferences.getUserPreferencesWithDefaults>;

export function useUserPreferences(enabled = true) {
  return useQuery(
    api.userPreferences.getUserPreferencesWithDefaults,
    enabled ? {} : 'skip'
  );
}

export function useUpdateUserPreferences() {
  return useMutation(api.userPreferences.updateUserPreferences);
}

// =============================================================================
// Chat Types & Hooks
// =============================================================================

export type ChatList = FunctionReturnType<typeof api.chatsAuth.getMyChats>;
export type SingleChat = FunctionReturnType<typeof api.chatsAuth.getMyChat>;

export function useChats(enabled = true) {
  return useQuery(
    api.chatsAuth.getMyChats,
    enabled ? {} : 'skip'
  );
}

export function useChat(chatId: Id<'chats'> | undefined, enabled = true) {
  return useQuery(
    api.chatsAuth.getMyChat,
    enabled && chatId ? { id: chatId } : 'skip'
  );
}

export function useCreateChat() {
  return useMutation(api.chatsAuth.createMyChat);
}

export function useUpdateChat() {
  return useMutation(api.chatsAuth.updateMyChat);
}

export function useDeleteChat() {
  return useMutation(api.chatsAuth.deleteMyChat);
}

export function useGenerateTitle() {
  return useAction(api.chats.generateAndUpdateTitle);
}

export function useClearChatHistory() {
  return useMutation(api.chats.clearHistory);
}

export function useTogglePinChat() {
  return useMutation(api.chats.togglePin);
}

export function useArchiveChat() {
  return useMutation(api.chats.archive);
}

export function useRestoreChat() {
  return useMutation(api.chats.restore);
}

export function useChatStats(ownerId: string | undefined, enabled = true) {
  return useQuery(
    api.chats.getStats,
    enabled && ownerId ? { ownerId } : 'skip'
  );
}

// =============================================================================
// Message Types & Hooks
// =============================================================================

export type MessageList = FunctionReturnType<typeof api.messagesAuth.getMyMessages>;
export type SingleMessage = FunctionReturnType<typeof api.messages.getById>;

export function useMessages(
  chatId: Id<'chats'> | undefined, 
  options?: { limit?: number; before?: number },
  enabled = true
) {
  return useQuery(
    api.messagesAuth.getMyMessages,
    enabled && chatId 
      ? { chatId, ...options }
      : 'skip'
  );
}

export function useMessage(messageId: Id<'messages'> | undefined, enabled = true) {
  return useQuery(
    api.messages.getById,
    enabled && messageId ? { id: messageId } : 'skip'
  );
}

export function useCreateMessage() {
  return useMutation(api.messages.create);
}

export function useUpdateMessage() {
  return useMutation(api.messages.update);
}

export function useDeleteMessage() {
  return useMutation(api.messages.remove);
}

export function useEditMessage() {
  return useMutation(api.messages.editMessage);
}

export function useToggleReaction() {
  return useMutation(api.messages.toggleReaction);
}

export function useRegenerateLastAssistant() {
  return useMutation(api.messages.regenerateLastAssistant);
}

export function useMessageStats(chatId: Id<'chats'> | undefined, enabled = true) {
  return useQuery(
    api.messages.getStats,
    enabled && chatId ? { chatId } : 'skip'
  );
}

export function useMessagesWithCitations(
  chatId: Id<'chats'> | undefined,
  limit = 20,
  enabled = true
) {
  return useQuery(
    api.messages.getWithCitations,
    enabled && chatId ? { chatId, limit } : 'skip'
  );
}

export function useRecentMessages(
  userId: string | undefined,
  limit = 20,
  enabled = true
) {
  return useQuery(
    api.messages.getRecent,
    enabled && userId ? { userId, limit } : 'skip'
  );
}

// =============================================================================
// Message Rating & Actions
// =============================================================================

export function useRateMessage() {
  return useMutation(api.messageRating.rateMessage);
}

export function useRemoveRating() {
  return useMutation(api.messageRating.removeRating);
}

export function useTrackAction() {
  return useMutation(api.messageRating.trackMessageAction);
}

// =============================================================================
// Agent Types & Hooks
// =============================================================================

export type AgentList = FunctionReturnType<typeof api.agents.listPublic>;
export type SingleAgent = FunctionReturnType<typeof api.agents.getById>;

export function useAgents(enabled = true) {
  return useQuery(
    api.agents.listPublic,
    enabled ? {} : 'skip'
  );
}

export function useAgent(agentId: Id<'agents'> | undefined, enabled = true) {
  return useQuery(
    api.agents.getById,
    enabled && agentId ? { id: agentId } : 'skip'
  );
}

// =============================================================================
// Utility Hooks
// =============================================================================

export function useTokenUsage(chatId: Id<'chats'> | undefined, enabled = true) {
  return useQuery(
    api.chats.getTokenUsage,
    enabled && chatId ? { chatId } : 'skip'
  );
}

// =============================================================================
// Real-time Updates
// =============================================================================

export function useStreamingSession(
  chatId: Id<'chats'> | undefined,
  enabled = true
) {
  // This would connect to real-time streaming sessions when implemented
  return useQuery(
    api.chats.getById,
    enabled && chatId ? { id: chatId } : 'skip'
  );
}

// =============================================================================
// Type Guards
// =============================================================================

export function isValidChatId(id: string | undefined): id is Id<'chats'> {
  return typeof id === 'string' && id.length > 0;
}

export function isValidMessageId(id: string | undefined): id is Id<'messages'> {
  return typeof id === 'string' && id.length > 0;
}

export function isValidAgentId(id: string | undefined): id is Id<'agents'> {
  return typeof id === 'string' && id.length > 0;
}

// =============================================================================
// Hook Composition Utilities
// =============================================================================

/**
 * Combined hook for chat and its messages
 */
export function useChatWithMessages(
  chatId: Id<'chats'> | undefined,
  messageOptions?: { limit?: number; before?: number }
) {
  const chat = useChat(chatId);
  const messages = useMessages(chatId, messageOptions);
  
  return {
    chat,
    messages,
    isLoading: chat === undefined || messages === undefined,
    error: null, // Add error handling as needed
  };
}

/**
 * Combined hook for user preferences and chat settings
 */
export function useUserSettings() {
  const preferences = useUserPreferences();
  const updatePreferences = useUpdateUserPreferences();
  
  return {
    preferences,
    updatePreferences,
    isLoading: preferences === undefined,
  };
}

/**
 * Combined hook for all chat management operations
 */
export function useChatManagement() {
  const createChat = useCreateChat();
  const updateChat = useUpdateChat();
  const deleteChat = useDeleteChat();
  const generateTitle = useGenerateTitle();
  const clearHistory = useClearChatHistory();
  const togglePin = useTogglePinChat();
  const archive = useArchiveChat();
  const restore = useRestoreChat();
  
  return {
    createChat,
    updateChat,
    deleteChat,
    generateTitle,
    clearHistory,
    togglePin,
    archive,
    restore,
  };
}

/**
 * Combined hook for all message operations
 */
export function useMessageManagement() {
  const createMessage = useCreateMessage();
  const updateMessage = useUpdateMessage();
  const deleteMessage = useDeleteMessage();
  const editMessage = useEditMessage();
  const toggleReaction = useToggleReaction();
  const regenerateLastAssistant = useRegenerateLastAssistant();
  const rateMessage = useRateMessage();
  const removeRating = useRemoveRating();
  const trackAction = useTrackAction();
  
  return {
    createMessage,
    updateMessage,
    deleteMessage,
    editMessage,
    toggleReaction,
    regenerateLastAssistant,
    rateMessage,
    removeRating,
    trackAction,
  };
}