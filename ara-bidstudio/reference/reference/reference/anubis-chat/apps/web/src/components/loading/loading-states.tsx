import type React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
        sizeClasses[size],
        className
      )}
      data-testid="loading-spinner"
    />
  );
};

interface LoadingSkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  variant?: 'rectangular' | 'circular';
  lines?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className,
  width = 'w-full',
  height = 'h-4',
  variant = 'rectangular',
  lines,
}) => {
  // If lines prop is provided, render multiple skeleton lines
  if (lines && lines > 1) {
    return (
      <div
        className={cn('space-y-2', className)}
        data-testid="loading-skeleton-container"
      >
        {Array.from({ length: lines }, (_, i) => (
          <div
            className={cn(
              'animate-pulse bg-gray-200',
              height,
              width,
              variant === 'circular' ? 'rounded-full' : 'rounded'
            )}
            data-testid="loading-skeleton"
            key={i}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200',
        height,
        width,
        variant === 'circular' ? 'rounded-full' : 'rounded',
        className
      )}
      data-testid="loading-skeleton"
    />
  );
};

interface QueryStateIndicatorProps {
  isLoading?: boolean;
  hasError?: boolean;
  isEmpty?: boolean;
  loadingText?: string;
  errorText?: string;
  emptyText?: string;
  children?: React.ReactNode;
}

export const QueryStateIndicator: React.FC<QueryStateIndicatorProps> = ({
  isLoading = false,
  hasError = false,
  isEmpty = false,
  loadingText = 'Loading...',
  errorText = 'Error occurred',
  emptyText = 'No data',
  children,
}) => {
  if (hasError) {
    return (
      <div
        className="rounded bg-red-50 p-4 text-red-600"
        data-testid="query-error"
      >
        {errorText}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center p-4"
        data-testid="query-loading"
      >
        <LoadingSpinner />
        <span className="ml-2">{loadingText}</span>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="p-4 text-center text-gray-500" data-testid="query-empty">
        {emptyText}
      </div>
    );
  }

  return <>{children}</>;
};
