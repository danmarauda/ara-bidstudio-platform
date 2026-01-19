'use client';

import { motion } from 'framer-motion';
import { Check, Star } from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';
import AnimatedSection from '@/components/landing/animated-section';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const tiers = [
  {
    name: 'Free',
    price: '0 SOL',
    period: 'forever',
    features: [
      '50 messages / month',
      'Free models (GPT-OSS-20B, GLM-4.5-Air, Qwen3-Coder, Kimi K2)',
      'Basic chat features',
      'Community support',
    ],
    cta: 'Get Started',
    href: '/auth',
    highlighted: false,
    popular: false,
  },
  {
    name: 'Pro',
    price: '0.05 SOL',
    period: 'per month',
    originalPrice: '0.1 SOL',
    features: [
      '500 messages / month',
      '100 premium model messages',
      'Premium models: GPT-5, GPT-5 Mini, Gemini 2.5 Pro, o4-mini',
      'All free models included',
      'Conversation history',
      'Model switching',
    ],
    cta: 'Start Pro Plan',
    href: '/auth',
    highlighted: true,
    popular: true,
    badge: 'Launch Special - 50% Off',
  },
  {
    name: 'Pro+',
    price: '0.1 SOL',
    period: 'per month',
    originalPrice: '0.2 SOL',
    features: [
      '1,000 messages / month',
      '300 premium model messages',
      'All models: GPT-5, GPT-5 Mini, Gemini 2.5 Pro, o4-mini + free models',
      'Advanced features',
      'Custom preferences',
      'API access (coming soon)',
      'Priority support',
    ],
    cta: 'Go Pro+',
    href: '/auth',
    highlighted: false,
    popular: false,
    badge: 'Launch Special - 50% Off',
  },
];

