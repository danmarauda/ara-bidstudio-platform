'use client';

import type { Doc, Id } from '@convex/_generated/dataModel';
import { MessageSquare, Plus, Sidebar } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { UpgradePrompt } from '@/components/auth/upgradePrompt';
import { EmptyState } from '@/components/data/empty-states';
import { LoadingStates } from '@/components/data/loading-states';
import {
  useAuthContext,
  useCanSendMessage,
  useSubscriptionLimits,
  useUpgradePrompt,
} from '@/components/providers/auth-provider';
import { useSolanaAgent } from '@/components/providers/solana-agent-provider';
import { AgentGrid } from '@/components/ui/agent-grid';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ModelGrid } from '@/components/ui/model-grid';

import { useConvexChat } from '@/hooks/use-convex-chat';
import { 
  useUserPreferences,
  useUpdateUserPreferences,
  useChats,
  useChat,
  useChatManagement,
  useAgents
} from '@/hooks/use-convex-chat-typed';
import { useTypingIndicator } from '@/hooks/use-typing-indicator';
import { AI_MODELS, DEFAULT_MODEL } from '@/lib/constants/ai-models';
import type { Chat, StreamingMessage, ToolCall } from '@/lib/types/api';
import type { MinimalMessage } from '@/lib/types/components';
import { cn } from '@/lib/utils';
import { createModuleLogger } from '@/lib/utils/logger';
import { ArtifactView } from './artifactView';
import { ChatHeader } from './chatHeader';
import { ChatSettingsDialog } from './chatSettingsDialog';
import { ChatWelcome } from './chatWelcome';
import { EnhancedMessageInput } from './enhanced-message-input';
import { ModelSelector } from './model-selector';
import { MessageListSuspense } from './messageListSuspense';
import { StreamingSuspenseWrapper } from './streamingSuspenseWrapper';

const log = createModuleLogger('components/chat/chat-interface');

type ChatSettings = {
  // Model Settings
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;

  // Behavior Settings
  systemPrompt: string;
  agentPrompt?: string; // Read-only agent prompt for display
  streamResponses: boolean;
  enableMemory: boolean;
  autoCreateTitles: boolean;

  // Interface Settings
  theme: 'light' | 'dark' | 'system';
  language: string;
  fontSize: 'small' | 'medium' | 'large';
  soundEnabled: boolean;
  autoScroll: boolean;

  // Advanced Settings
  saveHistory: boolean;
  contextWindow: number;
  responseFormat: 'text' | 'markdown' | 'json';
};

interface ChatInterfaceProps {
  className?: string;
}

/**
 * ChatInterface - Main chat application component
 * Provides modern AI chat experience with sidebar navigation and message handling
 */
