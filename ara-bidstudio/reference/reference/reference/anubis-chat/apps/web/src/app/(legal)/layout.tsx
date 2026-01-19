'use client';

import AnimatedSection from '@/components/landing/animated-section';
import LandingFooter from '@/components/landing/landingFooter';
import LandingHeader from '@/components/landing/landingHeader';
import SiteLinksSection from '../(landing)/components/siteLinksSection';

export default function LegalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative h-full w-full">
      <div className="relative z-10">
        <LandingHeader />
        <main className="w-full flex-1">
          <AnimatedSection
            allowOverlap
            auroraVariant="gold"
            className="isolate overflow-visible px-4 py-20 text-center sm:px-6 md:py-28 lg:px-8"
            dustIntensity="low"
            parallaxY={20}
            revealStrategy="none"
            softEdges
          >
            <div className="relative z-10 mx-auto w-full max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 to-orange-500/10 px-3 py-1 backdrop-blur-sm md:mb-6">
                <span className="font-medium text-primary text-xs tracking-wide">
                  Legal
                </span>
              </div>
              <h1 className="mt-1 mb-3 font-bold text-4xl sm:text-5xl md:mt-2 md:mb-4 md:text-6xl">
                <span className="bg-gradient-to-r from-black via-primary to-primary bg-clip-text text-transparent dark:from-white dark:via-primary dark:to-primary">
                  Policies and Terms
                </span>
              </h1>
              <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
                Learn how we operate, protect your data, and what to expect when
                using anubis.chat.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection
            auroraVariant="primary"
            className="px-4 py-10 sm:px-6 lg:px-8"
            dustIntensity="low"
            parallaxY={8}
            revealStrategy="inview"
            softEdges
          >
            <div className="relative z-10 mx-auto w-full max-w-5xl">
              <div className="relative">
                <div className="-inset-4 pointer-events-none absolute rounded-2xl">
                  <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(60%_40%_at_50%_50%,rgba(34,197,94,0.10)_0%,rgba(34,197,94,0.05)_40%,transparent_85%)] opacity-50 blur-[10px]" />
                </div>

                <div className="relative rounded-2xl border border-primary/15 bg-background/70 p-6 backdrop-blur-md sm:p-8 lg:p-10">
                  {children}
                </div>
              </div>
            </div>
          </AnimatedSection>
        </main>
        <div className="h-px w-full bg-transparent" id="footer-trigger" />
        <SiteLinksSection />
        <LandingFooter />
      </div>
    </div>
  );
}
