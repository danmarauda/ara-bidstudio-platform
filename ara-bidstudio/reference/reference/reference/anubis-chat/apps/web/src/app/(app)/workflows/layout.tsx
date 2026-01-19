import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Workflows | ANUBIS AI Chat',
  description:
    'Design and orchestrate AI workflows across multiple models with Web3-native actions and Solana automation.',
  alternates: { canonical: '/workflows' },
  openGraph: {
    url: 'https://anubis.chat/workflows',
    title: 'Workflows | ANUBIS AI Chat',
    description: 'Multi-model AI automation with Web3 capabilities.',
  },
  robots: { index: true, follow: true },
};

export default function WorkflowsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
