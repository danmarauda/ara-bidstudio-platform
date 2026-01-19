'use client';

import { api } from '@convex/_generated/api';
import type { Doc } from '@convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import {
  BookOpen,
  FileText,
  HelpCircle,
  Home,
  Info,
  Keyboard,
  type LucideIcon,
  MessageSquare,
  Moon,
  Plus,
  ScrollText,
  Settings,
  Shield,
  Sun,
  User,
  Zap,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CommandsOfMaatModal } from '@/components/command-palette/commands-of-maat-modal';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';

interface CommandItem {
  id: string;
  label: string;
  icon: LucideIcon;
  action: () => void;
  shortcut?: string;
}

export function globalCommandPalette() {
  const pathname = usePathname();
  const router = useRouter();
  const { setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Exclude specific routes: landing, referral info, roadmap
  const shouldRender = useMemo(() => {
    if (!pathname) {
      return false;
    }
    if (pathname === '/') {
      return false;
    }
    if (pathname.startsWith('/referral-info')) {
      return false;
    }
    if (pathname.startsWith('/roadmap')) {
      return false;
    }
    return true;
  }, [pathname]);

  // Data sources
  const chats = useQuery(api.chatsAuth.getMyChats, {});
  const topPrompts = useQuery(api.prompts.getTopPrompts, { limit: 3 });
  const { subscription, isAuthenticated } = useAuthContext();
  const adminStatus = useQuery(api.adminAuth.checkCurrentUserAdminStatus, {});
  const isProPlus = subscription?.tier === 'pro_plus';

  // User preferences mutation for theme updates
  const updateUserPreferences = useMutation(
    api.userPreferences.updateUserPreferences
  );

  // Register global Ctrl+K (mod+k) to toggle the palette on supported pages
  useEffect(() => {
    if (!shouldRender) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shouldRender]);

  // Helpers
  const run = useCallback((fn: () => void) => fn(), []);

  // Platform symbols
  const isMac =
    typeof navigator !== 'undefined' &&
    /Mac|iPhone|iPod|iPad/i.test(navigator.platform);
  const cmdKey = isMac ? '⌘' : 'Ctrl+';
  const shiftKey = isMac ? '⇧' : 'Shift+';
  const altKey = isMac ? '⌥' : 'Alt+';

  // Sections
  const promptCommands = (topPrompts || []).map((p: Doc<'prompts'>) => ({
    id: `prompt-${p._id}`,
    label: String(p.title),
    icon: FileText,
    action: () => {
      navigator.clipboard.writeText(String(p.content)).catch(() => {});
      setOpen(false);
    },
  }));

  const recentChatCommands = (chats || [])
    .slice(0, 9)
    .map((chat: Doc<'chats'>, index: number) => ({
      id: `chat-${chat._id}`,
      label: chat.title || `Chat ${index + 1}`,
      icon: MessageSquare,
      shortcut: index < 9 ? `${altKey}${index + 1}` : undefined,
      action: () => {
        router.push(`/chat?chatId=${chat._id}`);
        setOpen(false);
      },
    }));

  const coreCommands = [
    {
      id: 'new-chat',
      label: 'New Chat',
      icon: Plus,
      shortcut: `${cmdKey}N`,
      action: () => {
        router.push('/chat');
        setOpen(false);
      },
    },
    {
      id: 'chats',
      label: 'Chats',
      icon: MessageSquare,
      shortcut: `${cmdKey}${shiftKey}H`,
      action: () => {
        router.push('/chat');
        setOpen(false);
      },
    },
  ];

  const modelAgentCommands = [
    {
      id: 'select-agent',
      label: 'Select Agent',
      icon: Shield,
      shortcut: `${cmdKey}${shiftKey}A`,
      action: () => {
        router.push('/agents');
        setOpen(false);
      },
    },
    {
      id: 'select-model',
      label: 'Select Model',
      icon: Zap,
      shortcut: `${cmdKey}${shiftKey}M`,
      action: () => {
        router.push('/chat?openSettings=true');
        setOpen(false);
      },
    },
  ];

  const settingsCommands = [
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      shortcut: `${cmdKey}${shiftKey}T`,
      action: () => {
        router.push('/settings');
        setOpen(false);
      },
    },
    {
      id: 'light',
      label: 'Light Theme',
      icon: Sun,
      action: () => {
        setTheme('light');
        // Update user preferences asynchronously without blocking UI
        if (isAuthenticated) {
          updateUserPreferences({ theme: 'light' }).catch(() => {
            // Silently handle errors to avoid UI blocking
          });
        }
        setOpen(false);
      },
    },
    {
      id: 'dark',
      label: 'Dark Theme',
      icon: Moon,
      action: () => {
        setTheme('dark');
        // Update user preferences asynchronously without blocking UI
        if (isAuthenticated) {
          updateUserPreferences({ theme: 'dark' }).catch(() => {
            // Silently handle errors to avoid UI blocking
          });
        }
        setOpen(false);
      },
    },
  ];

  const helpCommands = [
    {
      id: 'shortcuts',
      label: 'Keyboard Shortcuts',
      icon: Keyboard,
      shortcut: `${cmdKey}?`,
      action: () => {
        setShowShortcuts(true);
        setOpen(false);
      },
    },
    ...(adminStatus?.isAdmin
      ? [
          {
            id: 'memories',
            label: 'Memories',
            icon: HelpCircle,
            shortcut: `${cmdKey}/`,
            action: () => {
              router.push('/memories');
              setOpen(false);
            },
          } as const,
        ]
      : []),
    {
      id: 'roadmap',
      label: 'Roadmap',
      icon: ScrollText,
      action: () => {
        router.push('/roadmap');
        setOpen(false);
      },
    },
  ];

  const navigationCommands = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      action: () => {
        router.push('/');
        setOpen(false);
      },
    },
    {
      id: 'account',
      label: 'Account',
      icon: User,
      action: () => {
        router.push('/account');
        setOpen(false);
      },
    },
    {
      id: 'referrals',
      label: 'Referrals',
      icon: Info,
      action: () => {
        router.push('/referrals');
        setOpen(false);
      },
    },
  ];

  if (!shouldRender) {
    return null;
  }

  return (
    <>
      <CommandDialog
        className="max-w-2xl"
        description="Quick actions and navigation"
        onOpenChange={setOpen}
        open={open}
        title="Command Palette"
      >
        <Command className="rounded-lg border shadow-md">
          <div className="flex items-center border-b px-3">
            <BookOpen className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Search commands..."
            />
          </div>
          <CommandList className="max-h-[400px] overflow-y-auto">
            <CommandEmpty>No commands found.</CommandEmpty>

            {adminStatus?.isAdmin && (
              <>
                <CommandGroup heading="📖 Prompt Library">
                  {promptCommands.length > 0 ? (
                    promptCommands.map((cmd: CommandItem) => (
                      <CommandItem
                        className="flex items-center justify-between"
                        key={cmd.id}
                        onSelect={() => run(cmd.action)}
                        value={cmd.label}
                      >
                        <div className="flex items-center gap-2">
                          <cmd.icon className="h-4 w-4" />
                          <span className="truncate">{cmd.label}</span>
                        </div>
                      </CommandItem>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-muted-foreground text-sm">
                      No prompts yet.
                    </div>
                  )}
                  {!isProPlus && (
                    <div className="p-2">
                      <Button
                        className="w-full"
                        onClick={() => {
                          router.push('/subscription');
                          setOpen(false);
                        }}
                        variant="outline"
                      >
                        Upgrade to use Prompt Library
                      </Button>
                    </div>
                  )}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            <CommandGroup heading="💬 Chat">
              {coreCommands.map((cmd: CommandItem) => (
                <CommandItem
                  className="flex items-center justify-between"
                  key={cmd.id}
                  onSelect={() => run(cmd.action)}
                  value={cmd.label}
                >
                  <div className="flex items-center gap-2">
                    <cmd.icon className="h-4 w-4" />
                    <span>{cmd.label}</span>
                  </div>
                  {cmd.shortcut && (
                    <CommandShortcut>{cmd.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>

            {recentChatCommands.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="🕘 Recent Chats">
                  {recentChatCommands.map((cmd: CommandItem) => (
                    <CommandItem
                      className="flex items-center justify-between"
                      key={cmd.id}
                      onSelect={() => run(cmd.action)}
                      value={cmd.label}
                    >
                      <div className="flex items-center gap-2">
                        <cmd.icon className="h-4 w-4" />
                        <span className="truncate">{cmd.label}</span>
                      </div>
                      {cmd.shortcut && (
                        <CommandShortcut>{cmd.shortcut}</CommandShortcut>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            <CommandSeparator />
            <CommandGroup heading="🤖 Models & Agents">
              {modelAgentCommands.map((cmd: CommandItem) => (
                <CommandItem
                  className="flex items-center justify-between"
                  key={cmd.id}
                  onSelect={() => run(cmd.action)}
                  value={cmd.label}
                >
                  <div className="flex items-center gap-2">
                    <cmd.icon className="h-4 w-4" />
                    <span>{cmd.label}</span>
                  </div>
                  {cmd.shortcut && (
                    <CommandShortcut>{cmd.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />
            <CommandGroup heading="⚙️ Settings">
              {settingsCommands.map((cmd: CommandItem) => (
                <CommandItem
                  className="flex items-center justify-between"
                  key={cmd.id}
                  onSelect={() => run(cmd.action)}
                  value={cmd.label}
                >
                  <div className="flex items-center gap-2">
                    <cmd.icon className="h-4 w-4" />
                    <span>{cmd.label}</span>
                  </div>
                  {cmd.shortcut && (
                    <CommandShortcut>{cmd.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />
            <CommandGroup heading="📚 Help & Info">
              {helpCommands.map((cmd: CommandItem) => (
                <CommandItem
                  className="flex items-center justify-between"
                  key={cmd.id}
                  onSelect={() => run(cmd.action)}
                  value={cmd.label}
                >
                  <div className="flex items-center gap-2">
                    <cmd.icon className="h-4 w-4" />
                    <span>{cmd.label}</span>
                  </div>
                  {cmd.shortcut && (
                    <CommandShortcut>{cmd.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />
            <CommandGroup heading="🧭 Navigation">
              {navigationCommands.map((cmd: CommandItem) => (
                <CommandItem
                  className="flex items-center justify-between"
                  key={cmd.id}
                  onSelect={() => run(cmd.action)}
                  value={cmd.label}
                >
                  <div className="flex items-center gap-2">
                    <cmd.icon className="h-4 w-4" />
                    <span>{cmd.label}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>

      <CommandsOfMaatModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </>
  );
}

export default globalCommandPalette;
