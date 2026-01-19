import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  /** Whether to show the text next to the logo */
  showText?: boolean;
  /** Size of the logo text */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  /** Additional CSS classes */
  className?: string;
  /** Whether the logo should link to home */
  asLink?: boolean;
  /** Custom text to display (default: "anubis.chat") */
  text?: string;
  /** Text style variant */
  textVariant?: 'default' | 'gradient' | 'egypt';
  /** Custom href for the logo link */
  href?: string;
  /** Animation type for the logo text */
  animation?: 'none' | 'gradient' | 'shimmer' | 'pulse' | 'typing';
}

const sizeMap = {
  sm: { text: 'text-base' },
  md: { text: 'text-lg' },
  lg: { text: 'text-xl' },
  xl: { text: 'text-2xl' },
  '2xl': { text: 'text-3xl' },
  '3xl': { text: 'text-4xl' },
} as const;

export function Logo({
  showText = true,
  size = 'md',
  className,
  asLink = true,
  text = 'anubis.chat',
  textVariant = 'default',
  href = '/',
  animation = 'gradient',
}: LogoProps) {
  const dimensions = sizeMap[size];

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

  const baseText = (
    <span
      className={cn(
        'font-extrabold font-heading tracking-tight',
        dimensions.text
      )}
    >
      <span
        className={cn(
          'bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent',
          textVariant === 'egypt' &&
            'from-[var(--color-egypt-gold)] via-[var(--color-foreground)] to-[var(--color-egypt-gold)]',
          textVariant === 'default' && 'bg-none text-foreground',
          animation !== 'none' && getAnimationClasses()
        )}
      >
        anubis
      </span>
      <span className="text-muted-foreground">.chat</span>
    </span>
  );

  const logoContent = (
    <div className={cn('inline-flex items-center gap-2', className)}>
      {showText && baseText}
    </div>
  );

  if (asLink) {
    return (
      <Link
        aria-label="anubis.chat Home"
        className="inline-flex transition-opacity hover:opacity-80"
        href={href}
      >
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}

/**
 * Logo icon only variant
 */
export function LogoIcon({
  size = 'md',
  className,
}: Pick<LogoProps, 'size' | 'className'>) {
  const containerSize = cn(
    size === 'sm' && 'h-6 w-6',
    size === 'md' && 'h-8 w-8',
    size === 'lg' && 'h-10 w-10',
    size === 'xl' && 'h-12 w-12',
    size === '2xl' && 'h-14 w-14',
    size === '3xl' && 'h-16 w-16'
  );
  const textSize = cn(
    size === 'sm' && 'text-xs',
    size === 'md' && 'text-sm',
    size === 'lg' && 'text-base',
    size === 'xl' && 'text-lg',
    size === '2xl' && 'text-xl',
    size === '3xl' && 'text-2xl'
  );
  return (
    <span
      aria-label="Anubis"
      className={cn(
        'inline-flex items-center justify-center rounded-md bg-primary/10 ring-1 ring-primary/20',
        containerSize,
        className
      )}
      role="img"
    >
      <span
        className={cn(
          'bg-gradient-to-r from-primary to-accent bg-clip-text font-extrabold font-heading text-transparent',
          textSize
        )}
      >
        A
      </span>
    </span>
  );
}

/**
 * Logo with text variant for headers/navigation
 */
export function LogoWithText({
  size = 'md',
  className,
  textVariant = 'default',
  asLink = true,
  href = '/',
  animation = 'gradient',
}: Pick<
  LogoProps,
  'size' | 'className' | 'textVariant' | 'asLink' | 'href' | 'animation'
>) {
  return (
    <Logo
      animation={animation}
      asLink={asLink}
      className={className}
      href={href}
      showText
      size={size}
      textVariant={textVariant}
    />
  );
}
