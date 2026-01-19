'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle,
  Coins,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TokenBalance {
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  usdValue?: number;
  change24h?: number;
  icon?: string;
}

interface WalletBalanceWidgetProps {
  address?: string;
  balances?: TokenBalance[];
  totalUsdValue?: number;
  isLoading?: boolean;
  onRefresh?: () => void;
  onSend?: () => void;
  onReceive?: () => void;
  variant?: 'compact' | 'detailed' | 'card';
  showUsdValues?: boolean;
  className?: string;
}

export function WalletBalanceWidget({
  address,
  balances = [],
  totalUsdValue = 0,
  isLoading = false,
  onRefresh,
  onSend,
  onReceive,
  variant = 'card',
  showUsdValues = true,
  className,
}: WalletBalanceWidgetProps) {
  const [hideBalances, setHideBalances] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  const formatBalance = (balance: number, decimals: number) => {
    const value = balance / 10 ** decimals;
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K`;
    }
    if (value < 0.01) {
      return value.toExponential(2);
    }
    return value.toFixed(4);
  };

  const formatUsd = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const mainToken = balances?.find((b) => b.symbol === 'SOL') || balances?.[0];
  const otherTokens = balances?.filter((b) => b.symbol !== 'SOL') || [];

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          {isLoading ? (
            <Skeleton className="h-4 w-20" />
          ) : (
            <span className="font-medium">
              {hideBalances ? '••••••' : formatUsd(totalUsdValue)}
            </span>
          )}
        </div>

        {address && (
          <Badge className="font-mono" variant="secondary">
            {formatAddress(address)}
          </Badge>
        )}

        <div className="flex items-center gap-1">
          <Button
            aria-label="Toggle balance visibility"
            className="h-7 w-7"
            onClick={() => setHideBalances(!hideBalances)}
            size="icon"
            type="button"
            variant="ghost"
          >
            {hideBalances ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </Button>

          {onRefresh && (
            <Button
              aria-label="Refresh balances"
              className="h-7 w-7"
              disabled={isRefreshing}
              onClick={handleRefresh}
              size="icon"
              type="button"
              variant="ghost"
            >
              <RefreshCw
                className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')}
              />
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold">Wallet Balance</span>
          </div>

          <div className="flex items-center gap-2">
            {address && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleCopyAddress}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      {copied ? (
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="mr-2 h-4 w-4" />
                      )}
                      {formatAddress(address)}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {copied ? 'Copied!' : 'Click to copy full address'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <Button
              aria-label="Toggle balance visibility"
              onClick={() => setHideBalances(!hideBalances)}
              size="icon"
              type="button"
              variant="ghost"
            >
              {hideBalances ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Total Value */}
        <div className="py-4 text-center">
          {isLoading ? (
            <Skeleton className="mx-auto h-10 w-32" />
          ) : (
            <div>
              <div className="font-bold text-3xl">
                {hideBalances ? '••••••' : formatUsd(totalUsdValue)}
              </div>
              <div className="mt-1 text-muted-foreground text-sm">
                Total Portfolio Value
              </div>
            </div>
          )}
        </div>

        {/* Token List */}
        <div className="space-y-2">
          {isLoading ? (
            <>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </>
          ) : (
            <AnimatePresence>
              {balances.map((token, index) => (
                <motion.div
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
                  initial={{ opacity: 0, x: -20 }}
                  key={token.symbol}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-center gap-3">
                    {token.icon ? (
                      <Image
                        alt={token.symbol}
                        className="rounded-full"
                        height={32}
                        src={token.icon}
                        width={32}
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <Coins className="h-4 w-4" />
                      </div>
                    )}

                    <div>
                      <div className="font-medium">{token.symbol}</div>
                      <div className="text-muted-foreground text-xs">
                        {token.name}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-medium">
                      {hideBalances
                        ? '•••'
                        : formatBalance(token.balance, token.decimals)}
                    </div>
                    {showUsdValues && token.usdValue !== undefined && (
                      <div className="text-muted-foreground text-xs">
                        {hideBalances ? '•••' : formatUsd(token.usdValue)}
                      </div>
                    )}
                  </div>

                  {token.change24h !== undefined && (
                    <div
                      className={cn(
                        'flex items-center gap-1 text-sm',
                        token.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                      )}
                    >
                      {token.change24h >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {Math.abs(token.change24h).toFixed(2)}%
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {onSend && (
            <Button className="flex-1" onClick={onSend} type="button">
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Send
            </Button>
          )}
          {onReceive && (
            <Button
              className="flex-1"
              onClick={onReceive}
              type="button"
              variant="outline"
            >
              <ArrowDownRight className="mr-2 h-4 w-4" />
              Receive
            </Button>
          )}
          {onRefresh && (
            <Button
              aria-label="Refresh balances"
              disabled={isRefreshing}
              onClick={handleRefresh}
              size="icon"
              type="button"
              variant="outline"
            >
              <RefreshCw
                className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
              />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Card variant (default)
  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet
          </CardTitle>

          <div className="flex items-center gap-1">
            <Button
              aria-label="Toggle balance visibility"
              className="h-8 w-8"
              onClick={() => setHideBalances(!hideBalances)}
              size="icon"
              type="button"
              variant="ghost"
            >
              {hideBalances ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>

            {onRefresh && (
              <Button
                aria-label="Refresh balances"
                className="h-8 w-8"
                disabled={isRefreshing}
                onClick={handleRefresh}
                size="icon"
                type="button"
                variant="ghost"
              >
                <RefreshCw
                  className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
                />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Address */}
        {address && (
          <div className="flex items-center justify-between rounded-lg bg-muted p-2">
            <span className="text-muted-foreground text-sm">Address</span>
            <Button
              className="h-7 font-mono"
              onClick={handleCopyAddress}
              size="sm"
              type="button"
              variant="ghost"
            >
              {copied ? (
                <CheckCircle className="mr-2 h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="mr-2 h-3.5 w-3.5" />
              )}
              {formatAddress(address)}
            </Button>
          </div>
        )}

        {/* Main Balance */}
        {mainToken && (
          <div className="py-2 text-center">
            {isLoading ? (
              <Skeleton className="mx-auto h-8 w-24" />
            ) : (
              <>
                <div className="font-bold text-2xl">
                  {hideBalances
                    ? '••••••'
                    : `${formatBalance(mainToken.balance, mainToken.decimals)} ${mainToken.symbol}`}
                </div>
                {showUsdValues && mainToken.usdValue !== undefined && (
                  <div className="text-muted-foreground text-sm">
                    {hideBalances ? '••••' : formatUsd(mainToken.usdValue)}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Other Tokens */}
        {otherTokens.length > 0 && (
          <div className="space-y-2">
            <div className="font-medium text-muted-foreground text-xs">
              OTHER TOKENS
            </div>
            {otherTokens.slice(0, 3).map((token) => (
              <div
                className="flex items-center justify-between text-sm"
                key={token.symbol}
              >
                <span className="text-muted-foreground">{token.symbol}</span>
                <span className="font-medium">
                  {hideBalances
                    ? '•••'
                    : formatBalance(token.balance, token.decimals)}
                </span>
              </div>
            ))}
            {otherTokens.length > 3 && (
              <Button
                className="w-full"
                size="sm"
                type="button"
                variant="ghost"
              >
                View all ({otherTokens.length} tokens)
              </Button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onSend && (
            <Button className="flex-1" onClick={onSend} size="sm" type="button">
              <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
              Send
            </Button>
          )}
          {onReceive && (
            <Button
              className="flex-1"
              onClick={onReceive}
              size="sm"
              type="button"
              variant="outline"
            >
              <ArrowDownRight className="mr-1 h-3.5 w-3.5" />
              Receive
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default WalletBalanceWidget;
