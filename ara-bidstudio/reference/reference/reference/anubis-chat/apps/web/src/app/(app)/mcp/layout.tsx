import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MCP | ANUBIS AI Chat',
  description:
    'Model Context Protocol (MCP) integrations for tools and knowledge. Connect external systems and enhance agent capabilities.',
  alternates: { canonical: '/mcp' },
  openGraph: {
    url: 'https://anubis.chat/mcp',
    title: 'MCP | ANUBIS AI Chat',
    description: 'Plug-and-play MCP integrations for AI agents.',
  },
  robots: { index: true, follow: true },
};

export default function MCPLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
