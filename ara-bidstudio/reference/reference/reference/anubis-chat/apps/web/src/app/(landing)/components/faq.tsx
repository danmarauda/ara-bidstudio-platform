'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import Script from 'next/script';
import { useState } from 'react';
import AnimatedSection from '@/components/landing/animated-section';
import { cn } from '@/lib/utils';

const faqs = [
  {
    q: 'Do I need an email to sign up?',
    a: 'No. Simply connect your Solana wallet to start chatting. No email or password required.',
  },
  {
    q: 'Which AI models are available?',
    a: 'Premium models: GPT-5, GPT-5 Mini, Gemini 2.5 Pro, and o4-mini. Free models: GPT-OSS-20B, GLM-4.5-Air, Qwen3-Coder, and Kimi K2.',
  },
  {
    q: 'Which wallets are supported?',
    a: 'Phantom, Solflare, Backpack, and all standard Solana wallets are supported.',
  },
  {
    q: 'Can I switch between models during a conversation?',
    a: 'Yes! You can seamlessly switch between any available model mid-conversation.',
  },
  {
    q: 'Is my conversation history saved?',
    a: 'Yes. All conversations are saved and synced across your devices when you sign in with your wallet.',
  },
  {
    q: 'What makes this different from ChatGPT?',
    a: 'Web3-native authentication, multiple AI models in one place, Egyptian-themed UI, and SOL-based payments.',
  },
];

function FAQ() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Generate FAQ schema markup
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };

  return (
    <>
      <Script id="faq-schema" type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </Script>
      <AnimatedSection
        allowOverlap
        className="py-20 md:py-28 lg:py-32"
        data-bg-variant="primary"
        dustIntensity="low"
        id="faq"
        revealStrategy="none"
        softEdges
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto mb-16 text-center"
            initial={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
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
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Frequently Asked Questions
              </span>
            </motion.h2>
            <motion.p
              className="mx-auto max-w-2xl text-muted-foreground"
              initial={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              viewport={{ once: true, margin: '-50px' }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              Have questions? We've got answers. If you can't find what you're
              looking for, feel free to reach out to our support team.
            </motion.p>
          </motion.div>
          <div className="mx-auto max-w-4xl">
            <div className="space-y-4">
              {faqs.map((item, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  key={item.q}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                    type: 'spring',
                    stiffness: 400,
                    damping: 25,
                  }}
                  viewport={{ once: true, margin: '-50px' }}
                  whileInView={{ opacity: 1, y: 0 }}
                >
                  <motion.button
                    className="group w-full cursor-pointer rounded-xl border border-border/40 bg-gradient-to-br from-background to-muted/20 p-4 text-left transition-all hover:border-primary/40 hover:shadow-md"
                    onClick={() =>
                      setExpandedFaq(expandedFaq === index ? null : index)
                    }
                    type="button"
                    whileHover={{
                      scale: 1.02,
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                      transition: {
                        type: 'spring',
                        stiffness: 400,
                        damping: 25,
                      },
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <h3
                        className={cn(
                          'pr-4 font-semibold transition-colors',
                          expandedFaq === index
                            ? 'text-primary'
                            : 'text-foreground'
                        )}
                      >
                        {item.q}
                      </h3>
                      <motion.div
                        animate={{
                          rotate: expandedFaq === index ? 180 : 0,
                          scale: expandedFaq === index ? 1.1 : 1,
                        }}
                        className="shrink-0"
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 25,
                        }}
                      >
                        <ChevronDown
                          className={cn(
                            'h-5 w-5 transition-colors',
                            expandedFaq === index
                              ? 'text-primary'
                              : 'text-muted-foreground group-hover:text-primary'
                          )}
                        />
                      </motion.div>
                    </div>

                    <AnimatePresence initial={false}>
                      {expandedFaq === index && (
                        <motion.div
                          animate={{
                            height: 'auto',
                            opacity: 1,
                            marginTop: 12,
                          }}
                          exit={{
                            height: 0,
                            opacity: 0,
                            marginTop: 0,
                          }}
                          initial={{ height: 0, opacity: 0 }}
                          style={{ overflow: 'hidden' }}
                          transition={{
                            duration: 0.3,
                            ease: [0.25, 0.46, 0.45, 0.94],
                          }}
                        >
                          <motion.div
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            initial={{ y: -10, opacity: 0 }}
                            transition={{ duration: 0.2, delay: 0.1 }}
                          >
                            <p className="text-muted-foreground leading-relaxed">
                              {item.a}
                            </p>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </AnimatedSection>
    </>
  );
}

export default FAQ;
