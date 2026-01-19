'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  Bot,
  Home,
  Menu,
  MessageSquare,
  Plus,
  Settings,
  User,
  Wallet,
  X,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: string | number;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

interface MobileNavigationProps {
  variant?: 'bottom' | 'floating' | 'drawer';
  className?: string;
  onNewChat?: () => void;
  unreadCount?: number;
}

const defaultNavItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home, href: '/' },
  { id: 'chat', label: 'Chat', icon: MessageSquare, href: '/chat' },
  { id: 'agents', label: 'Agents', icon: Bot, href: '/agents' },
  { id: 'wallet', label: 'Wallet', icon: Wallet, href: '/wallet' },
  { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
];

export function MobileNavigation({
  variant = 'bottom',
  className,
  onNewChat,
  unreadCount = 0,
}: MobileNavigationProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const navItems = defaultNavItems.map((item) => ({
    ...item,
    badge: item.id === 'chat' && unreadCount > 0 ? unreadCount : item.badge,
  }));

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsDrawerOpen(false);
  };

  if (variant === 'floating') {
    return (
      <div
        className={cn(
          '-translate-x-1/2 fixed bottom-6 left-1/2 z-50',
          'rounded-full border bg-background/95 shadow-lg backdrop-blur-lg',
          'px-2 py-2',
          className
        )}
      >
        <div className="flex items-center gap-1">
          {navItems.slice(0, 4).map((item) => {
            const isActive = pathname === item.href;
            const ItemIcon = item.icon;
            return (
              <motion.div key={item.id} whileTap={{ scale: 0.95 }}>
                <Button
                  aria-label={item.label}
                  className={cn(
                    'relative h-10 w-10 rounded-full',
                    isActive && 'shadow-sm'
                  )}
                  onClick={() => handleNavigation(item.href)}
                  size="icon"
                  variant={isActive ? 'default' : 'ghost'}
                >
                  <ItemIcon className="h-5 w-5" />
                  {item.badge && (
                    <Badge
                      className="-top-1 -right-1 absolute flex h-5 w-5 items-center justify-center p-0"
                      variant={item.badgeVariant || 'destructive'}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </motion.div>
            );
          })}

          <div className="mx-1 h-6 w-px bg-border" />

          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              aria-label="Open menu"
              className="h-10 w-10 rounded-full"
              onClick={() => setIsDrawerOpen(true)}
              size="icon"
              variant="ghost"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (variant === 'drawer') {
    return (
      <>
        {/* Menu Button */}
        <Button
          aria-label="Open navigation menu"
          className={cn(
            'fixed right-6 bottom-6 z-50 h-14 w-14 rounded-full shadow-lg',
            className
          )}
          onClick={() => setIsDrawerOpen(true)}
          size="icon"
          variant="outline"
        >
          <Menu className="h-6 w-6" />
        </Button>

        {/* Drawer */}
        <AnimatePresence>
          {isDrawerOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                onClick={() => setIsDrawerOpen(false)}
              />

              {/* Drawer Content */}
              <motion.div
                animate={{ x: 0 }}
                className="fixed top-0 right-0 z-50 h-full w-80 border-l bg-background shadow-xl"
                exit={{ x: '100%' }}
                initial={{ x: '100%' }}
                transition={{ type: 'spring', damping: 20 }}
              >
                <div className="flex h-full flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b p-4">
                    <h2 className="font-semibold text-lg">Menu</h2>
                    <Button
                      aria-label="Close menu"
                      onClick={() => setIsDrawerOpen(false)}
                      size="icon"
                      variant="ghost"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Navigation Items */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-2">
                      {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const ItemIcon = item.icon;
                        return (
                          <Button
                            className="w-full justify-start"
                            key={item.id}
                            onClick={() => handleNavigation(item.href)}
                            variant={isActive ? 'secondary' : 'ghost'}
                          >
                            <ItemIcon className="mr-3 h-5 w-5" />
                            {item.label}
                            {item.badge && (
                              <Badge
                                className="ml-auto"
                                variant={item.badgeVariant || 'secondary'}
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </Button>
                        );
                      })}
                    </div>

                    <div className="mt-6 border-t pt-6">
                      <Button
                        className="w-full"
                        onClick={() => handleNavigation('/settings')}
                        variant="outline"
                      >
                        <Settings className="mr-3 h-5 w-5" />
                        Settings
                      </Button>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  {onNewChat && (
                    <div className="border-t p-4">
                      <Button
                        className="w-full"
                        onClick={() => {
                          onNewChat();
                          setIsDrawerOpen(false);
                        }}
                      >
                        <Plus className="mr-2 h-5 w-5" />
                        New Chat
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Bottom variant (default)
  return (
    <div
      className={cn(
        'fixed right-0 bottom-0 left-0 z-50',
        'border-t bg-background/95 backdrop-blur-lg',
        'safe-bottom px-4 py-2',
        className
      )}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const ItemIcon = item.icon;
          return (
            <motion.button
              className={cn(
                'relative flex flex-col items-center gap-1 rounded-lg p-2 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
                'hover:bg-muted/50'
              )}
              key={item.id}
              onClick={() => handleNavigation(item.href)}
              whileTap={{ scale: 0.95 }}
            >
              <div className="relative">
                <ItemIcon
                  className={cn(
                    'h-5 w-5 transition-colors',
                    isActive && 'text-primary'
                  )}
                />
                {item.badge && (
                  <Badge
                    className="-top-2 -right-2 absolute flex h-4 min-w-[16px] items-center justify-center p-0 text-[10px]"
                    variant={item.badgeVariant || 'destructive'}
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span
                className={cn(
                  'font-medium text-[10px]',
                  isActive && 'text-primary'
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  className="-bottom-2 -translate-x-1/2 absolute left-1/2 h-1 w-1 rounded-full bg-primary"
                  layoutId="activeTab"
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Quick Action Button */}
      {onNewChat && (
        <motion.div
          animate={{ scale: 1 }}
          className="-top-16 absolute right-4"
          initial={{ scale: 0 }}
        >
          <Button
            aria-label="Start new chat"
            className="h-14 w-14 rounded-full shadow-lg"
            onClick={onNewChat}
            size="icon"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}

// Re-export the hook from the dedicated hooks file
export { useHideOnScroll } from '@/hooks/use-hide-on-scroll';

export default MobileNavigation;
