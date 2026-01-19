'use client';

import { motion } from 'framer-motion';
import { KeySquare, Lock, Shield } from 'lucide-react';
import { memo } from 'react';
import AnimatedSection from '@/components/landing/animated-section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const securityFeatures = [
  {
    icon: Shield,
    title: 'Signature-Gated Actions',
    description:
      'Every critical action is authorized by a wallet signature, ensuring you are always in control.',
    gradient: 'from-red-500 to-orange-500',
  },
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    description:
      'Your conversations are encrypted at rest and in transit, protecting your data from unauthorized access.',
    gradient: 'from-yellow-500 to-amber-500',
  },
  {
    icon: KeySquare,
    title: 'Wallet-Scoped Data',
    description:
      'All your data is isolated and tied to your public key, preventing cross-user data leakage.',
    gradient: 'from-lime-500 to-green-500',
  },
];

function Security() {
  return (
    <AnimatedSection
      allowOverlap
      className="py-20 md:py-28 lg:py-32"
      data-bg-variant="gold"
      dustIntensity="low"
      softEdges
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          viewport={{ margin: '-100px' }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <motion.h2
            className="mb-4 font-bold text-3xl md:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            viewport={{ margin: '-100px' }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <motion.span
              className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 bg-clip-text text-transparent"
              initial={{ backgroundPosition: '200% center' }}
              style={{ backgroundSize: '200% 100%' }}
              transition={{ delay: 0.3, duration: 1.5, ease: 'easeInOut' }}
              viewport={{ margin: '-100px' }}
              whileInView={{ backgroundPosition: '0% center' }}
            >
              Security and Privacy by Default
            </motion.span>
          </motion.h2>
          <motion.p
            className="mx-auto max-w-2xl text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            viewport={{ margin: '-100px' }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            We take your security seriously. Our platform is built with multiple
            layers of protection to keep your data safe and your conversations
            private.
          </motion.p>
        </motion.div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {securityFeatures.map((f, index) => {
            const Icon = f.icon;
            return (
              <motion.div
                initial={{ opacity: 0, y: 30, rotateY: -15 }}
                key={f.title}
                style={{ transformStyle: 'preserve-3d' }}
                transition={{
                  delay: index * 0.2,
                  duration: 0.8,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                viewport={{ margin: '-100px' }}
                whileHover={{
                  scale: 1.05,
                  rotateY: 5,
                  transition: { type: 'spring', stiffness: 300, damping: 25 },
                }}
                whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
              >
                <Card className="group relative h-full overflow-hidden border-red-500/10 bg-gradient-to-br from-background to-background/50 backdrop-blur-sm transition-all hover:border-red-500/30 hover:shadow-red-500/10 hover:shadow-xl">
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${f.gradient}`}
                    initial={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ opacity: 0.1 }}
                  />

                  <CardHeader className="relative">
                    <motion.div
                      className={`mb-3 inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${f.gradient} shadow-lg`}
                      initial={{ scale: 0.95 }}
                      transition={{
                        delay: index * 0.2 + 0.3,
                        duration: 0.4,
                        type: 'spring',
                        stiffness: 280,
                        damping: 24,
                      }}
                      viewport={{ once: true, margin: '-100px' }}
                      whileHover={{
                        scale: 1.1,
                        transition: {
                          type: 'spring',
                          stiffness: 400,
                          damping: 25,
                        },
                      }}
                      whileInView={{ scale: 1 }}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      transition={{
                        delay: index * 0.2 + 0.4,
                        duration: 0.5,
                      }}
                      viewport={{ margin: '-100px' }}
                      whileInView={{ opacity: 1, x: 0 }}
                    >
                      <CardTitle className="text-lg leading-snug">
                        {f.title}
                      </CardTitle>
                    </motion.div>
                  </CardHeader>

                  <CardContent className="relative">
                    <motion.p
                      className="text-muted-foreground text-sm leading-relaxed"
                      initial={{ opacity: 0 }}
                      transition={{
                        delay: index * 0.2 + 0.5,
                        duration: 0.5,
                      }}
                      viewport={{ once: true, margin: '-100px' }}
                      whileInView={{ opacity: 1 }}
                    >
                      {f.description}
                    </motion.p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </AnimatedSection>
  );
}

export default memo(Security);
