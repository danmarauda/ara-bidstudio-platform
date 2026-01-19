'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles, Wallet } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useMemo, useState } from 'react';
import AnimatedSection from '@/components/landing/animated-section';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 80,
      damping: 15,
    },
  },
};

function Hero() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated } = useAuthContext();
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const previewSrc = useMemo(() => {
    if (!mounted) {
      return '/assets/hero-preview-light.png';
    }
    return resolvedTheme === 'dark'
      ? '/assets/hero-preview-dark.png'
      : '/assets/hero-preview-light.png';
  }, [mounted, resolvedTheme]);

  return (
    <AnimatedSection
      allowOverlap
      aria-label="Hero"
      className="isolate overflow-visible pt-28 pb-24 text-center md:pt-36 md:pb-32"
      dustIntensity="low"
      parallaxY={24}
      revealStrategy="none"
      softEdges
    >
      <motion.div
        animate="visible"
        className="relative z-10 mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8"
        initial="hidden"
        variants={containerVariants}
      >
        <motion.div
          className="mb-10 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 to-emerald-500/10 px-3 py-1 backdrop-blur-sm md:mb-12"
          transition={{ type: 'spring', stiffness: 400 }}
          variants={itemVariants}
          whileHover={{
            scale: 1.05,
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)',
          }}
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }}
          >
            <Sparkles className="h-3 w-3 text-primary" />
          </motion.div>
          <span className="font-medium text-primary text-xs tracking-wide">
            Powered by GPT-5, Gemini 2.5 Pro, o4-mini & Free Models
          </span>
          <motion.div
            animate={{ rotate: [0, -360] }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }}
          >
            <Sparkles className="h-3 w-3 text-primary" />
          </motion.div>
        </motion.div>

        <motion.h1
          className="mt-2 mb-10 font-bold text-4xl sm:text-5xl md:mt-4 md:mb-12 md:text-6xl lg:text-7xl"
          style={{ opacity, scale }}
          variants={itemVariants}
        >
          <motion.span
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            className="bg-gradient-to-r from-black via-primary to-primary bg-clip-text text-transparent dark:from-white dark:via-primary dark:to-primary"
            style={{ backgroundSize: '200% 100%' }}
            transition={{
              duration: 8,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }}
          >
            Ancient Wisdom Meets Modern AI
          </motion.span>
        </motion.h1>

        <motion.p
          className="mx-auto mt-6 mb-16 max-w-3xl text-lg text-muted-foreground sm:text-xl md:mt-10 md:mb-20 md:text-2xl"
          variants={itemVariants}
        >
          Experience the future of AI conversation with{' '}
          <motion.span
            animate={{ scale: [1, 1.05, 1] }}
            className="font-semibold text-primary"
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
          >
            Solana wallet authentication
          </motion.span>
          , multi-model intelligence, and seamless Web3 integration.
        </motion.p>

        <motion.div
          className="mt-12 mb-14 flex flex-col items-center justify-center gap-6 sm:flex-row md:mt-14 md:mb-16 md:gap-7"
          variants={itemVariants}
        >
          <Link href={isAuthenticated ? '/dashboard' : '/auth'}>
            <motion.div
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                className="group relative w-full overflow-hidden sm:w-auto"
                size="lg"
              >
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"
                  initial={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ opacity: 1 }}
                />
                <motion.div
                  className="flex items-center"
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  whileHover={{ x: 2 }}
                >
                  {isAuthenticated ? (
                    <ArrowRight className="mr-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  ) : (
                    <Wallet className="mr-2 h-5 w-5 transition-transform group-hover:rotate-12" />
                  )}
                  {isAuthenticated
                    ? 'Open Dashboard'
                    : 'Connect Wallet & Start'}
                </motion.div>
              </Button>
            </motion.div>
          </Link>
          <Link href="#features">
            <motion.div
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                className="group w-full border-primary/20 backdrop-blur-sm hover:border-primary/40 sm:w-auto"
                size="lg"
                variant="outline"
              >
                <motion.div
                  className="flex items-center"
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  whileHover={{ x: 2 }}
                >
                  Explore Features
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </motion.div>
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </motion.div>

      {/* Framed preview image with animated glow */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="relative mt-12 px-2 sm:mt-16 md:mt-24 xl:px-0"
        initial={{ opacity: 0, y: 50 }}
        transition={{
          delay: 0.8,
          duration: 1,
          type: 'spring',
          stiffness: 60,
        }}
      >
        <motion.div
          className="relative mx-auto w-full max-w-[88rem]"
          transition={{ type: 'spring', stiffness: 300 }}
          whileHover={{ scale: 1.02 }}
        >
          {/* Animated glow background */}
          <motion.div
            animate={{
              opacity: [0.7, 1, 0.7],
            }}
            className="-top-24 -left-16 -right-16 -bottom-8 pointer-events-none absolute z-0 overflow-hidden rounded-2xl [filter:saturate(120%)] [mask-image:radial-gradient(120%_95%_at_50%_28%,black_60%,transparent_100%)] [mask-repeat:no-repeat]"
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'easeInOut',
            }}
          >
            <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent_0%,black_25%,black_75%,transparent_100%)] [mask-repeat:no-repeat]">
              <div className="absolute inset-0 [mask-image:linear-gradient(to_right,transparent_0%,black_5%,black_97%,transparent_100%)] [mask-repeat:no-repeat]">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  className="absolute inset-0 rounded-2xl bg-[radial-gradient(90%_65%_at_50%_0%,rgba(16,185,129,0.18)_0%,rgba(16,185,129,0.10)_42%,transparent_88%)] opacity-80 blur-[14px]"
                  transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY }}
                />
                <motion.div
                  animate={{ scale: [1.1, 1, 1.1] }}
                  className="absolute inset-0 rounded-2xl bg-[radial-gradient(45%_35%_at_50%_8%,rgba(52,211,153,0.52)_0%,rgba(16,185,129,0.32)_36%,transparent_70%)] opacity-90 blur-[8px]"
                  transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY }}
                />
                <motion.div
                  animate={{ opacity: [0.75, 0.85, 0.75] }}
                  className="absolute inset-0 rounded-2xl bg-[radial-gradient(50%_38%_at_50%_10%,transparent_50%,rgba(110,231,183,0.45)_60%,transparent_74%)] opacity-75 blur-[12px]"
                  transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
                />
                <div className="absolute inset-0 rounded-2xl bg-[conic-gradient(from_210deg_at_50%_12%,rgba(16,185,129,0.2)_0deg,transparent_120deg,transparent_240deg,rgba(52,211,153,0.14)_360deg)] opacity-60 mix-blend-screen" />
              </div>
            </div>
          </motion.div>

          {/* Animated content frame */}
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className="relative inset-shadow-2xs z-10 w-full overflow-hidden rounded-2xl border bg-background p-1 shadow-lg shadow-zinc-950/15 ring-1 ring-background sm:p-2 xl:p-3 dark:inset-shadow-white/20"
            initial={{ opacity: 0, scale: 0.9 }}
            transition={{
              delay: 1,
              duration: 0.8,
              type: 'spring',
              stiffness: 100,
            }}
            whileHover={{
              boxShadow: '0 20px 40px rgba(16, 185, 129, 0.15)',
            }}
          >
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl">
              <Image
                alt="ANUBIS AI Chat interface showing multi-model conversation with GPT-5, Gemini 2.5 Pro, o4-mini and Solana wallet authentication"
                className="relative z-10 object-contain"
                fill
                priority={false}
                quality={100}
                sizes="(min-width: 1536px) 1280px, (min-width: 1280px) 1100px, (min-width: 1024px) 900px, 96vw"
                src={previewSrc}
              />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatedSection>
  );
}

export default Hero;
