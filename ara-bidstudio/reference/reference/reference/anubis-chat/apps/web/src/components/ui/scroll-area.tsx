import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * ScrollArea component - Provides scrollable area with custom scrollbar styling
 */
export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'vertical' | 'horizontal' | 'both';
}

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, orientation = 'vertical', children, ...props }, ref) => {
    return (
      <div
        className={cn(
          'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500 relative overflow-auto',
          orientation === 'horizontal' && 'overflow-x-auto overflow-y-hidden',
          orientation === 'vertical' && 'overflow-y-auto overflow-x-hidden',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ScrollArea.displayName = 'ScrollArea';
