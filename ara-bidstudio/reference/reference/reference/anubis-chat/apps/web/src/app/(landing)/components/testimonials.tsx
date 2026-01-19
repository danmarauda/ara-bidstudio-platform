'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import Script from 'next/script';
import { memo } from 'react';
import AnimatedSection from '@/components/landing/animated-section';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'DeFi Trader',
    content:
      'anubis.chat agents execute my strategies faster than any manual workflow.',
    rating: 5,
  },
  {
    name: 'Michael Roberts',
    role: 'Data Scientist',
    content: 'RAG quality is outstanding. Context retrieval feels effortless.',
    rating: 5,
  },
  {
    name: 'Emma Wilson',
    role: 'Product Manager',
    content: 'The wallet‑native UX is exactly what our users expect.',
    rating: 5,
  },
];

function Testimonials() {
  // Generate review schema markup
  const reviewSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'ANUBIS AI Chat',
    review: testimonials.map((testimonial) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: testimonial.name,
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: testimonial.rating.toString(),
        bestRating: '5',
        worstRating: '1',
      },
      reviewBody: testimonial.content,
    })),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: testimonials.length.toString(),
      bestRating: '5',
      worstRating: '1',
    },
  };

  return (
    <>
      <Script id="testimonials-schema" type="application/ld+json">
        {JSON.stringify(reviewSchema)}
      </Script>
      <AnimatedSection
        allowOverlap
        className="py-20 md:py-28 lg:py-32"
        data-bg-variant="gold"
        dustIntensity="low"
        id="testimonials"
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
            viewport={{ once: true, margin: '-50px' }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <motion.h2
              className="mb-4 font-bold text-3xl md:text-4xl"
              initial={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              viewport={{ once: true, margin: '-50px' }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <span className="bg-gradient-to-r from-primary via-yellow-500 to-orange-500 bg-clip-text text-transparent">
                Loved by Builders, Trusted by Innovators
              </span>
            </motion.h2>
            <motion.p
              className="mx-auto max-w-2xl text-muted-foreground"
              initial={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              viewport={{ once: true, margin: '-50px' }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              Hear what our community has to say about their experience with
              ANUBIS.
            </motion.p>
          </motion.div>
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((t, index) => (
              <motion.div
                initial={{ opacity: 0, y: 50, rotateY: -15 }}
                key={t.name}
                style={{ transformStyle: 'preserve-3d' }}
                transition={{
                  duration: 0.7,
                  delay: index * 0.2,
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                }}
                viewport={{ once: true, margin: '-100px' }}
                whileHover={{
                  scale: 1.05,
                  y: -10,
                  rotateY: 5,
                  transition: { type: 'spring', stiffness: 400, damping: 25 },
                }}
                whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
              >
                <Card className="group relative h-full overflow-hidden border-primary/10 bg-gradient-to-br from-background to-background/50 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-primary/10 hover:shadow-xl">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-orange-500/5"
                    initial={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ opacity: 1 }}
                  />
                  <CardHeader className="relative">
                    <motion.div
                      className="flex gap-1"
                      initial={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.5, delay: 0.6 + index * 0.2 }}
                      viewport={{ once: true }}
                      whileInView={{ opacity: 1, scale: 1 }}
                    >
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <motion.div
                          initial={{ opacity: 0, scale: 0, rotate: -180 }}
                          key={`${t.name}-star-${i}`}
                          transition={{
                            duration: 0.4,
                            delay: 0.8 + index * 0.2 + i * 0.1,
                            type: 'spring',
                            stiffness: 400,
                            damping: 20,
                          }}
                          viewport={{ once: true }}
                          whileHover={{
                            scale: 1.2,
                            rotate: 360,
                            transition: { duration: 0.3 },
                          }}
                          whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                        >
                          <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                        </motion.div>
                      ))}
                    </motion.div>
                  </CardHeader>
                  <CardContent className="relative">
                    <motion.p
                      className="mb-4 font-semibold text-lg"
                      initial={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.6, delay: 1.0 + index * 0.2 }}
                      viewport={{ once: true }}
                      whileInView={{ opacity: 1, y: 0 }}
                    >
                      "{t.content}"
                    </motion.p>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.6, delay: 1.2 + index * 0.2 }}
                      viewport={{ once: true }}
                      whileInView={{ opacity: 1, y: 0 }}
                    >
                      <p className="font-semibold">{t.name}</p>
                      <p className="text-muted-foreground text-sm">{t.role}</p>
                    </motion.div>
                  </CardContent>

                  {/* Floating elements */}
                  <motion.div
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    className="absolute top-4 right-4 h-2 w-2 rounded-full bg-gradient-to-r from-primary to-orange-500"
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: index * 0.5,
                    }}
                  />
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>
    </>
  );
}

export default memo(Testimonials);
