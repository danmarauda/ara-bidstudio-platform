'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, FileText, Navigation, Settings, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  COMMANDS_OF_MAAT,
  formatShortcut,
  getCommandsByCategory,
  getPlatformKey,
  MAAT_CATEGORIES,
} from '@/lib/constants/commands-of-maat';
import { cn } from '@/lib/utils';

interface CommandsOfMaatModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const categoryIcons = {
  chat: FileText,
  navigation: Navigation,
  ai: Zap,
  settings: Settings,
  help: BookOpen,
};

export function CommandsOfMaatModal({
  isOpen,
  onClose,
  className,
}: CommandsOfMaatModalProps) {
  const [activeCategory, setActiveCategory] = useState<
    keyof typeof MAAT_CATEGORIES | 'all'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [platformKey, setPlatformKey] = useState('Cmd');

  useEffect(() => {
    setPlatformKey(getPlatformKey());
  }, []);

  const filteredCommands = COMMANDS_OF_MAAT.filter((command) => {
    const matchesCategory =
      activeCategory === 'all' || command.category === activeCategory;
    const matchesSearch =
      searchQuery === '' ||
      command.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      command.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formatShortcut(command.shortcut)
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const ShortcutKey = ({ children }: { children: React.ReactNode }) => (
    <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded border bg-muted px-1.5 font-medium font-mono text-[10px] text-muted-foreground shadow-sm">
      {children}
    </kbd>
  );

  const renderShortcut = (shortcut: string[]) => {
    return (
      <div className="flex items-center gap-1">
        {shortcut.map((key, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <span className="mx-0.5 text-muted-foreground">+</span>
            )}
            <ShortcutKey>{formatShortcut([key])}</ShortcutKey>
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <Dialog onOpenChange={onClose} open={isOpen}>
      <DialogContent
        className={cn('max-h-[85vh] max-w-4xl overflow-hidden', className)}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg">
              ⚖️
            </div>
            <div>
              <div>Keyboard Shortcuts</div>
              <div className="font-normal text-muted-foreground text-sm">
                Quick reference for all keyboard shortcuts
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground">
              🔍
            </div>
            <input
              className="w-full rounded-lg border bg-background py-2 pr-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shortcuts..."
              type="text"
              value={searchQuery}
            />
          </div>

          {/* Category Tabs */}
          <Tabs
            onValueChange={(v: string) =>
              setActiveCategory(v as keyof typeof MAAT_CATEGORIES | 'all')
            }
            value={activeCategory}
          >
            <TabsList className="grid w-full grid-cols-6 bg-muted/50">
              <TabsTrigger
                className="data-[state=active]:bg-primary/10"
                value="all"
              >
                <span className="mr-1.5">🌟</span>
                All
              </TabsTrigger>
              {Object.entries(MAAT_CATEGORIES).map(([key, category]) => {
                const Icon = categoryIcons[key as keyof typeof categoryIcons];
                return (
                  <TabsTrigger
                    className="data-[state=active]:bg-primary/10"
                    key={key}
                    value={key}
                  >
                    <Icon className="mr-1.5 h-3.5 w-3.5" />
                    <span className="hidden lg:inline">
                      {category.name.split(' ')[0]}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent className="mt-4" value={activeCategory}>
              <div className="max-h-[400px] overflow-y-auto pr-2">
                <AnimatePresence mode="wait">
                  {activeCategory === 'all' ? (
                    // Show all categories
                    <div className="space-y-6">
                      {Object.entries(MAAT_CATEGORIES).map(
                        ([categoryKey, category]) => {
                          const commands = getCommandsByCategory(
                            categoryKey as any
                          );
                          const Icon =
                            categoryIcons[
                              categoryKey as keyof typeof categoryIcons
                            ];

                          if (commands.length === 0) {
                            return null;
                          }

                          return (
                            <motion.div
                              animate={{ opacity: 1, y: 0 }}
                              className="space-y-2"
                              exit={{ opacity: 0, y: -10 }}
                              initial={{ opacity: 0, y: 10 }}
                              key={categoryKey}
                            >
                              <div className="flex items-center gap-2 font-medium text-muted-foreground text-sm">
                                <Icon className="h-4 w-4" />
                                <span>{category.name}</span>
                                <div className="h-px flex-1 bg-border" />
                              </div>
                              <div className="space-y-1">
                                {commands
                                  .filter(
                                    (cmd) =>
                                      searchQuery === '' ||
                                      cmd.name
                                        .toLowerCase()
                                        .includes(searchQuery.toLowerCase()) ||
                                      cmd.description
                                        .toLowerCase()
                                        .includes(searchQuery.toLowerCase())
                                  )
                                  .map((command, index) => (
                                    <motion.div
                                      animate={{ opacity: 1, x: 0 }}
                                      className="group flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-muted/50"
                                      initial={{ opacity: 0, x: -10 }}
                                      key={command.id}
                                      transition={{ delay: index * 0.02 }}
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="text-lg">
                                          {command.icon ? (
                                            <command.icon className="h-4 w-4 text-muted-foreground" />
                                          ) : (
                                            '📜'
                                          )}
                                        </span>
                                        <div>
                                          <div className="font-medium text-sm">
                                            {command.name}
                                          </div>
                                          <div className="text-muted-foreground text-xs">
                                            {command.description}
                                          </div>
                                        </div>
                                      </div>
                                      {renderShortcut(command.shortcut)}
                                    </motion.div>
                                  ))}
                              </div>
                            </motion.div>
                          );
                        }
                      )}
                    </div>
                  ) : (
                    // Show single category
                    <div className="space-y-1">
                      {filteredCommands.map((command, index) => (
                        <motion.div
                          animate={{ opacity: 1, x: 0 }}
                          className="group flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-muted/50"
                          initial={{ opacity: 0, x: -10 }}
                          key={command.id}
                          transition={{ delay: index * 0.02 }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">
                              {command.icon ? (
                                <command.icon className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                '📜'
                              )}
                            </span>
                            <div>
                              <div className="font-medium text-sm">
                                {command.name}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {command.description}
                              </div>
                            </div>
                          </div>
                          {renderShortcut(command.shortcut)}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>

                {filteredCommands.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">
                    <div className="mb-2 text-4xl">🏺</div>
                    <div>No shortcuts found</div>
                    <div className="mt-1 text-xs">Try a different search</div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer Tips */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/10" variant="outline">
                    <span className="mr-1">💡</span>
                    Pro Tip
                  </Badge>
                  <span>
                    Press{' '}
                    <ShortcutKey>
                      {platformKey === 'Cmd' ? '⌘' : 'Ctrl'}
                    </ShortcutKey>
                    <ShortcutKey>K</ShortcutKey> to open the command palette
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span>Platform:</span>
                <Badge className="bg-primary/10">
                  {platformKey === 'Cmd' ? '🍎 macOS' : '🪟 Windows/Linux'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
