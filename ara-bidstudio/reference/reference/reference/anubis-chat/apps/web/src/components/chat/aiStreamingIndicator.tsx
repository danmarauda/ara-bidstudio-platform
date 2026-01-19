'use client';

import { motion } from 'framer-motion';
import { Bot, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIStreamingIndicatorProps {
  type?: 'dots' | 'pulse' | 'typing' | 'thinking';
  label?: string;
  className?: string;
}

export function AIStreamingIndicator({
  type = 'dots',
  label = 'AI is thinking...',
  className,
}: AIStreamingIndicatorProps) {
  if (type === 'pulse') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="relative">
          <Bot className="h-5 w-5 text-muted-foreground" />
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        </div>
        <span className="text-muted-foreground text-sm">{label}</span>
      </div>
    );
  }

  if (type === 'typing') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Bot className="h-5 w-5 text-muted-foreground" />
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              className="h-2 w-2 rounded-full bg-muted-foreground"
              key={i}
              transition={{
                duration: 1.4,
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (type === 'thinking') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <div className="space-y-1">
          <span className="font-medium text-sm">{label}</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                animate={{
                  scaleX: [0.3, 1, 0.3],
                  opacity: [0.3, 1, 0.3],
                }}
                className="h-1 w-8 rounded-full bg-primary/30"
                key={i}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.15,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Default dots animation
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Bot className="h-5 w-5 text-muted-foreground" />
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <span
            className="inline-block h-2 w-2 animate-pulse rounded-full bg-muted-foreground"
            key={i}
            style={{
              animationDelay: `${i * 150}ms`,
            }}
          />
        ))}
      </div>
      {label && (
        <span className="ml-2 text-muted-foreground text-sm">{label}</span>
      )}
    </div>
  );
}
