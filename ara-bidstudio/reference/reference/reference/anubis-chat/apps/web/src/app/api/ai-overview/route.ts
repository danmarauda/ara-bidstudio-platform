import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export function GET() {
  const payload = {
    name: 'ANUBIS AI Chat',
    website: 'https://anubis.chat',
    categories: ['AI Chat', 'Agents', 'Web3', 'Solana'],
    models: [
      'gpt-5',
      'gpt-5-mini',
      'o4-mini',
      'gpt-4.1-mini',
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
      'claude-3.7-sonnet',
      'claude-3.5-sonnet',
      'claude-3.5-haiku',
      'claude-sonnet-4',
      'claude-opus-4.1',
      'deepseek-chat',
      'llama-3.1-70b-instruct',
      'gpt-oss-20b',
      'glm-4.5-air',
      'qwen3-coder',
      'kimi-k2',
    ],
    features: [
      'Solana wallet auth',
      'Agent workflows',
      'RAG',
      'Privacy-first (no email)',
    ],
    pricing: {
      currency: 'USD',
      solanaAccepted: true,
      tiers: [
        { name: 'Free', monthlyUSD: 0 },
        { name: 'Pro', monthlyUSD: 9.99 },
      ],
      notes:
        'SOL payments supported; converted at current exchange rate at checkout',
    },
  };

  return NextResponse.json(payload, { status: 200 });
}
