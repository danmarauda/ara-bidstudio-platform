'use client';

import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Users, Zap } from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';
import AnimatedSection from '@/components/landing/animated-section';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const referralFeatures = [
  {
    icon: DollarSign,
    title: 'Earn 3-5% Commission',
    description:
      'Start at 3% and automatically scale up to 5% as you refer more users.',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: TrendingUp,
    title: 'Recurring Revenue',
    description:
      'Earn on every payment your referrals make - monthly subscriptions and upgrades.',
    gradient: 'from-blue-500 to-primary',
  },
  {
    icon: Zap,
    title: 'Instant Payouts',
    description:
      'Receive commissions directly to your Solana wallet with no waiting periods.',
    gradient: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Users,
    title: 'Pro+ Exclusive',
    description: 'Unlock referral earnings by upgrading to our Pro+ tier.',
    gradient: 'from-purple-500 to-pink-500',
  },
];

function ReferralProgram() {
  return (
    <AnimatedSection
      allowOverlap
      className="py-20 md:py-28 lg:py-32"
      data-bg-variant="accent"
      dustIntensity="low"
      id="referral-program"
      softEdges
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto mb-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: '-50px' }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <motion.h2
            className="mb-4 font-bold text-3xl md:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true, margin: '-50px' }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <span className="bg-gradient-to-r from-green-500 via-emerald-500 to-primary bg-clip-text text-transparent">
              Earn with the ANUBIS Referral Program
            </span>
          </motion.h2>
          <motion.p
            className="mx-auto max-w-2xl text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true, margin: '-50px' }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            Share the power of ANUBIS and earn a passive income stream. It's a
            win-win for you and your friends.
          </motion.p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {referralFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                key={feature.title}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  type: 'spring',
                  stiffness: 400,
                  damping: 25,
                }}
                viewport={{ once: true, margin: '-100px' }}
                whileHover={{
                  scale: 1.05,
                  y: -10,
                  transition: { type: 'spring', stiffness: 400, damping: 25 },
                }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
              >
                <Card className="group relative h-full overflow-hidden border-green-500/10 bg-gradient-to-br from-background to-background/50 backdrop-blur-sm transition-all hover:border-green-500/30 hover:shadow-green-500/10 hover:shadow-xl">
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient}`}
                    initial={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ opacity: 0.1 }}
                  />
                  <CardHeader className="relative">
                    <motion.div
                      animate={{
                        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                      }}
                      className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg`}
                      whileHover={{
                        scale: 1.1,
                        rotate: 5,
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                        transition: {
                          type: 'spring',
                          stiffness: 400,
                          damping: 25,
                        },
                      }}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </motion.div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>

                    {/* Progress bar */}
                    <motion.div
                      className="mt-4 h-1 w-full overflow-hidden rounded-full bg-muted"
                      initial={{ opacity: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                      viewport={{ once: true }}
                      whileInView={{ opacity: 1 }}
                    >
                      <motion.div
                        className={`h-full bg-gradient-to-r ${feature.gradient}`}
                        initial={{ width: '0%' }}
                        transition={{
                          duration: 1.2,
                          ease: 'easeOut',
                          delay: 0.5 + index * 0.1,
                        }}
                        viewport={{ once: true }}
                        whileInView={{ width: '100%' }}
                      />
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true, margin: '-50px' }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
              whileInView={{ opacity: 1, x: 0 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/referral-info">
                <Button
                  className="shadow-lg transition-shadow hover:shadow-xl"
                  size="lg"
                  variant="default"
                >
                  Learn More & Start Earning
                </Button>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5, delay: 1.0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
              whileInView={{ opacity: 1, x: 0 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/subscription">
                <Button
                  className="transition-colors hover:bg-primary/5"
                  size="lg"
                  variant="outline"
                >
                  Upgrade to Pro+ to Unlock
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </AnimatedSection>
  );
}

export default memo(ReferralProgram);
