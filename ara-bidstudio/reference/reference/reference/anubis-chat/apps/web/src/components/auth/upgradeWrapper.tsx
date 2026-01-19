'use client';

import { api } from '@convex/_generated/api';
// useCurrentUser replacement - using getCurrentUserProfile query
import { useQuery } from 'convex/react';
import { createContext, type ReactNode, useContext } from 'react';
import {
  type UpgradeTrigger,
  type UseUpgradeModalOptions,
  useUpgradeModal,
} from '@/hooks/use-upgrade-modal';
import { UpgradeModal } from './upgrade-modal';

interface UpgradeContextValue {
  openUpgradeModal: (config?: {
    tier?: 'pro' | 'pro_plus';
    trigger?: UpgradeTrigger;
  }) => void;
  showForLimitReached: () => void;
  showForFeatureRequest: (
    feature: 'api_access' | 'large_files' | 'advanced_agents'
  ) => void;
  showForPremiumModel: () => void;
  currentTier: string | undefined;
  isOpen: boolean;
}

const UpgradeContext = createContext<UpgradeContextValue | null>(null);

interface UpgradeProviderProps {
  children: ReactNode;
  options?: UseUpgradeModalOptions;
}

export function UpgradeProvider({ children, options }: UpgradeProviderProps) {
  const {
    isOpen,
    suggestedTier,
    trigger,
    openModal,
    closeModal,
    showForLimitReached,
    showForFeatureRequest,
    showForPremiumModel,
    currentTier,
  } = useUpgradeModal(options);

  const contextValue: UpgradeContextValue = {
    openUpgradeModal: openModal,
    showForLimitReached,
    showForFeatureRequest,
    showForPremiumModel,
    currentTier,
    isOpen,
  };

  return (
    <UpgradeContext.Provider value={contextValue}>
      {children}
      <UpgradeModal
        isOpen={isOpen}
        onClose={closeModal}
        suggestedTier={suggestedTier}
        trigger={trigger}
      />
    </UpgradeContext.Provider>
  );
}

export function useUpgrade() {
  const context = useContext(UpgradeContext);
  if (!context) {
    throw new Error('useUpgrade must be used within an UpgradeProvider');
  }
  return context;
}

// HOC for protecting premium features
interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradeButton?: boolean;
}

export function FeatureGate({
  feature,
  children,
  fallback,
  showUpgradeButton = true,
}: FeatureGateProps) {
  const { openUpgradeModal } = useUpgrade();
  const user = useQuery(api.users.getCurrentUserProfile);
  const subscription = useQuery(
    api.subscriptions.getSubscriptionStatus,
    user ? {} : 'skip'
  );

  // Feature requirements mapping
  const featureRequirements: Record<string, 'free' | 'pro' | 'pro_plus'> = {
    basic_chat: 'free',
    document_upload: 'pro',
    premium_models: 'pro',
    api_access: 'pro_plus',
    large_files: 'pro_plus',
    advanced_agents: 'pro_plus',
    unlimited_chats: 'pro_plus',
  };

  const requiredTier = featureRequirements[feature] || 'pro_plus';
  const tierLevel = { free: 0, pro: 1, pro_plus: 2, admin: 3 } as const;
  const currentTier = subscription?.tier || 'free';
  const hasAccess =
    currentTier === 'admin' ||
    ((tierLevel as Record<string, number>)[currentTier] ?? 0) >=
      tierLevel[requiredTier];

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradeButton) {
    return null;
  }

  // Default upgrade prompt
  const suggestedTier = requiredTier === 'pro_plus' ? 'pro_plus' : 'pro';

  return (
    <div className="rounded-lg border-2 border-gray-300 border-dashed p-4 text-center dark:border-gray-700">
      <div className="mb-2 text-gray-600 text-sm dark:text-gray-400">
        This feature requires {requiredTier === 'pro_plus' ? 'Pro+' : 'Pro'}
      </div>
      <button
        className="font-medium text-blue-600 text-sm hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        onClick={() =>
          openUpgradeModal({
            tier: suggestedTier,
            trigger: 'feature_request',
          })
        }
        type="button"
      >
        Upgrade to access →
      </button>
    </div>
  );
}

export default UpgradeProvider;
