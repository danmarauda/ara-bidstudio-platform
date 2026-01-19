'use client';

import { motion } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';
import { memo } from 'react';
import AnimatedSection from '@/components/landing/animated-section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const models = [
  { name: 'GPT-5', provider: 'OpenAI', tier: 'Premium' },
  { name: 'GPT-5 Mini', provider: 'OpenAI', tier: 'Premium' },
  { name: 'Gemini 2.5 Pro', provider: 'Google', tier: 'Premium' },
  { name: 'o4-mini', provider: 'OpenAI', tier: 'Premium' },
  { name: 'GPT-OSS-20B', provider: 'OpenRouter', tier: 'Free' },
  { name: 'GLM-4.5-Air', provider: 'OpenRouter', tier: 'Free' },
  { name: 'Qwen3-Coder', provider: 'OpenRouter', tier: 'Free' },
  { name: 'Kimi K2', provider: 'OpenRouter', tier: 'Free' },
];

function getTierStyles(tier: string) {
  if (tier === 'Free') {
    return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400';
  }
  if (tier === 'Premium') {
    return 'border-purple-500/20 bg-purple-500/10 text-purple-400';
  }
  return 'border-blue-500/20 bg-blue-500/10 text-blue-400';
}

function Models() {
  return (
    <AnimatedSection
      allowOverlap
      className="py-20 md:py-28 lg:py-32"
      data-bg-variant="primary"
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
              className="bg-gradient-to-r from-accent via-foreground to-primary bg-clip-text text-transparent"
              initial={{ backgroundPosition: '200% center' }}
              style={{ backgroundSize: '200% 100%' }}
              transition={{ delay: 0.3, duration: 1.5, ease: 'easeInOut' }}
              viewport={{ margin: '-100px' }}
              whileInView={{ backgroundPosition: '0% center' }}
            >
              A Universe of Intelligence at Your Fingertips
            </motion.span>
          </motion.h2>
          <motion.p
            className="mx-auto max-w-2xl text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            viewport={{ margin: '-100px' }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            Seamlessly switch between the world's most powerful AI models to
            find the perfect one for any task.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {models.map((m, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              key={m.name}
              transition={{
                delay: index * 0.1,
                duration: 0.5,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              viewport={{ margin: '-50px' }}
              whileHover={{
                scale: 1.05,
                y: -5,
                transition: { type: 'spring', stiffness: 400, damping: 25 },
              }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
            >
              <Card className="group relative h-full overflow-hidden border-primary/10 bg-gradient-to-br from-background to-background/50 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-primary/10 hover:shadow-xl">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/5"
                  initial={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ opacity: 1 }}
                />

                <CardHeader className="relative p-4 pb-2">
                  <motion.div
                    className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent/50 to-primary/80 shadow-lg"
                    initial={{ scale: 0, rotate: -90 }}
                    transition={{
                      delay: index * 0.1 + 0.2,
                      duration: 0.6,
                      type: 'spring',
                      stiffness: 300,
                      damping: 25,
                    }}
                    viewport={{ margin: '-50px' }}
                    whileHover={{
                      scale: 1.1,
                      rotate: 10,
                      transition: {
                        type: 'spring',
                        stiffness: 400,
                        damping: 25,
                      },
                    }}
                    whileInView={{ scale: 1, rotate: 0 }}
                  >
                    <BrainCircuit className="h-5 w-5 text-white" />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    transition={{
                      delay: index * 0.1 + 0.3,
                      duration: 0.5,
                    }}
                    viewport={{ margin: '-50px' }}
                    whileInView={{ opacity: 1, x: 0 }}
                  >
                    <CardTitle className="text-base leading-tight md:text-lg">
                      {m.name}
                    </CardTitle>
                  </motion.div>
                </CardHeader>

                <CardContent className="relative p-4 pt-0">
                  <motion.p
                    className="text-muted-foreground text-xs md:text-sm"
                    initial={{ opacity: 0 }}
                    transition={{
                      delay: index * 0.1 + 0.4,
                      duration: 0.5,
                    }}
                    viewport={{ margin: '-50px' }}
                    whileInView={{ opacity: 1 }}
                  >
                    {m.provider}
                  </motion.p>
                  <motion.span
                    className={`mt-2 inline-block rounded-full border px-2 py-0.5 font-medium text-[10px] md:text-xs ${getTierStyles(
                      m.tier
                    )}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    transition={{
                      delay: index * 0.1 + 0.5,
                      duration: 0.4,
                      type: 'spring',
                      stiffness: 400,
                      damping: 25,
                    }}
                    viewport={{ margin: '-50px' }}
                    whileInView={{ opacity: 1, scale: 1 }}
                  >
                    {m.tier}
                  </motion.span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-8 flex items-center justify-center gap-2 text-muted-foreground text-sm"
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 1, duration: 0.6 }}
          viewport={{ margin: '-50px' }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <motion.span
            initial={{ opacity: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            viewport={{ margin: '-50px' }}
            whileInView={{ opacity: 1 }}
          >
            Hot-swap models anytime during a conversation.
          </motion.span>
        </motion.div>
      </div>
    </AnimatedSection>
  );
}

export default memo(Models);
