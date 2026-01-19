'use client';

import { ArrowRight, Crown, Shield, X, Zap } from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { UpgradePrompt as UpgradePromptType } from '@/hooks/use-subscription';
import { cn } from '@/lib/utils';
import { useUpgrade } from './upgradeWrapper';

interface UpgradePromptProps {
  prompt: UpgradePromptType;
  className?: string;
  onDismiss?: () => void;
  variant?: 'inline' | 'modal';
}

const TIER_DETAILS = {
  pro: {
    name: 'Pro',
    price: '0.05 SOL',
    icon: <Zap className="h-5 w-5" />,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    features: [
      '500 messages / month',
      '100 premium messages',
      'Document uploads',
      'Chat history',
    ],
  },
  pro_plus: {
    name: 'Pro+',
    price: '0.1 SOL',
    icon: <Shield className="h-5 w-5" />,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    features: [
      '1,000 messages / month',
      '300 premium messages',
      'Large file uploads',
      'API access',
      'Priority support',
    ],
  },
};

export function UpgradePrompt({
  prompt,
  className,
  onDismiss,
  variant = 'inline',
}: UpgradePromptProps) {
  const [showModal, setShowModal] = useState(false);
  const { openUpgradeModal } = useUpgrade();

  if (!prompt.shouldShow) {
    return null;
  }

  const suggestedTier = prompt.suggestedTier;
  const tierDetails = suggestedTier ? TIER_DETAILS[suggestedTier] : null;

  const getUrgencyStyles = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return {
          border: 'border-red-200 dark:border-red-800',
          bg: 'bg-red-50 dark:bg-red-950/20',
          text: 'text-red-900 dark:text-red-100',
          button: 'bg-red-600 hover:bg-red-700 text-white',
        };
      case 'medium':
        return {
          border: 'border-amber-200 dark:border-amber-800',
          bg: 'bg-amber-50 dark:bg-amber-950/20',
          text: 'text-amber-900 dark:text-amber-100',
          button: 'bg-amber-600 hover:bg-amber-700 text-white',
        };
      default:
        return {
          border: 'border-blue-200 dark:border-blue-800',
          bg: 'bg-blue-50 dark:bg-blue-950/20',
          text: 'text-blue-900 dark:text-blue-100',
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
        };
    }
  };

  const urgencyStyles = getUrgencyStyles(prompt.urgency);

  const handleUpgrade = () => {
    if (variant === 'modal') {
      setShowModal(true);
    } else {
      // Use the new upgrade modal system
      openUpgradeModal({
        tier: suggestedTier || 'pro',
        trigger:
          prompt.urgency === 'high' ? 'limit_reached' : 'usage_milestone',
      });
    }
  };

  if (variant === 'inline') {
    return (
      <>
        <Alert
          className={cn(
            urgencyStyles.border,
            urgencyStyles.bg,
            'relative',
            className
          )}
        >
          {onDismiss && (
            <Button
              className="absolute top-2 right-2 h-6 w-6 p-0"
              onClick={onDismiss}
              size="sm"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <div className="flex items-start space-x-3">
            {tierDetails && (
              <div className={cn('mt-0.5', tierDetails.color)}>
                {tierDetails.icon}
              </div>
            )}
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <h4 className={cn('font-semibold text-sm', urgencyStyles.text)}>
                  {prompt.title}
                </h4>
                {prompt.urgency === 'high' && (
                  <Badge className="text-xs" variant="destructive">
                    Action Required
                  </Badge>
                )}
              </div>
              <AlertDescription className={cn('text-sm', urgencyStyles.text)}>
                {prompt.message}
              </AlertDescription>
              {suggestedTier && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    className={urgencyStyles.button}
                    onClick={handleUpgrade}
                    size="sm"
                  >
                    Upgrade to {TIER_DETAILS[suggestedTier].name}
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                  <span className="text-xs opacity-75">
                    Starting at {TIER_DETAILS[suggestedTier].price}/month
                  </span>
                </div>
              )}
            </div>
          </div>
        </Alert>

        {/* Payment handling is now done through the UpgradeWrapper */}
      </>
    );
  }

  return (
    <>
      <Dialog onOpenChange={setShowModal} open={showModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {tierDetails && (
                <div className={tierDetails.color}>{tierDetails.icon}</div>
              )}
              {prompt.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-muted-foreground">{prompt.message}</p>

            {tierDetails && (
              <Card
                className={cn(
                  'p-4',
                  tierDetails.bgColor,
                  tierDetails.borderColor
                )}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {tierDetails.name} Plan
                    </h3>
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-2xl">
                        {tierDetails.price}
                      </span>
                      <Badge className="text-xs" variant="secondary">
                        50% Off Launch
                      </Badge>
                    </div>
                  </div>
                </div>

                <ul className="space-y-1 text-sm">
                  {tierDetails.features.map((feature) => (
                    <li className="flex items-center gap-2" key={feature}>
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="mt-4 w-full"
                  onClick={() => {
                    setShowModal(false);
                    openUpgradeModal({
                      tier: suggestedTier || 'pro',
                      trigger:
                        prompt.urgency === 'high'
                          ? 'limit_reached'
                          : 'usage_milestone',
                    });
                  }}
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade Now
                </Button>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment handling is now done through the UpgradeWrapper */}
    </>
  );
}
