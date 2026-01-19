import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subscription | ANUBIS AI Chat',
  description: 'Manage your ANUBIS AI Chat plan and premium model access.',
  alternates: { canonical: '/subscription' },
  openGraph: {
    url: 'https://anubis.chat/subscription',
    title: 'Subscription | ANUBIS AI Chat',
    description: 'Upgrade for premium AI models and features.',
  },
  robots: { index: true, follow: true },
};

export default function SubscriptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
