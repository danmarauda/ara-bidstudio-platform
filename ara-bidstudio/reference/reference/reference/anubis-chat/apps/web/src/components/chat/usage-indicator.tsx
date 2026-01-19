'use client';

import { BarChart3, Crown, Info, MessageCircle, Zap } from 'lucide-react';
import { useState } from 'react';
import { PaymentModal } from '@/components/auth/paymentModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSubscription } from '@/hooks/use-subscription';
import { formatTierLabel } from '@/lib/format-tier-label';
import { cn } from '@/lib/utils';

interface UsageIndicatorProps {
  variant?: 'compact' | 'detailed' | 'minimal';
  showUpgrade?: boolean;
  className?: string;
}

export function UsageIndicator({
  variant = 'compact',
  showUpgrade = true,
  className,
}: UsageIndicatorProps) {
  const { subscription, limits, upgradePrompt } = useSubscription();
  const [showPayment, setShowPayment] = useState(false);

  if (!subscription) {
    return null;
  }

  const usagePercentage = Math.round(
    (subscription.messagesUsed / subscription.messagesLimit) * 100
  );
  const premiumUsagePercentage =
    subscription.premiumMessagesLimit > 0
      ? Math.round(
          (subscription.premiumMessagesUsed /
            subscription.premiumMessagesLimit) *
            100
        )
      : 0;

  const currentTierForPayment: 'free' | 'pro' | 'pro_plus' =
    subscription.tier === 'admin' ? 'pro_plus' : subscription.tier;

  const getUsageColor = (percentage: number) => {
    if (percentage >= 95) {
      return 'text-red-600 dark:text-red-400';
    }
    if (percentage >= 75) {
      return 'text-amber-600 dark:text-amber-400';
    }
    if (percentage >= 50) {
      return 'text-blue-600 dark:text-blue-400';
    }
    return 'text-green-600 dark:text-green-400';
  };

  const getProgressVariant = (
    percentage: number
  ): 'default' | 'warning' | 'error' => {
    if (percentage >= 90) {
      return 'error';
    }
    if (percentage >= 75) {
      return 'warning';
    }
    return 'default';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  if (variant === 'minimal') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'flex items-center gap-2 text-sm',
                getUsageColor(usagePercentage),
                className
              )}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="font-medium">
                {formatNumber(limits.messagesRemaining)}
              </span>
              {subscription.tier !== 'free' &&
                limits.premiumMessagesRemaining > 0 && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <Crown className="h-4 w-4" />
                    <span className="font-medium">
                      {limits.premiumMessagesRemaining}
                    </span>
                  </>
                )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 text-sm">
              <p>{limits.messagesRemaining} messages remaining</p>
              {subscription.messageCredits &&
                subscription.messageCredits > 0 && (
                  <p className="text-green-600 dark:text-green-400">
                    +{subscription.messageCredits} purchased credits
                  </p>
                )}
              {subscription.tier !== 'free' && (
                <p>{limits.premiumMessagesRemaining} premium messages left</p>
              )}
              {subscription.premiumMessageCredits &&
                subscription.premiumMessageCredits > 0 && (
                  <p className="text-amber-600 dark:text-amber-400">
                    +{subscription.premiumMessageCredits} premium credits
                  </p>
                )}
              <p>{limits.daysUntilReset} days until reset</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className={cn('overflow-hidden p-3', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={getUsageColor(usagePercentage)}>
              <MessageCircle className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">
                  {subscription.messagesUsed}/{subscription.messagesLimit}
                </span>
                <Badge className="text-xs" variant="outline">
                  {formatTierLabel(subscription.tier)}
                </Badge>
              </div>
              <Progress
                className="h-2 w-24"
                value={usagePercentage}
                variant={getProgressVariant(usagePercentage)}
              />
            </div>
          </div>

          {upgradePrompt.shouldShow && showUpgrade && (
            <Button
              className="ml-2"
              onClick={() => setShowPayment(true)}
              size="sm"
              variant="outline"
            >
              <Zap className="mr-1 h-3 w-3" />
              Upgrade
            </Button>
          )}
        </div>

        {showPayment && upgradePrompt.suggestedTier && (
          <PaymentModal
            currentTier={currentTierForPayment}
            isOpen={showPayment}
            onClose={() => setShowPayment(false)}
            onSuccess={() => setShowPayment(false)}
            tier={upgradePrompt.suggestedTier}
          />
        )}
      </Card>
    );
  }

  // Detailed variant
  return (
    <Card className={cn('overflow-hidden p-4', className)}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-sm">
          <BarChart3 className="h-4 w-4" />
          Usage This Month
        </h3>
        <Badge className="text-xs" variant="outline">
          {formatTierLabel(subscription.tier)}
        </Badge>
      </div>

      <div className="space-y-4">
        {/* Messages Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <span>Messages</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={getUsageColor(usagePercentage)}>
                {subscription.messagesUsed}/{subscription.messagesLimit}
              </span>
              {subscription.messageCredits &&
                subscription.messageCredits > 0 && (
                  <Badge className="text-xs" variant="secondary">
                    +{subscription.messageCredits}
                  </Badge>
                )}
            </div>
          </div>
          <Progress
            className="h-2"
            value={usagePercentage}
            variant={getProgressVariant(usagePercentage)}
          />
        </div>

        {/* Premium Messages Usage (if applicable) */}
        {subscription.premiumMessagesLimit > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                <span>Premium Messages</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        GPT-4o, Claude 3.5 Sonnet, and other premium models
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-2">
                <span className={getUsageColor(premiumUsagePercentage)}>
                  {subscription.premiumMessagesUsed}/
                  {subscription.premiumMessagesLimit}
                </span>
                {subscription.premiumMessageCredits &&
                  subscription.premiumMessageCredits > 0 && (
                    <Badge className="text-xs" variant="secondary">
                      +{subscription.premiumMessageCredits}
                    </Badge>
                  )}
              </div>
            </div>
            <Progress
              className="h-2"
              value={premiumUsagePercentage}
              variant={getProgressVariant(premiumUsagePercentage)}
            />
          </div>
        )}

        {/* Reset Timer */}
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span>Resets in {limits.daysUntilReset} days</span>
          {showUpgrade && upgradePrompt.shouldShow && (
            <Button
              className="h-auto p-1 text-xs"
              onClick={() => setShowPayment(true)}
              size="sm"
              variant="ghost"
            >
              <Zap className="mr-1 h-3 w-3" />
              Upgrade
            </Button>
          )}
        </div>

        {/* Usage Warnings */}
        {usagePercentage >= 90 && (
          <div className="rounded border border-red-200 bg-red-50 p-2 text-red-700 text-xs dark:border-red-800 dark:bg-red-950/20 dark:text-red-300">
            ⚠️ Critical usage level reached
          </div>
        )}
        {usagePercentage >= 75 && usagePercentage < 90 && (
          <div className="rounded border border-amber-200 bg-amber-50 p-2 text-amber-700 text-xs dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
            ⚠️ Approaching usage limit
          </div>
        )}
      </div>

      {showPayment && upgradePrompt.suggestedTier && (
        <PaymentModal
          currentTier={currentTierForPayment}
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          onSuccess={() => setShowPayment(false)}
          tier={upgradePrompt.suggestedTier}
        />
      )}
    </Card>
  );
}