export function ChatInterface({ className }: ChatInterfaceProps) {
  const { user, isAuthenticated, token } = useAuthContext();
  const userWalletAddress = user?.walletAddress;
  const limits = useSubscriptionLimits();
  const upgradePrompt = useUpgradePrompt();
  const canSendMessage = useCanSendMessage();
  const { agents: solanaAgents, selectedAgent, selectAgent, isInitialized } =
    useSolanaAgent();
  
  // Fetch public agents from Convex backend to complement Solana agents
  const publicAgents = useAgents(isAuthenticated);
  
  // Merge Solana agents with public agents for comprehensive agent management
  const allAgents = useMemo(() => {
    const combined = [...(solanaAgents || [])];
    
    // Add public agents that aren't already in the Solana agent list
    if (publicAgents) {
      for (const publicAgent of publicAgents) {
        const exists = combined.some(agent => 
          agent._id === publicAgent._id || 
          agent.name === publicAgent.name
        );
        if (!exists) {
          combined.push(publicAgent);
        }
      }
    }
    
    return combined;
  }, [solanaAgents, publicAgents]);

  // Debug logging for authentication and limits
  useEffect(() => {
    if (isAuthenticated && token) {
      log.info('Chat interface authenticated', { 
        userWalletAddress,
        hasToken: !!token,
        limits: limits ? {
          messagesRemaining: limits.messagesRemaining
        } : 'loading'
      });
    }
  }, [isAuthenticated, token, userWalletAddress, limits]);

  // Debug logging for agent system integration
  useEffect(() => {
    if (isAuthenticated) {
      log.info('Agent system status', {
        solanaAgentsCount: solanaAgents?.length || 0,
        publicAgentsCount: publicAgents?.length || 0,
        totalAgentsCount: allAgents?.length || 0,
        selectedAgentId: selectedAgent?._id,
        selectedAgentName: selectedAgent?.name,
        isInitialized
      });
    }
  }, [isAuthenticated, solanaAgents, publicAgents, allAgents, selectedAgent, isInitialized]);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get chat ID from URL
  const urlChatId = searchParams.get('chatId');
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(
    urlChatId || undefined
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL.id);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Mobile dialog states
  const [showMobileModelSelector, setShowMobileModelSelector] = useState(false);
  const [showMobileAgentSelector, setShowMobileAgentSelector] = useState(false);
  const [showDesktopAgentSelector, setShowDesktopAgentSelector] =
    useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [_showSearchDialog, _setShowSearchDialog] = useState(false);

  // Artifact state for tool outputs
  const [currentArtifact, setCurrentArtifact] = useState<{
    id?: string;
    title: string;
    content?: string;
    code?: string;
    type: 'document' | 'code' | 'markdown';
    language?: string;
    framework?: string;
    description?: string;
    createdAt?: string;
  } | null>(null);
  const [showArtifact, setShowArtifact] = useState(false);

  // Theme hook from next-themes
  const { theme, setTheme } = useTheme();

  // User preferences from Convex (using typed hooks)
  const userPreferences = useUserPreferences(isAuthenticated);
  const updateUserPreferences = useUpdateUserPreferences();

  // Theme sync is now handled globally in ThemeSync component

  // Chat settings state - complete configuration
  const [chatSettings, setChatSettings] = useState<ChatSettings>({
    // Model Settings
    model: DEFAULT_MODEL.id,
    temperature: 0.7,
    maxTokens: 2000,
    topP: 0.9,
    frequencyPenalty: 0,
    presencePenalty: 0,

    // Behavior Settings - separate system and agent prompts
    systemPrompt: '', // User's custom system prompt starts empty
    agentPrompt: selectedAgent?.systemPrompt || '', // Agent's base prompt for display
    streamResponses: true,
    enableMemory: true,
    autoCreateTitles: true,

    // Interface Settings
    theme: 'system' as const,
    language: 'en',
    fontSize: 'medium' as const,
    soundEnabled: true,
    autoScroll: true,

    // Advanced Settings
    saveHistory: true,
    contextWindow: 10,
    responseFormat: 'markdown' as const,
  });

  // Sync chat settings with user preferences when preferences are loaded
  useEffect(() => {
    if (userPreferences && isAuthenticated) {
      setChatSettings((prev) => {
        const prefsBase = userPreferences as unknown;
        let defaults: Partial<{
          defaultModel: string;
          defaultTemperature: number;
          defaultMaxTokens: number;
          defaultTopP: number;
          defaultFrequencyPenalty: number;
          defaultPresencePenalty: number;
        }> = {};
        if (typeof prefsBase === 'object' && prefsBase !== null) {
          defaults = prefsBase as typeof defaults;
        }
        return {
          ...prev,
          // Apply user preferences to interface and behavior settings
          theme: userPreferences.theme || prev.theme,
          language: userPreferences.language || prev.language,
          fontSize: userPreferences.fontSize || prev.fontSize,
          soundEnabled: userPreferences.soundEnabled ?? prev.soundEnabled,
          autoScroll: userPreferences.autoScroll ?? prev.autoScroll,
          streamResponses:
            userPreferences.streamResponses ?? prev.streamResponses,
          enableMemory: userPreferences.enableMemory ?? prev.enableMemory,
          autoCreateTitles:
            userPreferences.autoCreateTitles ?? prev.autoCreateTitles,
          responseFormat: userPreferences.responseFormat || prev.responseFormat,
          contextWindow: userPreferences.contextWindow || prev.contextWindow,
          saveHistory: userPreferences.saveHistory ?? prev.saveHistory,
          // Apply model defaults for new chats (when provided by preferences)
          model: defaults.defaultModel ?? prev.model,
          temperature: defaults.defaultTemperature ?? prev.temperature,
          maxTokens: defaults.defaultMaxTokens ?? prev.maxTokens,
          topP: defaults.defaultTopP ?? prev.topP,
          frequencyPenalty:
            defaults.defaultFrequencyPenalty ?? prev.frequencyPenalty,
          presencePenalty:
            defaults.defaultPresencePenalty ?? prev.presencePenalty,
        };
      });
    }
  }, [userPreferences, isAuthenticated]);

  // Debug logging
  useEffect(() => {}, []);

  // Convex queries and mutations - using typed hooks
  const chats = useChats(isAuthenticated);
  const currentChatQuery = useChat(
    selectedChatId && isAuthenticated ? selectedChatId as Id<'chats'> : undefined,
    isAuthenticated
  );
  const { createChat, updateChat, deleteChat, generateTitle } = useChatManagement();

  // Use our new Convex chat hook for real-time streaming
  const { messages, sendMessage, isStreaming } =
    useConvexChat(selectedChatId);

  // Use typing indicators
  const { startTyping, isAnyoneTyping } =
    useTypingIndicator(selectedChatId, userWalletAddress);

  // Use the dedicated query for the current chat instead of filtering from the list
  const currentChat = currentChatQuery as
    | (Pick<
        Chat,
        | 'title'
        | 'model'
        | 'lastMessageAt'
        | 'updatedAt'
        | 'systemPrompt'
        | 'temperature'
        | 'tokenUsage'
      > & {
        _id: string;
        agentPrompt?: string;
        agentId?: string;
      })
    | undefined;

  // Sync URL parameter with selected chat ID
  useEffect(() => {
    if (urlChatId && urlChatId !== selectedChatId) {
      setSelectedChatId(urlChatId);
    }
  }, [urlChatId, selectedChatId]);

  // Check for openSettings parameter and open chat settings
  useEffect(() => {
    const openSettings = searchParams.get('openSettings');
    if (openSettings === 'true') {
      setShowMobileSettings(true);
      // Clean up the URL parameter after opening settings
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('openSettings');
      const newUrl = `/chat${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`;
      router.replace(newUrl);
    }
  }, [searchParams, router]);

  // Auto-select first chat on load if no chat is selected
  useEffect(() => {
    if (chats && chats.length > 0 && !selectedChatId) {
      const firstChatId = chats[0]._id;
      setSelectedChatId(firstChatId);
      // Update URL to include the chat ID
      router.push(`/chat?chatId=${firstChatId}`);
    }
  }, [chats, selectedChatId, router]);

  // Update selected model and settings when chat changes
  useEffect(() => {
    if (currentChat?.model) {
      setSelectedModel(currentChat.model);
      setChatSettings((prev) => ({
        ...prev,
        model: currentChat.model,
        systemPrompt: currentChat.systemPrompt || '',
        agentPrompt: currentChat.agentPrompt || prev.agentPrompt,
        temperature: currentChat.temperature || prev.temperature,
      }));

      // Also select the agent if the chat has an agentId (but only if it's different from current)
      if (currentChat.agentId && allAgents && selectAgent) {
        const chatAgent = allAgents.find((a) => a._id === currentChat.agentId);
        if (
          chatAgent &&
          (!selectedAgent || selectedAgent._id !== chatAgent._id)
        ) {
          selectAgent(currentChat.agentId);
        }
      }
    }
  }, [currentChat?.model, currentChat?.agentId, currentChat?.systemPrompt, currentChat?.agentPrompt, currentChat?.temperature, allAgents, selectAgent, selectedAgent?._id]);

  // Update agent prompt when agent changes (keep system prompt separate)
  // Only update if the agent actually changed to prevent feedback loops
  useEffect(() => {
    if (selectedAgent?.systemPrompt && selectedChatId && isAuthenticated) {
      // Check if this agent is different from what's already set in the chat
      if (currentChat?.agentId !== selectedAgent._id) {
        setChatSettings((prev) => ({
          ...prev,
          agentPrompt: selectedAgent.systemPrompt,
        }));

        // Update the current chat's agent prompt and reference
        updateChat({
          id: selectedChatId as Id<'chats'>,
          agentPrompt: selectedAgent.systemPrompt,
          agentId: selectedAgent._id,
        }).catch((error: unknown) => {
          log.error('Failed to update chat agent', {
            error: error instanceof Error ? error.message : String(error),
          });
        });
      } else {
        // Just update the settings without triggering a database update
        setChatSettings((prev) => ({
          ...prev,
          agentPrompt: selectedAgent.systemPrompt,
        }));
      }
    }
  }, [selectedAgent?._id, selectedAgent?.systemPrompt, selectedChatId, isAuthenticated, updateChat, currentChat?.agentId]);

  // Quick suggestions removed per product request

  // Regenerate an assistant message by resending the preceding user message
  const handleRegenerateMessage = (messageId: string) => {
    if (!messages || messages.length === 0) {
      return;
    }

    const findMessageIndex = (id: string) => {
      for (let i = 0; i < messages.length; i++) {
        const m = messages[i] as unknown;
        if (
          typeof m === 'object' &&
          m !== null &&
          'isStreaming' in m &&
          (m as StreamingMessage).isStreaming
        ) {
          if ((m as StreamingMessage).id === id) {
            return i;
          }
          continue;
        }
        if (
          typeof m === 'object' &&
          m !== null &&
          '_id' in m &&
          String((m as { _id: unknown })._id) === id
        ) {
          return i;
        }
      }
      return -1;
    };

    const idx = findMessageIndex(messageId);
    if (idx < 0) {
      return;
    }

    // walk backwards to find the closest previous user message
    for (let i = idx - 1; i >= 0; i--) {
      const candidate = messages[i] as unknown;
      if (
        typeof candidate === 'object' &&
        candidate !== null &&
        'role' in candidate &&
        (candidate as { role: string }).role === 'user' &&
        'content' in candidate &&
        typeof (candidate as { content: unknown }).content === 'string'
      ) {
        void handleSendMessage((candidate as { content: string }).content);
        break;
      }
    }
  };


  // Define handleCreateChat before using it
  const handleCreateChat = async () => {
    if (!isAuthenticated) {
      return;
    }

    setIsCreatingChat(true);
    try {
      const newChat = await createChat({
        title: `New Chat ${new Date().toLocaleTimeString()}`,
        model: selectedModel || DEFAULT_MODEL.id,
        systemPrompt: '', // User's custom system prompt starts empty
        agentPrompt: selectedAgent?.systemPrompt || '', // Copy agent's prompt
        agentId: selectedAgent?._id, // Reference to the agent
      });
      // The create mutation returns the full chat document, extract the _id
      if (newChat?._id) {
        setSelectedChatId(newChat._id);
        // Update URL to include the new chat ID
        router.push(`/chat?chatId=${newChat._id}`);
      }
    } catch (_error) {
    } finally {
      setIsCreatingChat(false);
    }
  };

  // Global Command Palette handles shortcuts now; local integration removed.

  const handleSendMessage = async (
    content: string,
    useReasoning?: boolean,
    attachments?: Array<{
      fileId: string;
      url?: string;
      mimeType: string;
      size: number;
      type: 'image' | 'file' | 'video';
    }>
  ) => {
    if (!(selectedChatId && user && userWalletAddress)) {
      return;
    }

    // Check if user can send messages
    if (!canSendMessage) {
      setShowUpgradePrompt(true);
      return;
    }

    try {
      // Use the new Convex streaming function with selected model and reasoning settings
      await sendMessage(
        content,
        userWalletAddress,
        selectedModel,
        useReasoning,
        attachments
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      log.error('Failed to send message', { error: errorMessage });
      // If error is about limits, show upgrade prompt
      if (errorMessage.includes('limit') || errorMessage.includes('quota')) {
        setShowUpgradePrompt(true);
      }
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await deleteChat({
        id: chatId as Id<'chats'>,
      });
      if (selectedChatId === chatId) {
        const remainingChats = chats?.filter(
          (chat: Doc<'chats'>) => chat._id !== chatId
        );
        setSelectedChatId(remainingChats?.[0]?._id);
      }
    } catch (error: unknown) {
      log.error('Failed to delete chat', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleGenerateTitle = () => {
    if (!(selectedChatId && user?._id)) {
      return;
    }

    toast.promise(
      generateTitle({
        chatId: selectedChatId as Id<'chats'>,
        ownerId: user._id,
      }),
      {
        loading: 'Generating title...',
        success: (result) => {
          if (result.success) {
            log.info('Title generated successfully', { title: result.title });
            if (result.skipped) {
              return 'Title already exists';
            }
            return `Title updated: ${result.title}`;
          }
          if (result.error) {
            log.error('Failed to generate title', { error: result.error });
            throw new Error(result.error);
          }
          return 'Title generated';
        },
        error: (err) => {
          log.error('Error generating title', { error: err?.message });
          return err?.message || 'Failed to generate title';
        },
      }
    );
  };

  const handleModelChange = async (newModel: string) => {
    setSelectedModel(newModel);
    setChatSettings((prev) => ({ ...prev, model: newModel }));

    // Update the chat's model in the database
    if (selectedChatId && isAuthenticated) {
      try {
        await updateChat({
          id: selectedChatId as Id<'chats'>,
          model: newModel,
        });
      } catch (error: unknown) {
        log.error('Failed to update chat model', { 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
  };

  const handleSettingsChange = async (newSettings: ChatSettings) => {
    setChatSettings(newSettings);

    // Update selected model if it changed
    if (newSettings.model !== selectedModel) {
      setSelectedModel(newSettings.model);
    }

    // Update theme immediately in next-themes if changed
    if (newSettings.theme !== theme) {
      setTheme(newSettings.theme);
    }

    // Save interface preferences using the Convex mutation
    if (isAuthenticated) {
      try {
        await updateUserPreferences({
          // Interface Settings
          theme: newSettings.theme,
          language: newSettings.language,
          fontSize: newSettings.fontSize,
          soundEnabled: newSettings.soundEnabled,
          autoScroll: newSettings.autoScroll,
          // Behavior Settings
          streamResponses: newSettings.streamResponses,
          saveHistory: newSettings.saveHistory,
          enableMemory: newSettings.enableMemory,
          autoCreateTitles: newSettings.autoCreateTitles,
          responseFormat: newSettings.responseFormat,
          contextWindow: newSettings.contextWindow,
          // Model Preferences (defaults for new chats)
          defaultModel: newSettings.model,
          defaultTemperature: newSettings.temperature,
          defaultMaxTokens: newSettings.maxTokens,
          defaultTopP: newSettings.topP,
          defaultFrequencyPenalty: newSettings.frequencyPenalty,
          defaultPresencePenalty: newSettings.presencePenalty,
        });
      } catch (_error: unknown) {}
    }

    // Update chat-specific settings in database if needed
    if (selectedChatId && isAuthenticated) {
      const updates: {
        model?: string;
        systemPrompt?: string;
        temperature?: number;
        maxTokens?: number;
      } = {};

      if (newSettings.model !== chatSettings.model) {
        updates.model = newSettings.model;
      }
      if (newSettings.systemPrompt !== chatSettings.systemPrompt) {
        updates.systemPrompt = newSettings.systemPrompt;
      }
      if (newSettings.temperature !== chatSettings.temperature) {
        updates.temperature = newSettings.temperature;
      }
      if (newSettings.maxTokens !== chatSettings.maxTokens) {
        updates.maxTokens = newSettings.maxTokens;
      }

      // Only update if there are actual changes
      if (Object.keys(updates).length > 0) {
        updateChat({
          id: selectedChatId as Id<'chats'>,
          ...updates,
        }).catch((error: unknown) => {
          log.error('Failed to update chat settings', {
            error: error instanceof Error ? error.message : String(error),
          });
        });
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <EmptyState
          description="Please connect your wallet and sign in to access the chat interface"
          icon={<MessageSquare className="h-12 w-12 text-muted-foreground" />}
          title="Authentication Required"
        />
      </div>
    );
  }

  return (
    <div
      className={cn('flex h-full min-h-0 w-full overflow-hidden', className)}
    >
      {/* Main Chat Area - Adjust width when artifact is shown on desktop */}
      <div
        className={cn(
          'flex min-h-0 flex-col overflow-hidden transition-all duration-300',
          showArtifact ? 'lg:w-1/2' : 'flex-1'
        )}
      >
        {/* Top Bar */}
        <div className="flex h-14 min-h-[3.5rem] items-center justify-between border-border/50 border-b bg-card/30 px-2 backdrop-blur sm:px-3 md:px-4 lg:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2 md:gap-3">
            {/* Hamburger menu */}
            {!sidebarOpen && (
              <Button
                className="button-press flex-shrink-0 p-1.5 sm:p-2"
                onClick={() => setSidebarOpen(true)}
                size="sm"
                variant="ghost"
              >
                <Sidebar className="h-4 w-4" />
              </Button>
            )}

            {/* Mobile New Chat button - between hamburger and chat header */}
            <Button
              className="button-press flex-shrink-0 sm:hidden"
              disabled={isCreatingChat}
              onClick={handleCreateChat}
              size="sm"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              <span className="ml-1">New</span>
            </Button>

            {currentChat ? (
              <div className="min-w-0 flex-1">
                <ChatHeader
                  chat={currentChat}
                  onAgentSelectorClick={() => {
                    // Use desktop selector for larger screens, mobile for smaller
                    const isMobile = window.innerWidth < 640; // sm breakpoint
                    if (isMobile) {
                      setShowMobileAgentSelector(true);
                    } else {
                      setShowDesktopAgentSelector(true);
                    }
                  }}
                  onClearHistory={() => {}}
                  onDelete={() => {
                    if (selectedChatId) {
                      handleDeleteChat(selectedChatId);
                    }
                  }}
                  onGenerateTitle={handleGenerateTitle}
                  onModelSelectorClick={() => setShowMobileModelSelector(true)}
                  onRename={(newTitle) => {
                    if (selectedChatId && isAuthenticated) {
                      updateChat({
                        id: selectedChatId as Id<'chats'>,
                        title: newTitle,
                      }).catch((error: unknown) => {
                        log.error('Failed to rename chat', {
                          error: error instanceof Error ? error.message : String(error),
                        });
                      });
                    }
                  }}
                  onSettingsClick={() => setShowMobileSettings(true)}
                  selectedAgent={selectedAgent || undefined}
                />
              </div>
            ) : (
              <div className="flex min-w-0 items-center gap-2">
                <MessageSquare className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <span className="hidden truncate font-medium text-muted-foreground text-xs sm:inline-block sm:text-sm md:text-base">
                  Select a chat to begin
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-shrink-0 items-center gap-0.5 sm:gap-1 md:gap-2">
            {/* Model Selector - responsive width */}
            {currentChat && (
              <div className="hidden sm:block sm:w-32 md:w-40 lg:w-48 xl:w-56">
                <ModelSelector
                  disabled={isStreaming}
                  onValueChange={handleModelChange}
                  value={selectedModel}
                />
              </div>
            )}

            {/* Desktop New Chat button */}
            <Button
              className="button-press hidden sm:flex"
              disabled={isCreatingChat}
              onClick={handleCreateChat}
              size="sm"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              <span className="ml-1">New</span>
              <span className="ml-1 hidden md:inline-block">Chat</span>
            </Button>

            {/* Desktop Settings Button */}
            <div className="hidden md:block">
              <ChatSettingsDialog
                onSettingsChange={handleSettingsChange}
                settings={chatSettings}
              />
            </div>
          </div>
        </div>

        {/* Chat Content */}
        {currentChat ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-transparent">
            {/* Message List */}
            <div className="relative flex-1 overflow-hidden">
              {messages === undefined ? (
                <div className="flex h-full items-center justify-center">
                  <LoadingStates
                    size="lg"
                    text="Loading messages..."
                    variant="spinner"
                  />
                </div>
              ) : (
                <StreamingSuspenseWrapper
                  isStreaming={isStreaming}
                  onError={(error) => {
                    log.error('Message list streaming error', { error: error.message });
                  }}
                  onRetry={() => {
                    // Refresh the message list
                    window.location.reload();
                  }}
                >
                  <MessageListSuspense
                    fontSize={chatSettings.fontSize}
                    isTyping={isAnyoneTyping && !isStreaming}
                    messages={(messages || []).map((m) => {
                      if ((m as StreamingMessage).isStreaming) {
                        return m as StreamingMessage;
                      }
                      const doc = m as {
                        _id: unknown;
                        content: string;
                        role: 'user' | 'assistant' | 'system';
                        createdAt?: number;
                        _creationTime?: number;
                        rating?: {
                          userRating: 'like' | 'dislike';
                          ratedAt: number;
                          ratedBy: string;
                        };
                        actions?: {
                          copiedCount?: number;
                          sharedCount?: number;
                          regeneratedCount?: number;
                          lastActionAt?: number;
                        };
                        metadata?: {
                          tools?: ToolCall[];
                        };
                      };
                      const normalized: MinimalMessage & { toolCalls?: ToolCall[] } = {
                        _id: String(doc._id),
                        content: doc.content,
                        role: doc.role,
                        createdAt:
                          doc.createdAt ?? doc._creationTime ?? Date.now(),
                        rating: doc.rating,
                        actions: doc.actions,
                        toolCalls: doc.metadata?.tools || [],
                      };
                      return normalized;
                    })}
                    onArtifactClick={(artifact) => {
                      setCurrentArtifact(artifact);
                      setShowArtifact(true);
                    }}
                    onMessageRegenerate={handleRegenerateMessage}
                  />
                </StreamingSuspenseWrapper>
              )}
            </div>

            {/* Quick Suggestions removed */}

            {/* Upgrade Prompt */}
            {upgradePrompt.shouldShow && upgradePrompt.urgency === 'high' && (
              <div className="border-border/50 border-t bg-card/30 p-2 sm:p-3 md:p-4">
                <div className="mx-auto w-full max-w-full px-0 sm:max-w-6xl md:max-w-7xl lg:px-4 xl:px-8">
                  <UpgradePrompt
                    onDismiss={() => setShowUpgradePrompt(false)}
                    prompt={upgradePrompt}
                    variant="inline"
                  />
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="border-border/50 border-t bg-card/30 backdrop-blur">
              <div className="p-2 sm:p-3 md:p-4">
                <div className="mx-auto w-full max-w-full px-0 sm:max-w-6xl md:max-w-7xl lg:px-4 xl:px-8">
                  <EnhancedMessageInput
                    disabled={
                      !selectedChatId ||
                      messages === undefined ||
                      isStreaming ||
                      !canSendMessage ||
                      !isInitialized
                    }
                    isStreaming={isStreaming}
                    onSend={async (content, options) => {
                      // Adapt the enhanced input format to the original handleSendMessage
                      const mappedAttachments = options?.attachments?.map(
                        (att) => ({
                          fileId: att.id,
                          url: att.url,
                          mimeType: att.type,
                          size: att.size,
                          type: (att.type.startsWith('image/')
                            ? 'image'
                            : att.type.startsWith('video/')
                              ? 'video'
                              : 'file') as 'image' | 'file' | 'video',
                        })
                      );

                      await handleSendMessage(
                        content,
                        options?.useReasoning,
                        mappedAttachments
                      );
                    }}
                    onTyping={startTyping}
                    placeholder={
                      !isInitialized
                        ? 'Initializing agent system...'
                        : canSendMessage
                          ? isStreaming
                            ? 'Anubis is responding...'
                            : `Ask Anubis anything...${limits?.messagesRemaining ? ` (${limits.messagesRemaining} messages remaining)` : ''}`
                          : 'Message limit reached - Upgrade to continue'
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-transparent">
            {chats?.length === 0 ? (
              <ChatWelcome
                isCreating={isCreatingChat}
                onCreateChat={handleCreateChat}
              />
            ) : (
              <EmptyState
                description="Select a chat from the sidebar to continue"
                icon={
                  <MessageSquare className="h-12 w-12 text-muted-foreground" />
                }
                title="No Chat Selected"
              />
            )}
          </div>
        )}
      </div>

      {/* Mobile Model Selector Dialog */}
      <Dialog
        onOpenChange={setShowMobileModelSelector}
        open={showMobileModelSelector}
      >
        <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] max-w-[680px] overflow-hidden sm:w-[90vw] md:w-auto md:max-w-3xl lg:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select AI Model</DialogTitle>
            <DialogDescription>
              Choose an AI model for your conversation
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto">
            <ModelGrid
              columns={5}
              models={AI_MODELS}
              onModelSelect={(model) => {
                handleModelChange(model.id);
                setShowMobileModelSelector(false);
              }}
              selectedModelId={selectedModel}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Agent Selector Dialog */}
      <Dialog
        onOpenChange={setShowMobileAgentSelector}
        open={showMobileAgentSelector}
      >
        <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] max-w-[680px] overflow-hidden sm:w-[90vw] md:w-auto md:max-w-3xl lg:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select AI Agent</DialogTitle>
            <DialogDescription>
              Choose a specialized agent for your blockchain tasks
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto">
            {allAgents && (
              <AgentGrid
                agents={allAgents}
                columns={5}
                onAgentSelect={async (agent) => {
                  selectAgent(agent._id);
                  setShowMobileAgentSelector(false);

                  // Update the current chat's agent prompt and reference
                  if (selectedChatId && isAuthenticated) {
                    try {
                      await updateChat({
                        id: selectedChatId as Id<'chats'>,
                        agentPrompt: agent.systemPrompt,
                        agentId: agent._id,
                      });
                    } catch (error: unknown) {
                      log.error('Failed to update chat agent', {
                        error: error instanceof Error ? error.message : String(error),
                      });
                    }
                  }
                }}
                selectedAgentId={selectedAgent?._id}
              />
            )}
          </div>

          {/* Create New Agent Button */}
          <div className="border-t pt-4">
            <Link className="block" href="/agents">
              <Button
                className="w-full"
                onClick={() => setShowMobileAgentSelector(false)}
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create a New Agent
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Settings Dialog - Using responsive ChatSettingsDialog */}
      {showMobileSettings && (
        <ChatSettingsDialog
          onOpenChange={setShowMobileSettings}
          onSettingsChange={handleSettingsChange}
          open={showMobileSettings}
          settings={chatSettings}
        />
      )}

      {/* Global command palette covers this page */}

      {/* Desktop Agent Selector Dialog (reusing mobile dialog for consistency) */}
      <Dialog
        onOpenChange={setShowDesktopAgentSelector}
        open={showDesktopAgentSelector}
      >
        <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] max-w-[680px] overflow-hidden sm:w-[90vw] md:w-auto md:max-w-3xl lg:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select AI Agent</DialogTitle>
            <DialogDescription>
              Choose a specialized agent for your blockchain tasks
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto">
            {allAgents && (
              <AgentGrid
                agents={allAgents}
                columns={5}
                onAgentSelect={async (agent) => {
                  selectAgent(agent._id);
                  setShowDesktopAgentSelector(false);

                  // Update the current chat's agent prompt and reference
                  if (selectedChatId && isAuthenticated) {
                    try {
                      await updateChat({
                        id: selectedChatId as Id<'chats'>,
                        agentPrompt: agent.systemPrompt,
                        agentId: agent._id,
                      });
                    } catch (error: unknown) {
                      log.error('Failed to update chat agent', {
                        error: error instanceof Error ? error.message : String(error),
                      });
                    }
                  }
                }}
                selectedAgentId={selectedAgent?._id}
              />
            )}
          </div>

          {/* Create New Agent Button */}
          <div className="border-t pt-4">
            <Link className="block" href="/agents">
              <Button
                className="w-full"
                onClick={() => setShowDesktopAgentSelector(false)}
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create a New Agent
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && upgradePrompt.suggestedTier && (
        <UpgradePrompt
          onDismiss={() => setShowUpgradePrompt(false)}
          prompt={upgradePrompt}
          variant="modal"
        />
      )}

      {/* Artifact View - Split view on desktop, overlay on mobile */}
      <ArtifactView
        artifact={currentArtifact}
        className="lg:border-l"
        isOpen={showArtifact}
        onClose={() => {
          setShowArtifact(false);
          setCurrentArtifact(null);
        }}
      />
    </div>
  );
}

export default ChatInterface;
