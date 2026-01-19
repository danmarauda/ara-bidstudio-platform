import { cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import type { LoadingStatesProps } from '@/lib/types/components';
import { cn } from '@/lib/utils';

const loadingVariants = cva('flex items-center justify-center', {
  variants: {
    size: {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const spinnerVariants = cva('animate-spin', {
  variants: {
    size: {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const skeletonVariants = cva(
  'animate-pulse rounded bg-gray-200 dark:bg-gray-800',
  {
    variants: {
      size: {
        sm: 'h-4',
        md: 'h-6',
        lg: 'h-8',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

/**
 * LoadingStates component - Various loading state indicators
 */
export function LoadingStates({
  variant = 'spinner',
  size = 'md',
  text,
  className,
  children,
}: LoadingStatesProps) {
  const renderLoadingIndicator = () => {
    switch (variant) {
      case 'spinner':
        return (
          <Loader2
            className={cn(
              spinnerVariants({ size }),
              'text-blue-600 dark:text-blue-400'
            )}
          />
        );

      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                className={cn(
                  'animate-bounce rounded-full bg-blue-600 dark:bg-blue-400',
                  size === 'sm' && 'h-1 w-1',
                  size === 'md' && 'h-1.5 w-1.5',
                  size === 'lg' && 'h-2 w-2'
                )}
                key={i}
                style={{
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <div
            className={cn(
              'animate-pulse rounded-full bg-blue-600 dark:bg-blue-400',
              size === 'sm' && 'h-4 w-4',
              size === 'md' && 'h-6 w-6',
              size === 'lg' && 'h-8 w-8'
            )}
          />
        );

      case 'skeleton':
        return (
          <div className="w-full max-w-sm space-y-2">
            <div className={cn(skeletonVariants({ size }), 'w-3/4')} />
            <div className={cn(skeletonVariants({ size }), 'w-1/2')} />
            <div className={cn(skeletonVariants({ size }), 'w-2/3')} />
          </div>
        );

      default:
        return (
          <Loader2
            className={cn(
              spinnerVariants({ size }),
              'text-blue-600 dark:text-blue-400'
            )}
          />
        );
    }
  };

  return (
    <div
      className={cn(loadingVariants({ size }), 'flex-col space-y-2', className)}
    >
      {renderLoadingIndicator()}
      {text && (
        <p
          className={cn(
            'text-center text-gray-600 dark:text-gray-400',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-base'
          )}
        >
          {text}
        </p>
      )}
      {children}
    </div>
  );
}

export default LoadingStates;
