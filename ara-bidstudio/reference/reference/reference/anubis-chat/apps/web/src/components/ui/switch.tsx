'use client';

import type * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function Switch({
  checked,
  onCheckedChange,
  className,
  ...props
}: SwitchProps) {
  return (
    <label
      className={cn(
        'relative inline-flex cursor-pointer items-center',
        className
      )}
    >
      <input
        checked={checked}
        className="peer sr-only"
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        type="checkbox"
        {...props}
      />
      <div className="h-6 w-11 rounded-full bg-muted transition-colors peer-checked:bg-primary">
        <div className="absolute m-0.5 h-5 w-5 rounded-full bg-background transition-transform peer-checked:translate-x-5" />
      </div>
    </label>
  );
}

export default Switch;
