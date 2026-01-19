'use client';

import { api } from '@convex/_generated/api';
// useCurrentUser replacement - using getCurrentUserProfile query
import { useQuery } from 'convex/react';
import { Crown, Lock, Shield } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { UpgradeModal } from './upgrade-modal';
import { UpgradeCard } from './upgradeCard';

// Helper functions moved from useSubscription
function requiresPremium(
  feature:
    | 'advanced_agents'
    | 'api_access'
    | 'large_files'
    | 'priority_support'
    | 'premium_models'
) {
  return feature === 'api_access' ||
    feature === 'large_files' ||
    feature === 'priority_support'
    ? 'pro_plus'
    : 'pro';
}

function canAccessFeature(tier: string, feature: string): boolean {
  if (tier === 'admin') {
    return true;
  }
  let tierLevel = 0;
  if (tier === 'pro_plus') {
    tierLevel = 2;
  } else if (tier === 'pro') {
    tierLevel = 1;
  }
  const requiredTier = requiresPremium(
    feature as
      | 'advanced_agents'
      | 'api_access'
      | 'large_files'
      | 'priority_support'
      | 'premium_models'
  );
  const requiredLevel = requiredTier === 'pro_plus' ? 2 : 1;

  return tierLevel >= requiredLevel;
}

interface FeatureGateProps {
  feature:
    | 'advanced_agents'
    | 'api_access'
    | 'large_files'
    | 'priority_support'
    | 'premium_models';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradeButton?: boolean;
  className?: string;
}

const FEATURE_INFO = {
  advanced_agents: {
    name: 'Advanced AI Agents',
    description:
      'Access sophisticated AI agents with specialized capabilities and advanced reasoning.',
    requiredTier: 'pro_plus' as const,
    icon: <Shield className="h-5 w-5" />,
  },
  api_access: {
    name: 'API Access',
    description:
      'Integrate anubis.chat into your applications with our powerful API.',
    requiredTier: 'pro_plus' as const,
    icon: <Crown className="h-5 w-5" />,
  },
  large_files: {
    name: 'Large File Uploads',
    description: 'Upload and analyze files up to 100MB in size.',
    requiredTier: 'pro_plus' as const,
    icon: <Shield className="h-5 w-5" />,
  },
  priority_support: {
    name: 'Priority Support',
    description: 'Get faster response times and dedicated support.',
    requiredTier: 'pro_plus' as const,
    icon: <Crown className="h-5 w-5" />,
  },
  premium_models: {
    name: 'Premium AI Models',
    description:
      'Access to GPT-4o, Claude 3.5 Sonnet, and other premium models.',
    requiredTier: 'pro' as const,
    icon: <Crown className="h-5 w-5" />,
  },
};

const TIER_INFO = {
  pro: {
    name: 'Pro',
    price: '0.05 SOL',
    originalPrice: '0.1 SOL',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  pro_plus: {
    name: 'Pro+',
    price: '0.1 SOL',
    originalPrice: '0.2 SOL',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
};

export function FeatureGate({
  feature,
  children,
  fallback,
  showUpgradeButton = true,
  className,
}: FeatureGateProps) {
  const user = useQuery(api.users.getCurrentUserProfile);
  const subscription = useQuery(
    api.subscriptions.getSubscriptionStatus,
    user ? {} : 'skip'
  );
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (!subscription) {
    return (
      fallback || (
        <div className={cn('flex items-center justify-center p-8', className)}>
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      )
    );
  }

  // Check if user has access to the feature
  const hasAccess = canAccessFeature(subscription.tier, feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show fallback if provided and upgrade is disabled
  if (fallback && !showUpgradeButton) {
    return <>{fallback}</>;
  }

  const featureInfo = FEATURE_INFO[feature];
  const requiredTier = featureInfo.requiredTier;
  const tierInfo = TIER_INFO[requiredTier];

  return (
    <>
      {fallback ? (
        <div className={className}>
          {fallback}
          {showUpgradeButton && (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="mt-2" size="sm" variant="outline">
                  <Lock className="mr-2 h-4 w-4" />
                  Unlock Feature
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-center">
                    Unlock {featureInfo.name}
                  </DialogTitle>
                </DialogHeader>
                <UpgradeCard
                  bgColor={tierInfo.bgColor}
                  borderColor={tierInfo.borderColor}
                  className={className}
                  color={tierInfo.color}
                  featureDescription={featureInfo.description}
                  featureName={featureInfo.name}
                  inModal
                  onClickUpgrade={() => setShowUpgradeModal(true)}
                  originalPrice={tierInfo.originalPrice}
                  price={tierInfo.price}
                  showButton={showUpgradeButton}
                  tierName={tierInfo.name}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      ) : (
        <UpgradeCard
          bgColor={tierInfo.bgColor}
          borderColor={tierInfo.borderColor}
          className={className}
          color={tierInfo.color}
          featureDescription={featureInfo.description}
          featureName={featureInfo.name}
          onClickUpgrade={() => setShowUpgradeModal(true)}
          originalPrice={tierInfo.originalPrice}
          price={tierInfo.price}
          showButton={showUpgradeButton}
          tierName={tierInfo.name}
        />
      )}

      {showUpgradeModal && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          suggestedTier={requiredTier}
          trigger="feature_request"
        />
      )}
    </>
  );
}

// Convenience components for common use cases
export function PremiumFeature({
  children,
  ...props
}: Omit<FeatureGateProps, 'feature'>) {
  return (
    <FeatureGate feature="premium_models" {...props}>
      {children}
    </FeatureGate>
  );
}

export function ProPlusFeature({
  children,
  feature,
  ...props
}: Omit<FeatureGateProps, 'feature'> & {
  feature:
    | 'advanced_agents'
    | 'api_access'
    | 'large_files'
    | 'priority_support';
}) {
  return (
    <FeatureGate feature={feature} {...props}>
      {children}
    </FeatureGate>
  );
}
