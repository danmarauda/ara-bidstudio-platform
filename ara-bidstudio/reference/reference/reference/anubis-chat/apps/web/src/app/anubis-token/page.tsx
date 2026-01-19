'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Coins,
  Copy,
  DollarSign,
  ExternalLink,
  Flame,
  Rocket,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import SiteLinksSection from '@/app/(landing)/components/siteLinksSection';
import AnimatedSection from '@/components/landing/animated-section';
import LandingFooter from '@/components/landing/landingFooter';
import LandingHeader from '@/components/landing/landingHeader';
import { Button } from '@/components/ui/button';

// Countdown Timer removed

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

// Animated Stats Component
function AnimatedStats() {
  const stats = [
    {
      label: 'Total Supply',
      value: '1B',
      icon: Coins,
      suffix: 'ANUB',
      fullValue: '1,000,000,000',
    },
    { label: 'Initial Price', value: '0.00001', icon: DollarSign, prefix: '$' },
    { label: 'Bonding Curve', value: '100', icon: TrendingUp, suffix: '%' },
    {
      label: 'Community',
      value: '100',
      icon: Users,
      suffix: '%',
      fullLabel: 'Community Owned',
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-2 gap-6 md:grid-cols-4"
      initial="hidden"
      variants={containerVariants}
      viewport={{ once: true, amount: 0.3 }}
      whileInView="visible"
    >
      {stats.map((stat, index) => (
        <motion.div
          className="group relative"
          key={stat.label}
          variants={scaleVariants}
          whileHover={{
            scale: 1.05,
            transition: { type: 'spring', stiffness: 300 },
          }}
        >
          <motion.div
            animate={{
              opacity: [0.5, 0.8, 0.5],
            }}
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 to-emerald-500/20 blur-xl"
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              delay: index * 0.2,
            }}
          />
          <div className="relative rounded-xl border border-primary/20 bg-background/50 p-3 xs:p-4 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 sm:p-5 md:p-6">
            <motion.div
              animate={{ rotate: 0, scale: 1 }}
              initial={{ rotate: -10, scale: 0 }}
              transition={{
                delay: 0.3 + index * 0.1,
                type: 'spring',
                stiffness: 200,
              }}
            >
              <stat.icon className="mb-2 h-5 xs:h-6 w-5 xs:w-6 text-primary sm:mb-3 sm:h-7 sm:w-7 md:h-8 md:w-8" />
            </motion.div>
            <div className="font-bold text-base xs:text-lg sm:text-xl md:text-2xl">
              {stat.prefix}
              <motion.span
                animate={{ opacity: 1, x: 0 }}
                className="inline-block"
                initial={{ opacity: 0, x: -20 }}
                title={stat.fullValue || stat.value}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                {stat.value}
              </motion.span>
              {stat.suffix && (
                <span className="ml-1 text-muted-foreground text-sm xs:text-base sm:text-lg">
                  {stat.suffix}
                </span>
              )}
            </div>
            <p
              className="mt-1 truncate text-muted-foreground text-xs xs:text-sm"
              title={stat.fullLabel || stat.label}
            >
              {stat.fullLabel || stat.label}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

// Floating Particles Component
function FloatingParticles() {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (windowSize.width === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          animate={{
            y: -100,
            x: Math.random() * windowSize.width,
          }}
          className="absolute"
          initial={{
            x: Math.random() * windowSize.width,
            y: windowSize.height + 100,
          }}
          key={`particle-${i}-${windowSize.width}-${windowSize.height}`}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'linear',
            delay: Math.random() * 10,
          }}
        >
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }}
          >
            {(() => {
              if (i % 3 === 0) {
                return <Coins className="h-6 w-6 text-primary/30" />;
              }
              if (i % 3 === 1) {
                return <Star className="h-4 w-4 text-emerald-400/30" />;
              }
              return <Sparkles className="h-5 w-5 text-primary/30" />;
            })()}
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

export default function AnubisTokenPage() {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const { scrollYProgress } = useScroll();
  const _opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const _scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

  const tokenAddress = 'Coming Soon - Launching on Pump.Fun';

  const copyTokenAddress = async () => {
    try {
      await navigator.clipboard.writeText(tokenAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (_err) {
      // ignore clipboard errors
    }
  };

  const tokenDotIds = Array.from({ length: 8 }, (_, i) => `token-dot-${i}`);

  return (
    <div className="relative h-full w-full">
      {/* Floating Particles */}
      <FloatingParticles />

      <div className="relative z-10">
        <LandingHeader />

        {/* Epic Hero Section with 3D Effects */}
        <AnimatedSection
          allowOverlap
          aria-label="$ANUBIS Token Hero"
          className="isolate overflow-visible pt-28 pb-24 text-center md:pt-36 md:pb-32"
          dustIntensity="high"
          parallaxY={48}
          revealStrategy="none"
          softEdges
        >
          <div className="relative z-10 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
            {/* Animated Badge */}
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
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-gradient-to-r from-primary/20 to-emerald-500/20 px-3 py-1.5 backdrop-blur-sm sm:mb-10 sm:px-4 sm:py-2 md:mb-12"
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
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              >
                <Flame className="h-3 w-3 text-primary sm:h-4 sm:w-4" />
              </motion.div>
              <motion.span
                animate={{ opacity: 1 }}
                className="font-bold text-primary text-xs uppercase tracking-wide sm:text-sm"
                initial={{ opacity: 0 }}
                transition={{ delay: 0.3 }}
              >
                Meme Token Launch 🔥
              </motion.span>
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
              >
                <Rocket className="h-3 w-3 text-emerald-500 sm:h-4 sm:w-4" />
              </motion.div>
            </motion.div>

            <motion.h1
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 mb-6 font-bold text-2xl transition-all delay-100 duration-700 sm:mb-8 sm:text-4xl md:mt-4 md:mb-10 md:mb-12 md:text-5xl lg:text-6xl xl:text-7xl min-[425px]:text-3xl"
              initial={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <span className="animate-pulse bg-gradient-to-r from-primary via-emerald-400 to-emerald-500 bg-clip-text text-transparent">
                $ANUBIS
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary/80 via-primary to-emerald-500 bg-clip-text text-transparent text-xl sm:text-3xl md:text-4xl lg:text-5xl min-[425px]:text-2xl">
                Powers the Future
              </span>
            </motion.h1>

            {/* Token Contract Address (moved below heading) */}
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto mt-6 max-w-2xl sm:mt-8"
              initial={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/30 to-emerald-500/30 blur-2xl" />
                <div className="relative rounded-xl border border-primary/40 bg-background/60 p-4 backdrop-blur-lg sm:p-6">
                  <p className="mb-3 text-muted-foreground text-sm uppercase tracking-wider">
                    Token Contract Address
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <code className="flex-1 overflow-x-auto break-all rounded-md bg-muted px-2 py-1.5 text-left font-mono text-[10px] text-primary sm:px-3 sm:text-sm min-[425px]:px-2.5 min-[425px]:py-2 min-[425px]:text-xs">
                      {tokenAddress}
                    </code>
                    <Button
                      className="border-primary/20 text-xs hover:border-primary/40 sm:text-sm"
                      onClick={copyTokenAddress}
                      size="sm"
                      variant="outline"
                    >
                      {copiedAddress ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Primary CTAs (moved below heading and address) */}
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex flex-col items-center justify-center gap-6 sm:mt-8 sm:flex-row"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <Link
                href="https://pump.fun"
                rel="noopener noreferrer"
                target="_blank"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    className="group w-full bg-gradient-to-r from-primary to-emerald-500 font-bold text-sm text-white hover:from-primary/90 hover:to-emerald-600 sm:w-auto sm:text-base"
                    size="lg"
                  >
                    <TrendingUp className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Buy on Pump.Fun
                    <ExternalLink className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-1 sm:h-4 sm:w-4" />
                  </Button>
                </motion.div>
              </Link>
              <Link href="#tokenomics">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    className="w-full border-primary/20 text-sm backdrop-blur-sm hover:border-primary/40 sm:w-auto sm:text-base"
                    size="lg"
                    variant="outline"
                  >
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto mt-4 mb-8 max-w-4xl text-base text-muted-foreground transition-all delay-200 duration-700 sm:mt-6 sm:mb-12 sm:text-lg md:mt-10 md:mb-16 md:mb-20 md:text-xl lg:text-2xl"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Join the revolution where{' '}
              <span className="font-bold text-primary">ancient wisdom</span>{' '}
              meets{' '}
              <span className="font-bold text-emerald-400">modern memes</span>.
              50% funds the AI, 50% powers the platform.
              <motion.span
                animate={{ scale: [1, 1.05, 1] }}
                className="mt-4 block font-bold text-primary"
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              >
                100% Community Driven 🚀
              </motion.span>
            </motion.p>

            {/* Stats Section */}
            <AnimatedStats />
          </div>
        </AnimatedSection>

        {/* Info Section with Image */}
        <AnimatedSection
          className="py-24 md:py-32"
          dustIntensity="low"
          edgeMask={false}
          id="about"
          includeTomb={false}
          parallaxY={20}
          revealStrategy="none"
          softEdges={false}
          useSurface={false}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
              {/* Text Content */}
              <div className="order-2 lg:order-1">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  whileInView={{ opacity: 1, x: 0 }}
                >
                  <h2 className="mb-4 font-bold text-2xl sm:mb-6 sm:text-4xl md:text-5xl min-[425px]:mb-5 min-[425px]:text-3xl">
                    <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                      Ancient Power,
                    </span>
                    <br />
                    <span className="text-foreground">Modern Utility</span>
                  </h2>

                  <p className="mb-4 text-muted-foreground text-sm leading-relaxed sm:mb-8 sm:text-lg md:text-xl min-[425px]:mb-6 min-[425px]:text-base">
                    $ANUBIS isn't just another meme token. It's the lifeblood of
                    the ANUBIS ecosystem, directly funding both our
                    revolutionary AI agent and the platform that hosts it.
                  </p>

                  <motion.div
                    className="space-y-4"
                    initial="hidden"
                    variants={containerVariants}
                    viewport={{ once: true, amount: 0.3 }}
                    whileInView="visible"
                  >
                    {[
                      {
                        icon: Zap,
                        color: 'primary',
                        title: 'AI Agent Funding',
                        desc: '50% of all proceeds directly fund ANUBIS AI development and operations',
                      },
                      {
                        icon: Shield,
                        color: 'primary',
                        title: 'Platform Support',
                        desc: '50% goes to maintaining and improving the ANUBIS.Chat platform',
                      },
                      {
                        icon: Users,
                        color: 'emerald-500',
                        title: 'Community Driven',
                        desc: 'Built by the community, for the community, with transparent fund allocation',
                      },
                    ].map((feature, index) => (
                      <motion.div
                        className="flex items-start gap-3"
                        key={feature.title}
                        transition={{ type: 'spring', stiffness: 300 }}
                        variants={itemVariants}
                        whileHover={{ x: 10 }}
                      >
                        <motion.div
                          className={`rounded-full ${feature.color === 'emerald-500' ? 'bg-emerald-500/20' : 'bg-primary/20'} mt-1 p-2`}
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
                            className={`h-4 w-4 sm:h-5 sm:w-5 ${feature.color === 'emerald-500' ? 'text-emerald-500' : 'text-primary'}`}
                          />
                        </motion.div>
                        <div>
                          <motion.h3
                            className="mb-1 font-semibold text-base sm:text-lg"
                            initial={{ opacity: 0, x: -20 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                            viewport={{ once: true }}
                            whileInView={{ opacity: 1, x: 0 }}
                          >
                            {feature.title}
                          </motion.h3>
                          <motion.p
                            className="text-muted-foreground"
                            initial={{ opacity: 0 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                            viewport={{ once: true }}
                            whileInView={{ opacity: 1 }}
                          >
                            {feature.desc}
                          </motion.p>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              </div>

              {/* Image/Visual */}
              <div className="order-1 lg:order-2">
                <motion.div
                  className="relative"
                  initial={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  whileInView={{ opacity: 1, x: 0 }}
                >
                  {/* Green glow effect behind container - square with rounded corners */}
                  <div className="-inset-0.5 sm:-inset-1 lg:-inset-1.5 absolute">
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/15 via-emerald-500/10 to-primary/15 blur-xl" />
                    <div className="absolute inset-0 animate-pulse rounded-3xl bg-gradient-to-br from-primary/8 to-emerald-500/8 blur-lg" />
                  </div>

                  <div className="relative aspect-square overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-emerald-500/10 to-primary/5 backdrop-blur-sm">
                    {/* ANUBIS Token Image - Static and Large */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* Glow effect behind the token */}
                      <div className="absolute h-[150%] w-[150%] rounded-full bg-gradient-to-r from-primary/20 to-emerald-500/20 blur-3xl" />

                      {/* Token image - larger than container */}
                      <div className="relative h-[140%] w-[140%]">
                        <Image
                          alt="$ANUBIS Token"
                          className="object-contain drop-shadow-2xl"
                          fill
                          priority
                          src="/assets/token.png"
                        />
                      </div>
                    </div>

                    {/* Animated particles */}
                    <div className="pointer-events-none absolute inset-0">
                      {tokenDotIds.map((id, _i) => (
                        <motion.div
                          animate={{
                            y: [-10, 10, -10],
                            opacity: [0.3, 0.8, 0.3],
                          }}
                          className="absolute h-2 w-2 rounded-full bg-primary"
                          key={id}
                          style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                          }}
                          transition={{
                            duration: 2 + Math.random() * 2,
                            repeat: Number.POSITIVE_INFINITY,
                            delay: Math.random() * 2,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Tokenomics Panels */}
        <AnimatedSection
          className="py-24 md:py-32"
          dustIntensity="low"
          edgeMask={false}
          id="tokenomics"
          includeTomb={false}
          parallaxY={20}
          revealStrategy="none"
          softEdges={false}
          useSurface={false}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              className="mb-16 text-center"
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <h2 className="mb-3 font-bold text-2xl sm:mb-6 sm:text-4xl md:text-5xl min-[425px]:mb-4 min-[425px]:text-3xl">
                Transparent{' '}
                <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                  Tokenomics
                </span>
              </h2>
              <p className="mx-auto max-w-3xl text-base text-muted-foreground sm:text-lg md:text-xl">
                Every $ANUBIS purchase directly contributes to the ecosystem.
                Here's exactly where your investment goes.
              </p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 gap-8 md:grid-cols-2"
              initial="hidden"
              variants={containerVariants}
              viewport={{ once: true, amount: 0.2 }}
              whileInView="visible"
            >
              {/* AI Agent Panel */}
              <motion.div
                className="relative"
                transition={{ type: 'spring', stiffness: 300 }}
                variants={scaleVariants}
                whileHover={{
                  scale: 1.02,
                  boxShadow: '0 20px 40px rgba(16, 185, 129, 0.15)',
                }}
              >
                <motion.div
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent"
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                />
                <div className="relative h-full rounded-2xl border border-primary/20 bg-background/50 p-6 backdrop-blur-sm sm:p-8">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-primary/20 p-3">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-2 font-semibold text-primary text-sm">
                          50% ALLOCATION
                        </span>
                      </div>
                      <h3 className="mb-3 font-bold text-xl sm:text-2xl">
                        ANUBIS AI Agent
                      </h3>
                      <p className="mb-6 text-muted-foreground">
                        Powers the development and operation of our
                        revolutionary AI agent with advanced reasoning
                        capabilities.
                      </p>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          <span className="text-muted-foreground text-sm">
                            AI Model Training & Fine-tuning
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          <span className="text-muted-foreground text-sm">
                            Infrastructure & Computing Costs
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          <span className="text-muted-foreground text-sm">
                            Research & Development
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          <span className="text-muted-foreground text-sm">
                            Agent Performance Optimization
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Platform Panel */}
              <motion.div
                className="relative"
                transition={{ type: 'spring', stiffness: 300 }}
                variants={scaleVariants}
                whileHover={{
                  scale: 1.02,
                  boxShadow: '0 20px 40px rgba(52, 211, 153, 0.15)',
                }}
              >
                <motion.div
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent"
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: 0.5,
                  }}
                />
                <div className="relative h-full rounded-2xl border border-emerald-500/20 bg-background/50 p-6 backdrop-blur-sm sm:p-8">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-emerald-500/20 p-3">
                      <Shield className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-2 font-semibold text-emerald-500 text-sm">
                          50% ALLOCATION
                        </span>
                      </div>
                      <h3 className="mb-3 font-bold text-xl sm:text-2xl">
                        ANUBIS.Chat Platform
                      </h3>
                      <p className="mb-6 text-muted-foreground">
                        Maintains and enhances the platform infrastructure that
                        hosts our AI services and community.
                      </p>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span className="text-muted-foreground text-sm">
                            Server Infrastructure & Hosting
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span className="text-muted-foreground text-sm">
                            Platform Development & Updates
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span className="text-muted-foreground text-sm">
                            Security & Compliance
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span className="text-muted-foreground text-sm">
                            Community Support & Growth
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </AnimatedSection>

        {/* CTA Section */}
        <AnimatedSection
          className="py-24 md:py-32"
          dustIntensity="high"
          edgeMask={false}
          includeTomb={false}
          parallaxY={24}
          revealStrategy="none"
          softEdges={false}
          useSurface={false}
        >
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <h2 className="mb-3 font-bold text-2xl sm:mb-6 sm:text-4xl md:text-5xl min-[425px]:mb-4 min-[425px]:text-3xl">
                Join the{' '}
                <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                  $ANUBIS
                </span>{' '}
                Revolution
              </h2>
              <p className="mx-auto mb-8 max-w-2xl text-base text-muted-foreground sm:mb-12 sm:text-lg md:text-xl">
                Be part of the future of AI funding. Every token purchased helps
                build the next generation of artificial intelligence.
              </p>

              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <motion.div
                  className="flex flex-col items-center justify-center gap-4 sm:flex-row"
                  initial="hidden"
                  variants={containerVariants}
                  viewport={{ once: true }}
                  whileInView="visible"
                >
                  <motion.div variants={itemVariants}>
                    <Link
                      href="https://pump.fun"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <motion.div
                        whileHover={{
                          scale: 1.05,
                          rotate: [0, -1, 1, 0],
                          transition: { rotate: { duration: 0.3 } },
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          className="group relative overflow-hidden bg-gradient-to-r from-primary to-emerald-500 px-6 py-4 font-bold text-sm text-white hover:from-primary/90 hover:to-emerald-600 sm:px-8 sm:py-6 sm:text-base"
                          size="lg"
                        >
                          <motion.span
                            className="absolute inset-0 bg-white/20"
                            initial={{ x: '-100%' }}
                            transition={{ duration: 0.5 }}
                            whileHover={{ x: '100%' }}
                          />
                          <TrendingUp className="relative z-10 mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                          <span className="relative z-10">
                            Launch on Pump.Fun
                          </span>
                          <ExternalLink className="group-hover:-translate-y-1 relative z-10 ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5" />
                        </Button>
                      </motion.div>
                    </Link>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Link
                      href="https://raydium.io"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <motion.div
                        whileHover={{
                          scale: 1.05,
                          rotate: [0, 1, -1, 0],
                          transition: { rotate: { duration: 0.3 } },
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          className="group relative overflow-hidden border-primary/20 px-6 py-4 text-sm backdrop-blur-sm hover:border-primary/40 sm:px-8 sm:py-6 sm:text-base"
                          size="lg"
                          variant="outline"
                        >
                          <motion.span
                            className="absolute inset-0 bg-primary/10"
                            initial={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            whileHover={{ scale: 1, opacity: 1 }}
                          />
                          <Zap className="relative z-10 mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                          <span className="relative z-10">
                            Trade on Raydium
                          </span>
                          <ExternalLink className="group-hover:-translate-y-1 relative z-10 ml-2 h-3 w-3 transition-transform group-hover:translate-x-1 sm:h-4 sm:w-4" />
                        </Button>
                      </motion.div>
                    </Link>
                  </motion.div>
                </motion.div>

                <motion.p
                  className="text-muted-foreground text-sm"
                  initial={{ opacity: 0 }}
                  transition={{ delay: 0.5 }}
                  viewport={{ once: true }}
                  whileInView={{ opacity: 1 }}
                >
                  🚀 Token will graduate to Raydium automatically at $69K market
                  cap
                </motion.p>
              </motion.div>
            </motion.div>
          </div>
        </AnimatedSection>

        {/* Site Links Section */}
        <SiteLinksSection />

        <LandingFooter />
      </div>
    </div>
  );
}
