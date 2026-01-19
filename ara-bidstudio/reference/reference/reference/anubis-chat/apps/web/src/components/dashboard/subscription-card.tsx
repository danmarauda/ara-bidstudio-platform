'use client';

import { Crown } from 'lucide-react';
import { UsageIndicator } from '@/components/chat/usage-indicator';
import { useSubscriptionStatus } from '@/components/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

function getTierBg(tier: string): string {
  switch (tier) {
    case 'free':
      return 'bg-slate-100 dark:bg-slate-800';
    case 'pro':
      return 'bg-blue-100 dark:bg-blue-900';
    case 'pro_plus':
      return 'bg-purple-100 dark:bg-purple-900';
    default:
      return 'bg-slate-100 dark:bg-slate-800';
  }
}

function getTierColor(tier: string): string {
  switch (tier) {
    case 'free':
      return 'text-slate-600 dark:text-slate-400';
    case 'pro':
      return 'text-blue-600 dark:text-blue-400';
    case 'pro_plus':
      return 'text-purple-600 dark:text-purple-400';
    default:
      return 'text-slate-600 dark:text-slate-400';
  }
}

function formatTierLabel(tier?: string): string {
  switch (tier) {
    case 'pro_plus':
      return 'Pro+';
    case 'pro':
      return 'Pro';
    case 'free':
      return 'Free';
    default:
      return tier ?? 'Free';
  }
}

export function SubscriptionCard() {
  const subscription = useSubscriptionStatus();

  if (!subscription) {
    return null;
  }

  return (
    <Card className="p-3 transition-colors hover:ring-1 hover:ring-primary/20 sm:p-4 md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className={cn(
              'rounded-md p-1.5 sm:p-2',
              getTierBg(subscription.tier)
            )}
          >
            <Crown
              className={cn(
                'h-4 w-4 sm:h-5 sm:w-5',
                getTierColor(subscription.tier)
              )}
            />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h2 className="font-semibold text-sm sm:text-base md:text-lg">
                {formatTierLabel(subscription.tier)} Plan
              </h2>
              {subscription.tier !== 'free' && (
                <Badge className="text-[10px] sm:text-xs" variant="outline">
                  {subscription.planPriceSol} SOL/mo
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground sm:text-xs md:text-sm">
              {subscription.tier === 'free' &&
                'Basic features with limited access'}
              {subscription.tier === 'pro' &&
                'Enhanced features with premium model access'}
              {subscription.tier === 'pro_plus' &&
                'Full access to all features and models'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="font-medium text-xs sm:text-sm">
            {subscription.messagesUsed} / {subscription.messagesLimit}
          </div>
          <div className="text-[10px] text-muted-foreground sm:text-xs">
            messages used
          </div>
        </div>
      </div>
      <div className="mt-3">
        <UsageIndicator
          showUpgrade={subscription.tier !== 'pro_plus'}
          variant="detailed"
        />
      </div>
    </Card>
  );
}

export default SubscriptionCard;
