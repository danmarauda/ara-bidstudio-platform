import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const progressVariants = cva(
  'relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800',
  {
    variants: {
      size: {
        sm: 'h-1.5',
        md: 'h-2',
        lg: 'h-3',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const progressBarVariants = cva(
  'h-full w-full flex-1 rounded-full transition-all duration-300 ease-in-out',
  {
    variants: {
      variant: {
        default: 'bg-blue-600 dark:bg-blue-500',
        success: 'bg-green-600 dark:bg-green-500',
        warning: 'bg-yellow-600 dark:bg-yellow-500',
        error: 'bg-red-600 dark:bg-red-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants>,
    VariantProps<typeof progressBarVariants> {
  value: number;
  max?: number;
  showValue?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    { className, value, max = 100, showValue = false, size, variant, ...props },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div className="space-y-2">
        <div
          className={cn(progressVariants({ size }), className)}
          ref={ref}
          {...props}
        >
          <div
            className={cn(progressBarVariants({ variant }))}
            style={{ transform: `translateX(-${100 - percentage}%)` }}
          />
        </div>
        {showValue && (
          <div className="flex justify-between text-gray-600 text-sm dark:text-gray-400">
            <span>{Math.round(percentage)}%</span>
            <span>
              {value} / {max}
            </span>
          </div>
        )}
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress, progressVariants };
