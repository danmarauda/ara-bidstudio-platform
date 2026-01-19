'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Command,
  FileText,
  Globe,
  Keyboard,
  MessageSquare,
  Navigation,
  Search,
  Settings,
  Terminal,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
  icon?: React.ComponentType<any>;
}

interface KeyboardShortcutsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  customShortcuts?: Shortcut[];
  className?: string;
}

const defaultShortcuts: Shortcut[] = [
  // General
  {
    keys: ['⌘', 'K'],
    description: 'Open command palette',
    category: 'general',
    icon: Command,
  },
  {
    keys: ['⌘', '/'],
    description: 'Show keyboard shortcuts',
    category: 'general',
    icon: Keyboard,
  },
  {
    keys: ['⌘', ','],
    description: 'Open settings',
    category: 'general',
    icon: Settings,
  },
  { keys: ['Esc'], description: 'Close dialog / Cancel', category: 'general' },

  // Chat
  {
    keys: ['⌘', 'N'],
    description: 'New chat',
    category: 'chat',
    icon: MessageSquare,
  },
  { keys: ['⌘', 'Enter'], description: 'Send message', category: 'chat' },
  {
    keys: ['⌘', 'Shift', 'Enter'],
    description: 'New line in message',
    category: 'chat',
  },
  { keys: ['⌘', 'E'], description: 'Edit last message', category: 'chat' },
  { keys: ['⌘', 'R'], description: 'Regenerate response', category: 'chat' },
  { keys: ['⌘', 'D'], description: 'Delete message', category: 'chat' },
  { keys: ['⌘', 'C'], description: 'Copy message', category: 'chat' },

  // Navigation
  {
    keys: ['⌘', '1-9'],
    description: 'Switch to chat 1-9',
    category: 'navigation',
    icon: Navigation,
  },
  { keys: ['⌘', '['], description: 'Previous chat', category: 'navigation' },
  { keys: ['⌘', ']'], description: 'Next chat', category: 'navigation' },
  {
    keys: ['⌘', 'Shift', 'F'],
    description: 'Search conversations',
    category: 'navigation',
    icon: Search,
  },
  { keys: ['⌘', 'B'], description: 'Toggle sidebar', category: 'navigation' },
  {
    keys: ['↑', '↓'],
    description: 'Navigate messages',
    category: 'navigation',
  },

  // File & Media
  {
    keys: ['⌘', 'U'],
    description: 'Upload file',
    category: 'files',
    icon: FileText,
  },
  {
    keys: ['⌘', 'Shift', 'U'],
    description: 'Paste from clipboard',
    category: 'files',
  },
  {
    keys: ['Space'],
    description: 'Preview file (when selected)',
    category: 'files',
  },

  // Agent & Model
  { keys: ['⌘', 'Shift', 'M'], description: 'Change model', category: 'agent' },
  { keys: ['⌘', 'Shift', 'A'], description: 'Select agent', category: 'agent' },
  {
    keys: ['⌘', 'Shift', 'P'],
    description: 'Edit system prompt',
    category: 'agent',
  },
];

const getPlatformKey = () => {
  if (typeof window === 'undefined') {
    return '⌘';
  }
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  return isMac ? '⌘' : 'Ctrl';
};

export function KeyboardShortcutsOverlay({
  isOpen,
  onClose,
  customShortcuts = [],
  className,
}: KeyboardShortcutsOverlayProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [platformKey, setPlatformKey] = useState('⌘');

  useEffect(() => {
    setPlatformKey(getPlatformKey());
  }, []);

  const allShortcuts = [...defaultShortcuts, ...customShortcuts].map(
    (shortcut) => ({
      ...shortcut,
      keys: shortcut.keys.map((key) => (key === '⌘' ? platformKey : key)),
    })
  );

  const categories = [
    'all',
    ...Array.from(new Set(allShortcuts.map((s) => s.category))),
  ];

  const filteredShortcuts = allShortcuts.filter((shortcut) => {
    const matchesCategory =
      activeCategory === 'all' || shortcut.category === activeCategory;
    const matchesSearch =
      searchQuery === '' ||
      shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shortcut.keys.join(' ').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const ShortcutKey = ({ children }: { children: React.ReactNode }) => (
    <kbd className="rounded border bg-muted px-2 py-1 font-semibold text-foreground text-xs">
      {children}
    </kbd>
  );

  const categoryIcons: Record<string, React.ComponentType<any>> = {
    general: Globe,
    chat: MessageSquare,
    navigation: Navigation,
    files: FileText,
    agent: Terminal,
  };

  return (
    <Dialog onOpenChange={onClose} open={isOpen}>
      <DialogContent
        className={cn('max-h-[80vh] max-w-3xl overflow-hidden', className)}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Quick reference for all available keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <input
              className="w-full rounded-md bg-muted py-2 pr-3 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shortcuts..."
              type="text"
              value={searchQuery}
            />
          </div>

          {/* Categories */}
          <Tabs onValueChange={setActiveCategory} value={activeCategory}>
            <TabsList
              className="grid w-full"
              style={{
                gridTemplateColumns: `repeat(${categories.length}, 1fr)`,
              }}
            >
              {categories.map((category) => {
                const Icon = categoryIcons[category];
                return (
                  <TabsTrigger
                    className="capitalize"
                    key={category}
                    value={category}
                  >
                    {Icon && <Icon className="mr-1 h-4 w-4" />}
                    {category}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent className="mt-4" value={activeCategory}>
              <div className="max-h-[400px] space-y-2 overflow-y-auto pr-2">
                <AnimatePresence mode="popLayout">
                  {filteredShortcuts.map((shortcut, index) => (
                    <motion.div
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50"
                      exit={{ opacity: 0, y: -10 }}
                      initial={{ opacity: 0, y: 10 }}
                      key={`${shortcut.keys.join('-')}-${index}`}
                      transition={{ delay: index * 0.02 }}
                    >
                      <div className="flex items-center gap-3">
                        {shortcut.icon &&
                          (() => {
                            const IconComponent = shortcut.icon;
                            return (
                              <IconComponent className="h-4 w-4 text-muted-foreground" />
                            );
                          })()}
                        <span className="text-sm">{shortcut.description}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, i) => (
                          <div className="flex items-center gap-1" key={i}>
                            <ShortcutKey>{key}</ShortcutKey>
                            {i < shortcut.keys.length - 1 && (
                              <span className="text-muted-foreground text-xs">
                                +
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {filteredShortcuts.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    No shortcuts found matching your search
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Tips */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-muted-foreground text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Tip</Badge>
                <span>
                  Press <ShortcutKey>{platformKey}</ShortcutKey>{' '}
                  <ShortcutKey>/</ShortcutKey> anytime to show this dialog
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>Platform:</span>
                <Badge>{platformKey === '⌘' ? 'macOS' : 'Windows/Linux'}</Badge>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Re-export the hook from the dedicated hooks file
export { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

export default KeyboardShortcutsOverlay;
