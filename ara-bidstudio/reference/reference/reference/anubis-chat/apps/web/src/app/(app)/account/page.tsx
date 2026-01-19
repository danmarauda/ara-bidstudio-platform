'use client';

import { AlertTriangle, Loader, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { UpgradeModal } from '@/components/auth/upgrade-modal';
import { UserProfile } from '@/components/auth/userProfile';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useUpdateUserProfile } from '@/hooks/convex/useUsers';
import { useSubscription } from '@/hooks/use-subscription';
import { useUpgradeModal } from '@/hooks/use-upgrade-modal';

export default function AccountPage() {
  const { user, isLoading: authLoading } = useAuthContext();
  const {
    subscription,
    limits,
    upgradePrompt,
    isLoading: subscriptionLoading,
    error,
  } = useSubscription();
  const { isOpen, openModal, closeModal, suggestedTier } = useUpgradeModal();

  const isLoading = authLoading || subscriptionLoading;
  const { mutate: updateProfile } = useUpdateUserProfile();

  const handleUpdate = async (data: {
    displayName?: string;
    avatar?: string;
  }) => {
    try {
      const result = await updateProfile({
        displayName: data.displayName,
        avatar: data.avatar,
      });
      if (result?.success === false) {
        toast.error(result.error?.message || 'Failed to update profile');
        return;
      }
      toast.success('Profile updated');
    } catch (_e) {
      toast.error('Failed to update profile');
    }
  };
  const showUpgradeButton =
    subscription &&
    subscription.tier !== 'pro_plus' &&
    subscription.tier !== 'admin';

  return (
    <div className="w-full bg-gradient-to-b from-primary/5 dark:from-primary/10">
      {/* Full-width header */}
      <div className="w-full p-4 md:p-6">
        <div className="mx-auto w-full max-w-6xl">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h1 className="whitespace-nowrap bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text font-semibold text-2xl text-transparent sm:text-3xl">
                Account
              </h1>
              <p className="text-muted-foreground">
                View and update your profile
              </p>
            </div>
            {showUpgradeButton && (
              <div className="flex flex-col gap-2 md:flex-row md:justify-end">
                <Button
                  className="gap-2"
                  onClick={() =>
                    openModal({
                      tier: subscription.tier === 'pro' ? 'pro_plus' : 'pro',
                      trigger: 'manual',
                    })
                  }
                >
                  <Zap className="h-4 w-4" />
                  Upgrade Account
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Constrained content */}
      <div className="mx-auto w-full max-w-6xl space-y-4 p-4 md:p-6">
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

        {/* Error state */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Unable to load subscription data. Please refresh the page.
            </AlertDescription>
          </Alert>
        )}

        <Card className="p-4 ring-1 ring-primary/10 sm:p-5 md:p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              <span className="text-muted-foreground text-sm">
                Loading account data...
              </span>
            </div>
          )}
          {!isLoading && user && (
            <UserProfile
              limits={limits}
              onUpdate={handleUpdate}
              subscription={subscription}
              upgradePrompt={upgradePrompt}
              user={user}
            />
          )}
          {!(isLoading || user) && (
            <div className="text-muted-foreground text-sm">No user loaded.</div>
          )}
        </Card>

        {/* Upgrade Modal */}
        <UpgradeModal
          isOpen={isOpen}
          onClose={closeModal}
          suggestedTier={suggestedTier}
          trigger="manual"
        />
      </div>
    </div>
  );
}
