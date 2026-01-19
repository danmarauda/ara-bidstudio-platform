'use client';

import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { ModeToggle } from '@/components/mode-toggle';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { LogoWithText } from '@/components/ui/logo';
import { cn } from '@/lib/utils';

const menuItems = [
  { name: 'Home', href: '/' },
  { name: 'Referral Info', href: '/referral-info' },
  { name: 'Roadmap', href: '/roadmap' },
  { name: '$ANUBIS Token', href: '/anubis-token' },
];

export default function LandingHeader() {
  const { isAuthenticated } = useAuthContext();
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  React.useEffect(() => {
    setMenuState(false);
  }, [pathname]);

  return (
    <header>
      <nav
        className="group fixed top-0 right-0 left-0 z-50 px-2"
        data-state={menuState && 'active'}
      >
        <div
          className={cn(
            'mx-auto mt-2 max-w-7xl px-4 transition-all duration-300 lg:px-8',
            isScrolled && 'rounded-2xl border bg-background/60 backdrop-blur-lg'
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full justify-between lg:w-auto">
              <Link
                aria-label="anubis.chat Home"
                className="inline-flex items-center gap-2"
                href={isAuthenticated ? '/dashboard' : '/'}
                onClick={() => setMenuState(false)}
              >
                <span className="relative inline-flex items-center justify-center">
                  {/* Subtle layered glow */}
                  <span
                    aria-hidden
                    className="-inset-1 pointer-events-none absolute rounded-full blur-sm"
                    style={{
                      background:
                        'radial-gradient(closest-side, rgba(16,185,129,0.10), transparent 70%)',
                    }}
                  />
                  <motion.span
                    animate={{
                      scale: [1, 1.02, 1],
                      opacity: [0.16, 0.22, 0.16],
                    }}
                    aria-hidden
                    className="-inset-0.5 pointer-events-none absolute rounded-full"
                    style={{
                      background:
                        'radial-gradient(closest-side, rgba(16,185,129,0.08), transparent 60%)',
                    }}
                    transition={{
                      duration: 6,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: 'easeInOut',
                    }}
                  />
                  <Image
                    alt="Anubis mark"
                    className="relative drop-shadow-[0_0_4px_rgba(16,185,129,0.06)]"
                    height={60}
                    src="/assets/logoNoText.png"
                    width={60}
                  />
                </span>
                <LogoWithText
                  animation="gradient"
                  asLink={false}
                  size="md"
                  textVariant="gradient"
                />
              </Link>

              <button
                aria-label={menuState === true ? 'Close Menu' : 'Open Menu'}
                className="-m-2.5 -mr-4 relative z-20 block cursor-pointer p-2.5 lg:hidden"
                onClick={() => setMenuState(!menuState)}
                type="button"
              >
                <Menu className="m-auto size-6 in-data-[state=active]:rotate-180 duration-200 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0" />
                <X className="-rotate-180 absolute inset-0 m-auto size-6 scale-0 opacity-0 duration-200 group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100" />
              </button>
            </div>

            {/* Center nav (desktop) */}
            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <ul className="flex gap-8 text-sm">
                {menuItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.name}>
                      <Link
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'block border-transparent border-b-2 pb-1 text-muted-foreground duration-150 hover:border-primary hover:text-accent-foreground',
                          isActive && 'border-primary text-foreground'
                        )}
                        href={item.href}
                      >
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Actions & mobile expanded menu */}
            <div className="mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border bg-background p-6 shadow-2xl shadow-zinc-300/20 group-data-[state=active]:block md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none lg:group-data-[state=active]:flex dark:shadow-none dark:lg:bg-transparent">
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {menuItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                    return (
                      <li key={item.name}>
                        <Link
                          aria-current={isActive ? 'page' : undefined}
                          className={cn(
                            'block border-transparent border-b-2 pb-1 text-muted-foreground duration-150 hover:border-primary hover:text-accent-foreground',
                            isActive && 'border-primary text-foreground'
                          )}
                          href={item.href}
                          onClick={() => setMenuState(false)}
                        >
                          <span>{item.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:gap-3 md:w-fit">
                <ModeToggle />
                <Button asChild size="sm">
                  <Link
                    href={isAuthenticated ? '/dashboard' : '/auth'}
                    onClick={() => setMenuState(false)}
                  >
                    <span>
                      {isAuthenticated ? 'Open Dashboard' : 'Enter App'}
                    </span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
