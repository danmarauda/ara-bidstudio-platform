'use client';

import { api } from '@convex/_generated/api';
import { useQuery } from 'convex/react';
import { useMemo } from 'react';

export interface SubscriptionStatus {
  tier: 'free' | 'pro' | 'pro_plus' | 'admin';
  messagesUsed: number;
  messagesLimit: number;
  premiumMessagesUsed: number;
  premiumMessagesLimit: number;
  messageCredits?: number;
  premiumMessageCredits?: number;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  autoRenew: boolean;
  planPriceSol: number;
  features: string[];
  daysRemaining?: number;
}

export interface SubscriptionLimits {
  tier: SubscriptionStatus['tier'];
  canSendMessage: boolean;
  canUsePremiumModel: boolean;
  canUploadLargeFiles: boolean;
  canAccessAdvancedFeatures: boolean;
  canUseAPI: boolean;
  messagesRemaining: number;
  premiumMessagesRemaining: number;
  daysUntilReset: number;
}

export interface UpgradePrompt {
  shouldShow: boolean;
  title: string;
  message: string;
  suggestedTier: 'pro' | 'pro_plus' | null;
  urgency: 'low' | 'medium' | 'high';
}

export function useSubscription() {
  const user = useQuery(api.users.getCurrentUserProfile);

  const subscription = useQuery(
    api.subscriptions.getSubscriptionStatus,
    user ? {} : 'skip'
  );

  const normalizedSubscription = useMemo((): SubscriptionStatus | null => {
    if (!subscription) {
      return null;
    }
    const allowedTiers = ['free', 'pro', 'pro_plus', 'admin'] as const;
    const tier = (allowedTiers as readonly string[]).includes(subscription.tier)
      ? (subscription.tier as (typeof allowedTiers)[number])
      : 'free';

    const computedDaysRemaining = Math.max(
      0,
      Math.ceil(
        ((subscription.currentPeriodEnd ?? Date.now()) - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    );

    const maybeSubscription = subscription as Record<string, unknown>;
    const providedDaysRemaining =
      typeof maybeSubscription.daysRemaining === 'number'
        ? (maybeSubscription.daysRemaining as number)
        : undefined;

    const maybeSubscriptionWithCredits = subscription as Record<
      string,
      unknown
    > & {
      messageCredits?: number;
      premiumMessageCredits?: number;
    };

    return {
      tier,
      messagesUsed: subscription.messagesUsed ?? 0,
      messagesLimit: subscription.messagesLimit ?? 0,
      premiumMessagesUsed: subscription.premiumMessagesUsed ?? 0,
      premiumMessagesLimit: subscription.premiumMessagesLimit ?? 0,
      messageCredits: maybeSubscriptionWithCredits.messageCredits ?? 0,
      premiumMessageCredits:
        maybeSubscriptionWithCredits.premiumMessageCredits ?? 0,
      currentPeriodStart: subscription.currentPeriodStart ?? Date.now(),
      currentPeriodEnd: subscription.currentPeriodEnd ?? Date.now(),
      autoRenew: Boolean(subscription.autoRenew),
      planPriceSol: subscription.planPriceSol ?? 0,
      features: Array.isArray(subscription.features)
        ? subscription.features
        : [],
      daysRemaining: providedDaysRemaining ?? computedDaysRemaining,
    };
  }, [subscription]);

  const limits = useMemo((): SubscriptionLimits => {
    if (!normalizedSubscription) {
      return {
        tier: 'free',
        canSendMessage: false,
        canUsePremiumModel: false,
        canUploadLargeFiles: false,
        canAccessAdvancedFeatures: false,
        canUseAPI: false,
        messagesRemaining: 0,
        premiumMessagesRemaining: 0,
        daysUntilReset: 0,
      };
    }

    // Include both monthly allowance and purchased credits
    const monthlyMessagesRemaining = Math.max(
      0,
      normalizedSubscription.messagesLimit - normalizedSubscription.messagesUsed
    );
    const messagesRemaining =
      monthlyMessagesRemaining + (normalizedSubscription.messageCredits || 0);

    const monthlyPremiumRemaining = Math.max(
      0,
      normalizedSubscription.premiumMessagesLimit -
        normalizedSubscription.premiumMessagesUsed
    );
    const premiumMessagesRemaining =
      monthlyPremiumRemaining +
      (normalizedSubscription.premiumMessageCredits || 0);
    const msUntilReset = normalizedSubscription.currentPeriodEnd - Date.now();
    const daysUntilReset = Math.max(
      0,
      Math.ceil(msUntilReset / (1000 * 60 * 60 * 24))
    );

    return {
      tier: normalizedSubscription.tier,
      canSendMessage:
        messagesRemaining > 0 ||
        (normalizedSubscription.messageCredits || 0) > 0,
      canUsePremiumModel:
        (premiumMessagesRemaining > 0 ||
          (normalizedSubscription.premiumMessageCredits || 0) > 0) &&
        normalizedSubscription.tier !== 'free',
      canUploadLargeFiles: normalizedSubscription.tier === 'pro_plus',
      canAccessAdvancedFeatures: normalizedSubscription.tier === 'pro_plus',
      canUseAPI: normalizedSubscription.tier === 'pro_plus',
      messagesRemaining,
      premiumMessagesRemaining,
      daysUntilReset,
    };
  }, [normalizedSubscription]);

  const upgradePrompt = useMemo((): UpgradePrompt => {
    if (!normalizedSubscription) {
      return {
        shouldShow: false,
        title: '',
        message: '',
        suggestedTier: null,
        urgency: 'low',
      };
    }

    const usagePercentage =
      (normalizedSubscription.messagesUsed /
        normalizedSubscription.messagesLimit) *
      100;
    const premiumUsagePercentage =
      normalizedSubscription.premiumMessagesLimit > 0
        ? (normalizedSubscription.premiumMessagesUsed /
            normalizedSubscription.premiumMessagesLimit) *
          100
        : 0;

    // Critical usage (>95%)
    if (usagePercentage >= 95) {
      return {
        shouldShow: true,
        title: 'Message Limit Reached',
        message: `You've used ${normalizedSubscription.messagesUsed}/${normalizedSubscription.messagesLimit} messages this month. Upgrade to continue chatting.`,
        suggestedTier:
          normalizedSubscription.tier === 'free' ? 'pro' : 'pro_plus',
        urgency: 'high',
      };
    }

    // High premium usage (>90%)
    if (
      premiumUsagePercentage >= 90 &&
      normalizedSubscription.tier !== 'pro_plus'
    ) {
      return {
        shouldShow: true,
        title: 'Premium Messages Running Low',
        message: `You've used ${normalizedSubscription.premiumMessagesUsed}/${normalizedSubscription.premiumMessagesLimit} premium messages. Upgrade for unlimited access.`,
        suggestedTier: 'pro_plus',
        urgency: 'high',
      };
    }

    // Warning threshold (>75%)
    if (usagePercentage >= 75) {
      return {
        shouldShow: true,
        title: 'Usage Warning',
        message: `You've used ${Math.round(usagePercentage)}% of your monthly messages. Consider upgrading to avoid interruptions.`,
        suggestedTier:
          normalizedSubscription.tier === 'free' ? 'pro' : 'pro_plus',
        urgency: 'medium',
      };
    }

    // Free tier encouragement (>50%)
    if (normalizedSubscription.tier === 'free' && usagePercentage >= 50) {
      return {
        shouldShow: true,
        title: 'Enjoying Anubis Chat?',
        message: `You've used ${normalizedSubscription.messagesUsed} messages. Upgrade to Pro for 30x more messages and premium AI models.`,
        suggestedTier: 'pro',
        urgency: 'low',
      };
    }

    return {
      shouldShow: false,
      title: '',
      message: '',
      suggestedTier: null,
      urgency: 'low',
    };
  }, [normalizedSubscription]);

  return {
    subscription: normalizedSubscription,
    limits,
    upgradePrompt,
    isLoading: subscription === undefined,
    error: null, // Add error handling if needed
  };
}

// Helper functions for feature gating
export function requiresPremium(
  feature: 'advanced_agents' | 'api_access' | 'large_files' | 'priority_support'
) {
  return feature === 'api_access' ||
    feature === 'large_files' ||
    feature === 'priority_support'
    ? 'pro_plus'
    : 'pro';
}

export function canAccessFeature(tier: string, feature: string): boolean {
  const tierLevel = tier === 'pro_plus' ? 2 : tier === 'pro' ? 1 : 0;
  const requiredTier = requiresPremium(feature as any);
  const requiredLevel = requiredTier === 'pro_plus' ? 2 : 1;

  return tierLevel >= requiredLevel;
}
