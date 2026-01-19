import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Roadmap | ANUBIS AI Chat',
  description: 'Follow features in development for ANUBIS AI Chat and agents.',
  alternates: { canonical: '/roadmap' },
  openGraph: {
    url: 'https://anubis.chat/roadmap',
    title: 'Roadmap | ANUBIS AI Chat',
    description: 'See what’s next for ANUBIS.',
  },
  robots: { index: true, follow: true },
};

export default function RoadmapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
