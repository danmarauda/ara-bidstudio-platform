// Application Keyboard Shortcuts

import {
  ArrowDownToLine,
  ArrowUpToLine,
  Bot,
  Brain,
  ChevronLeft,
  ChevronRight,
  Command as CommandIcon,
  Copy,
  Eraser,
  FileDown,
  Keyboard as KeyboardIcon,
  LayoutDashboard,
  Map,
  MessageSquare,
  MessageSquarePlus,
  PanelLeft,
  Pencil,
  Search,
  Settings as SettingsIcon,
  Shield,
  SlidersHorizontal,
  Sparkles,
  SunMoon,
  Trash2,
  Type,
  Upload,
  User,
  Zap,
} from 'lucide-react';
import type { ComponentType } from 'react';

export interface MaatCommand {
  id: string;
  name: string;
  description: string;
  shortcut: string[];
  category: 'chat' | 'navigation' | 'ai' | 'settings' | 'help';
  icon?: ComponentType<any>;
  action?: string;
  enabled?: boolean; // For conditionally enabled commands
}

// Platform-specific key mappings
export const getPlatformKey = () => {
  if (typeof window === 'undefined') {
    return 'Cmd';
  }
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  return isMac ? 'Cmd' : 'Ctrl';
};

export const COMMANDS_OF_MAAT: MaatCommand[] = [
  // Chat Commands (Chat Management)
  {
    id: 'new-chat',
    name: 'New Chat',
    description: 'Create a new chat conversation',
    shortcut: ['mod', 'n'],
    category: 'chat',
    icon: MessageSquarePlus,
    enabled: true,
  },
  {
    id: 'clear-chat',
    name: 'Clear Chat',
    description: 'Clear current chat messages',
    shortcut: ['mod', 'shift', 'delete'],
    category: 'chat',
    icon: Eraser,
    enabled: true,
  },
  {
    id: 'delete-chat',
    name: 'Delete Chat',
    description: 'Delete current chat permanently',
    shortcut: ['mod', 'shift', 'backspace'],
    category: 'chat',
    icon: Trash2,
    enabled: true,
  },
  {
    id: 'rename-chat',
    name: 'Rename Chat',
    description: 'Rename current chat',
    shortcut: ['mod', 'shift', 'r'],
    category: 'chat',
    icon: Pencil,
    enabled: true,
  },
  {
    id: 'duplicate-chat',
    name: 'Duplicate Chat',
    description: 'Create a copy of current chat',
    shortcut: ['mod', 'd'],
    category: 'chat',
    icon: Copy,
    enabled: true,
  },

  // Navigation Commands
  {
    id: 'open-command-palette',
    name: 'Open Command Palette',
    description: 'Open the command palette',
    shortcut: ['mod', 'k'],
    category: 'navigation',
    icon: CommandIcon,
    enabled: true,
  },
  {
    id: 'focus-input',
    name: 'Focus Input',
    description: 'Focus on message input',
    shortcut: ['mod', 'l'],
    category: 'navigation',
    icon: Type,
    enabled: true,
  },
  {
    id: 'open-dashboard',
    name: 'Open Dashboard',
    description: 'Go to dashboard',
    shortcut: [],
    category: 'navigation',
    icon: LayoutDashboard,
    enabled: true,
  },
  {
    id: 'open-chats',
    name: 'Open Chats',
    description: 'Go to chats',
    shortcut: [],
    category: 'navigation',
    icon: MessageSquare,
    enabled: true,
  },
  {
    id: 'open-agents',
    name: 'Open Agents',
    description: 'Go to agents',
    shortcut: [],
    category: 'navigation',
    icon: Bot,
    enabled: true,
  },
  {
    id: 'open-account',
    name: 'Open Account',
    description: 'Go to account',
    shortcut: [],
    category: 'navigation',
    icon: User,
    enabled: true,
  },
  {
    id: 'open-memories',
    name: 'Open Memories',
    description: 'Go to memories',
    shortcut: [],
    category: 'navigation',
    icon: Brain,
    enabled: true,
  },
  {
    id: 'switch-chat-1',
    name: 'Switch to Chat 1',
    description: 'Switch to chat 1',
    shortcut: ['alt', '1'],
    category: 'navigation',
  },
  {
    id: 'switch-chat-2',
    name: 'Switch to Chat 2',
    description: 'Switch to chat 2',
    shortcut: ['alt', '2'],
    category: 'navigation',
  },
  {
    id: 'switch-chat-3',
    name: 'Switch to Chat 3',
    description: 'Switch to chat 3',
    shortcut: ['alt', '3'],
    category: 'navigation',
  },
  {
    id: 'switch-chat-4',
    name: 'Switch to Chat 4',
    description: 'Switch to chat 4',
    shortcut: ['alt', '4'],
    category: 'navigation',
  },
  {
    id: 'switch-chat-5',
    name: 'Switch to Chat 5',
    description: 'Switch to chat 5',
    shortcut: ['alt', '5'],
    category: 'navigation',
  },
  {
    id: 'switch-chat-6',
    name: 'Switch to Chat 6',
    description: 'Switch to chat 6',
    shortcut: ['alt', '6'],
    category: 'navigation',
  },
  {
    id: 'switch-chat-7',
    name: 'Switch to Chat 7',
    description: 'Switch to chat 7',
    shortcut: ['alt', '7'],
    category: 'navigation',
  },
  {
    id: 'switch-chat-8',
    name: 'Switch to Chat 8',
    description: 'Switch to chat 8',
    shortcut: ['alt', '8'],
    category: 'navigation',
  },
  {
    id: 'switch-chat-9',
    name: 'Switch to Chat 9',
    description: 'Switch to chat 9',
    shortcut: ['alt', '9'],
    category: 'navigation',
  },
  {
    id: 'previous-chat',
    name: 'Previous Chat',
    description: 'Navigate to previous chat',
    shortcut: ['mod', '['],
    category: 'navigation',
    icon: ChevronLeft,
  },
  {
    id: 'next-chat',
    name: 'Next Chat',
    description: 'Navigate to next chat',
    shortcut: ['mod', ']'],
    category: 'navigation',
    icon: ChevronRight,
  },
  {
    id: 'search-conversations',
    name: 'Search Conversations',
    description: 'Search through all conversations',
    shortcut: ['mod', 'shift', 'f'],
    category: 'navigation',
    icon: Search,
    enabled: true,
  },
  {
    id: 'toggle-sidebar',
    name: 'Toggle Sidebar',
    description: 'Show/hide chat sidebar',
    shortcut: ['mod', 'b'],
    category: 'navigation',
    icon: PanelLeft,
    enabled: true,
  },
  {
    id: 'scroll-to-bottom',
    name: 'Scroll to Bottom',
    description: 'Scroll to bottom of chat',
    shortcut: ['mod', 'down'],
    category: 'navigation',
    icon: ArrowDownToLine,
    enabled: true,
  },
  {
    id: 'scroll-to-top',
    name: 'Scroll to Top',
    description: 'Scroll to top of chat',
    shortcut: ['mod', 'up'],
    category: 'navigation',
    icon: ArrowUpToLine,
    enabled: true,
  },

  // AI & Models
  {
    id: 'select-agent',
    name: 'Select Agent',
    description: 'Open agent selector',
    shortcut: ['mod', 'shift', 'a'],
    category: 'ai',
    icon: Shield,
    enabled: true,
  },
  {
    id: 'select-model',
    name: 'Select Model',
    description: 'Select AI model',
    shortcut: ['mod', 'shift', 'm'],
    category: 'ai',
    icon: Zap,
    enabled: true,
  },
  {
    id: 'toggle-reasoning',
    name: 'Toggle Reasoning',
    description: 'Enable/disable reasoning mode',
    shortcut: ['mod', 'shift', 'w'],
    category: 'ai',
    icon: Brain,
    enabled: true,
  },
  {
    id: 'quick-claude',
    name: 'Switch to Claude',
    description: 'Quickly switch to Claude',
    shortcut: ['mod', '1'],
    category: 'ai',
    icon: Sparkles,
    enabled: true,
  },
  {
    id: 'quick-gpt',
    name: 'Switch to GPT',
    description: 'Quickly switch to GPT',
    shortcut: ['mod', '2'],
    category: 'ai',
    icon: Bot,
    enabled: true,
  },

  // Settings
  {
    id: 'open-settings',
    name: 'Settings',
    description: 'Open chat settings',
    shortcut: ['mod', ','],
    category: 'settings',
    icon: SettingsIcon,
    enabled: true,
  },
  {
    id: 'toggle-theme',
    name: 'Toggle Theme',
    description: 'Switch between light and dark theme',
    shortcut: ['mod', 'shift', 't'],
    category: 'settings',
    icon: SunMoon,
    enabled: true,
  },
  {
    id: 'upload-file',
    name: 'Upload File',
    description: 'Upload file to chat',
    shortcut: ['mod', 'u'],
    category: 'settings',
    icon: Upload,
    enabled: true,
  },
  {
    id: 'export-chat',
    name: 'Export Chat',
    description: 'Export chat as markdown',
    shortcut: ['mod', 'shift', 'e'],
    category: 'settings',
    icon: FileDown,
    enabled: true,
  },
  {
    id: 'open-preferences',
    name: 'Preferences',
    description: 'Open user preferences',
    shortcut: ['mod', 'shift', ','],
    category: 'settings',
    icon: SlidersHorizontal,
    enabled: true,
  },

  // Help & Info
  {
    id: 'open-shortcuts',
    name: 'Keyboard Shortcuts',
    description: 'Show all keyboard shortcuts',
    shortcut: ['mod', '?'],
    category: 'help',
    icon: KeyboardIcon,
    enabled: true,
  },
  {
    id: 'open-roadmap',
    name: 'Roadmap',
    description: 'View product roadmap',
    shortcut: ['mod', 'shift', 'i'],
    category: 'help',
    icon: Map,
    enabled: true,
  },
];

