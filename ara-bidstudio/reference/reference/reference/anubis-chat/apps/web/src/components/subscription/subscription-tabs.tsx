'use client';

import { CreditCard, Crown, Plus } from 'lucide-react';
import { useState } from 'react';
import MessageCreditsModal from '@/components/auth/messageCreditsModal';
import { UpgradeModal } from '@/components/auth/upgrade-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUpgradeModal } from '@/hooks/use-upgrade-modal';
import { cn } from '@/lib/utils';

interface SubscriptionTabsProps {
  // Props from existing subscription page
  subscription: any;
  limits: any;
  selectedPlan: 'free' | 'pro' | 'pro_plus';
  onSelectPlan: (plan: 'free' | 'pro' | 'pro_plus') => void;
  preview: {
    standardPreview: { id: string; name: string }[];
    premiumPreview: { id: string; name: string }[];
    standardTotal: number;
    premiumTotal: number;
  };
}

const MESSAGE_CREDIT_PACK = {
  standardCredits: 150,
  premiumCredits: 25,
  priceSOL: 0.025,
  priceUSD: 3.5,
};

export function SubscriptionTabs({
  subscription,
  limits,
  selectedPlan,
  onSelectPlan,
  preview,
}: SubscriptionTabsProps) {
  const [activeTab, setActiveTab] = useState('subscriptions');
  const [upgradeInitialTab, setUpgradeInitialTab] = useState<
    'subscription' | 'credits'
  >('subscription');
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const { isOpen, openModal, closeModal, suggestedTier } = useUpgradeModal();

  const formatTierLabel = (tier: string): string => {
    switch (tier) {
      case 'pro_plus':
        return 'Pro+';
      case 'pro':
        return 'Pro';
      case 'free':
        return 'Free';
      default:
        return tier;
    }
  };

  const renderSubscriptionTab = () => (
    <div className="space-y-6">
      {/* Current subscription status */}
      <Card className="p-4 ring-1 ring-primary/10 transition hover:ring-primary/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'rounded-lg p-2',
                subscription.tier === 'pro_plus'
                  ? 'bg-purple-100 dark:bg-purple-900'
                  : subscription.tier === 'pro'
                    ? 'bg-blue-100 dark:bg-blue-900'
                    : 'bg-slate-100 dark:bg-slate-800'
              )}
            >
              <Crown
                className={cn(
                  'h-5 w-5',
                  subscription.tier === 'pro_plus'
                    ? 'text-purple-600 dark:text-purple-400'
                    : subscription.tier === 'pro'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400'
                )}
              />
            </div>
            <div>
              <h3 className="font-semibold text-base sm:text-lg">
                {formatTierLabel(subscription.tier)} Plan
              </h3>
              <p className="text-muted-foreground text-xs leading-snug sm:text-sm">
                {subscription.tier === 'free' &&
                  'Basic features with limited access'}
                {subscription.tier === 'pro' &&
                  'Enhanced features with premium models'}
                {subscription.tier === 'pro_plus' &&
                  'Full access including premium models'}
              </p>
            </div>
          </div>
          <Button
            onClick={() =>
              openModal({
                tier: subscription.tier === 'pro' ? 'pro_plus' : 'pro',
                trigger: 'manual',
              })
            }
            size="sm"
            variant={subscription.tier === 'pro_plus' ? 'outline' : 'default'}
          >
            {subscription.tier === 'free' && 'Upgrade'}
            {subscription.tier === 'pro' && 'Upgrade to Pro+'}
            {subscription.tier === 'pro_plus' && 'Manage Billing'}
          </Button>
        </div>
      </Card>

      {/* Plans comparison */}
      <Card className="p-4 ring-1 ring-border/50 transition hover:ring-primary/20 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-base sm:text-lg">
            Available Plans
          </h3>
          {(subscription.tier === 'free' || subscription.tier === 'pro') && (
            <Button
              onClick={() => openModal({ tier: 'pro_plus', trigger: 'manual' })}
              size="sm"
            >
              Upgrade to Pro+
            </Button>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:grid-cols-3">
            {/* Free Plan */}
            <div>
              <input
                checked={selectedPlan === 'free'}
                className="sr-only"
                id="plan-free"
                name="plan"
                onChange={() => onSelectPlan('free')}
                type="radio"
              />
              <label
                className={cn(
                  'group block h-full min-h-[10rem] cursor-pointer rounded-xl border p-4 transition-all',
                  selectedPlan === 'free'
                    ? 'border-primary/40 bg-gradient-to-br from-primary/10 to-transparent ring-1 ring-primary/40'
                    : 'border-border hover:shadow-sm hover:ring-1 hover:ring-primary/20'
                )}
                htmlFor="plan-free"
              >
                <div className="flex h-full flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="font-semibold tracking-tight">Free</div>
                      {subscription.tier === 'free' && (
                        <div className="rounded bg-primary/10 px-2 py-1 font-medium text-primary text-xs">
                          Current
                        </div>
                      )}
                    </div>
                    <div className="font-semibold text-foreground text-sm">
                      $0
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Forever
                    </div>
                  </div>
                </div>
              </label>
            </div>

            {/* Pro Plan */}
            <div>
              <input
                checked={selectedPlan === 'pro'}
                className="sr-only"
                id="plan-pro"
                name="plan"
                onChange={() => onSelectPlan('pro')}
                type="radio"
              />
              <label
                className={cn(
                  'group block h-full min-h-[10rem] cursor-pointer rounded-xl border p-4 transition-all',
                  selectedPlan === 'pro'
                    ? 'border-primary/40 bg-gradient-to-br from-primary/10 to-transparent ring-1 ring-primary/40'
                    : 'border-border hover:shadow-sm hover:ring-1 hover:ring-primary/20'
                )}
                htmlFor="plan-pro"
              >
                <div className="flex h-full flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 text-blue-500">⚡</div>
                        <div className="font-semibold tracking-tight">Pro</div>
                      </div>
                      {subscription.tier === 'pro' && (
                        <div className="rounded bg-primary/10 px-2 py-1 font-medium text-primary text-xs">
                          Current
                        </div>
                      )}
                    </div>
                    <div className="font-semibold text-foreground text-sm">
                      0.05 SOL
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      per month
                    </div>
                  </div>
                </div>
              </label>
            </div>

            {/* Pro+ Plan */}
            <div>
              <input
                checked={selectedPlan === 'pro_plus'}
                className="sr-only"
                id="plan-pro-plus"
                name="plan"
                onChange={() => onSelectPlan('pro_plus')}
                type="radio"
              />
              <label
                className={cn(
                  'group block h-full min-h-[10rem] cursor-pointer rounded-xl border p-4 transition-all',
                  selectedPlan === 'pro_plus'
                    ? 'border-primary/40 bg-gradient-to-br from-primary/10 to-transparent ring-1 ring-primary/40'
                    : 'border-border hover:shadow-sm hover:ring-1 hover:ring-primary/20'
                )}
                htmlFor="plan-pro-plus"
              >
                <div className="flex h-full flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-purple-500" />
                        <div className="font-semibold tracking-tight">Pro+</div>
                      </div>
                      {(subscription.tier === 'pro_plus' ||
                        subscription.tier === 'admin') && (
                        <div className="rounded bg-primary/10 px-2 py-1 font-medium text-primary text-xs">
                          Current
                        </div>
                      )}
                    </div>
                    <div className="font-semibold text-foreground text-sm">
                      0.1 SOL
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      per month
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Features preview */}
          <div>
            <h4 className="mb-2 font-medium">
              Features for{' '}
              {selectedPlan === 'pro_plus'
                ? 'Pro+'
                : selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}
            </h4>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] sm:text-xs">
              <div className="rounded-xl border p-2">
                <div className="text-muted-foreground">Messages/month</div>
                <div className="font-medium">
                  {selectedPlan === 'free' && '50'}
                  {selectedPlan === 'pro' && '500'}
                  {selectedPlan === 'pro_plus' && '1,000'}
                </div>
              </div>
              <div className="rounded-xl border p-2">
                <div className="text-muted-foreground">Premium messages</div>
                <div className="font-medium">
                  {selectedPlan === 'free' && '—'}
                  {selectedPlan === 'pro' && '100'}
                  {selectedPlan === 'pro_plus' && '300'}
                </div>
              </div>
              <div className="rounded-xl border p-2">
                <div className="text-muted-foreground">Standard models</div>
                <div className="font-medium">{preview.standardTotal}</div>
              </div>
              <div className="rounded-xl border p-2">
                <div className="text-muted-foreground">Premium models</div>
                <div className="font-medium">{preview.premiumTotal}</div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderCreditsTab = () => (
    <div className="space-y-6">
      {/* Current credits balance */}
      <Card className="p-4 ring-1 ring-primary/10 transition hover:ring-primary/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900">
              <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-base sm:text-lg">
                Current Credits
              </h3>
              <p className="text-muted-foreground text-xs leading-snug sm:text-sm">
                {subscription.messageCredits || 0} Standard •{' '}
                {subscription.premiumMessageCredits || 0} Premium
              </p>
            </div>
          </div>
          <Button
            className="bg-gradient-to-r from-green-500 to-green-600"
            onClick={() => {
              // Open the Upgrade modal directly on the credits tab
              setUpgradeInitialTab('credits');
              openModal({
                tier: subscription.tier === 'free' ? 'pro' : 'pro_plus',
                trigger: 'manual',
              });
            }}
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Buy Credits
          </Button>
        </div>
      </Card>

      {/* Credit pack selection */}
      <Card className="p-4 ring-1 ring-border/50 transition hover:ring-primary/20 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-base sm:text-lg">
            Message Credit Pack
          </h3>
          <Badge className="bg-green-100 text-green-800">Best Value</Badge>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:grid-cols-3">
            {/* Pack details */}
            <div>
              <div className="group block h-full min-h-[8rem] cursor-default rounded-xl border border-green-200 bg-gradient-to-br from-green-50/50 to-transparent p-4 ring-1 ring-green-200/40 transition-all">
                <div className="flex h-full flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="font-semibold tracking-tight">
                        Credits
                      </div>
                    </div>
                    <div className="font-semibold text-foreground text-sm">
                      {MESSAGE_CREDIT_PACK.standardCredits +
                        MESSAGE_CREDIT_PACK.premiumCredits}{' '}
                      total
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {MESSAGE_CREDIT_PACK.standardCredits} standard +{' '}
                      {MESSAGE_CREDIT_PACK.premiumCredits} premium
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <div className="group block h-full min-h-[8rem] cursor-default rounded-xl border border-green-200 bg-gradient-to-br from-green-50/50 to-transparent p-4 ring-1 ring-green-200/40 transition-all">
                <div className="flex h-full flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="font-semibold tracking-tight">Price</div>
                    </div>
                    <div className="font-semibold text-foreground text-sm">
                      {MESSAGE_CREDIT_PACK.priceSOL} SOL
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      ≈ ${MESSAGE_CREDIT_PACK.priceUSD} USD
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div>
              <div className="group block h-full min-h-[8rem] cursor-default rounded-xl border border-green-200 bg-gradient-to-br from-green-50/50 to-transparent p-4 ring-1 ring-green-200/40 transition-all">
                <div className="flex h-full flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="font-semibold tracking-tight">
                        Benefits
                      </div>
                    </div>
                    <div className="font-semibold text-foreground text-sm">
                      Never expire
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Stack with plan
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features & How it works */}
          <div>
            <h4 className="mb-2 font-medium">How Message Consumption Works</h4>
            <div className="mt-3 grid grid-cols-1 gap-2 text-[11px] sm:text-xs">
              <div className="rounded-xl border p-2">
                <div className="text-muted-foreground">
                  1. Plan messages first
                </div>
                <div className="font-medium">
                  50 Free • 500 Pro • 1,000 Pro+
                </div>
              </div>
              <div className="rounded-xl border p-2">
                <div className="text-muted-foreground">
                  2. Credits when needed
                </div>
                <div className="font-medium">Auto-used after plan</div>
              </div>
              <div className="rounded-xl border p-2">
                <div className="text-muted-foreground">
                  3. Premium same pattern
                </div>
                <div className="font-medium">Plan premium → credits</div>
              </div>
              <div className="rounded-xl border p-2">
                <div className="text-muted-foreground">4. Referral support</div>
                <div className="font-medium">Earn commissions</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Removed redundant bottom purchase button per design update */}
    </div>
  );

  return (
    <>
      <Tabs className="w-full" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger
            className="flex items-center space-x-1 sm:space-x-2"
            value="subscriptions"
          >
            <Crown className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Subscription Plans</span>
            <span className="sm:hidden">Plans</span>
          </TabsTrigger>
          <TabsTrigger
            className="flex items-center space-x-1 sm:space-x-2"
            value="credits"
          >
            <CreditCard className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Message Credits</span>
            <span className="sm:hidden">Credits</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent className="mt-6" value="subscriptions">
          {renderSubscriptionTab()}
        </TabsContent>

        <TabsContent className="mt-6" value="credits">
          {renderCreditsTab()}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <UpgradeModal
        initialTab={upgradeInitialTab}
        isOpen={isOpen}
        onClose={closeModal}
        suggestedTier={suggestedTier}
        trigger="manual"
      />

      <MessageCreditsModal
        isOpen={isCreditsModalOpen}
        onClose={() => setIsCreditsModalOpen(false)}
      />
    </>
  );
}

export default SubscriptionTabs;
