import Script from 'next/script';

interface StructuredDataProps {
  data: Record<string, any>;
}

/**
 * Component for adding structured data (JSON-LD) to pages
 * Improves SEO by providing machine-readable information
 */
export function StructuredData({ data }: StructuredDataProps) {
  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  );
}

// Pre-configured structured data for common pages
export const websiteStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'ANUBIS AI Chat',
  applicationCategory: 'CommunicationApplication',
  operatingSystem: 'Any',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '150',
  },
  description: 'Advanced AI chat platform with Web3 integration and multiple AI models',
  url: 'https://anubis.chat',
  image: 'https://anubis.chat/assets/hero-preview-dark.png',
  author: {
    '@type': 'Organization',
    name: 'ANUBIS AI',
    url: 'https://anubis.chat',
  },
  potentialAction: {
    '@type': 'UseAction',
    target: 'https://anubis.chat/chat',
  },
};

export const organizationStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ANUBIS AI',
  url: 'https://anubis.chat',
  logo: 'https://anubis.chat/favicon.png',
  description: 'Web3-native AI chat platform with Solana integration',
  sameAs: [
    'https://twitter.com/anubischat',
    'https://github.com/anubischat',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'support@anubis.chat',
  },
};

export const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What AI models does ANUBIS support?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'ANUBIS supports premium models like GPT-5, GPT-5 Mini, Gemini 2.5 Pro, and o4-mini, plus free models including GPT-OSS-20B, GLM-4.5-Air, Qwen3-Coder, and Kimi K2.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does Web3 integration work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'ANUBIS integrates with Solana wallets for authentication and supports blockchain-based features for enhanced privacy and security.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is ANUBIS free to use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, ANUBIS offers free models for all users. Premium models are available through subscription plans.',
      },
    },
  ],
};