'use client';

import { cn } from '@/lib/utils';

export interface SliderProps {
  value: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
}

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  className,
  disabled,
}: SliderProps) {
  const current = Math.min(Math.max(value[0] ?? min, min), max);

  return (
    <input
      aria-label="slider"
      className={cn(
        'h-2 w-full appearance-none rounded bg-muted accent-primary outline-none',
        className
      )}
      disabled={disabled}
      max={max}
      min={min}
      onChange={(e) => onValueChange?.([Number(e.target.value)])}
      step={step}
      type="range"
      value={current}
    />
  );
}

export default Slider;
