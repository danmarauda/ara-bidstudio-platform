import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat | ANUBIS AI Chat',
  description:
    'Chat with premium models (GPT-5, GPT-5 Mini, Gemini 2.5 Pro, o4-mini) and free models (GPT-OSS-20B, GLM-4.5-Air, Qwen3-Coder, Kimi K2). Web3-native with Solana wallet authentication.',
  alternates: { canonical: '/chat' },
  openGraph: {
    url: 'https://anubis.chat/chat',
    title: 'Chat | ANUBIS AI Chat',
    description:
      'Multi-model AI chat with Web3-native authentication and Solana integration.',
  },
  robots: { index: true, follow: true },
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
