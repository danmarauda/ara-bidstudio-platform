'use client';

import type * as React from 'react';
import { cn } from '@/lib/utils';

type LandingSectionProps = React.ComponentProps<'section'>;

export function LandingSection({
  className,
  children,
  ...props
}: LandingSectionProps) {
  return (
    <section
      className={cn('relative isolate py-20 md:py-28', className)}
      {...props}
    >
      {/* Floating, background-less content with subtle glow edges */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative">
          <div
            aria-hidden
            className="-inset-x-8 -top-16 pointer-events-none absolute h-24 bg-gradient-to-b from-primary/10 to-transparent dark:from-primary/20"
          />
          {children}
        </div>
      </div>
    </section>
  );
}
