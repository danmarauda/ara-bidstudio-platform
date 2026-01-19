'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import AnubisAurora from '@/components/anubisAurora';
import { TombBackground } from '@/components/landing/tomb-background';

export type AnimationIntensity = 'low' | 'medium' | 'high';

/**
 * AnimatedSection wraps a content block with layered background animations.
 *
 * Intensity levels control visual density and motion:
 * - 'low': minimal elements, longer durations, lower opacity (default)
 * - 'medium': balanced elements and durations
 * - 'high': more elements, shorter durations, higher opacity
 *
 * Notes:
 * - Respects prefers-reduced-motion and disables animations when enabled
 * - Uses IntersectionObserver to pause animations when section is off-screen
 * - Decorative layers can be toggled via props for tomb background
 */
interface AnimatedSectionProps
  extends Omit<
    React.HTMLAttributes<HTMLElement>,
    | 'children'
    | 'className'
    | 'onDrag'
    | 'onDragEnd'
    | 'onDragStart'
    | 'onAnimationStart'
    | 'onAnimationEnd'
  > {
  children: React.ReactNode;
  className?: string;
  /** Whether to apply the themed surface background (papyrus/basalt). Defaults to true */
  useSurface?: boolean;
  auroraVariant?: 'primary' | 'gold' | undefined;
  auroraPosition?: 'top' | 'bottom';
  includeTomb?: boolean;
  dustIntensity?: AnimationIntensity;
  edgeMask?: boolean;
  /** Allow background visuals to bleed beyond section bounds */
  allowOverlap?: boolean;
  /** Adds soft top/bottom gradient fades to avoid hard seams between sections (default: true) */
  softEdges?: boolean;
  /** Control the top soft edge independently (defaults to softEdges) */
  softTopEdge?: boolean;
  /** Control the bottom soft edge independently (defaults to softEdges) */
  softBottomEdge?: boolean;
  /** Optional parallax strength (px). 0 disables. */
  parallaxY?: number;
  /** Reveal animation strategy */
  revealStrategy?: 'none' | 'inview' | 'scroll';
  /** Distance in px to slide when revealing */
  revealDistance?: number;
  /** Scroll reveal curve control points (0-1). Defaults to [0,0.3,0.6,1] */
  revealCurve?: [number, number, number, number];
  /** Force aurora to be visible regardless of scroll state */
  forceAurora?: boolean;
}

