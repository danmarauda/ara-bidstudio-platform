'use client';

import { AlertTriangle, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { UsageIndicator } from '@/components/chat/usage-indicator';
import {
  useSubscriptionLimits,
  useSubscriptionStatus,
} from '@/components/providers/auth-provider';
import SubscriptionTabs from '@/components/subscription/subscription-tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { getModelsForTier, isPremiumModel } from '@/lib/constants/ai-models';

export default function SubscriptionPage() {
  const subscription = useSubscriptionStatus();
  const limits = useSubscriptionLimits();
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'pro_plus'>(
    () => {
      const tier = subscription?.tier ?? 'free';
      return tier === 'admin'
        ? 'pro_plus'
        : (tier as 'free' | 'pro' | 'pro_plus');
    }
  );

  // Compute preview unconditionally to keep hook order stable between renders
  const preview = useMemo(() => {
    const list = getModelsForTier(selectedPlan);
    const standard = list.filter((m) => !isPremiumModel(m));
    const premium = list.filter((m) => isPremiumModel(m));
    return {
      standardPreview: standard.slice(0, 4),
      premiumPreview: premium.slice(0, 2),
      standardTotal: standard.length,
      premiumTotal: premium.length,
    };
  }, [selectedPlan]);

  useEffect(() => {
    if (!subscription) {
      return;
    }
    const tier = subscription.tier === 'admin' ? 'pro_plus' : subscription.tier;
    setSelectedPlan(tier as 'free' | 'pro' | 'pro_plus');
  }, [subscription, subscription?.tier]);

  if (!subscription) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <h2 className="font-semibold text-xl">Loading subscription...</h2>
          <p className="text-muted-foreground">
            Please wait while we load your subscription details.
          </p>
        </div>
      </div>
    );
  }

  const usagePercent =
    subscription.messagesLimit > 0
      ? Math.round(
          (subscription.messagesUsed / subscription.messagesLimit) * 100
        )
      : 0;

  const isExpiringSoon =
    subscription.tier !== 'free' &&
    (subscription.daysRemaining ?? Number.POSITIVE_INFINITY) <= 7;
  const isNearLimit = usagePercent >= 75;

  const formatTierLabel = (tier: string): string => {
    switch (tier) {
      case 'pro_plus':
        return 'Pro+';
      case 'pro':
        return 'Pro';
      case 'free':
        return 'Free';
      default:
        return tier;
    }
  };

  return (
    <div className="w-full overflow-x-hidden bg-gradient-to-b from-primary/5 dark:from-primary/10">
      {/* Full-width header */}
      <div className="w-full p-4 md:p-6">
        <div className="mx-auto w-full max-w-6xl">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h1 className="whitespace-nowrap bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text font-semibold text-2xl text-transparent sm:text-3xl">
                Subscription Management
              </h1>
              <p className="text-muted-foreground">
                Manage your anubis.chat subscription and billing
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Constrained content */}
      <div className="mx-auto w-full max-w-6xl space-y-4 px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
        <Alerts
          currentPeriodEnd={subscription.currentPeriodEnd}
          daysRemaining={
            subscription.daysRemaining ?? limits?.daysUntilReset ?? 0
          }
          isExpiringSoon={isExpiringSoon}
          isNearLimit={isNearLimit}
          tierLabel={formatTierLabel(subscription.tier)}
          usagePercent={usagePercent}
        />

        <UsageOverview
          messagesLeft={limits?.messagesRemaining ?? 0}
          messagesUsed={subscription.messagesUsed}
          premiumMessagesUsed={subscription.premiumMessagesUsed}
          usagePercent={usagePercent}
        />

        <SubscriptionTabs
          limits={limits}
          onSelectPlan={setSelectedPlan}
          preview={preview}
          selectedPlan={selectedPlan}
          subscription={subscription}
        />
      </div>
    </div>
  );
}

type AlertsProps = {
  isExpiringSoon: boolean;
  isNearLimit: boolean;
  usagePercent: number;
  tierLabel: string;
  daysRemaining: number;
  currentPeriodEnd: number;
};

function Alerts({
  isExpiringSoon,
  isNearLimit,
  usagePercent,
  tierLabel,
  daysRemaining,
  currentPeriodEnd,
}: AlertsProps) {
  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {isExpiringSoon && (
        <Alert className="border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            Your {tierLabel} subscription expires in {daysRemaining} days on{' '}
            {formatDate(currentPeriodEnd)}.
          </AlertDescription>
        </Alert>
      )}
      {isNearLimit && (
        <Alert className="border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/20">
          <TrendingUp className="h-4 w-4 text-rose-600" />
          <AlertDescription>
            You've used {usagePercent}% of your monthly message allowance.
            Consider upgrading.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

type UsageOverviewProps = {
  messagesUsed: number;
  messagesLeft: number;
  premiumMessagesUsed: number;
  usagePercent: number;
};

function UsageOverview({
  messagesUsed,
  messagesLeft,
  premiumMessagesUsed,
  usagePercent,
}: UsageOverviewProps) {
  return (
    <Card className="p-3 ring-1 ring-border/50 transition hover:ring-primary/20">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-2">
          <div className="text-[11px] text-muted-foreground">Messages Used</div>
          <div className="font-semibold text-lg leading-tight">
            {messagesUsed}
          </div>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-2 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="text-[11px] text-muted-foreground">Messages Left</div>
          <div className="font-semibold text-lg leading-tight">
            {messagesLeft}
          </div>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="text-[11px] text-muted-foreground">Premium Used</div>
          <div className="font-semibold text-lg leading-tight">
            {premiumMessagesUsed}
          </div>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 dark:border-emerald-800 dark:bg-emerald-900/20">
          <div className="text-[11px] text-muted-foreground">Usage Rate</div>
          <div className="font-semibold text-lg leading-tight">
            {usagePercent}%
          </div>
        </div>
      </div>
      <div className="mt-3">
        <UsageIndicator showUpgrade={false} variant="compact" />
      </div>
    </Card>
  );
}
