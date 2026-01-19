'use client';

import {
  Activity,
  CheckCircle2,
  Layers,
  MessageSquarePlus,
  Settings,
  ShieldCheck,
  User2,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ModeToggle } from '@/components/mode-toggle';
import {
  useAuthContext,
  useSubscriptionLimits,
  useSubscriptionStatus,
} from '@/components/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatTierLabel } from '@/lib/format-tier-label';
import { cn } from '@/lib/utils';

/**
 * ActivityFooter — persistent, themed footer attached to the viewport bottom.
 * Visible only when authenticated (rendered within authenticated layouts).
 */
export default function ActivityFooter() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthContext();
  const subscription = useSubscriptionStatus();
  const limits = useSubscriptionLimits();

  // Online status (navigator-based, simple and robust)
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // NOTE: Avoid showing wallet/public identifiers in footer to reduce exposure
  const hasUser = Boolean(user?.walletAddress);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <footer
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t bg-gradient-to-r from-primary/10 via-card/80 to-primary/10 backdrop-blur supports-[backdrop-filter]:bg-card/70'
      )}
    >
      <TooltipProvider>
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-3 py-1 text-sm md:px-4">
          {/* Left cluster: connection + account (no PII) */}
          <LeftCluster
            hasUser={hasUser}
            isOnline={isOnline}
            tier={subscription?.tier}
          />

          {/* Middle cluster: platform stats */}
          <StatsSection
            limits={{
              messagesRemaining: limits?.messagesRemaining,
              premiumMessagesRemaining: limits?.premiumMessagesRemaining,
              daysUntilReset: limits?.daysUntilReset,
            }}
          />

          {/* Right cluster: quick actions */}
          <ActionsSection pathname={pathname} />
        </div>
      </TooltipProvider>
    </footer>
  );
}

export function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground text-xs">
      <div className="flex items-center gap-1">
        {icon}
        <span>{label}</span>
      </div>
      <span aria-live="polite" className="font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

export function NavIcon({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={label}
          asChild
          className={cn(
            'h-7 w-7 p-0',
            active ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
          )}
          size="sm"
          type="button"
          variant="ghost"
        >
          <Link href={href}>{icon}</Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

export function LeftCluster({
  isOnline,
  hasUser,
  tier,
}: {
  isOnline: boolean;
  hasUser: boolean;
  tier?: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        aria-live="polite"
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs',
          isOnline
            ? 'bg-emerald-500/10 text-emerald-500'
            : 'bg-destructive/10 text-destructive'
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'h-2 w-2 rounded-full',
            isOnline ? 'bg-emerald-500' : 'bg-red-500'
          )}
        />
        {isOnline ? 'Online' : 'Offline'}
      </span>

      <Separator className="hidden h-4 md:block" orientation="vertical" />

      {hasUser ? (
        <div className="hidden items-center gap-2 md:flex">
          <Button aria-label="Account" asChild size="sm" variant="ghost">
            <Link className="inline-flex items-center gap-2" href="/account">
              <User2 aria-hidden="true" className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </Link>
          </Button>
          {tier ? (
            <Badge className="ml-1" variant="outline">
              {formatTierLabel(tier)}
            </Badge>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function StatsSection({
  limits,
}: {
  limits: {
    messagesRemaining?: number | undefined;
    premiumMessagesRemaining?: number | undefined;
    daysUntilReset?: number | undefined;
  };
}) {
  return (
    <div className="hidden items-center gap-4 md:flex">
      <StatItem
        icon={
          <MessageSquarePlus
            aria-hidden="true"
            className="h-3.5 w-3.5 text-primary"
          />
        }
        label="Messages"
        value={
          typeof limits.messagesRemaining === 'number'
            ? `${limits.messagesRemaining}`
            : 'N/A'
        }
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <StatItem
              icon={
                <Zap
                  aria-hidden="true"
                  className="h-3.5 w-3.5 text-amber-500"
                />
              }
              label="Premium Messages"
              value={
                typeof limits.premiumMessagesRemaining === 'number'
                  ? `${limits.premiumMessagesRemaining}`
                  : 'N/A'
              }
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          Remaining messages on premium models this billing period
        </TooltipContent>
      </Tooltip>
      <StatItem
        icon={
          <ShieldCheck
            aria-hidden="true"
            className="h-3.5 w-3.5 text-blue-600"
          />
        }
        label="Days Until Reset"
        value={
          typeof limits.daysUntilReset === 'number'
            ? `${limits.daysUntilReset}d`
            : 'N/A'
        }
      />
    </div>
  );
}

export function ActionsSection({ pathname }: { pathname: string | null }) {
  return (
    <div className="flex items-center gap-1 md:gap-2">
      <NavIcon
        active={pathname?.startsWith('/dashboard')}
        href="/dashboard"
        icon={<Activity className="h-4 w-4" />}
        label="Dashboard"
      />
      <NavIcon
        active={pathname?.startsWith('/chat')}
        href="/chat"
        icon={<MessageSquarePlus className="h-4 w-4" />}
        label="Chat"
      />
      <NavIcon
        active={pathname?.startsWith('/agents')}
        href="/agents"
        icon={<Layers className="h-4 w-4" />}
        label="Agents"
      />
      {/* Workflows removed per request */}
      <NavIcon
        active={pathname?.startsWith('/subscription')}
        href="/subscription"
        icon={<CheckCircle2 className="h-4 w-4" />}
        label="Subscription"
      />
      <NavIcon
        active={pathname?.startsWith('/settings')}
        href="/settings"
        icon={<Settings className="h-4 w-4" />}
        label="Settings"
      />

      <Separator className="mx-1 hidden h-4 md:block" orientation="vertical" />
      <div className="flex items-center">
        <ModeToggle />
      </div>
    </div>
  );
}
