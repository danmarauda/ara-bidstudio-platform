'use client';

import { api } from '@convex/_generated/api';
// useCurrentUser replacement - use getCurrentUserProfile query
import { useQuery } from 'convex/react';
import { useCallback, useState } from 'react';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('use-upgrade-modal');

export type UpgradeTrigger =
  | 'limit_reached'
  | 'feature_request'
  | 'premium_model_request'
  | 'manual'
  | 'usage_milestone';

export interface UseUpgradeModalOptions {
  defaultTier?: 'pro' | 'pro_plus';
  autoShow?: boolean;
}

export function useUpgradeModal(options: UseUpgradeModalOptions = {}) {
  const { defaultTier = 'pro', autoShow = false } = options;
  const [isOpen, setIsOpen] = useState(false);
  const [suggestedTier, setSuggestedTier] = useState<'pro' | 'pro_plus'>(
    defaultTier
  );
  const [trigger, setTrigger] = useState<UpgradeTrigger>('manual');

  const user = useQuery(api.users.getCurrentUserProfile);
  const subscription = useQuery(
    api.subscriptions.getSubscriptionStatus,
    user ? {} : 'skip'
  );

  // Calculate upgrade prompt (moved from useSubscription)
  const upgradePrompt = {
    shouldShow: false,
    title: '',
    message: '',
    suggestedTier: null as 'pro' | 'pro_plus' | null,
    urgency: 'low' as 'low' | 'medium' | 'high',
  };

  // Open modal with specific configuration
  const openModal = useCallback(
    (config?: { tier?: 'pro' | 'pro_plus'; trigger?: UpgradeTrigger }) => {
      setSuggestedTier(config?.tier || defaultTier);
      setTrigger(config?.trigger || 'manual');
      setIsOpen(true);

      log.info('Upgrade modal opened', {
        tier: config?.tier || defaultTier,
        trigger: config?.trigger || 'manual',
        currentTier: subscription?.tier,
      });
    },
    [defaultTier, subscription?.tier]
  );

  // Close modal
  const closeModal = useCallback(() => {
    setIsOpen(false);
    log.info('Upgrade modal closed');
  }, []);

  // Specific trigger methods for different scenarios
  const showForLimitReached = useCallback(() => {
    const tier = subscription?.tier === 'free' ? 'pro' : 'pro_plus';
    openModal({ tier, trigger: 'limit_reached' });
  }, [subscription?.tier, openModal]);

  const showForFeatureRequest = useCallback(
    (feature: 'api_access' | 'large_files' | 'advanced_agents') => {
      // API access and large files require Pro+
      const tier = ['api_access', 'large_files'].includes(feature)
        ? 'pro_plus'
        : 'pro';
      openModal({ tier, trigger: 'feature_request' });
    },
    [openModal]
  );

  const showForPremiumModel = useCallback(() => {
    const tier = subscription?.tier === 'free' ? 'pro' : 'pro_plus';
    openModal({ tier, trigger: 'premium_model_request' });
  }, [subscription?.tier, openModal]);

  // Auto-show logic based on upgrade prompt
  const shouldAutoShow =
    autoShow && upgradePrompt?.shouldShow && upgradePrompt.urgency === 'high';

  return {
    // State
    isOpen: isOpen || shouldAutoShow,
    suggestedTier,
    trigger,

    // Actions
    openModal,
    closeModal,
    showForLimitReached,
    showForFeatureRequest,
    showForPremiumModel,

    // Computed values
    shouldAutoShow,
    currentTier: subscription?.tier,
    upgradePrompt,
  };
}

// Feature gating helper that can trigger upgrade modal
export function useFeatureGate() {
  const user = useQuery(api.users.getCurrentUserProfile);
  const subscription = useQuery(
    api.subscriptions.getSubscriptionStatus,
    user ? {} : 'skip'
  );
  const upgradeModal = useUpgradeModal();

  const checkFeature = useCallback(
    (feature: string): boolean => {
      const tier = subscription?.tier || 'free';

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
      const tierLevel: Record<string, number> = {
        free: 0,
        pro: 1,
        pro_plus: 2,
      };

      return (tierLevel[tier] || 0) >= (tierLevel[requiredTier] || 0);
    },
    [subscription?.tier]
  );

  const requireFeature = useCallback(
    (feature: string): boolean => {
      const hasAccess = checkFeature(feature);

      if (!hasAccess) {
        // Show upgrade modal for this specific feature
        upgradeModal.showForFeatureRequest(feature as any);

        log.info('Feature access denied, showing upgrade modal', {
          feature,
          currentTier: subscription?.tier,
        });
      }

      return hasAccess;
    },
    [checkFeature, subscription?.tier, upgradeModal]
  );

  return {
    checkFeature,
    requireFeature,
    upgradeModal,
    currentTier: subscription?.tier,
  };
}

export default useUpgradeModal;
