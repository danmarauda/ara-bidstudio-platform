'use client';

import { DollarSign, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHeliusPrice } from '@/hooks/use-helius-price';
import { cn } from '@/lib/utils';

interface TokenPriceItemProps {
  symbol: string;
  name: string;
}

function TokenPriceItem({ symbol, name }: TokenPriceItemProps) {
  const { price, priceChange, formatUsd, formatPriceChange, isLoading, error } =
    useHeliusPrice(symbol);

  if (isLoading) {
    return (
      <div className="flex animate-pulse items-center justify-between rounded-lg bg-muted/50 p-3">
        <div className="space-y-1">
          <div className="h-4 w-16 rounded bg-muted" />
          <div className="h-3 w-24 rounded bg-muted" />
        </div>
        <div className="h-6 w-20 rounded bg-muted" />
      </div>
    );
  }

  if (error || price === null) {
    return (
      <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
        <div>
          <div className="font-medium">{symbol}</div>
          <div className="text-muted-foreground text-xs">{name}</div>
        </div>
        <div className="text-muted-foreground text-sm">--</div>
      </div>
    );
  }

  const isPositive = priceChange && priceChange >= 0;

  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted/70">
      <div>
        <div className="flex items-center gap-1 font-medium">
          {symbol}
          {priceChange !== null &&
            (isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600" />
            ))}
        </div>
        <div className="text-muted-foreground text-xs">{name}</div>
      </div>
      <div className="text-right">
        <div className="font-medium">{formatUsd(price)}</div>
        {priceChange !== null && (
          <div
            className={cn(
              'text-xs',
              isPositive ? 'text-green-600' : 'text-red-600'
            )}
          >
            {formatPriceChange()}
          </div>
        )}
      </div>
    </div>
  );
}

export function TokenPricesWidget({ className }: { className?: string }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const tokens = [
    { symbol: 'SOL', name: 'Solana' },
    { symbol: 'USDC', name: 'USD Coin' },
    { symbol: 'USDT', name: 'Tether' },
  ];

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 font-medium text-sm">
          <DollarSign className="h-4 w-4" />
          Token Prices
        </CardTitle>
        <Button
          className="h-8 w-8"
          onClick={handleRefresh}
          size="icon"
          variant="ghost"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2" key={refreshKey}>
        {tokens.map((token) => (
          <TokenPriceItem
            key={token.symbol}
            name={token.name}
            symbol={token.symbol}
          />
        ))}
        <div className="border-t pt-2">
          <p className="text-center text-muted-foreground text-xs">
            Powered by Helius • Cached for performance
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
