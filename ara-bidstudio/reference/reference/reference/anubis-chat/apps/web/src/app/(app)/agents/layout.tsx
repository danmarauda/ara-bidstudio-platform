import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agents | ANUBIS AI Chat',
  description:
    'Create and manage autonomous AI agents. Configure tools, memory, and workflows for premium and free AI models.',
  alternates: { canonical: '/agents' },
  openGraph: {
    url: 'https://anubis.chat/agents',
    title: 'Agents | ANUBIS AI Chat',
    description: 'Build and run autonomous AI agents with Web3 integrations.',
  },
  robots: { index: true, follow: true },
};

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