function Pricing() {
  return (
    <AnimatedSection
      allowOverlap
      className="py-20 md:py-28 lg:py-32"
      data-bg-variant="gold"
      dustIntensity="low"
      id="pricing"
      parallaxY={12}
      revealCurve={[0, 0.25, 0.6, 1]}
      revealStrategy="none"
      softEdges
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto mb-16 text-center"
          initial={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          viewport={{ once: true, margin: '-100px' }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <motion.h2
            className="mb-4 font-bold text-3xl md:text-4xl"
            initial={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            viewport={{ once: true, margin: '-100px' }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <motion.span
              className="bg-gradient-to-r from-primary via-yellow-500 to-orange-500 bg-clip-text text-transparent"
              initial={{ backgroundPosition: '200% center' }}
              style={{ backgroundSize: '200% 100%' }}
              transition={{ delay: 0.3, duration: 1.5, ease: 'easeInOut' }}
              viewport={{ margin: '-100px' }}
              whileInView={{ backgroundPosition: '0% center' }}
            >
              Simple, Transparent Pricing
            </motion.span>
          </motion.h2>
          <motion.p
            className="mx-auto max-w-2xl text-muted-foreground"
            initial={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            viewport={{ once: true, margin: '-100px' }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            Choose the plan that's right for you. Upgrade, downgrade, or cancel
            anytime.
          </motion.p>
        </motion.div>
        <div className="grid gap-8 lg:grid-cols-3">
          {tiers.map((t, index) => (
            <motion.div
              initial={{ opacity: 1, y: 0, scale: 1 }}
              key={t.name}
              transition={{
                delay: index * 0.2,
                duration: 0.8,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              viewport={{ once: true, margin: '-100px' }}
              whileHover={{
                scale: t.highlighted ? 1.08 : 1.05,
                y: -10,
                transition: { type: 'spring', stiffness: 300, damping: 25 },
              }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
            >
              <Card
                className={cn(
                  'group relative flex h-full flex-col overflow-hidden border-primary/10 bg-gradient-to-br from-background to-background/50 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-primary/10 hover:shadow-xl',
                  t.highlighted &&
                    'border-primary/40 shadow-2xl shadow-primary/20'
                )}
              >
                <motion.div
                  className={cn(
                    'absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-orange-500/5',
                    t.highlighted && 'opacity-100'
                  )}
                  initial={{ opacity: t.highlighted ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ opacity: 0.1 }}
                />

                {t.popular && (
                  <motion.div
                    className="pointer-events-none absolute top-16 right-4 z-10 whitespace-nowrap rounded-full bg-gradient-to-r from-primary to-accent px-3 py-1 font-semibold text-primary-foreground text-xs md:top-12 md:right-4"
                    initial={{ opacity: 0, scale: 0, rotate: -10 }}
                    transition={{
                      delay: index * 0.2 + 0.5,
                      duration: 0.6,
                      type: 'spring',
                      stiffness: 400,
                      damping: 25,
                    }}
                    viewport={{ margin: '-100px' }}
                    whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                  >
                    POPULAR
                  </motion.div>
                )}

                {t.badge && (
                  <motion.div
                    className="pointer-events-none absolute top-6 right-4 z-10 whitespace-nowrap rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 px-3 py-1 font-semibold text-white text-xs shadow md:top-4 md:right-4"
                    initial={{ opacity: 0, scale: 0, rotate: 10 }}
                    transition={{
                      delay: index * 0.2 + 0.4,
                      duration: 0.6,
                      type: 'spring',
                      stiffness: 400,
                      damping: 25,
                    }}
                    viewport={{ margin: '-100px' }}
                    whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                  >
                    {t.badge}
                  </motion.div>
                )}

                <CardHeader className="relative">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    transition={{
                      delay: index * 0.2 + 0.2,
                      duration: 0.5,
                    }}
                    viewport={{ margin: '-100px' }}
                    whileInView={{ opacity: 1, x: 0 }}
                  >
                    <CardTitle className="text-2xl">{t.name}</CardTitle>
                  </motion.div>

                  <motion.div
                    className="flex items-baseline gap-2"
                    initial={{ opacity: 0, scale: 0.8 }}
                    transition={{
                      delay: index * 0.2 + 0.3,
                      duration: 0.6,
                      type: 'spring',
                      stiffness: 300,
                      damping: 25,
                    }}
                    viewport={{ margin: '-100px' }}
                    whileInView={{ opacity: 1, scale: 1 }}
                  >
                    <span className="font-bold text-4xl text-primary">
                      {t.price}
                    </span>
                    {t.originalPrice && (
                      <span className="text-muted-foreground text-xl line-through">
                        {t.originalPrice}
                      </span>
                    )}
                  </motion.div>

                  <motion.p
                    className="text-muted-foreground text-sm"
                    initial={{ opacity: 0 }}
                    transition={{
                      delay: index * 0.2 + 0.4,
                      duration: 0.5,
                    }}
                    viewport={{ margin: '-100px' }}
                    whileInView={{ opacity: 1 }}
                  >
                    {t.period}
                  </motion.p>
                </CardHeader>

                <CardContent className="relative flex flex-1 flex-col">
                  <ul className="flex-1 space-y-3 text-sm">
                    {t.features.map((f, featureIndex) => (
                      <motion.li
                        className="flex items-start gap-3"
                        initial={{ opacity: 0, x: -20 }}
                        key={f}
                        transition={{
                          delay: index * 0.2 + 0.5 + featureIndex * 0.1,
                          duration: 0.4,
                        }}
                        viewport={{ margin: '-100px' }}
                        whileInView={{ opacity: 1, x: 0 }}
                      >
                        <Check className="mt-1 h-4 w-4 flex-shrink-0 text-primary" />
                        <span className="text-muted-foreground">{f}</span>
                      </motion.li>
                    ))}
                  </ul>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    transition={{
                      delay: index * 0.2 + 0.8,
                      duration: 0.6,
                    }}
                    viewport={{ margin: '-100px' }}
                    whileInView={{ opacity: 1, y: 0 }}
                  >
                    <Link className="mt-8" href={t.href}>
                      <motion.div
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 25,
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          className="w-full transition-transform"
                          size="lg"
                          type="button"
                          variant={t.highlighted ? 'default' : 'outline'}
                        >
                          {t.highlighted && <Star className="mr-2 h-4 w-4" />}{' '}
                          {t.cta}
                        </Button>
                      </motion.div>
                    </Link>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}

export default memo(Pricing);
