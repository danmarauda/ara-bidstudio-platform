'use client';

import { Wallet } from 'lucide-react';
import { useHeliusPrice } from '@/hooks/use-helius-price';
import { cn } from '@/lib/utils';

interface WalletBalanceDisplayProps {
  balance: number; // Balance in SOL
  className?: string;
  showUsd?: boolean;
  compact?: boolean;
}

export function WalletBalanceDisplay({
  balance,
  className,
  showUsd = true,
  compact = false,
}: WalletBalanceDisplayProps) {
  const {
    tokenToUsd,
    formatUsd,
    price,
    priceChange,
    formatPriceChange,
    cachedAt,
  } = useHeliusPrice('SOL');

  const usdValue = tokenToUsd(balance);

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Wallet className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{balance.toFixed(4)} SOL</span>
        {showUsd && usdValue !== null && (
          <span className="text-muted-foreground text-sm">
            ({formatUsd(usdValue)})
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <Wallet className="h-5 w-5 text-primary" />
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-2xl">{balance.toFixed(4)}</span>
            <span className="text-muted-foreground">SOL</span>
          </div>
          {showUsd && usdValue !== null && (
            <div className="text-lg text-muted-foreground">
              ≈ {formatUsd(usdValue)} USD
            </div>
          )}
        </div>
      </div>

      {showUsd && price !== null && (
        <div className="space-y-1">
          <div className="text-muted-foreground text-sm">
            <span>1 SOL = {formatUsd(price)}</span>
            {priceChange !== null && (
              <span
                className={cn(
                  'ml-2',
                  priceChange >= 0 ? 'text-green-600' : 'text-red-600'
                )}
              >
                {formatPriceChange()}
              </span>
            )}
          </div>
          {cachedAt && (
            <div className="text-muted-foreground/70 text-xs">
              Price from Helius • Cached{' '}
              {new Date(cachedAt).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
