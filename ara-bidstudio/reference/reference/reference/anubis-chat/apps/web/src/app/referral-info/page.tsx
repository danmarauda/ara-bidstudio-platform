'use client';

import { api } from '@convex/_generated/api';
import { useQuery } from 'convex/react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ChevronDown,
  Clock,
  DollarSign,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import AnimatedSection from '@/components/landing/animated-section';
import LandingFooter from '@/components/landing/landingFooter';
import LandingHeader from '@/components/landing/landingHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import SiteLinksSection from '../(landing)/components/siteLinksSection';

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 10,
    },
  },
};

const scaleVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

export default function ReferralInfoPage() {
  const subscriptionStatus = useQuery(api.subscriptions.getSubscriptionStatus);
  const canCreateReferral = subscriptionStatus?.tier === 'pro_plus';
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [_mounted, setMounted] = useState(false);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.9]);

  // Fetch real referral statistics
  const leaderboardData = useQuery(api.referrals.getEnhancedLeaderboard, {
    limit: 100,
  });
  const systemStats = leaderboardData?.systemStats;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen w-full">
      <LandingHeader />

      <main className="relative w-full flex-1 overflow-x-hidden pb-10">
        {/* Hero Section */}
        <AnimatedSection
          allowOverlap
          className="isolate overflow-visible px-4 py-24 text-center sm:px-6 md:py-32 lg:px-8"
          dustIntensity="low"
          parallaxY={24}
          revealStrategy="none"
          softEdges
        >
          <div className="relative z-10 mx-auto w-full max-w-4xl">
            <motion.div
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                boxShadow: [
                  '0 0 20px rgba(16, 185, 129, 0.3)',
                  '0 0 40px rgba(16, 185, 129, 0.5)',
                  '0 0 20px rgba(16, 185, 129, 0.3)',
                ],
              }}
              className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 to-orange-500/10 px-3 py-1 backdrop-blur-sm md:mb-8"
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              transition={{
                duration: 0.6,
                boxShadow: {
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                },
              }}
              whileHover={{
                scale: 1.05,
                transition: { type: 'spring', stiffness: 400 },
              }}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{
                  duration: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'linear',
                }}
              >
                <Sparkles className="h-3 w-3 text-primary" />
              </motion.div>
              <span className="font-medium text-primary text-xs tracking-wide">
                Pro+ Exclusive • Up to 5% Commission
              </span>
              <motion.div
                animate={{ rotate: [0, -360] }}
                transition={{
                  duration: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'linear',
                }}
              >
                <Sparkles className="h-3 w-3 text-primary" />
              </motion.div>
            </motion.div>

            <motion.h1
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 mb-4 font-bold text-4xl transition-all delay-100 duration-700 sm:text-5xl md:mt-4 md:mb-6 md:text-6xl lg:text-7xl"
              initial={{ opacity: 0, y: 30 }}
              style={{ opacity, scale }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.span
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                className="bg-gradient-to-r from-black via-primary to-primary bg-clip-text text-transparent dark:from-white dark:via-primary dark:to-primary"
                style={{ backgroundSize: '200% 200%' }}
                transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY }}
              >
                ANUBIS Referral Program
              </motion.span>
            </motion.h1>

            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto mt-3 mb-10 max-w-3xl text-lg text-muted-foreground transition-all delay-200 duration-700 sm:text-xl md:mt-4 md:mb-12 md:text-2xl"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Earn up to{' '}
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                className="font-bold text-primary"
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              >
                5% commission
              </motion.span>{' '}
              on every payment your referrals make —
              <motion.span
                animate={{ scale: [1, 1.05, 1] }}
                className="bg-gradient-to-r from-black via-primary to-primary bg-clip-text font-semibold text-transparent dark:from-white dark:via-primary dark:to-primary"
                transition={{
                  duration: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: 0.5,
                }}
              >
                {' '}
                forever
              </motion.span>
              .
            </motion.p>

            {/* Stats Row with Glow Background */}
            <div className="relative mb-8">
              {/* Glow effect behind stats */}
              <div className="-inset-4 pointer-events-none absolute rounded-xl">
                <div className="absolute inset-0 rounded-xl bg-[radial-gradient(60%_40%_at_50%_50%,rgba(34,197,94,0.12)_0%,rgba(34,197,94,0.06)_40%,transparent_85%)] opacity-60 blur-[8px]" />
                <div className="absolute inset-0 rounded-xl bg-[radial-gradient(30%_25%_at_50%_50%,rgba(34,197,94,0.20)_0%,rgba(34,197,94,0.12)_35%,transparent_70%)] opacity-70 blur-[4px]" />
              </div>

              <motion.div
                animate="visible"
                className="relative z-10 flex flex-wrap justify-center gap-8 transition-all delay-300 duration-700 motion-reduce:transition-none"
                initial="hidden"
                variants={containerVariants}
              >
                {systemStats ? (
                  <>
                    <motion.div
                      className="text-center"
                      variants={scaleVariants}
                      whileHover={{ scale: 1.1 }}
                    >
                      <motion.div
                        animate={{ opacity: 1, scale: 1 }}
                        aria-live="polite"
                        className="font-bold text-3xl text-primary"
                        initial={{ opacity: 0, scale: 0 }}
                        transition={{
                          delay: 0.5,
                          type: 'spring',
                          stiffness: 200,
                        }}
                      >
                        {systemStats.totalReferrers || 0}
                      </motion.div>
                      <motion.div
                        animate={{ opacity: 1 }}
                        className="text-muted-foreground text-sm"
                        initial={{ opacity: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        Active Referrers
                      </motion.div>
                    </motion.div>
                    <motion.div
                      className="text-center"
                      variants={scaleVariants}
                      whileHover={{ scale: 1.1 }}
                    >
                      <motion.div
                        animate={{ opacity: 1, scale: 1 }}
                        aria-live="polite"
                        className="font-bold text-3xl text-primary"
                        initial={{ opacity: 0, scale: 0 }}
                        transition={{
                          delay: 0.6,
                          type: 'spring',
                          stiffness: 200,
                        }}
                      >
                        {systemStats.totalPayoutsSOL
                          ? `${systemStats.totalPayoutsSOL.toFixed(2)} SOL`
                          : '0 SOL'}
                      </motion.div>
                      <motion.div
                        animate={{ opacity: 1 }}
                        className="text-muted-foreground text-sm"
                        initial={{ opacity: 0 }}
                        transition={{ delay: 0.7 }}
                      >
                        Total Paid Out
                      </motion.div>
                    </motion.div>
                    <motion.div
                      className="text-center"
                      variants={scaleVariants}
                      whileHover={{ scale: 1.1 }}
                    >
                      <motion.div
                        animate={{ opacity: 1, scale: 1 }}
                        aria-live="polite"
                        className="font-bold text-3xl text-primary"
                        initial={{ opacity: 0, scale: 0 }}
                        transition={{
                          delay: 0.7,
                          type: 'spring',
                          stiffness: 200,
                        }}
                      >
                        {systemStats.totalReferrals || 0}
                      </motion.div>
                      <motion.div
                        animate={{ opacity: 1 }}
                        className="text-muted-foreground text-sm"
                        initial={{ opacity: 0 }}
                        transition={{ delay: 0.8 }}
                      >
                        Total Referrals
                      </motion.div>
                    </motion.div>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <div className="h-9 w-20 animate-pulse rounded bg-muted motion-reduce:animate-none" />
                      <div className="mt-2 text-muted-foreground text-sm">
                        Active Referrers
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="h-9 w-24 animate-pulse rounded bg-muted motion-reduce:animate-none" />
                      <div className="mt-2 text-muted-foreground text-sm">
                        Total Paid Out
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="h-9 w-20 animate-pulse rounded bg-muted motion-reduce:animate-none" />
                      <div className="mt-2 text-muted-foreground text-sm">
                        Total Referrals
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </div>

            <div className="mt-6 mb-8 flex flex-col items-center justify-center gap-3 sm:flex-row md:mt-8 md:mb-10 md:gap-4">
              {canCreateReferral ? (
                <Link href="/referrals">
                  <Button
                    className="group relative w-full overflow-hidden sm:w-auto"
                    size="lg"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <Star className="mr-2 h-5 w-5 transition-transform group-hover:rotate-12" />
                    Go to Your Referrals
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/subscription">
                    <Button
                      className="group relative w-full overflow-hidden sm:w-auto"
                      size="lg"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      <span className="relative">
                        Upgrade to Pro+ to Start Earning
                      </span>
                    </Button>
                  </Link>
                  <Link href="/referrals">
                    <Button
                      className="group w-full border-primary/20 backdrop-blur-sm hover:border-primary/40 sm:w-auto"
                      size="lg"
                      variant="outline"
                    >
                      View Referral Dashboard
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </AnimatedSection>

        {/* Key Features */}
        <AnimatedSection
          className="px-4 py-16 sm:px-6 md:py-20 lg:px-8"
          dustIntensity="low"
          parallaxY={12}
          revealStrategy="inview"
          softEdges
          useSurface={false}
        >
          <div className="relative z-10 mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 font-bold text-3xl md:text-4xl">
                <span className="bg-gradient-to-r from-black via-primary to-primary bg-clip-text text-transparent dark:from-white dark:via-primary dark:to-primary">
                  Why Choose ANUBIS?
                </span>
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                {systemStats && systemStats.averageCommissionRate > 0
                  ? `Join our referral program with an average ${(systemStats.averageCommissionRate * 100).toFixed(1)}% commission rate`
                  : 'Join our rewarding referral program in the AI space'}
              </p>
            </div>
            <motion.div
              className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              initial="hidden"
              variants={containerVariants}
              viewport={{ once: true, amount: 0.2 }}
              whileInView="visible"
            >
              <motion.div
                transition={{ type: 'spring', stiffness: 300 }}
                variants={scaleVariants}
                whileHover={{ y: -10 }}
              >
                <Card className="group relative h-full overflow-hidden border-primary/10 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-primary/10 hover:shadow-xl">
                  <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <CardHeader className="relative">
                    <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg transition-transform group-hover:scale-110">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">Recurring Revenue</CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <p className="text-muted-foreground text-sm">
                      Earn commission on every payment your referrals make -
                      monthly subscriptions, upgrades, and additional purchases.
                      Build a passive income stream!
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                transition={{ type: 'spring', stiffness: 300 }}
                variants={scaleVariants}
                whileHover={{ y: -10 }}
              >
                <Card className="group relative h-full overflow-hidden border-primary/10 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-primary/10 hover:shadow-xl">
                  <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <CardHeader className="relative">
                    <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-primary shadow-lg transition-transform group-hover:scale-110">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">
                      Auto-Scaling Rates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <p className="text-muted-foreground text-sm">
                      Start at 3% commission and automatically increase to 5% as
                      you refer more users. Every 5 referrals unlocks a higher
                      tier!
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                transition={{ type: 'spring', stiffness: 300 }}
                variants={scaleVariants}
                whileHover={{ y: -10 }}
              >
                <Card className="group relative h-full overflow-hidden border-primary/10 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-primary/10 hover:shadow-xl">
                  <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <CardHeader className="relative">
                    <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 shadow-lg transition-transform group-hover:scale-110">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">Instant Payouts</CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <p className="text-muted-foreground text-sm">
                      Receive commissions directly to your Solana wallet during
                      payment processing. No waiting periods or minimum
                      thresholds!
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                transition={{ type: 'spring', stiffness: 300 }}
                variants={scaleVariants}
                whileHover={{ y: -10 }}
              >
                <Card className="group relative h-full overflow-hidden border-primary/10 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-primary/10 hover:shadow-xl">
                  <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <CardHeader className="relative">
                    <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg transition-transform group-hover:scale-110">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">Pro+ Exclusive</CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <p className="text-muted-foreground text-sm">
                      Only Pro+ members can create referral codes and earn
                      commissions. Join the elite tier to unlock this benefit!
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                transition={{ type: 'spring', stiffness: 300 }}
                variants={scaleVariants}
                whileHover={{ y: -10 }}
              >
                <Card className="group relative h-full overflow-hidden border-primary/10 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-primary/10 hover:shadow-xl">
                  <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <CardHeader className="relative">
                    <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg transition-transform group-hover:scale-110">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">Fraud Protection</CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <p className="text-muted-foreground text-sm">
                      Advanced fraud detection ensures legitimate referrals.
                      Rate limiting and IP monitoring protect your earnings.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                transition={{ type: 'spring', stiffness: 300 }}
                variants={scaleVariants}
                whileHover={{ y: -10 }}
              >
                <Card className="group relative h-full overflow-hidden border-primary/10 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-primary/10 hover:shadow-xl">
                  <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <CardHeader className="relative">
                    <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg transition-transform group-hover:scale-110">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">
                      72-Hour Grace Period
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <p className="text-muted-foreground text-sm">
                      New users have 72 hours to add their referrer if they
                      didn't use a link.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Commission Tiers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <Card className="relative mb-12 overflow-hidden border-primary/20">
                <CardHeader className="relative">
                  <motion.div
                    className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5"
                    initial={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.05 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                  >
                    <Trophy className="h-4 w-4 text-primary" />
                    <span className="font-medium text-primary text-sm">
                      Progressive Rewards
                    </span>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    transition={{ delay: 0.4 }}
                    viewport={{ once: true }}
                    whileInView={{ opacity: 1, x: 0 }}
                  >
                    <CardTitle className="text-3xl">
                      Commission Tier System
                    </CardTitle>
                  </motion.div>
                  <motion.p
                    className="text-muted-foreground"
                    initial={{ opacity: 0 }}
                    transition={{ delay: 0.5 }}
                    viewport={{ once: true }}
                    whileInView={{ opacity: 1 }}
                  >
                    Your commission rate increases automatically as you refer
                    more users
                  </motion.p>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-6">
                    <motion.div
                      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                      initial="hidden"
                      variants={containerVariants}
                      viewport={{ once: true }}
                      whileInView="visible"
                    >
                      {[
                        { tier: 1, referrals: '1-4', rate: '3.0%' },
                        { tier: 2, referrals: '5-9', rate: '3.2%' },
                        { tier: 3, referrals: '10-14', rate: '3.4%' },
                        { tier: 4, referrals: '15-19', rate: '3.6%' },
                        { tier: 5, referrals: '20-24', rate: '3.8%' },
                        { tier: 6, referrals: '25-29', rate: '4.0%' },
                        { tier: 7, referrals: '30-34', rate: '4.2%' },
                        { tier: 8, referrals: '35-39', rate: '4.4%' },
                        { tier: 9, referrals: '40-44', rate: '4.6%' },
                        { tier: 10, referrals: '45-49', rate: '4.8%' },
                        {
                          tier: 11,
                          referrals: '50+',
                          rate: '5.0%',
                          isMax: true,
                        },
                      ].map((tier, _index) => (
                        <motion.div
                          className={cn(
                            'group relative overflow-hidden rounded-xl border p-4',
                            tier.isMax
                              ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg shadow-primary/20'
                              : 'border-border/40 bg-gradient-to-br from-background to-muted/30'
                          )}
                          key={tier.tier}
                          variants={itemVariants}
                          whileHover={{
                            scale: 1.05,
                            borderColor: tier.isMax
                              ? undefined
                              : 'rgba(34,197,94,0.4)',
                            transition: { type: 'spring', stiffness: 300 },
                          }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {tier.isMax && (
                            <motion.div
                              animate={{
                                rotate: [0, 15, -15, 0],
                                scale: [1, 1.2, 1.2, 1],
                              }}
                              className="absolute top-2 right-2"
                              transition={{
                                duration: 2,
                                repeat: Number.POSITIVE_INFINITY,
                                repeatDelay: 3,
                              }}
                            >
                              <Star className="h-4 w-4 text-primary" />
                            </motion.div>
                          )}
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">
                                  Tier {tier.tier}
                                </span>
                                {tier.isMax && (
                                  <span className="font-bold text-primary text-xs">
                                    MAX
                                  </span>
                                )}
                              </div>
                              <div className="text-muted-foreground text-sm">
                                {tier.referrals} referrals
                              </div>
                            </div>
                            <div className="relative">
                              <div className="font-bold text-2xl">
                                <span
                                  className={cn(
                                    tier.isMax
                                      ? 'bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent'
                                      : 'text-primary'
                                  )}
                                >
                                  {tier.rate}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                    <div className="relative overflow-hidden rounded-xl p-6">
                      <div className="absolute inset-0 bg-grid-white/5" />
                      <p className="relative text-center font-medium">
                        Commission increases by{' '}
                        <span className="text-primary">0.2%</span> every{' '}
                        <span className="text-primary">5 referrals</span>, up to
                        a maximum of{' '}
                        <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text font-bold text-transparent">
                          5%
                        </span>{' '}
                        at 50+ referrals
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* How It Works */}
            <Card className="relative mb-12 overflow-hidden border-primary/20">
              <CardHeader className="relative">
                <CardTitle className="text-3xl">How It Works</CardTitle>
                <p className="text-muted-foreground">
                  Your journey to passive income in 5 simple steps
                </p>
              </CardHeader>
              <CardContent className="relative">
                <div className="relative space-y-8">
                  {/* Connecting line */}
                  <div className="absolute top-8 bottom-8 left-5 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent" />

                  {[
                    {
                      step: 1,
                      title: 'Upgrade to Pro+',
                      description:
                        'Become a Pro+ member to unlock the ability to create referral codes and earn commissions.',
                      color: 'from-purple-500 to-pink-500',
                      icon: Star,
                    },
                    {
                      step: 2,
                      title: 'Create Your Referral Code',
                      description:
                        'Generate a custom or auto-generated referral code from your dashboard.',
                      color: 'from-blue-500 to-cyan-500',
                      icon: Shield,
                    },
                    {
                      step: 3,
                      title: 'Share Your Link',
                      description:
                        'Share your unique referral link on social media, Discord, or directly with friends.',
                      color: 'from-green-500 to-emerald-500',
                      icon: Users,
                    },
                    {
                      step: 4,
                      title: 'Track Your Referrals',
                      description:
                        'Monitor your referred users and commission earnings in real-time from your dashboard.',
                      color: 'from-yellow-500 to-orange-500',
                      icon: TrendingUp,
                    },
                    {
                      step: 5,
                      title: 'Earn Forever',
                      description:
                        'Receive commissions on every payment your referrals make, including renewals and upgrades.',
                      color: 'from-primary to-orange-500',
                      icon: DollarSign,
                    },
                  ].map((item, index) => (
                    <motion.div
                      className="relative flex gap-4 transition-all hover:translate-x-1"
                      initial={{ opacity: 0, x: -50 }}
                      key={item.step}
                      transition={{
                        delay: index * 0.1,
                        type: 'spring',
                        stiffness: 100,
                      }}
                      viewport={{ once: true }}
                      whileInView={{ opacity: 1, x: 0 }}
                    >
                      <motion.div
                        className={cn(
                          'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-lg',
                          item.color
                        )}
                        initial={{ scale: 0, rotate: -180 }}
                        transition={{
                          delay: 0.2 + index * 0.1,
                          type: 'spring',
                          stiffness: 200,
                        }}
                        viewport={{ once: true }}
                        whileHover={{ scale: 1.2, rotate: 10 }}
                        whileInView={{ scale: 1, rotate: 0 }}
                      >
                        <motion.div
                          animate={{ opacity: 1 }}
                          initial={{ opacity: 0 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                        >
                          <item.icon className="h-5 w-5" />
                        </motion.div>
                        {index < 4 && (
                          <div className="-bottom-2 -translate-x-1/2 absolute left-1/2 h-4 w-0.5 bg-gradient-to-b from-white/20 to-transparent" />
                        )}
                      </motion.div>
                      <div className="flex-1 rounded-lg p-4 transition-colors hover:bg-muted/50">
                        <motion.h3
                          className="mb-1 font-semibold text-lg"
                          initial={{ opacity: 0 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                          viewport={{ once: true }}
                          whileInView={{ opacity: 1 }}
                        >
                          {item.title}
                        </motion.h3>
                        <motion.p
                          className="text-muted-foreground"
                          initial={{ opacity: 0 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                          viewport={{ once: true }}
                          whileInView={{ opacity: 1 }}
                        >
                          {item.description}
                        </motion.p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* FAQ */}
            <Card className="relative overflow-hidden border-primary/20">
              <CardHeader className="relative">
                <CardTitle className="text-3xl">
                  Frequently Asked Questions
                </CardTitle>
                <p className="text-muted-foreground">
                  Everything you need to know about our referral program
                </p>
              </CardHeader>
              <CardContent className="relative">
                <div className="space-y-4">
                  {[
                    {
                      question: 'Who can participate in the referral program?',
                      answer:
                        'Only Pro+ members can create referral codes and earn commissions. However, anyone can be referred and use a referral code.',
                    },
                    {
                      question: 'How do I receive my commissions?',
                      answer:
                        'Commissions are paid directly to your Solana wallet during the payment transaction. There are no waiting periods or minimum payout thresholds.',
                    },
                    {
                      question: 'Do I earn on recurring payments?',
                      answer:
                        'Yes! You earn commission on every payment your referrals make, including monthly renewals, plan upgrades, and additional purchases.',
                    },
                    {
                      question: 'Can referral codes be changed?',
                      answer:
                        "Once a user is referred by someone, this relationship is permanent and cannot be changed. New users have 72 hours to claim their referrer if they didn't use a link initially.",
                    },
                    {
                      question:
                        'Is there a limit to how many people I can refer?',
                      answer:
                        "No! There's no limit to how many users you can refer. The more you refer, the higher your commission rate becomes (up to 5%).",
                    },
                  ].map((item, index) => (
                    <motion.button
                      className="group w-full cursor-pointer rounded-xl border border-border/40 p-4 text-left transition-all hover:border-primary/40 hover:shadow-md"
                      initial={{ opacity: 0, y: 20 }}
                      key={item.question}
                      onClick={() =>
                        setExpandedFaq(expandedFaq === index ? null : index)
                      }
                      transition={{
                        delay: index * 0.05,
                        type: 'spring',
                        stiffness: 100,
                      }}
                      type="button"
                      viewport={{ once: true }}
                      whileHover={{ scale: 1.02 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="pr-4 font-semibold">{item.question}</h3>
                        <motion.div
                          animate={{ rotate: expandedFaq === index ? 180 : 0 }}
                          className="shrink-0"
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronDown className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                        </motion.div>
                      </div>
                      <div
                        className={cn(
                          'grid transition-all',
                          expandedFaq === index
                            ? 'mt-3 grid-rows-[1fr]'
                            : 'grid-rows-[0fr]'
                        )}
                      >
                        <div className="overflow-hidden">
                          <motion.p
                            animate={{ opacity: expandedFaq === index ? 1 : 0 }}
                            className="text-muted-foreground"
                            initial={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            {item.answer}
                          </motion.p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <motion.div
              className="mt-16 text-center"
              initial={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <motion.div
                className="relative inline-block"
                transition={{ type: 'spring', stiffness: 300 }}
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  className="absolute inset-0 rounded-full bg-primary/20 blur-3xl"
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                />
                {canCreateReferral ? (
                  <Link href="/referrals">
                    <Button
                      className="group relative overflow-hidden"
                      size="lg"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-primary/20 via-orange-500/20 to-primary/20 opacity-0 transition-opacity group-hover:opacity-100" />
                      <Star className="mr-2 h-5 w-5 transition-transform group-hover:rotate-12" />
                      <span className="relative">Start Earning Now</span>
                    </Button>
                  </Link>
                ) : (
                  <Link href="/subscription">
                    <Button
                      className="group relative overflow-hidden"
                      size="lg"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-primary/20 via-orange-500/20 to-primary/20 opacity-0 transition-opacity group-hover:opacity-100" />
                      <span className="relative">
                        Upgrade to Pro+ & Start Earning
                      </span>
                    </Button>
                  </Link>
                )}
              </motion.div>
              {systemStats && systemStats.totalReferrers > 0 && (
                <p className="mt-6 text-muted-foreground">
                  Join{' '}
                  <span className="font-bold text-lg text-primary">
                    {systemStats.totalReferrers}
                  </span>{' '}
                  active referrer{systemStats.totalReferrers !== 1 ? 's' : ''}
                </p>
              )}
            </motion.div>
          </div>
        </AnimatedSection>
        <SiteLinksSection />
      </main>
      <LandingFooter />
    </div>
  );
}
