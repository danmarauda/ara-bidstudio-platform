'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { LogoWithText } from '@/components/ui/logo';

export default function SiteLinksSection() {
  return (
    <section className="relative border-border/40 border-t bg-background">
      {/* Neutral cover to mask any preceding section gradients */}
      <div
        aria-hidden
        className="-top-8 pointer-events-none absolute inset-x-0 h-8 bg-background"
      />
      <div className="relative mx-auto w-full max-w-7xl px-4 pt-10 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Left visual — logo mark with green glow */}
          <div className="relative flex items-center justify-center">
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
            >
              {/* Base ambient gradient */}
              <span
                aria-hidden
                className="-inset-2 pointer-events-none absolute rounded-full blur-md"
                style={{
                  background:
                    'radial-gradient(closest-side, rgba(16,185,129,0.12), transparent 70%)',
                }}
              />
              {/* Subtle breathing highlight */}
              <motion.span
                animate={{ scale: [1, 1.02, 1], opacity: [0.18, 0.25, 0.18] }}
                aria-hidden
                className="-inset-1 pointer-events-none absolute rounded-full"
                style={{
                  background:
                    'radial-gradient(closest-side, rgba(16,185,129,0.10), transparent 60%)',
                }}
                transition={{
                  duration: 6,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'easeInOut',
                }}
              />
              <Image
                alt="Anubis mark"
                className="relative drop-shadow-[0_0_5px_rgba(16,185,129,0.06)]"
                height={128}
                priority={false}
                src="/assets/logoNoText.png"
                width={128}
              />
            </motion.div>
          </div>
          <div>
            <LogoWithText size="md" textVariant="gradient" />
            <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
              Wallet-native AI chat built for the decentralized web.
            </p>
          </div>
          <div>
            <h4 className="mb-3 font-medium text-sm">Product</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>
                <Link className="hover:text-primary" href="#features">
                  Features
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary" href="#pricing">
                  Pricing
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary" href="#faq">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-medium text-sm">Company</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>
                <Link className="hover:text-primary" href="/referral-info">
                  Referral Program
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary" href="/roadmap">
                  Roadmap
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary" href="/anubis-token">
                  $ANUBIS Token
                </Link>
              </li>
              <li>
                <a
                  className="hover:text-primary"
                  href="mailto:hello@anubis.chat"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-medium text-sm">Legal</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>
                <Link className="hover:text-primary" href="/legal/terms">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary" href="/legal/privacy">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary" href="/legal/cookies">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        {/* Final separator to match the section width */}
        <div className="mt-8 h-px w-full bg-border/40" />
      </div>
    </section>
  );
}