export default function AnimatedSection({
  children,
  className,
  useSurface = true,
  auroraVariant,
  auroraPosition = 'top',
  includeTomb = false,
  dustIntensity = 'low',
  edgeMask = false,
  allowOverlap = false,
  softEdges = true,
  softTopEdge,
  softBottomEdge,
  parallaxY = 0,
  revealStrategy = 'none',
  revealDistance = 24,
  revealCurve = [0, 0.3, 0.6, 1],
  forceAurora = false,
  ...rest
}: AnimatedSectionProps) {
  const ref = useRef<HTMLElement | null>(null);
  // Start inactive to prevent background aurora from rendering before the
  // section is actually in view (avoids glow bleeding from off-screen sections)
  const [active, setActive] = useState<boolean>(false);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const translateY = useTransform(
    scrollYProgress,
    [0, 1],
    [parallaxY, -parallaxY]
  );
  // Scroll-linked reveal transforms (reversible)
  const yReveal = useTransform(scrollYProgress, revealCurve, [
    revealDistance,
    revealDistance * 0.5,
    0,
    0,
  ]);
  const opacityReveal = useTransform(
    scrollYProgress,
    revealCurve,
    [0, 0.3, 0.9, 1]
  );
  // Track if the user has scrolled the page at least once to defer aurora/glow
  // rendering on first load (prevents initial glow flash on top sections)
  const [hasScrolled, setHasScrolled] = useState<boolean>(false);
  useEffect(() => {
    const updateHasScrolled = (): void => {
      if (window.scrollY > 0) {
        setHasScrolled(true);
      }
    };
    updateHasScrolled();
    window.addEventListener('scroll', updateHasScrolled, { passive: true });
    return () => window.removeEventListener('scroll', updateHasScrolled);
  }, []);

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion) {
      setActive(false);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setActive(entry.isIntersecting);
        }
      },
      { root: null, threshold: 0.1 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const motionEnabled = active;
  const effectiveParallaxStyle = getParallaxStyle(
    motionEnabled,
    parallaxY,
    translateY
  );
  const useInViewReveal = motionEnabled && revealStrategy === 'inview';
  const useScrollReveal = motionEnabled && revealStrategy === 'scroll';
  const shouldShowAurora = decideAuroraVisibility({
    forceAurora,
    motionEnabled,
    auroraVariant,
    hasScrolled,
    useInViewReveal,
    useScrollReveal,
  });

  return (
    <motion.section
      className={`relative ${allowOverlap ? 'overflow-visible' : 'overflow-hidden'} ${useSurface ? 'light:papyrus-surface dark:basalt-surface' : ''} bg-background ${className ?? ''}`}
      ref={ref}
      style={{ contain: 'paint', position: 'relative' }}
      {...rest}
    >
      {/* Background layers (non-interactive) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={getEdgeMaskStyle(edgeMask)}
      >
        {includeTomb && <TombBackground showAccentGlow={false} />}
      </div>
      {shouldShowAurora &&
        (auroraVariant ? (
          <AnubisAurora position={auroraPosition} variant={auroraVariant} />
        ) : (
          <AnubisAurora position={auroraPosition} />
        ))}

      {/* Soft section transitions to avoid hard seams */}
      {(softTopEdge ?? softEdges) ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-background via-background/60 to-transparent"
        />
      ) : null}
      {(softBottomEdge ?? softEdges) ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background via-background/60 to-transparent"
        />
      ) : null}

      {/* Foreground content */}
      <motion.div className="relative z-10" style={effectiveParallaxStyle}>
        <motion.div
          initial={
            useInViewReveal ? { opacity: 0, y: revealDistance } : undefined
          }
          style={
            useScrollReveal ? { y: yReveal, opacity: opacityReveal } : undefined
          }
          transition={
            useInViewReveal
              ? { type: 'spring', bounce: 0.25, duration: 1.2 }
              : undefined
          }
          viewport={
            useInViewReveal
              ? { margin: '-40% 0px -40% 0px', once: true }
              : undefined
          }
          whileInView={useInViewReveal ? { opacity: 1, y: 0 } : undefined}
        >
          {children}
        </motion.div>
      </motion.div>
    </motion.section>
  );
}

function getParallaxStyle(
  motionEnabled: boolean,
  parallaxY: number,
  translateY: import('framer-motion').MotionValue<number>
) {
  return motionEnabled && parallaxY ? { y: translateY } : undefined;
}

function getEdgeMaskStyle(edgeMask: boolean): React.CSSProperties | undefined {
  if (!edgeMask) {
    return;
  }
  const mask =
    'radial-gradient(circle at 50% 50%, transparent 0 55%, white 75%)';
  return { WebkitMaskImage: mask, maskImage: mask };
}

function decideAuroraVisibility(args: {
  forceAurora: boolean;
  motionEnabled: boolean;
  auroraVariant?: 'primary' | 'gold';
  hasScrolled: boolean;
  useInViewReveal: boolean;
  useScrollReveal: boolean;
}) {
  const {
    forceAurora,
    motionEnabled,
    auroraVariant,
    hasScrolled,
    useInViewReveal,
    useScrollReveal,
  } = args;
  if (forceAurora) {
    return true;
  }
  if (!motionEnabled) {
    return false;
  }
  if (auroraVariant === undefined) {
    return false;
  }
  return hasScrolled || useInViewReveal || useScrollReveal;
}
