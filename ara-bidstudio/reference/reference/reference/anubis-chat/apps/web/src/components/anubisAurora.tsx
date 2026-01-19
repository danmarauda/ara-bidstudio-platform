'use client';

import { cn } from '@/lib/utils';

interface AnubisAuroraProps {
  className?: string;
  variant?: 'primary' | 'gold' | 'both';
  position?: 'top' | 'bottom';
}

export function AnubisAurora({
  className,
  variant = 'both',
  position = 'top',
}: AnubisAuroraProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0',
        position === 'bottom' && 'top-auto bottom-0',
        className
      )}
    >
      {(variant === 'primary' || variant === 'both') && (
        <div className="aurora aurora-primary" />
      )}
      {(variant === 'gold' || variant === 'both') && (
        <div className="aurora aurora-gold" />
      )}
    </div>
  );
}

export default AnubisAurora;
