'use client';

import { api } from '@convex/_generated/api';
import { useQuery } from 'convex/react';
import { Bot, Calendar, MessageSquare, TrendingUp, Zap } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
// UsageIndicator is only used inside cards below
import { SubscriptionCard } from '@/components/dashboard/subscription-card';
import {
  useAuthContext,
  useSubscriptionStatus,
} from '@/components/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useUpdateUserProfile } from '@/hooks/convex/useUsers';
import type { SubscriptionStatus } from '@/hooks/use-subscription';

// Helper function to determine badge variant for status
const getStatusBadgeVariant = (
  status: 'pending' | 'confirmed' | 'failed' | 'refunded'
): 'default' | 'secondary' | 'destructive' => {
  if (status === 'confirmed') {
    return 'default';
  }
  if (status === 'pending') {
    return 'secondary';
  }
  return 'destructive';
};

// Helper function to handle username form submission
const handleUsernameSubmit = async (
  e: React.FormEvent<HTMLFormElement>,
  pendingName: string,
  setSavingName: (saving: boolean) => void,
  updateProfile: (data: {
    displayName: string;
  }) => Promise<{ success?: boolean; error?: { message: string } }>,
  setLocalDisplayName: (name: string) => void,
  setIsEditingName: (editing: boolean) => void
) => {
  e.preventDefault();
  if (!pendingName.trim()) {
    return;
  }

  try {
    setSavingName(true);
    const result = await updateProfile({
      displayName: pendingName.trim(),
    });
    if (result?.success === false) {
      toast.error(result.error?.message || 'Failed to update username');
      return;
    }
    setLocalDisplayName(pendingName.trim());
    setIsEditingName(false);
    toast.success('Username updated');
  } finally {
    setSavingName(false);
  }
};

