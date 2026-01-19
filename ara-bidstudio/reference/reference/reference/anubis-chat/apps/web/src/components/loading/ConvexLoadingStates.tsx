/**
 * Loading state components for Convex operations
 * Provides consistent loading UX across the application
 */

'use client';

import { Loader2, Wifi, WifiOff } from 'lucide-react';
import type React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// =============================================================================
// Basic Loading Components
// =============================================================================

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  text,
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      {text && <span className="text-muted-foreground text-sm">{text}</span>}
    </div>
  );
}

export interface LoadingDotsProps {
  className?: string;
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((index) => (
        <div
          className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground"
          key={index}
          style={{
            animationDelay: `${index * 150}ms`,
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  );
}

// =============================================================================
// Skeleton Loading Components
// =============================================================================

export function ChatListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <Card className="w-full" key={index}>
          <CardHeader className="pb-2">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="mt-3 flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function MessageListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          className={cn(
            'flex gap-3',
            index % 2 === 0 ? '' : 'flex-row-reverse'
          )}
          key={index}
        >
          <Skeleton className="h-8 w-8 flex-shrink-0 rounded-full" />
          <div className="max-w-[70%] flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function UserProfileSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton className="mb-2 h-4 w-16" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div>
            <Skeleton className="mb-2 h-4 w-20" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
        <div>
          <Skeleton className="mb-2 h-4 w-24" />
          <Skeleton className="h-20 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DocumentListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          className="flex items-center gap-3 rounded-lg border p-3"
          key={index}
        >
          <Skeleton className="h-8 w-8 rounded" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Connection Status Components
// =============================================================================

export interface ConnectionStatusProps {
  isConnected: boolean;
  className?: string;
}

export function ConnectionStatus({
  isConnected,
  className,
}: ConnectionStatusProps) {
  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      {isConnected ? (
        <>
          <Wifi className="h-4 w-4 text-green-500" />
          <span className="text-green-600">Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-red-500" />
          <span className="text-red-600">Disconnected</span>
        </>
      )}
    </div>
  );
}

// =============================================================================
// Query State Indicators
// =============================================================================

export interface QueryStateIndicatorProps {
  isLoading: boolean;
  hasError: boolean;
  isEmpty?: boolean;
  loadingText?: string;
  errorText?: string;
  emptyText?: string;
  className?: string;
}

export function QueryStateIndicator({
  isLoading,
  hasError,
  isEmpty = false,
  loadingText = 'Loading...',
  errorText = 'Failed to load data',
  emptyText = 'No data available',
  className,
}: QueryStateIndicatorProps) {
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <LoadingSpinner text={loadingText} />
      </div>
    );
  }

  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center py-8 text-red-500',
          className
        )}
      >
        <span className="text-sm">{errorText}</span>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div
        className={cn(
          'flex items-center justify-center py-8 text-muted-foreground',
          className
        )}
      >
        <span className="text-sm">{emptyText}</span>
      </div>
    );
  }

  return null;
}

// =============================================================================
// Optimistic Update Indicators
// =============================================================================

export interface OptimisticUpdateIndicatorProps {
  isOptimistic: boolean;
  children: React.ReactNode;
  className?: string;
}

export function OptimisticUpdateIndicator({
  isOptimistic,
  children,
  className,
}: OptimisticUpdateIndicatorProps) {
  return (
    <div
      className={cn(
        'relative',
        isOptimistic && 'pointer-events-none opacity-70',
        className
      )}
    >
      {children}
      {isOptimistic && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-lg bg-background/80 p-2 backdrop-blur-sm">
            <LoadingSpinner size="sm" />
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Progressive Loading Component
// =============================================================================

export interface ProgressiveLoadingProps {
  stages: Array<{
    name: string;
    completed: boolean;
    duration?: number;
  }>;
  className?: string;
}

export function ProgressiveLoading({
  stages,
  className,
}: ProgressiveLoadingProps) {
  const completedStages = stages.filter((stage) => stage.completed).length;
  const progress = (completedStages / stages.length) * 100;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <div className="h-2 flex-1 rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all duration-300 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-muted-foreground text-sm">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="space-y-1">
        {stages.map((stage, index) => (
          <div className="flex items-center gap-2 text-sm" key={stage.name}>
            {stage.completed ? (
              <div className="h-2 w-2 rounded-full bg-green-500" />
            ) : index === completedStages ? (
              <LoadingSpinner size="sm" />
            ) : (
              <div className="h-2 w-2 rounded-full bg-muted" />
            )}
            <span
              className={cn(
                stage.completed ? 'text-green-600' : 'text-muted-foreground'
              )}
            >
              {stage.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
