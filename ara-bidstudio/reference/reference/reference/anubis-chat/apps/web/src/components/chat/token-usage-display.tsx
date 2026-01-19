'use client';

import { DollarSign, MessageSquare, TrendingUp, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface TokenUsage {
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalCachedTokens: number;
  totalEstimatedCost: number;
  messageCount: number;
}

interface TokenUsageDisplayProps {
  tokenUsage?: TokenUsage;
  className?: string;
  showDetails?: boolean;
}

export function TokenUsageDisplay({
  tokenUsage,
  className,
  showDetails = true,
}: TokenUsageDisplayProps) {
  if (!tokenUsage) {
    return null;
  }

  const cacheSavingsPercent =
    tokenUsage.totalCachedTokens > 0
      ? Math.round(
          (tokenUsage.totalCachedTokens / (tokenUsage.totalPromptTokens || 1)) *
            100
        )
      : 0;

  const avgTokensPerMessage =
    tokenUsage.messageCount > 0
      ? Math.round(tokenUsage.totalTokens / tokenUsage.messageCount)
      : 0;

  const formatCost = (cost: number) => {
    if (cost === 0) return 'Free';
    if (cost < 0.01) return '<$0.01';
    return `$${cost.toFixed(3)}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card className={cn('space-y-3 p-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-medium text-sm">
          <Zap className="h-4 w-4" />
          Token Usage
        </h3>
        <span className="text-muted-foreground text-xs">
          {tokenUsage.messageCount} messages
        </span>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground text-xs">Total Tokens</span>
          </div>
          <p className="font-medium text-sm">
            {formatNumber(tokenUsage.totalTokens)}
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground text-xs">Est. Cost</span>
          </div>
          <p className="font-medium text-sm">
            {formatCost(tokenUsage.totalEstimatedCost)}
          </p>
        </div>
      </div>

      {showDetails && (
        <>
          {/* Cache Savings */}
          {cacheSavingsPercent > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Cache Savings</span>
                <span className="font-medium text-green-600">
                  {cacheSavingsPercent}%
                </span>
              </div>
              <Progress className="h-1.5" value={cacheSavingsPercent} />
              <p className="text-muted-foreground text-xs">
                {formatNumber(tokenUsage.totalCachedTokens)} tokens cached
              </p>
            </div>
          )}

          {/* Detailed Breakdown */}
          <div className="space-y-2 border-t pt-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Prompt Tokens</span>
              <span>{formatNumber(tokenUsage.totalPromptTokens)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Completion Tokens</span>
              <span>{formatNumber(tokenUsage.totalCompletionTokens)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Avg per Message</span>
              <span>{formatNumber(avgTokensPerMessage)}</span>
            </div>
          </div>

          {/* Efficiency Indicator */}
          {tokenUsage.messageCount > 5 && (
            <div className="border-t pt-2">
              <div className="flex items-center gap-2 text-xs">
                <TrendingUp
                  className={cn(
                    'h-3 w-3',
                    avgTokensPerMessage < 500
                      ? 'text-green-600'
                      : avgTokensPerMessage < 1000
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  )}
                />
                <span className="text-muted-foreground">
                  {avgTokensPerMessage < 500
                    ? 'Excellent efficiency'
                    : avgTokensPerMessage < 1000
                      ? 'Good efficiency'
                      : 'Consider shorter context'}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
