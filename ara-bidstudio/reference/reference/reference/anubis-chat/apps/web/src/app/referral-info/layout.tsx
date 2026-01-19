import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Referral Program | ANUBIS AI Chat',
  description:
    'Invite builders and earn rewards with the ANUBIS referral program.',
  alternates: { canonical: '/referral-info' },
  openGraph: {
    url: 'https://anubis.chat/referral-info',
    title: 'Referral Program | ANUBIS AI Chat',
    description: 'Share ANUBIS AI Chat and earn.',
  },
  robots: { index: true, follow: true },
};

export default function ReferralLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
