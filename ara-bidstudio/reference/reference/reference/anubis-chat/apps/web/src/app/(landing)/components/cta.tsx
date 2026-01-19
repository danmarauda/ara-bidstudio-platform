'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Wallet } from 'lucide-react';
import Link from 'next/link';
import AnimatedSection from '@/components/landing/animated-section';
import { Button } from '@/components/ui/button';

function CTA() {
  return (
    <AnimatedSection
      allowOverlap
      auroraPosition="bottom"
      auroraVariant="primary"
      className="py-20 md:py-28 lg:py-32"
      data-bg-variant="primary"
      dustIntensity="medium"
      edgeMask
      softEdges
      useSurface={false}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 to-orange-500/10 p-8 shadow-xl ring-1 ring-border/50 sm:p-10 md:p-12"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          viewport={{ margin: '-100px' }}
          whileHover={{
            scale: 1.02,
            transition: { type: 'spring', stiffness: 300, damping: 25 },
          }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
        >
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-grid-white/5"
            initial={{ opacity: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            viewport={{ margin: '-100px' }}
            whileInView={{ opacity: 1 }}
          />

          <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto] md:gap-10">
            <div className="text-center md:text-left">
              <motion.h2
                className="mb-3 font-bold text-3xl md:mb-4 md:text-4xl"
                initial={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                viewport={{ margin: '-100px' }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <motion.span
                  className="bg-gradient-to-r from-primary via-foreground to-accent bg-clip-text text-transparent"
                  initial={{ backgroundPosition: '200% center' }}
                  style={{ backgroundSize: '200% 100%' }}
                  transition={{ delay: 0.5, duration: 1.5, ease: 'easeInOut' }}
                  viewport={{ margin: '-100px' }}
                  whileInView={{ backgroundPosition: '0% center' }}
                >
                  Ancient Wisdom,
                  <br />
                  Powered by Modern AI
                </motion.span>
              </motion.h2>

              <motion.p
                className="mx-auto max-w-2xl text-muted-foreground md:mx-0"
                initial={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                viewport={{ margin: '-100px' }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                Connect your wallet to start using anubis.chat — multi‑model
                intelligence, seamless Web3 auth, and a frictionless chat
                experience.
              </motion.p>
            </div>

            <motion.div
              className="flex flex-col items-center justify-center gap-3 sm:flex-row md:justify-end"
              initial={{ opacity: 0, x: 20 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              viewport={{ margin: '-100px' }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              <Link href="/auth">
                <motion.div
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button className="group relative overflow-hidden" size="lg">
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"
                      initial={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ opacity: 1 }}
                    />
                    <motion.div
                      className="flex items-center"
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 25,
                      }}
                      whileHover={{ x: 2 }}
                    >
                      <Wallet className="mr-2 h-5 w-5 transition-transform group-hover:rotate-12" />
                      Connect Wallet & Start
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
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 25,
                      }}
                      whileHover={{ x: 2 }}
                    >
                      Explore Features
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </motion.div>
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </AnimatedSection>
  );
}

export default CTA;
