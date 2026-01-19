'use client';

import { motion } from 'framer-motion';
import { Check, MessagesSquare, Rocket, Upload, Wallet } from 'lucide-react';
import { memo } from 'react';
import AnimatedSection from '@/components/landing/animated-section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const steps = [
  {
    icon: Wallet,
    title: 'Connect Wallet',
    description:
      'Sign in securely with Phantom, Solflare, or any Solana wallet.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: MessagesSquare,
    title: 'Start Chatting',
    description: 'Choose your AI model and begin conversing instantly.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Upload,
    title: 'Switch Models',
    description:
      'Seamlessly switch between GPT-5, Gemini 2.5 Pro, o4-mini, and free models instantly.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Rocket,
    title: 'Save & Continue',
    description: 'Your conversations are saved and synced across all devices.',
    color: 'from-yellow-500 to-orange-500',
  },
];

function HowItWorks() {
  return (
    <AnimatedSection
      allowOverlap
      className="-mt-px py-20 md:py-28 lg:py-32"
      data-bg-variant="primary"
      dustIntensity="low"
      parallaxY={14}
      revealCurve={[0, 0.25, 0.6, 1]}
      revealStrategy="none"
      softBottomEdge={false}
      softEdges
      softTopEdge={false}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto mb-12 max-w-3xl text-center"
          initial={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: '-50px' }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <motion.h2
            className="mb-3 font-bold text-3xl md:text-5xl"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true, margin: '-50px' }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <span className="bg-gradient-to-r from-primary via-foreground to-accent bg-clip-text text-transparent">
              Get Started in Seconds
            </span>
          </motion.h2>
          <motion.p
            className="text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true, margin: '-50px' }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            A seamless and secure onboarding experience using the power of Web3.
          </motion.p>
        </motion.div>

        {/* Progress indicator */}
        <motion.div
          className="mx-auto mb-12 flex max-w-md justify-between"
          initial={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          viewport={{ once: true, margin: '-50px' }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          {steps.map((step, index) => (
            <motion.div
              className="flex h-3 w-3 items-center justify-center rounded-full border-2 border-primary bg-primary"
              initial={{ scale: 0, opacity: 0 }}
              key={`progress-dot-${step.title}`}
              transition={{
                duration: 0.4,
                delay: 0.8 + index * 0.1,
                type: 'spring',
                stiffness: 400,
                damping: 25,
              }}
              viewport={{ once: true, margin: '-50px' }}
              whileHover={{
                scale: 1.5,
                transition: { type: 'spring', stiffness: 400, damping: 25 },
              }}
              whileInView={{ scale: 1.25, opacity: 1 }}
            >
              <motion.div
                className="h-1 w-1 rounded-full bg-primary-foreground"
                initial={{ scale: 0 }}
                transition={{ duration: 0.2, delay: 1.0 + index * 0.1 }}
                viewport={{ once: true }}
                whileInView={{ scale: 1 }}
              />
            </motion.div>
          ))}
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((item, index) => {
            const stepNumber = index + 1;

            return (
              <motion.div
                className="group"
                initial={{ opacity: 0, y: 60, rotateY: -15, scale: 0.8 }}
                key={item.title}
                style={{ transformStyle: 'preserve-3d' }}
                transition={{
                  duration: 0.8,
                  ease: [0.25, 0.46, 0.45, 0.94],
                  delay: index * 0.2,
                }}
                viewport={{ once: true, margin: '-100px' }}
                whileHover={{
                  scale: 1.05,
                  y: -10,
                  transition: { type: 'spring', stiffness: 300, damping: 25 },
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                  rotateY: 0,
                  scale: 1,
                }}
              >
                <Card className="relative h-full overflow-hidden border-primary/10 bg-gradient-to-br from-background to-background/50 backdrop-blur-sm hover:border-primary/30 hover:shadow-primary/10 hover:shadow-xl">
                  {/* Background gradient overlay */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${item.color.replace('from-', 'from-').replace('to-', 'to-')}`}
                    initial={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ opacity: 0.1 }}
                  />

                  {/* Step number badge */}
                  <motion.div
                    className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-bold text-primary-foreground text-xs"
                    initial={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                    viewport={{ once: true, margin: '-100px' }}
                    whileHover={{
                      scale: 1.2,
                      rotate: 10,
                      transition: {
                        type: 'spring',
                        stiffness: 400,
                        damping: 25,
                      },
                    }}
                    whileInView={{ scale: 1 }}
                  >
                    {stepNumber}
                  </motion.div>

                  <CardHeader className="relative pb-4">
                    {/* Icon with enhanced animations */}
                    <motion.div
                      className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} shadow-lg`}
                      initial={{ scale: 0.98 }}
                      transition={{ duration: 0.3 }}
                      viewport={{ once: true, margin: '-100px' }}
                      whileHover={{
                        scale: 1.1,
                        rotate: 10,
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                        transition: {
                          type: 'spring',
                          stiffness: 400,
                          damping: 25,
                        },
                      }}
                      whileInView={{ scale: 1 }}
                    >
                      <item.icon className="h-8 w-8 text-white" />
                    </motion.div>

                    {/* Title */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      transition={{
                        duration: 0.6,
                        delay: 0.5 + index * 0.1,
                      }}
                      viewport={{ once: true, margin: '-100px' }}
                      whileInView={{ opacity: 1, y: 0 }}
                    >
                      <CardTitle className="mb-2 text-xl">
                        {item.title}
                      </CardTitle>
                    </motion.div>
                  </CardHeader>

                  <CardContent className="relative pt-0">
                    {/* Description */}
                    <motion.p
                      className="text-muted-foreground text-sm leading-relaxed"
                      initial={{ opacity: 0, y: 10 }}
                      transition={{
                        duration: 0.8,
                        delay: 0.6 + index * 0.1,
                      }}
                      viewport={{ once: true, margin: '-100px' }}
                      whileInView={{ opacity: 1, y: 0 }}
                    >
                      {item.description}
                    </motion.p>

                    {/* Progress indicator */}
                    <motion.div
                      className="mt-4 h-1 w-full overflow-hidden rounded-full bg-muted"
                      initial={{ opacity: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: 0.7 + index * 0.1,
                      }}
                      viewport={{ once: true, margin: '-100px' }}
                      whileInView={{ opacity: 1 }}
                    >
                      <motion.div
                        className={`h-full bg-gradient-to-r ${item.color}`}
                        initial={{ width: '0%' }}
                        transition={{
                          duration: 1.2,
                          ease: 'easeOut',
                          delay: 0.8 + index * 0.1,
                        }}
                        viewport={{ once: true, margin: '-100px' }}
                        whileInView={{ width: '100%' }}
                      />
                    </motion.div>
                  </CardContent>

                  {/* Connecting arrow (except for last card) */}
                  {index < steps.length - 1 && (
                    <motion.div
                      className="-right-4 absolute top-1/2 z-10 hidden lg:block"
                      initial={{ opacity: 0, x: -10, scale: 0.8 }}
                      transition={{
                        duration: 0.6,
                        delay: 1.0 + index * 0.1,
                      }}
                      viewport={{ once: true, margin: '-100px' }}
                      whileInView={{ opacity: 1, x: 0, scale: 1 }}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary/40 bg-background shadow-lg shadow-primary/20 transition-all duration-300">
                        <motion.div
                          animate={{
                            scale: [1, 1.2, 1],
                          }}
                          className="h-2 w-2 rounded-full bg-primary"
                          transition={{
                            duration: 1.5,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: 'easeInOut',
                          }}
                        />
                      </div>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.ul
          className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-4 text-muted-foreground text-sm"
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          viewport={{ margin: '-50px' }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          {['No email required', 'Private by design', 'Export anytime'].map(
            (text, index) => (
              <motion.li
                className="inline-flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.8 }}
                key={text}
                transition={{
                  delay: 0.9 + index * 0.1,
                  duration: 0.4,
                  type: 'spring',
                  stiffness: 400,
                  damping: 25,
                }}
                viewport={{ margin: '-50px' }}
                whileInView={{ opacity: 1, scale: 1 }}
              >
                <Check className="h-4 w-4 text-primary" /> {text}
              </motion.li>
            )
          )}
        </motion.ul>
      </div>
    </AnimatedSection>
  );
}

export default memo(HowItWorks);
