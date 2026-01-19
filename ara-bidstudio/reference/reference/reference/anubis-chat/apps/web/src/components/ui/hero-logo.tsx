'use client';

import { cn } from '@/lib/utils';
import { LogoIcon } from './logo';

interface HeroLogoProps {
  className?: string;
  /** Show the logo icon above the text */
  showIcon?: boolean;
  /** Custom size for the icon */
  iconSize?: 'sm' | 'md' | 'lg' | 'xl';
  /** Animation type for the logo text */
  animation?: 'none' | 'gradient' | 'shimmer' | 'pulse' | 'typing';
}

/**
 * Large hero logo for landing pages and splash screens
 * Displays "anubis.chat" in large, styled text with optional icon
 */
export function HeroLogo({
  className,
  showIcon = true,
  iconSize = 'xl',
  animation = 'gradient',
}: HeroLogoProps) {
  // Animation classes
  const getAnimationClasses = () => {
    switch (animation) {
      case 'gradient':
        return 'animate-gradient-x bg-[length:200%_100%]';
      case 'shimmer':
        return 'animate-shimmer bg-[length:200%_100%]';
      case 'pulse':
        return 'animate-pulse-glow';
      case 'typing':
        return 'animate-typing';
      default:
        return '';
    }
  };

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div className="space-y-2 text-center">
        <h1 className="font-extrabold font-heading text-5xl tracking-tight lg:text-7xl">
          <span
            className={cn(
              'bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent',
              animation !== 'none' && getAnimationClasses()
            )}
          >
            anubis
          </span>
          <span className="text-muted-foreground">.chat</span>
        </h1>
        <div className="egypt-text text-xl lg:text-2xl">
          Ancient Wisdom • Modern AI
        </div>
      </div>
    </div>
  );
}

/**
 * Compact hero logo variant for smaller spaces
 */
export function CompactHeroLogo({
  className,
  animation = 'gradient',
}: {
  className?: string;
  animation?: 'none' | 'gradient' | 'shimmer' | 'pulse' | 'typing';
}) {
  // Animation classes
  const getAnimationClasses = () => {
    switch (animation) {
      case 'gradient':
        return 'animate-gradient-x bg-[length:200%_100%]';
      case 'shimmer':
        return 'animate-shimmer bg-[length:200%_100%]';
      case 'pulse':
        return 'animate-pulse-glow';
      case 'typing':
        return 'animate-typing';
      default:
        return '';
    }
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <LogoIcon size="lg" />
      <div>
        <h2 className="font-extrabold font-heading text-2xl">
          <span
            className={cn(
              'bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent',
              animation !== 'none' && getAnimationClasses()
            )}
          >
            anubis
          </span>
          <span className="text-muted-foreground">.chat</span>
        </h2>
        <p className="egypt-text text-sm">Ancient Wisdom • Modern AI</p>
      </div>
    </div>
  );
}
