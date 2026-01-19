'use client';

import {
  AlertTriangle,
  Bot,
  Crown,
  Loader,
  MessageSquare,
  User as UserIcon,
  Wallet as WalletIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type GridSetting, SettingsGrid } from '@/components/ui/settings-grid';
import { useSubscription } from '@/hooks/use-subscription';

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuthContext();
  const {
    subscription,
    upgradePrompt,
    isLoading: subscriptionLoading,
    error,
  } = useSubscription();
  const router = useRouter();

  const isLoading = authLoading || subscriptionLoading;

  const formatTierLabel = (tier?: string): string => {
    switch (tier) {
      case 'pro_plus':
        return 'Pro+';
      case 'pro':
        return 'Pro';
      case 'free':
        return 'Free';
      case 'admin':
        return 'Admin';
      default:
        return tier ?? 'Free';
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto mb-4 h-8 w-8 animate-spin" />
          <h2 className="font-semibold text-xl">Loading settings...</h2>
          <p className="text-muted-foreground">
            Please wait while we load your settings.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <div>
          <h1 className="font-semibold text-xl sm:text-2xl">Settings</h1>
          <p className="text-muted-foreground">
            Manage your preferences and integrations
          </p>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Unable to load subscription data. Some features may not be
            available.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-b from-primary/5 dark:from-primary/10">
      {/* Full-width header */}
      <div className="w-full p-4 md:p-6">
        <div className="mx-auto w-full max-w-6xl">
          <h1 className="bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text font-semibold text-2xl text-transparent sm:text-3xl">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your preferences and integrations
          </p>
        </div>
      </div>

      {/* Constrained content */}
      <div className="mx-auto w-full max-w-6xl space-y-4 p-3 sm:p-4 md:p-6">
        {/* Show upgrade prompt if needed */}
        {upgradePrompt?.shouldShow && (
          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              <strong>{upgradePrompt.title}</strong>
              <p className="mt-1 text-sm">{upgradePrompt.message}</p>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          <div>
            <h2 className="mb-2 font-medium">Billing & plan</h2>
            {(() => {
              const settings: GridSetting[] = [
                {
                  id: 'subscription-tier',
                  title: 'Subscription',
                  description: 'Plan and usage',
                  type: 'display',
                  value: `${formatTierLabel(subscription?.tier)}${
                    subscription?.messagesLimit
                      ? ` • ${subscription.messagesUsed || 0}/${
                          subscription.messagesLimit
                        } msgs`
                      : ''
                  }`,
                  badge:
                    subscription?.tier !== 'free' && subscription?.planPriceSol
                      ? `${subscription.planPriceSol} SOL/mo`
                      : undefined,
                  icon: <Crown className="h-4 w-4 text-primary" />,
                  category: 'advanced',
                  compact: true,
                },
                {
                  id: 'manage-subscription',
                  title: 'Manage Subscription',
                  description: 'Billing and plan details',
                  type: 'action',
                  onClick: () => router.push('/subscription'),
                  icon: <Crown className="h-4 w-4 text-primary" />,
                  category: 'advanced',
                  compact: true,
                },
              ];
              return (
                <SettingsGrid
                  className="mt-1"
                  columns={2}
                  gridClassName="gap-4"
                  settings={settings}
                  showFilter={false}
                />
              );
            })()}
          </div>

          <div>
            <h2 className="mb-2 font-medium">Account & tools</h2>
            {(() => {
              const settings: GridSetting[] = [
                {
                  id: 'account',
                  title: 'Account',
                  description: user?.walletAddress
                    ? `${user.walletAddress.slice(0, 8)}...${user.walletAddress.slice(-4)}`
                    : 'No wallet connected',
                  type: 'action',
                  onClick: () => router.push('/account'),
                  icon: <UserIcon className="h-4 w-4 text-primary" />,
                  category: 'interface',
                },
                {
                  id: 'wallet',
                  title: 'Wallet',
                  description: 'Connect and manage your wallet',
                  type: 'action',
                  onClick: () => router.push('/wallet'),
                  icon: <WalletIcon className="h-4 w-4 text-primary" />,
                  category: 'interface',
                },
                {
                  id: 'chat-settings',
                  title: 'Chat Settings',
                  description: 'Configure AI models and chat behavior',
                  type: 'action',
                  onClick: () => {
                    // Navigate to chat page and open settings
                    router.push('/chat?openSettings=true');
                  },
                  icon: <MessageSquare className="h-4 w-4 text-primary" />,
                  category: 'behavior',
                },
                {
                  id: 'agents',
                  title: 'Agents',
                  description: 'Create and manage agents',
                  type: 'action',
                  onClick: () => router.push('/agents'),
                  icon: <Bot className="h-4 w-4 text-primary" />,
                  category: 'behavior',
                },
              ];
              return (
                <SettingsGrid
                  className="mt-1"
                  columns={2}
                  gridClassName="gap-4"
                  settings={settings}
                  showFilter={false}
                />
              );
            })()}
          </div>
        </div>

        {/* Preferences section removed by request */}
      </div>
    </div>
  );
}
