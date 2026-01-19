'use client';

import { api } from '@convex/_generated/api';
import { useAuthActions, useAuthToken } from '@convex-dev/auth/react';
import { useQuery } from 'convex/react';
import { createContext, type ReactNode, useContext, useMemo } from 'react';
import type {
  SubscriptionLimits,
  SubscriptionStatus,
  UpgradePrompt,
} from '@/hooks/use-subscription';
import { useWallet } from '@/hooks/useWallet';
import type { AuthSession, User } from '@/lib/types/api';
import { createModuleLogger } from '@/lib/utils/logger';

const _log = createModuleLogger('auth-provider');

interface AuthContextValue {
  // Auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  error: string | null;

  // Auth methods
  login: () => Promise<AuthSession | null>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  clearError: () => void;

  // Wallet integration
  isWalletConnected: boolean;
  walletAddress: string | null;
  publicKey: string | null;

  // Subscription integration
  subscription: SubscriptionStatus | null;
  limits: SubscriptionLimits | null;
  upgradePrompt: UpgradePrompt;
  isSubscriptionLoading: boolean;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const user = useQuery(api.users.getCurrentUserProfile);
  const { signIn, signOut } = useAuthActions();
  const token = useAuthToken();
  const wallet = useWallet();

  // Subscription data from Convex
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

  // Calculate subscription limits
  const limits = useMemo((): SubscriptionLimits | null => {
    if (!normalizedSubscription) {
      return null;
    }

    const messagesRemaining = Math.max(
      0,
      normalizedSubscription.messagesLimit - normalizedSubscription.messagesUsed
    );
    const premiumMessagesRemaining = Math.max(
      0,
      normalizedSubscription.premiumMessagesLimit -
        normalizedSubscription.premiumMessagesUsed
    );
    const msUntilReset = normalizedSubscription.currentPeriodEnd - Date.now();
    const daysUntilReset = Math.max(
      0,
      Math.ceil(msUntilReset / (1000 * 60 * 60 * 24))
    );

    return {
      tier: normalizedSubscription.tier,
      canSendMessage: messagesRemaining > 0,
      canUsePremiumModel:
        premiumMessagesRemaining > 0 && normalizedSubscription.tier !== 'free',
      canUploadLargeFiles: normalizedSubscription.tier === 'pro_plus',
      canAccessAdvancedFeatures: normalizedSubscription.tier === 'pro_plus',
      canUseAPI: normalizedSubscription.tier === 'pro_plus',
      messagesRemaining,
      premiumMessagesRemaining,
      daysUntilReset,
    };
  }, [normalizedSubscription]);

  // Calculate upgrade prompts
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

  // Refresh subscription data
  const refreshSubscription = async () => {
    // Force re-query of subscription data (Convex handles this automatically)
    // This is mainly for manual refresh scenarios
  };

  const contextValue: AuthContextValue = useMemo(
    () => ({
      // Auth state - using Convex Auth hooks directly
      isAuthenticated: !!user,
      isLoading: wallet.isConnecting,
      user: user as User | null,
      token,
      error: null,

      // Auth methods - using Convex Auth actions
      login: async () => {
        // Minimal placeholder to satisfy type; actual login is handled elsewhere
        return {
          walletAddress: wallet.publicKey?.toString() ?? '',
          publicKey: wallet.publicKey?.toString() ?? '',
          token: token || '',
          refreshToken: token || '',
          expiresAt: Date.now() + 3_600_000,
          user: (user as User) ?? ({} as User),
        };
      },
      logout: signOut,
      refreshToken: async () => token,
      clearError: () => {},

      // Wallet integration
      isWalletConnected: wallet.isConnected,
      walletAddress: wallet.publicKey?.toString() ?? null,
      publicKey: wallet.publicKey?.toString() ?? null,

      // Subscription integration
      subscription: normalizedSubscription,
      limits,
      upgradePrompt,
      isSubscriptionLoading: subscription === undefined,
      refreshSubscription,
    }),
    [
      user,
      token,
      signOut,
      wallet.isConnecting,
      wallet.isConnected,
      wallet.publicKey,
      subscription,
      normalizedSubscription,
      limits,
      upgradePrompt,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

// Convenience hooks for common use cases
// useCurrentUser is now imported directly from @convex-dev/auth/react

export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuthContext();
  return isAuthenticated;
}

// useAuthToken is now imported directly from @convex-dev/auth/react

// Subscription convenience hooks
export function useSubscriptionStatus(): SubscriptionStatus | null {
  const { subscription } = useAuthContext();
  return subscription;
}

export function useSubscriptionLimits(): SubscriptionLimits | null {
  const { limits } = useAuthContext();
  return limits;
}

export function useUpgradePrompt(): UpgradePrompt {
  const { upgradePrompt } = useAuthContext();
  return upgradePrompt;
}

export function useCanSendMessage(): boolean {
  const { limits } = useAuthContext();
  return limits?.canSendMessage ?? false;
}

export function useCanUsePremiumModel(): boolean {
  const { limits } = useAuthContext();
  return limits?.canUsePremiumModel ?? false;
}
