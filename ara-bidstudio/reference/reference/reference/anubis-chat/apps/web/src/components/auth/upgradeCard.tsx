'use client';

import { ArrowRight, Crown, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface UpgradeCardProps {
  featureName: string;
  featureDescription: string;
  tierName: string;
  price: string;
  originalPrice: string;
  color: string;
  bgColor: string;
  borderColor: string;
  className?: string;
  inModal?: boolean;
  showButton?: boolean;
  onClickUpgrade?: () => void;
}

export function UpgradeCard({
  featureName,
  featureDescription,
  tierName,
  price,
  originalPrice,
  color,
  bgColor,
  borderColor,
  className,
  inModal = false,
  showButton = true,
  onClickUpgrade,
}: UpgradeCardProps) {
  return (
    <Card
      className={cn(
        'p-6 text-center',
        bgColor,
        borderColor,
        !inModal && 'mx-auto max-w-md',
        className
      )}
    >
      <div className="mb-4 flex justify-center">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full bg-white/10',
            color
          )}
        >
          <Lock className="h-6 w-6" />
        </div>
      </div>

      <h3 className="mb-2 font-semibold text-lg">
        {featureName} - {tierName} Feature
      </h3>

      <p className="mb-4 text-muted-foreground text-sm">{featureDescription}</p>

      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-center gap-2">
          <span className="font-bold text-xl">{price}</span>
          <span className="text-muted-foreground text-sm line-through">
            {originalPrice}
          </span>
          <span className="rounded bg-orange-500 px-2 py-1 font-semibold text-white text-xs">
            50% Off
          </span>
        </div>
        <p className="text-muted-foreground text-xs">per month</p>
      </div>

      {showButton && (
        <Button className="w-full" onClick={onClickUpgrade} type="button">
          <Crown className="mr-2 h-4 w-4" />
          Upgrade to {tierName}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </Card>
  );
}
