import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  getCommandById,
  getEnabledCommands,
  type MaatCommand,
} from '@/lib/constants/commands-of-maat';
import { useKeyboardShortcuts } from './use-keyboard-shortcuts';

// Type-safe command IDs
type CommandId = MaatCommand['id'];

export type UseCommandPaletteProps = {
  onNewChat?: () => void;
  onSelectChat?: (chatId: string) => void;
  onSelectAgent?: () => void;
  onSelectModel?: () => void;
  onOpenSettings?: () => void;
  onToggleSidebar?: () => void;
  onSearchConversations?: () => void;
  onClearChat?: () => void;
  onDeleteChat?: () => void;
  onRenameChat?: () => void;
  onDuplicateChat?: () => void;
  onExportChat?: () => void;
  onFocusInput?: () => void;
  onScrollToBottom?: () => void;
  onScrollToTop?: () => void;
  onToggleReasoning?: () => void;
  onQuickSelectClaude?: () => void;
  onQuickSelectGPT?: () => void;
  onUploadFile?: () => void;
  onOpenPreferences?: () => void;
  currentChatId?: string;
  chats?: { id: string; title: string }[];
};

export function useCommandPalette({
  onNewChat,
  onSelectChat,
  onSelectAgent,
  onSelectModel,
  onOpenSettings,
  onToggleSidebar,
  onSearchConversations,
  onClearChat,
  onDeleteChat,
  onRenameChat,
  onDuplicateChat,
  onExportChat,
  onFocusInput,
  onScrollToBottom,
  onScrollToTop,
  onToggleReasoning,
  onQuickSelectClaude,
  onQuickSelectGPT,
  onUploadFile,
  onOpenPreferences,
  currentChatId,
  chats = [],
}: UseCommandPaletteProps = {}) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Command handlers map with type-safe keys
  const commandHandlers: Partial<Record<CommandId, () => void>> = {
    // Chat Commands
    'new-chat': () => {
      onNewChat?.();
      toast.success('New chat created');
    },
    'clear-chat': () => {
      if (currentChatId) {
        onClearChat?.();
        toast.success('Chat cleared');
      }
    },
    'delete-chat': () => {
      if (currentChatId) {
        onDeleteChat?.();
        toast.success('Chat deleted');
      }
    },
    'rename-chat': () => {
      if (currentChatId) {
        onRenameChat?.();
      }
    },
    'duplicate-chat': () => {
      if (currentChatId) {
        onDuplicateChat?.();
        toast.success('Chat duplicated');
      }
    },

    // Navigation
    'open-command-palette': () => {
      setIsCommandPaletteOpen((prev) => !prev);
    },
    'focus-input': () => {
      onFocusInput?.();
      // Ensure focus happens after any UI updates
      requestAnimationFrame(() => {
        messageInputRef.current?.focus();
      });
    },
    'search-conversations': () => {
      onSearchConversations?.();
    },
    'toggle-sidebar': () => {
      onToggleSidebar?.();
    },
    'scroll-to-bottom': () => {
      onScrollToBottom?.();
    },
    'scroll-to-top': () => {
      onScrollToTop?.();
    },
    'previous-chat': () => {
      if (currentChatId && chats.length > 0) {
        const currentIndex = chats.findIndex((c) => c.id === currentChatId);
        if (currentIndex > 0) {
          onSelectChat?.(chats[currentIndex - 1].id);
          toast.success('Previous chat opened');
        } else if (currentIndex === 0) {
          // Wrap to last chamber
          const lastChat = chats.at(-1);
          if (lastChat) {
            onSelectChat?.(lastChat.id);
          }
          toast.success('Wrapped to last chat');
        }
      }
    },
    'next-chat': () => {
      if (currentChatId && chats.length > 0) {
        const currentIndex = chats.findIndex((c) => c.id === currentChatId);
        if (currentIndex < chats.length - 1) {
          onSelectChat?.(chats[currentIndex + 1].id);
          toast.success('Next chat opened');
        } else if (currentIndex === chats.length - 1) {
          // Wrap to first chamber
          onSelectChat?.(chats[0].id);
          toast.success('Wrapped to first chat');
        }
      }
    },

    // AI & Models
    'select-agent': () => {
      onSelectAgent?.();
      toast.success('Agent selector opened');
    },
    'select-model': () => {
      onSelectModel?.();
    },
    'toggle-reasoning': () => {
      onToggleReasoning?.();
      toast.success('Reasoning toggled');
    },
    'quick-claude': () => {
      onQuickSelectClaude?.();
      toast.success('Switched to Claude');
    },
    'quick-gpt': () => {
      onQuickSelectGPT?.();
      toast.success('Switched to GPT');
    },

    // Settings
    'open-settings': () => {
      onOpenSettings?.();
    },
    'toggle-theme': () => {
      const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
      setTheme(nextTheme);
      toast.success(
        nextTheme === 'light'
          ? 'Switched to light theme'
          : 'Switched to dark theme'
      );
    },
    'upload-file': () => {
      onUploadFile?.();
    },
    'export-chat': () => {
      if (currentChatId) {
        onExportChat?.();
        toast.success('Chat exported');
      }
    },
    'open-preferences': () => {
      onOpenPreferences?.();
    },

    // Help & Info
    'open-shortcuts': () => {
      setIsShortcutsModalOpen(true);
    },
    'open-roadmap': () => {
      router.push('/roadmap');
    },

    // Navigation helpers
    'open-dashboard': () => {
      router.push('/dashboard');
    },
    'open-chats': () => {
      router.push('/chat');
    },
    'open-agents': () => {
      router.push('/agents');
    },
    'open-account': () => {
      router.push('/account');
    },
    'open-memories': () => {
      router.push('/memories');
    },
  };

  // Handle direct chat switching (1-9)
  for (let i = 1; i <= 9; i++) {
    commandHandlers[`switch-chat-${i}` as CommandId] = () => {
      const chatIndex = i - 1;
      if (chats[chatIndex]) {
        onSelectChat?.(chats[chatIndex].id);
        toast.success(`Switched to chat ${i}`);
      }
    };
  }

  // Execute command by ID
  const executeCommand = useCallback(
    (commandId: string) => {
      const command = getCommandById(commandId);
      if (!command) {
        return;
      }

      const handler = commandHandlers[commandId];
      if (handler) {
        handler();
      } else if (process.env.NODE_ENV !== 'production') {
        toast.error(`Unknown command: ${commandId}`);
      }
    },
    [commandHandlers]
  );

  // Build keyboard shortcuts object - memoized and only for enabled commands with valid shortcuts
  const shortcuts = useMemo(() => {
    const enabledCommands = getEnabledCommands();
    return enabledCommands.reduce(
      (acc, command) => {
        // Skip commands with undefined or empty shortcuts
        if (!command.shortcut || command.shortcut.length === 0) {
          return acc;
        }

        // Skip if any shortcut part is empty
        if (command.shortcut.some((key) => !key || key.trim() === '')) {
          return acc;
        }

        const shortcutKey = command.shortcut.join('+');
        acc[shortcutKey] = (e: KeyboardEvent) => {
          e.preventDefault();
          executeCommand(command.id);
        };
        return acc;
      },
      {} as Record<string, (e: KeyboardEvent) => void>
    );
  }, [executeCommand]); // Only recreate when executeCommand changes

  // Register keyboard shortcuts
  useKeyboardShortcuts(shortcuts);

  // Set up message input ref if needed
  const setMessageInputRef = useCallback((ref: HTMLTextAreaElement | null) => {
    messageInputRef.current = ref;
  }, []);

  return {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    isShortcutsModalOpen,
    setIsShortcutsModalOpen,
    executeCommand,
    setMessageInputRef,
    openCommandPalette: () => setIsCommandPaletteOpen(true),
    closeCommandPalette: () => setIsCommandPaletteOpen(false),
    openShortcutsModal: () => setIsShortcutsModalOpen(true),
    closeShortcutsModal: () => setIsShortcutsModalOpen(false),
  };
}
