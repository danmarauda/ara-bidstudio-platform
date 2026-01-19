'use client';

import { useAuthActions } from '@convex-dev/auth/react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Authenticated, AuthLoading, Unauthenticated } from 'convex/react';
import type { Transition, Variants } from 'framer-motion';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Bot,
  CheckCircle,
  Coins,
  DollarSign,
  Globe,
  Lock,
  Shield,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useRef, useState } from 'react';
import SiteLinksSection from '@/app/(landing)/components/siteLinksSection';
import { EmptyState } from '@/components/data/empty-states';
import LandingFooter from '@/components/landing/landingFooter';
import LandingHeader from '@/components/landing/landingHeader';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Lightning } from '@/components/ui/heroOdyssey';
import { Logo } from '@/components/ui/logo';
import { useWallet } from '@/hooks/useWallet';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('auth-page');

// Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const springTransition: Transition = {
  type: 'spring',
  stiffness: 100,
  damping: 10,
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: springTransition,
  },
};

const scaleVariants: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { ...springTransition, damping: 15 },
  },
};

const glowVariants: Variants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 3,
      repeat: Number.POSITIVE_INFINITY,
    },
  },
};

// Removed floating particles to reduce visual clutter per design update

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('dark');
  useAuthActions();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const {
    isConnected,
    publicKey,
    balance,
    formatAddress,
    authenticateWithConvex,
    connect: connectWallet,
    disconnect,
  } = useWallet();
  const { setVisible } = useWalletModal();

  const { isAuthenticated, user } = useAuthContext();

  // Track theme mounting and ensure proper hydration
  useEffect(() => {
    setMounted(true);

    // Set initial system theme
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
      setSystemTheme(mediaQuery.matches ? 'light' : 'dark');

      // Listen for system theme changes
      const handleSystemThemeChange = (e: MediaQueryListEvent) => {
        setSystemTheme(e.matches ? 'light' : 'dark');
      };

      mediaQuery.addEventListener('change', handleSystemThemeChange);

      return () => {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      };
    }
  }, []);

  // More robust theme detection with system preference fallback
  const isLightMode =
    mounted &&
    (() => {
      // If we have a resolved theme, use it (most reliable)
      if (resolvedTheme) {
        return resolvedTheme === 'light';
      }

      // If we have an explicit theme setting, use it
      if (theme && theme !== 'system') {
        return theme === 'light';
      }

      // For system theme, use our tracked system theme state
      return systemTheme === 'light';
    })();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const next = searchParams?.get('next');
      const dest = next?.startsWith('/') ? next : '/dashboard';
      router.push(dest);
    }
  }, [isAuthenticated, user, router, searchParams]);

  // Handle Solana wallet sign-in using Convex Auth
  const handleWalletSignIn = useCallback(async () => {
    if (!(isConnected && publicKey)) {
      setAuthError('Please connect your wallet first');
      return;
    }

    setIsSigningIn(true);
    setAuthError(null);

    try {
      log.info('Starting Convex Auth sign-in with Solana wallet');

      // Use wallet hook flow to create challenge, sign it, and sign in with all required fields
      await authenticateWithConvex();

      log.info('Convex Auth sign-in successful');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Authentication failed';
      log.error('Convex Auth sign-in failed', { error: errorMessage });
      setAuthError(errorMessage);
    } finally {
      setIsSigningIn(false);
    }
  }, [isConnected, publicKey, authenticateWithConvex]);

  // Auto-trigger verification (Convex auth) once after wallet connects
  const autoSignInTriggeredRef = useRef(false);
  useEffect(() => {
    if (isConnected && publicKey && !isAuthenticated && !isSigningIn) {
      if (!autoSignInTriggeredRef.current) {
        autoSignInTriggeredRef.current = true;
        // Fire and forget; internal state handles loading/errors
        handleWalletSignIn().catch((err) => {
          log.debug('Auto wallet sign-in attempt completed with error', {
            error: err instanceof Error ? err.message : String(err),
          });
        });
      }
    } else if (!(isConnected && publicKey)) {
      // Reset when wallet disconnects so re-connect can auto-trigger again
      autoSignInTriggeredRef.current = false;
    }
  }, [
    isConnected,
    publicKey,
    isAuthenticated,
    isSigningIn,
    handleWalletSignIn,
  ]);

  const clearError = () => {
    setAuthError(null);
  };

  const handleSwitchWallet = async () => {
    try {
      if (isConnected) {
        await disconnect();
      }
      setVisible(true);
    } catch (_e) {
      setAuthError('Unable to switch wallet. Please try again.');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Lightning canvas background with theme-aware adjustments */}
      <div className="-z-10 absolute inset-0">
        {mounted && (
          <Lightning
            beamWidth={isLightMode ? 3 : 2.5}
            className="h-full w-full"
            hue={162}
            intensity={isLightMode ? 0.25 : 0.7}
            key={`lightning-${isLightMode ? 'light' : 'dark'}-${resolvedTheme || theme || 'system'}`}
            size={isLightMode ? 2.5 : 2}
            speed={isLightMode ? 0.8 : 1.2}
          />
        )}
        {/* Theme-aware overlay for better contrast */}
        <div
          className={`absolute inset-0 transition-all duration-700 ${
            isLightMode
              ? 'bg-gradient-to-b from-white/90 via-white/85 to-white/80 backdrop-blur-[2px]'
              : 'bg-gradient-to-b from-black/40 via-black/30 to-transparent'
          }`}
        />
      </div>

      {/* Animated Background Gradient with smoother theme transition */}
      <motion.div
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        className={`absolute inset-0 transition-all duration-700 ${
          isLightMode
            ? 'bg-gradient-to-br from-primary/6 via-emerald-500/3 to-background/90'
            : 'bg-gradient-to-br from-primary/10 via-emerald-500/5 to-background'
        }`}
        style={{ backgroundSize: '200% 200%' }}
        transition={{
          duration: 20,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'linear',
        }}
      />

      {/* Grid Background with enhanced theme-aware opacity */}
      <div
        className={`absolute inset-0 bg-[url('/grid.svg')] bg-center transition-opacity duration-700 ${
          isLightMode ? 'opacity-25' : 'opacity-10'
        } [mask-image:radial-gradient(white,transparent_70%)]`}
      />

      <LandingHeader />

      <div className="relative z-0 mx-auto min-h-screen w-full px-3 pt-28 pb-16 sm:px-4 md:px-6 md:pt-36 lg:pt-40">
        <div className="mx-auto max-w-6xl">
          {/* Mobile Welcome Header - Only visible on mobile */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 block text-center lg:hidden"
            initial={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
              }}
              className="relative mx-auto mb-6"
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
              }}
            >
              <motion.div
                animate="animate"
                className="absolute inset-0 mx-auto h-24 w-24 rounded-2xl bg-gradient-to-br from-primary/30 to-emerald-500/30 blur-xl"
                initial="initial"
                variants={glowVariants}
              />
            </motion.div>
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="mb-3 flex flex-row items-center justify-center gap-2.5"
              initial={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <span className="bg-gradient-to-r from-black via-primary to-primary bg-clip-text font-bold text-3xl text-transparent sm:text-3xl dark:from-white dark:via-primary dark:to-primary">
                Welcome to
              </span>
              <Logo
                animation="pulse"
                asLink={false}
                size="3xl"
                textVariant="gradient"
              />
            </motion.div>
            <motion.p
              animate={{ opacity: 1 }}
              className="px-4 text-base text-muted-foreground"
              initial={{ opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              Connect your wallet to unlock{' '}
              <span className="font-bold text-primary">AI-powered Web3</span>
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-2">
            {/* Left: Feature/Brand Panel */}
            <motion.div
              animate="visible"
              className="order-2 space-y-6 lg:order-1"
              initial="hidden"
              variants={containerVariants}
            >
              {/* Desktop Welcome Header - Only visible on desktop */}
              <motion.div
                className="hidden text-center lg:block lg:text-left"
                variants={itemVariants}
              >
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  className="relative mx-auto mb-6 lg:mx-0"
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                >
                  <motion.div
                    animate="animate"
                    className="absolute inset-0 mx-auto h-24 w-24 rounded-2xl bg-gradient-to-br from-primary/30 to-emerald-500/30 blur-xl lg:mx-0"
                    initial="initial"
                    variants={glowVariants}
                  />
                </motion.div>
                <motion.div
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-3 flex flex-row items-center justify-center gap-3 lg:justify-start"
                  initial={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <span className="bg-gradient-to-r from-black via-primary to-primary bg-clip-text font-bold text-3xl text-transparent xl:text-4xl dark:from-white dark:via-primary dark:to-primary">
                    Welcome to
                  </span>
                  <Logo
                    animation="typing"
                    asLink={false}
                    size="3xl"
                    textVariant="gradient"
                  />
                </motion.div>
                <motion.p
                  animate={{ opacity: 1 }}
                  className="text-base text-muted-foreground sm:text-lg"
                  initial={{ opacity: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  Connect your wallet to unlock{' '}
                  <span className="font-bold text-primary">
                    AI-powered Web3
                  </span>
                </motion.p>
              </motion.div>

              {/* Features List */}
              <motion.div variants={itemVariants}>
                <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card/50 to-card/30 p-6 backdrop-blur">
                  {/* Animated glow effect */}
                  <motion.div
                    animate={{
                      opacity: [0, 0.5, 0],
                    }}
                    className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-br from-primary/10 via-transparent to-emerald-500/10 opacity-0"
                    transition={{
                      duration: 3,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                  />

                  <h3 className="mb-4 flex items-center justify-center gap-2 text-center font-semibold lg:justify-start lg:text-left">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{
                        duration: 3,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: 'linear',
                      }}
                    >
                      <Sparkles className="h-5 w-5 text-primary" />
                    </motion.div>
                    <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                      What you'll unlock
                    </span>
                  </h3>

                  <motion.div
                    className="grid gap-3"
                    variants={containerVariants}
                  >
                    {[
                      {
                        icon: Bot,
                        color: 'primary',
                        title: 'Multi-Model AI',
                        desc: 'GPT-5, Gemini 2.5 Pro, Free models & more',
                      },
                      {
                        icon: Globe,
                        color: 'emerald-500',
                        title: 'Web3 Native',
                        desc: 'Solana wallet authentication',
                      },
                      {
                        icon: TrendingUp,
                        color: 'primary',
                        title: 'Referral Program',
                        desc: 'Earn up to 5% commission',
                      },
                      {
                        icon: DollarSign,
                        color: 'emerald-500',
                        title: '$ANUBIS Token',
                        desc: 'Exclusive holder benefits',
                      },
                    ].map((feature, index) => (
                      <motion.div
                        className="group flex items-center gap-3 rounded-lg p-2 transition-all hover:bg-muted/50"
                        key={feature.title}
                        transition={{ type: 'spring', stiffness: 300 }}
                        variants={itemVariants}
                        whileHover={{ x: 10 }}
                      >
                        <motion.div
                          className={`rounded-lg ${feature.color === 'emerald-500' ? 'bg-emerald-500/10' : 'bg-primary/10'} p-2`}
                          initial={{ rotate: -180, scale: 0 }}
                          transition={{
                            delay: 0.2 + index * 0.1,
                            type: 'spring',
                            stiffness: 200,
                          }}
                          viewport={{ once: true }}
                          whileInView={{ rotate: 0, scale: 1 }}
                        >
                          <feature.icon
                            className={`h-4 w-4 ${feature.color === 'emerald-500' ? 'text-emerald-500' : 'text-primary'}`}
                          />
                        </motion.div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-sm">{feature.title}</p>
                          <p className="text-muted-foreground text-xs">
                            {feature.desc}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </Card>
              </motion.div>

              {/* Footer */}
              <motion.div
                className="text-center lg:text-left"
                variants={itemVariants}
              >
                <p className="flex items-center justify-center gap-2 text-muted-foreground text-xs lg:justify-start">
                  <Shield className="h-3 w-3 text-primary" />
                  Protected by Solana blockchain • Powered by{' '}
                  <span className="font-bold text-primary">
                    ANUBIS Intelligence
                  </span>
                </p>
              </motion.div>
            </motion.div>

            {/* Right: Auth Panel */}
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              className={`${isConnected ? 'mt-8' : ''} order-1 lg:order-2`}
              initial={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="mx-auto w-full max-w-md space-y-6">
                {/* Auth Error Display */}
                <AnimatePresence mode="wait">
                  {authError && (
                    <motion.div
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="border-destructive/50 bg-destructive/10 p-4">
                        <div className="flex items-start gap-3">
                          <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{
                              duration: 0.5,
                              repeat: Number.POSITIVE_INFINITY,
                              repeatDelay: 2,
                            }}
                          >
                            <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
                          </motion.div>
                          <div className="flex-1">
                            <p className="font-medium text-destructive text-sm">
                              Authentication Error
                            </p>
                            <p className="mt-1 text-destructive/80 text-sm">
                              {authError}
                            </p>
                            <div className="mt-3 flex gap-2">
                              <Button
                                onClick={clearError}
                                size="sm"
                                type="button"
                                variant="outline"
                              >
                                Try Again
                              </Button>
                              <Button
                                onClick={handleSwitchWallet}
                                size="sm"
                                type="button"
                                variant="outline"
                              >
                                Switch Wallet
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Authentication Flow */}
                <AuthLoading>
                  <motion.div
                    animate={{ opacity: 1, scale: 1 }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card/50 to-card/30 p-8 shadow-xl backdrop-blur">
                      <motion.div
                        animate={{
                          opacity: [0, 0.3, 0],
                        }}
                        className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5"
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                        }}
                      />
                      <div className="relative text-center">
                        <motion.div
                          animate={{
                            scale: [1, 1.05, 1],
                          }}
                          className="inline-flex items-center gap-2"
                          transition={{
                            duration: 1.5,
                            repeat: Number.POSITIVE_INFINITY,
                          }}
                        >
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          <span className="text-muted-foreground text-sm">
                            Loading authentication...
                          </span>
                        </motion.div>
                      </div>
                    </Card>
                  </motion.div>
                </AuthLoading>

                <Unauthenticated>
                  <motion.div
                    animate={{ opacity: 1, scale: 1 }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card/50 to-card/30 p-8 shadow-xl backdrop-blur">
                      {/* Animated glow effect */}
                      <motion.div
                        animate={{
                          opacity: [0, 0.3, 0],
                        }}
                        className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5"
                        transition={{
                          duration: 3,
                          repeat: Number.POSITIVE_INFINITY,
                        }}
                      />

                      {isConnected ? (
                        <motion.div
                          animate="visible"
                          className="relative space-y-4"
                          initial="hidden"
                          variants={containerVariants}
                        >
                          {/* Wallet Connected Status */}
                          <motion.div
                            className="rounded-xl border border-green-500/20 bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-5"
                            transition={{ type: 'spring', stiffness: 300 }}
                            variants={scaleVariants}
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <motion.div
                                  animate={{
                                    scale: [1, 1.1, 1],
                                  }}
                                  className="relative"
                                  transition={{
                                    duration: 2,
                                    repeat: Number.POSITIVE_INFINITY,
                                  }}
                                >
                                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                                    <Wallet className="h-6 w-6 text-green-500" />
                                  </div>
                                  <motion.div
                                    animate={{ scale: 1 }}
                                    className="-bottom-1 -right-1 absolute h-4 w-4 rounded-full border-2 border-background bg-green-500"
                                    initial={{ scale: 0 }}
                                    transition={{
                                      delay: 0.3,
                                      type: 'spring',
                                      stiffness: 500,
                                    }}
                                  >
                                    <CheckCircle className="h-3 w-3 text-white" />
                                  </motion.div>
                                </motion.div>
                                <div>
                                  <div className="flex items-center gap-2 font-semibold text-sm">
                                    Wallet Connected
                                    <motion.div
                                      animate={{ opacity: 1, scale: 1 }}
                                      initial={{ opacity: 0, scale: 0 }}
                                      transition={{ delay: 0.5 }}
                                    >
                                      <Badge
                                        className="border-green-500/20 bg-green-500/10 text-green-600"
                                        variant="outline"
                                      >
                                        Active
                                      </Badge>
                                    </motion.div>
                                  </div>
                                  <p className="font-mono text-muted-foreground text-xs">
                                    {formatAddress(8)}
                                  </p>
                                </div>
                              </div>
                              <motion.div
                                animate={{ opacity: 1, x: 0 }}
                                className="text-right"
                                initial={{ opacity: 0, x: 20 }}
                                transition={{ delay: 0.6 }}
                              >
                                <p className="text-muted-foreground text-xs">
                                  Balance
                                </p>
                                <div className="flex items-center gap-1 font-bold">
                                  <motion.div
                                    animate={{ rotate: [0, 360] }}
                                    transition={{
                                      duration: 3,
                                      repeat: Number.POSITIVE_INFINITY,
                                      ease: 'linear',
                                    }}
                                  >
                                    <Coins className="h-4 w-4 text-yellow-500" />
                                  </motion.div>
                                  {balance?.toFixed(3)} SOL
                                </div>
                              </motion.div>
                            </div>
                          </motion.div>

                          {/* Sign In Button or Loading State */}
                          {isSigningIn ? (
                            <motion.div
                              animate={{ opacity: 1 }}
                              className="text-center"
                              initial={{ opacity: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <motion.div
                                animate={{
                                  scale: [1, 1.05, 1],
                                }}
                                className="inline-flex items-center gap-2"
                                transition={{
                                  duration: 1.5,
                                  repeat: Number.POSITIVE_INFINITY,
                                }}
                              >
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                <span className="text-muted-foreground text-sm">
                                  Authenticating with Convex...
                                </span>
                              </motion.div>
                              <motion.p
                                animate={{ opacity: 1 }}
                                className="mt-2 text-muted-foreground text-xs"
                                initial={{ opacity: 0 }}
                                transition={{ delay: 0.2 }}
                              >
                                Please approve the signature request in your
                                wallet
                              </motion.p>
                            </motion.div>
                          ) : (
                            <motion.div
                              animate="visible"
                              initial="hidden"
                              variants={containerVariants}
                            >
                              <motion.div variants={itemVariants}>
                                <Button
                                  className="group relative w-full overflow-hidden bg-gradient-to-r from-primary to-emerald-500 font-bold text-white hover:from-primary/90 hover:to-emerald-600"
                                  disabled={isSigningIn}
                                  onClick={handleWalletSignIn}
                                  size="lg"
                                  type="button"
                                >
                                  <motion.span
                                    className="absolute inset-0 bg-white/20"
                                    initial={{ x: '-100%' }}
                                    transition={{ duration: 0.5 }}
                                    whileHover={{ x: '100%' }}
                                  />
                                  <Shield className="relative z-10 mr-2 h-5 w-5" />
                                  <span className="relative z-10">
                                    Sign In with Wallet
                                  </span>
                                </Button>
                              </motion.div>
                              <motion.div
                                className="mt-2 text-center"
                                variants={itemVariants}
                              >
                                <Button
                                  className="border-primary/20 hover:border-primary/40"
                                  onClick={handleSwitchWallet}
                                  size="sm"
                                  type="button"
                                  variant="outline"
                                >
                                  Switch Wallet
                                </Button>
                              </motion.div>
                              <motion.p
                                className="text-center text-muted-foreground text-xs"
                                variants={itemVariants}
                              >
                                By signing in, you agree to our Terms of Service
                                and Privacy Policy
                              </motion.p>
                            </motion.div>
                          )}
                        </motion.div>
                      ) : (
                        <motion.div
                          animate="visible"
                          className="relative space-y-6"
                          initial="hidden"
                          variants={containerVariants}
                        >
                          <motion.div variants={itemVariants}>
                            <EmptyState
                              action={{
                                label: 'Connect Wallet',
                                onClick: connectWallet,
                              }}
                              description="Connect your Solana wallet to get started"
                              icon={
                                <motion.div
                                  animate={{
                                    scale: [1, 1.1, 1],
                                    rotate: [0, 5, -5, 0],
                                  }}
                                  transition={{
                                    duration: 3,
                                    repeat: Number.POSITIVE_INFINITY,
                                  }}
                                >
                                  <Wallet className="h-12 w-12 text-primary" />
                                </motion.div>
                              }
                              title="Connect Your Wallet"
                            />
                          </motion.div>
                          <motion.div
                            className="border-primary/20 border-t pt-6"
                            variants={itemVariants}
                          >
                            <p className="mb-4 text-center font-medium text-sm">
                              <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                                Why wallet authentication?
                              </span>
                            </p>
                            <motion.div
                              className="grid gap-3"
                              variants={containerVariants}
                            >
                              {[
                                {
                                  icon: Shield,
                                  bgClass: 'bg-green-500/10',
                                  textClass: 'text-green-500',
                                  title: 'No Passwords',
                                  desc: 'Secure wallet-based auth',
                                },
                                {
                                  icon: Lock,
                                  bgClass: 'bg-blue-500/10',
                                  textClass: 'text-blue-500',
                                  title: 'Cryptographic Security',
                                  desc: 'Military-grade encryption',
                                },
                                {
                                  icon: Zap,
                                  bgClass: 'bg-purple-500/10',
                                  textClass: 'text-purple-500',
                                  title: 'Instant Access',
                                  desc: 'Direct Web3 integration',
                                },
                              ].map((item, index) => (
                                <motion.div
                                  className="group flex items-center gap-3 rounded-lg bg-muted/50 p-3 transition-all hover:bg-muted/70"
                                  key={item.title}
                                  transition={{
                                    type: 'spring',
                                    stiffness: 300,
                                  }}
                                  variants={itemVariants}
                                  whileHover={{ x: 5 }}
                                >
                                  <motion.div
                                    className={`rounded-lg ${item.bgClass} p-2`}
                                    initial={{ rotate: -180, scale: 0 }}
                                    transition={{
                                      delay: 0.2 + index * 0.1,
                                      type: 'spring',
                                      stiffness: 200,
                                    }}
                                    viewport={{ once: true }}
                                    whileInView={{ rotate: 0, scale: 1 }}
                                  >
                                    <item.icon
                                      className={`h-4 w-4 ${item.textClass}`}
                                    />
                                  </motion.div>
                                  <div className="text-left">
                                    <p className="font-medium text-sm">
                                      {item.title}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                      {item.desc}
                                    </p>
                                  </div>
                                </motion.div>
                              ))}
                            </motion.div>
                          </motion.div>
                        </motion.div>
                      )}
                    </Card>
                  </motion.div>
                </Unauthenticated>

                <Authenticated>
                  <motion.div
                    animate={{ opacity: 1, scale: 1 }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-card/50 to-card/30 p-8 shadow-xl backdrop-blur">
                      <motion.div
                        animate={{
                          opacity: [0, 0.5, 0],
                        }}
                        className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-br from-green-500/10 via-transparent to-emerald-500/10"
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                        }}
                      />
                      <motion.div
                        animate={{ opacity: 1, y: 0 }}
                        className="relative space-y-4 text-center"
                        initial={{ opacity: 0, y: 20 }}
                        transition={{ delay: 0.2 }}
                      >
                        <motion.div
                          animate={{ scale: 1, rotate: 0 }}
                          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20"
                          initial={{ scale: 0, rotate: -180 }}
                          transition={{
                            type: 'spring',
                            stiffness: 200,
                            delay: 0.3,
                          }}
                        >
                          <motion.div
                            animate={{
                              scale: [1, 1.2, 1],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Number.POSITIVE_INFINITY,
                            }}
                          >
                            <CheckCircle className="h-8 w-8 text-green-500" />
                          </motion.div>
                        </motion.div>
                        <motion.div
                          animate={{ opacity: 1 }}
                          initial={{ opacity: 0 }}
                          transition={{ delay: 0.5 }}
                        >
                          <h3 className="font-semibold text-lg">
                            <span className="bg-gradient-to-r from-green-500 to-emerald-400 bg-clip-text text-transparent">
                              Successfully Authenticated!
                            </span>
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            Redirecting you to the dashboard...
                          </p>
                        </motion.div>
                        <motion.div
                          animate={{ opacity: 1 }}
                          className="mx-auto h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
                          initial={{ opacity: 0 }}
                          transition={{ delay: 0.7 }}
                        />
                      </motion.div>
                    </Card>
                  </motion.div>
                </Authenticated>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <SiteLinksSection />
      <LandingFooter />
    </div>
  );
}
