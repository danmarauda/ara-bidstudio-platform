'use client';

import { Github, Twitter } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

export default function LandingFooter() {
  return (
    <footer className="fixed right-0 bottom-0 left-0 z-50 border-border/50 border-t bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="relative mx-auto flex h-10 w-full max-w-7xl items-center justify-between px-4">
        {/* Left - Domain */}
        <div className="flex items-center">
          <Logo
            animation="gradient"
            asLink={false}
            className="text-foreground/70"
            size="sm"
            textVariant="gradient"
          />
        </div>

        {/* Center - Credit */}
        <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2">
          <span className="text-foreground/70 text-sm">
            Anubis by{' '}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text font-semibold text-transparent">
              <a
                href="https://x.com/symbiex"
                rel="noopener noreferrer"
                target="_blank"
              >
                SYMBaiEX
              </a>
            </span>
          </span>
        </div>

        {/* Right - Social Icons */}
        <div className="flex items-center gap-3">
          <Link
            aria-label="Twitter"
            className="text-foreground/60 transition-colors duration-200 hover:text-primary"
            href="https://x.com/AnubisChat"
            rel="noopener noreferrer"
            target="_blank"
          >
            <Twitter className="h-4 w-4" />
          </Link>
          <Link
            aria-label="GitHub"
            className="text-foreground/60 transition-colors duration-200 hover:text-primary"
            href="https://github.com/SYMBaiEX/anubis.chat"
            rel="noopener noreferrer"
            target="_blank"
          >
            <Github className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