export default function DashboardPage() {
  const { user } = useAuthContext();
  const subscription = useSubscriptionStatus();
  const [isEditingName, setIsEditingName] = useState(false);
  const [pendingName, setPendingName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [localDisplayName, setLocalDisplayName] = useState<string | null>(null);
  const { mutate: updateProfile } = useUpdateUserProfile();
  const purchases = useQuery(
    api.subscriptions.getMessageCreditPurchases,
    user ? { limit: 5 } : 'skip'
  );
  const creditsSummary = useQuery(
    api.subscriptions.getMessageCreditsSummary,
    {}
  );
  const subscriptionPayments = useQuery(
    api.subscriptions.getSubscriptionPayments,
    user ? { limit: 5 } : 'skip'
  );

  type RecentPurchaseItem =
    | {
        kind: 'subscription';
        id: string;
        title: string;
        amountSol: number;
        status: 'pending' | 'confirmed' | 'failed' | 'refunded';
        date: number;
      }
    | {
        kind: 'credits';
        id: string;
        title: string;
        amountSol: number;
        status: 'pending' | 'confirmed' | 'failed' | 'refunded';
        date: number;
        totalCredits: number;
      };

  type SubscriptionPaymentLike = {
    id?: string;
    tier?: string;
    amountSol?: number;
    status?: string;
    paymentDate?: number;
  };
  type CreditPurchaseLike = {
    id?: string;
    priceSOL?: number;
    status?: string;
    createdAt?: number;
    standardCredits?: number;
    premiumCredits?: number;
  };

  const recentPurchases: RecentPurchaseItem[] = useMemo(() => {
    const subRows: RecentPurchaseItem[] = (subscriptionPayments || []).map(
      (p: SubscriptionPaymentLike) => ({
        kind: 'subscription',
        id: (p.id as string) ?? '',
        title: `${String(p.tier ?? '').toUpperCase()} plan`,
        amountSol: (p.amountSol as number) ?? 0,
        status: (p.status as RecentPurchaseItem['status']) ?? 'pending',
        date: (p.paymentDate as number) ?? 0,
      })
    );
    const creditRows: RecentPurchaseItem[] = (purchases || []).map(
      (purchase: CreditPurchaseLike) => ({
        kind: 'credits',
        id: (purchase.id as string) ?? '',
        title: 'Message credits',
        amountSol: (purchase.priceSOL as number) ?? 0,
        status: (purchase.status as RecentPurchaseItem['status']) ?? 'pending',
        date: (purchase.createdAt as number) ?? 0,
        totalCredits:
          ((purchase.standardCredits as number) ?? 0) +
          ((purchase.premiumCredits as number) ?? 0),
      })
    );
    return [...subRows, ...creditRows].sort((a, b) => b.date - a.date);
  }, [subscriptionPayments, purchases]);

  // Tier helpers moved into SubscriptionCard

  useEffect(() => {
    setPendingName(user?.displayName ?? '');
    setLocalDisplayName(user?.displayName ?? null);
  }, [user?.displayName]);

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

  // Helper function to render subscription badge
  const renderSubscriptionBadge = (
    currentSubscription: SubscriptionStatus | null
  ) => {
    if (!currentSubscription) {
      return null;
    }
    return (
      <Badge className="hidden sm:inline-flex" variant="outline">
        {formatTierLabel(currentSubscription.tier)}
      </Badge>
    );
  };

  // Helper function to render welcome section
  const renderWelcomeSection = (
    currentDisplayName: string | null,
    currentEditingState: boolean
  ) => {
    if (currentDisplayName && !currentEditingState) {
      return (
        <p className="text-muted-foreground text-sm sm:text-base">
          Welcome,{' '}
          <span className="font-medium text-foreground">
            {currentDisplayName}
          </span>
        </p>
      );
    }

    if (!(currentDisplayName || currentEditingState)) {
      return (
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground text-sm sm:text-base">Welcome</p>
          <Button
            className="h-7 px-2 text-xs"
            onClick={() => setIsEditingName(true)}
            variant="secondary"
          >
            Set Username
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full bg-gradient-to-b from-primary/5 dark:from-primary/10">
      {/* Full-width Header Strip */}
      <div className="w-full p-3 sm:p-4 md:p-6 lg:p-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text font-semibold text-2xl text-transparent sm:text-3xl md:text-4xl">
              Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {renderSubscriptionBadge(subscription)}
            <Button asChild className="flex-1 sm:flex-initial" size="sm">
              <Link href="/chat">
                <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">Open Chat</span>
                <span className="sm:hidden">Chat</span>
              </Link>
            </Button>
            <Button
              asChild
              className="flex-1 sm:flex-initial"
              size="sm"
              variant="secondary"
            >
              <Link href="/agents">
                <Bot className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">Agents</span>
                <span className="sm:hidden">Agents</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Constrained content container */}
      <div className="mx-auto w-full max-w-6xl space-y-4 p-3 sm:space-y-5 sm:p-4 md:space-y-6 md:p-6 lg:space-y-6">
        <div className="flex items-center gap-2">
          {renderWelcomeSection(localDisplayName, isEditingName)}
          {isEditingName && (
            <form
              className="flex w-full max-w-sm items-center gap-2"
              onSubmit={(e) =>
                handleUsernameSubmit(
                  e,
                  pendingName,
                  setSavingName,
                  updateProfile,
                  setLocalDisplayName,
                  setIsEditingName
                )
              }
            >
              <Input
                aria-label="Username"
                className="h-8"
                maxLength={40}
                onChange={(e) => setPendingName(e.target.value)}
                placeholder="Enter a username"
                required
                value={pendingName}
              />
              <Button
                className="h-8"
                disabled={savingName}
                size="sm"
                type="submit"
              >
                Save
              </Button>
              <Button
                className="h-8"
                onClick={() => {
                  setIsEditingName(false);
                  setPendingName(user?.displayName ?? '');
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
            </form>
          )}
        </div>
        {/* Subscription Status Card */}
        <SubscriptionCard />

        {/* Quick Stats - Responsive Grid */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 md:grid-cols-4 md:gap-4">
          {/* Messages Card */}
          <Card className="border-primary/30 bg-primary/10 p-2.5 transition-colors hover:ring-1 hover:ring-primary/30 sm:p-3 md:p-4 dark:bg-primary/15">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-[11px] text-muted-foreground sm:text-xs md:text-sm">
                  Messages
                </h3>
                <p className="font-bold text-lg sm:text-xl md:text-2xl">
                  {subscription?.messagesUsed || 0}
                </p>
              </div>
              <span className="rounded-md bg-gradient-to-br from-primary/30 to-transparent p-1">
                <MessageSquare className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
              </span>
            </div>
            <div className="mt-1.5 sm:mt-2">
              <Progress
                className="h-1 sm:h-1.5"
                value={
                  subscription
                    ? (subscription.messagesUsed / subscription.messagesLimit) *
                      100
                    : 0
                }
              />
            </div>
          </Card>

          {/* Premium Card */}
          <Card className="border-accent/30 bg-accent/10 p-2.5 transition-colors hover:ring-1 hover:ring-accent/30 sm:p-3 md:p-4 dark:bg-accent/15">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-[11px] text-muted-foreground sm:text-xs md:text-sm">
                  Premium
                </h3>
                <p className="font-bold text-lg sm:text-xl md:text-2xl">
                  {subscription?.premiumMessagesUsed || 0}
                </p>
              </div>
              <span className="rounded-md bg-gradient-to-br from-accent/30 to-transparent p-1">
                <Zap className="h-3.5 w-3.5 text-accent sm:h-4 sm:w-4" />
              </span>
            </div>
            <div className="mt-1.5 sm:mt-2">
              <Progress
                className="h-1 sm:h-1.5"
                value={
                  subscription && subscription.premiumMessagesLimit > 0
                    ? (subscription.premiumMessagesUsed /
                        subscription.premiumMessagesLimit) *
                      100
                    : 0
                }
              />
            </div>
          </Card>

          {/* Days Left Card */}
          <Card className="border-secondary/30 bg-secondary/10 p-2.5 transition-colors hover:ring-1 hover:ring-secondary/30 sm:p-3 md:p-4 dark:bg-secondary/15">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-[11px] text-muted-foreground sm:text-xs md:text-sm">
                  Days Left
                </h3>
                <p className="font-bold text-lg sm:text-xl md:text-2xl">
                  {subscription?.daysRemaining || 0}
                </p>
              </div>
              <span className="rounded-md bg-gradient-to-br from-secondary/30 to-transparent p-1">
                <Calendar className="h-3.5 w-3.5 text-secondary-foreground sm:h-4 sm:w-4" />
              </span>
            </div>
          </Card>

          {/* Usage Card */}
          <Card className="border-primary/30 bg-primary/10 p-2.5 transition-colors hover:ring-1 hover:ring-primary/30 sm:p-3 md:p-4 dark:bg-primary/15">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-[11px] text-muted-foreground sm:text-xs md:text-sm">
                  Usage
                </h3>
                <p className="font-bold text-lg sm:text-xl md:text-2xl">
                  {subscription && subscription.messagesLimit > 0
                    ? Math.round(
                        (subscription.messagesUsed /
                          subscription.messagesLimit) *
                          100
                      )
                    : 0}
                  %
                </p>
              </div>
              <span className="rounded-md bg-gradient-to-br from-primary/30 to-transparent p-1">
                <TrendingUp className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
              </span>
            </div>
          </Card>
        </div>

        {/* Purchased Credits Progress */}
        {creditsSummary && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Card className="border-green-600/30 bg-green-600/10 p-2.5 transition-colors hover:ring-1 hover:ring-green-600/30 dark:bg-green-600/15">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-[11px] text-muted-foreground sm:text-xs md:text-sm">
                    Purchased Standard Credits
                  </h3>
                  <p className="font-bold text-lg sm:text-xl md:text-2xl">
                    {creditsSummary.standardRemaining}/
                    {creditsSummary.totalStandardPurchased}
                  </p>
                </div>
              </div>
              <div className="mt-1.5 sm:mt-2">
                <Progress
                  className="h-1 sm:h-1.5"
                  value={
                    creditsSummary.totalStandardPurchased > 0
                      ? (creditsSummary.standardRemaining /
                          creditsSummary.totalStandardPurchased) *
                        100
                      : 0
                  }
                />
              </div>
            </Card>

            <Card className="border-purple-600/30 bg-purple-600/10 p-2.5 transition-colors hover:ring-1 hover:ring-purple-600/30 dark:bg-purple-600/15">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-[11px] text-muted-foreground sm:text-xs md:text-sm">
                    Purchased Premium Credits
                  </h3>
                  <p className="font-bold text-lg sm:text-xl md:text-2xl">
                    {creditsSummary.premiumRemaining}/
                    {creditsSummary.totalPremiumPurchased}
                  </p>
                </div>
              </div>
              <div className="mt-1.5 sm:mt-2">
                <Progress
                  className="h-1 sm:h-1.5"
                  value={
                    creditsSummary.totalPremiumPurchased > 0
                      ? (creditsSummary.premiumRemaining /
                          creditsSummary.totalPremiumPurchased) *
                        100
                      : 0
                  }
                />
              </div>
            </Card>
          </div>
        )}

        {/* Recent Purchases (latest -> oldest) */}
        {recentPurchases.length > 0 && (
          <Card className="p-4 ring-1 ring-primary/10">
            <h3 className="mb-3 font-semibold text-base">Recent Purchases</h3>
            <div className="space-y-2">
              {recentPurchases.map((item) => (
                <div
                  className="flex items-center justify-between border-b pb-2 text-sm last:border-b-0 last:pb-0"
                  key={`${item.kind}-${item.id}`}
                >
                  <div>
                    <div className="font-medium">
                      {item.kind === 'subscription'
                        ? item.title
                        : `${item.title} (${item.totalCredits} credits)`}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {new Date(item.date).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{item.amountSol} SOL</div>
                    <Badge
                      size="sm"
                      variant={getStatusBadgeVariant(item.status)}
                    >
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
