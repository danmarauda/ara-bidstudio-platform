'use client';

import type * as React from 'react';
import { cn } from '@/lib/utils';

export interface SeparatorProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical';
}

export function Separator({
  orientation = 'horizontal',
  className,
  ...props
}: SeparatorProps) {
  return (
    <hr
      aria-orientation={orientation}
      className={cn(
        orientation === 'vertical' ? 'h-full w-px' : 'h-px w-full',
        'bg-border',
        className
      )}
      {...props}
    />
  );
}

export default Separator;
