'use client';

import LandingFooter from '@/components/landing/landingFooter';
import LandingHeader from '@/components/landing/landingHeader';
import CTA from './(landing)/components/cta';
import FAQ from './(landing)/components/faq';
import Features from './(landing)/components/features';
import Hero from './(landing)/components/hero';
import HowItWorks from './(landing)/components/howItWorks';
import Models from './(landing)/components/models';
import Pricing from './(landing)/components/pricing';
import ReferralProgram from './(landing)/components/referralProgram';
import Security from './(landing)/components/security';
import SiteLinksSection from './(landing)/components/siteLinksSection';
import Testimonials from './(landing)/components/testimonials';

export default function LandingPage() {
  return (
    <div className="w-full">
      <LandingHeader />
      <Hero />
      <Features />
      <HowItWorks />
      <Security />
      <Models />
      <Pricing />
      <ReferralProgram />
      <Testimonials />
      <FAQ />
      <CTA />
      <SiteLinksSection />
      <LandingFooter />
    </div>
  );
}