// Helper function to format shortcuts for display
export function formatShortcut(shortcut: string[]): string {
  const platformKey = getPlatformKey();
  return shortcut
    .map((key) => {
      switch (key) {
        case 'mod':
          return platformKey === 'Cmd' ? '⌘' : 'Ctrl';
        case 'shift':
          return '⇧';
        case 'alt':
          return '⌥';
        case 'enter':
          return '↵';
        case 'escape':
          return 'Esc';
        default:
          return key.toUpperCase();
      }
    })
    .join('');
}

// Get commands by category
export function getCommandsByCategory(
  category: MaatCommand['category'],
  onlyEnabled = true
): MaatCommand[] {
  return COMMANDS_OF_MAAT.filter(
    (cmd) =>
      cmd.category === category && (!onlyEnabled || cmd.enabled !== false)
  );
}

// Get command by ID
export function getCommandById(id: string): MaatCommand | undefined {
  return COMMANDS_OF_MAAT.find((cmd) => cmd.id === id);
}

// Get enabled commands
export function getEnabledCommands(): MaatCommand[] {
  return COMMANDS_OF_MAAT.filter((cmd) => cmd.enabled !== false);
}

// Categories with display names
export const MAAT_CATEGORIES = {
  chat: {
    name: 'Chat',
    description: 'Chat and message management',
    icon: '📜',
  },
  navigation: {
    name: 'Navigation',
    description: 'Navigate your workspace',
    icon: '🧭',
  },
  ai: {
    name: 'AI & Models',
    description: 'Agents and model controls',
    icon: '⚡',
  },
  settings: {
    name: 'Settings',
    description: 'Preferences and configuration',
    icon: '🏛️',
  },
  help: {
    name: 'Help & Info',
    description: 'Help and documentation',
    icon: '📚',
  },
} as const;
