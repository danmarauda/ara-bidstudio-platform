'use client';

import { Crown, Shield, Zap } from 'lucide-react';
import { UpgradeModal } from '@/components/auth/upgrade-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type {
  SubscriptionStatus as SubscriptionData,
  SubscriptionLimits,
  UpgradePrompt,
} from '@/hooks/use-subscription';
import { useUpgradeModal } from '@/hooks/use-upgrade-modal';
import { cn } from '@/lib/utils';

/**
 * SubscriptionStatus component - Display subscription details and usage
 * Shows message usage, features, and upgrade options
 */
export type CompatibleSubscription = SubscriptionData & {
  isAdmin?: boolean;
  availableModels?: string[];
};

interface ExtendedSubscriptionStatusProps {
  subscription?: CompatibleSubscription;
  limits?: SubscriptionLimits | null;
  upgradePrompt?: UpgradePrompt;
  showUpgrade?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function SubscriptionStatus({
  subscription,
  limits,
  upgradePrompt,
  showUpgrade = false,
  className,
  children,
}: ExtendedSubscriptionStatusProps) {
  const { isOpen, openModal, closeModal, suggestedTier } = useUpgradeModal();
  // Handle missing subscription data
  if (!subscription) {
    return (
      <div className={cn('space-y-6', className)}>
        <Card className="p-6">
          <div className="text-center text-muted-foreground">
            <p>Unable to load subscription data</p>
          </div>
        </Card>
      </div>
    );
  }

  // Use messagesUsed/messagesLimit for new subscription system
  const messagesUsed = subscription.messagesUsed ?? 0;
  const messagesLimit = subscription.messagesLimit ?? 10_000;
  const premiumMessagesUsed = subscription.premiumMessagesUsed ?? 0;
  const premiumMessagesLimit = subscription.premiumMessagesLimit ?? 0;

  // Handle admin unlimited access (Infinity values)
  const isAdmin = subscription.tier === 'admin' || subscription.isAdmin;
  let usagePercentage = 0;
  if (!isAdmin) {
    usagePercentage =
      messagesLimit > 0 ? Math.round((messagesUsed / messagesLimit) * 100) : 0;
  }
  let premiumUsagePercentage = 0;
  if (!isAdmin) {
    premiumUsagePercentage =
      premiumMessagesLimit > 0
        ? Math.round((premiumMessagesUsed / premiumMessagesLimit) * 100)
        : 0;
  }

  // Use limits from the hook if available, otherwise calculate from subscription
  const canSendMessage = limits?.canSendMessage ?? messagesUsed < messagesLimit;
  const canUsePremiumModel =
    limits?.canUsePremiumModel ??
    (premiumMessagesUsed < premiumMessagesLimit &&
      subscription.tier !== 'free');

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'admin':
        return <Shield className="h-5 w-5" />;
      case 'pro_plus':
        return <Crown className="h-5 w-5" />;
      case 'pro':
        return <Zap className="h-5 w-5" />;
      default:
        return <Crown className="h-5 w-5" />;
    }
  };

  const getTierLabel = (tier: string) => {
    if (tier === 'admin') {
      return 'Administrator';
    }
    if (tier === 'pro_plus') {
      return 'Pro+ Plan';
    }
    if (tier === 'pro') {
      return 'Pro Plan';
    }
    return 'Free Plan';
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'admin':
        return 'text-red-600 dark:text-red-400';
      case 'pro_plus':
        return 'text-purple-600 dark:text-purple-400';
      case 'pro':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getProgressVariant = (percentage: number) => {
    if (percentage >= 90) {
      return 'error';
    }
    if (percentage >= 75) {
      return 'warning';
    }
    return 'default';
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Subscription Overview */}
      <Card className="p-5 ring-1 ring-primary/10">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={cn('flex-shrink-0', getTierColor(subscription.tier))}
            >
              {getTierIcon(subscription.tier)}
            </div>
            <div>
              <h3 className="bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text font-semibold text-lg text-transparent">
                {getTierLabel(subscription.tier)}
              </h3>
              <p className="text-gray-600 text-sm dark:text-gray-400">
                {subscription.tier === 'admin'
                  ? 'Unlimited access to all features'
                  : 'Current subscription tier'}
              </p>
            </div>
          </div>
        </div>

        {/* Message Usage */}
        <div className="space-y-4">
          {/* Regular Messages */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900 text-sm dark:text-gray-100">
                Message Usage
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 text-sm dark:text-gray-400">
                  {isAdmin
                    ? 'Unlimited'
                    : `${formatNumber(messagesUsed)} / ${formatNumber(messagesLimit)}`}
                </span>
                {!(isAdmin || canSendMessage) && (
                  <Badge size="sm" variant="error">
                    Limit Reached
                  </Badge>
                )}
              </div>
            </div>
            <Progress
              max={100}
              size="md"
              value={usagePercentage}
              variant={getProgressVariant(usagePercentage)}
            />
            {usagePercentage >= 80 && (
              <div className="flex items-center space-x-2">
                <Badge
                  size="sm"
                  variant={usagePercentage >= 90 ? 'error' : 'warning'}
                >
                  {usagePercentage >= 90 ? 'Critical' : 'Warning'}
                </Badge>
                <span className="text-gray-600 text-xs dark:text-gray-400">
                  {usagePercentage >= 90
                    ? 'Your message usage is critically high'
                    : "You're approaching your message limit"}
                </span>
              </div>
            )}
          </div>

          {/* Premium Messages (if applicable) */}
          {premiumMessagesLimit > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 text-sm dark:text-gray-100">
                  Premium Model Usage
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600 text-sm dark:text-gray-400">
                    {isAdmin
                      ? 'Unlimited'
                      : `${formatNumber(premiumMessagesUsed)} / ${formatNumber(premiumMessagesLimit)}`}
                  </span>
                  {!(isAdmin || canUsePremiumModel) &&
                    subscription.tier !== 'free' && (
                      <Badge size="sm" variant="error">
                        Limit Reached
                      </Badge>
                    )}
                </div>
              </div>
              <Progress
                max={100}
                size="md"
                value={premiumUsagePercentage}
                variant={getProgressVariant(premiumUsagePercentage)}
              />
              <div className="text-gray-500 text-xs dark:text-gray-400">
                Includes GPT-4o, Claude 3.5 Sonnet, and other premium AI models
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Features */}
      {subscription.features && subscription.features.length > 0 && (
        <Card className="p-5">
          <h4 className="mb-4 font-semibold text-gray-900 text-md dark:text-gray-100">
            Included Features
          </h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {subscription.features.map((feature: string) => {
              // Format feature names for better display
              const formattedFeature = feature
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (l) => l.toUpperCase());

              return (
                <div
                  className="flex items-center space-x-2 text-gray-600 text-sm dark:text-gray-400"
                  key={feature}
                >
                  <div className="h-2 w-2 flex-shrink-0 rounded-full bg-green-500" />
                  <span>{formattedFeature}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Available Models */}
      {subscription.availableModels &&
        subscription.availableModels.length > 0 && (
          <Card className="p-5">
            <h4 className="mb-4 font-semibold text-gray-900 text-md dark:text-gray-100">
              Available AI Models
            </h4>
            <div className="flex flex-wrap gap-2">
              {subscription.availableModels.map((model: string) => (
                <Badge key={model} variant="secondary">
                  {model}
                </Badge>
              ))}
            </div>
          </Card>
        )}

      {/* Subscription Period Info */}
      {subscription.currentPeriodStart && subscription.currentPeriodEnd && (
        <Card className="p-5">
          <h4 className="mb-4 font-semibold text-gray-900 text-md dark:text-gray-100">
            Billing Period
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Current Period:
              </span>
              <span className="text-gray-900 dark:text-gray-100">
                {new Date(subscription.currentPeriodStart).toLocaleDateString()}{' '}
                - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Days Remaining:
              </span>
              <span className="text-gray-900 dark:text-gray-100">
                {subscription.daysRemaining ||
                  Math.max(
                    0,
                    Math.ceil(
                      (subscription.currentPeriodEnd - Date.now()) /
                        (1000 * 60 * 60 * 24)
                    )
                  )}{' '}
                days
              </span>
            </div>
            {subscription.currentPeriodEnd &&
              subscription.currentPeriodEnd < Date.now() && (
                <div className="flex justify-between">
                  <span className="font-medium text-red-600 dark:text-red-400">
                    Status:
                  </span>
                  <Badge variant="destructive">Expired</Badge>
                </div>
              )}
          </div>
        </Card>
      )}

      {/* Usage Recommendations - Use upgradePrompt if available (hide for admins) */}
      {!isAdmin && (upgradePrompt?.shouldShow || usagePercentage >= 75) && (
        <Card className="border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <div className="flex items-start space-x-3">
            <Zap className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
            <div className="space-y-2">
              <h5 className="font-medium text-sm text-yellow-800 dark:text-yellow-200">
                {upgradePrompt?.title || 'Usage Recommendation'}
              </h5>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                {upgradePrompt?.message ||
                  (usagePercentage >= 90
                    ? 'Consider upgrading your plan to get more messages or wait for your monthly reset.'
                    : 'You may want to monitor your message usage more closely or consider upgrading your plan.')}
              </p>
              {(showUpgrade || upgradePrompt?.suggestedTier) && (
                <Button
                  className="mt-2"
                  onClick={() =>
                    openModal({
                      tier:
                        upgradePrompt?.suggestedTier ||
                        (subscription?.tier === 'free' ? 'pro' : 'pro_plus'),
                      trigger: 'limit_reached',
                    })
                  }
                  size="sm"
                  variant="outline"
                >
                  {upgradePrompt?.suggestedTier
                    ? `Upgrade to ${upgradePrompt.suggestedTier.charAt(0).toUpperCase() + upgradePrompt.suggestedTier.slice(1)}`
                    : 'View Upgrade Options'}
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {children}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={isOpen}
        onClose={closeModal}
        suggestedTier={suggestedTier}
        trigger="manual"
      />
    </div>
  );
}

export default SubscriptionStatus;
