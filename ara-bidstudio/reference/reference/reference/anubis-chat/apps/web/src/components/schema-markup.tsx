'use client';

import Script from 'next/script';

export default function SchemaMarkup() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ANUBIS AI Chat',
    alternateName: 'anubis.chat',
    url: 'https://anubis.chat',
    logo: 'https://anubis.chat/favicon.png',
    description:
      'Advanced AI chat platform with Web3 integration and Solana wallet authentication',
    foundingDate: '2025',
    sameAs: [
      'https://twitter.com/anubischat',
      'https://github.com/symbaiex/anubis.chat',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      url: 'https://anubis.chat',
    },
  };

  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ANUBIS AI Chat',
    applicationCategory: 'AI Chat Platform',
    applicationSubCategory: 'Conversational AI',
    operatingSystem: 'Web Browser',
    description:
      'Advanced AI chat platform with premium models: GPT-5, GPT-5 Mini, Gemini 2.5 Pro, o4-mini, plus free models: GPT-OSS-20B, GLM-4.5-Air, Qwen3-Coder, Kimi K2. Features Solana wallet authentication, RAG capabilities, and Web3 integration.',
    url: 'https://anubis.chat',
    screenshot: 'https://anubis.chat/assets/hero-preview-light.png',
    paymentAccepted: ['SOL', 'Cryptocurrency', 'Credit Card'],
    author: {
      '@type': 'Organization',
      name: 'ANUBIS AI Chat',
    },
    offers: [
      {
        '@type': 'Offer',
        name: 'Free Tier',
        price: '0',
        priceCurrency: 'USD',
        description: 'Access to free AI models and basic features',
      },
      {
        '@type': 'Offer',
        name: 'Pro Tier',
        price: '9.99',
        priceCurrency: 'USD',
        description:
          'Access to premium AI models including GPT-5 and Gemini 2.5',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '9.99',
          priceCurrency: 'USD',
          unitText: 'MONTH',
        },
        additionalProperty: [
          {
            '@type': 'PropertyValue',
            name: 'Solana pricing',
            value: 'Pay in SOL at current exchange rate at checkout',
          },
        ],
      },
    ],
    featureList: [
      'Premium AI models: GPT-5, GPT-5 Mini, Gemini 2.5 Pro, o4-mini',
      'Free AI models: GPT-OSS-20B, GLM-4.5-Air, Qwen3-Coder, Kimi K2',
      'Solana wallet authentication',
      'Web3 integration',
      'RAG (Retrieval-Augmented Generation)',
      'Model switching mid-conversation',
      'Conversation history',
      'Cross-device sync',
      'Privacy-focused design',
      'No email required',
    ],
    browserRequirements: 'Modern web browser with JavaScript enabled',
    softwareVersion: '1.0',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '150',
      bestRating: '5',
      worstRating: '1',
    },
  };

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'ANUBIS AI Chat Platform',
    description:
      'Web3-native AI chat platform offering advanced conversational AI with multiple models, Solana integration, and enhanced privacy features.',
    brand: {
      '@type': 'Brand',
      name: 'ANUBIS',
    },
    category: 'AI Chat Software',
    image: 'https://anubis.chat/assets/hero-preview-light.png',
    url: 'https://anubis.chat',
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '0',
      highPrice: '9.99',
      priceCurrency: 'USD',
      offerCount: '2',
      paymentAccepted: ['SOL', 'Cryptocurrency', 'Credit Card'],
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: 'Solana pricing',
          value: 'Subscriptions can be paid in SOL (converted at checkout)',
        },
      ],
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '150',
      bestRating: '5',
      worstRating: '1',
    },
    review: [
      {
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: 'Sarah Chen',
        },
        reviewRating: {
          '@type': 'Rating',
          ratingValue: '5',
          bestRating: '5',
        },
        reviewBody:
          'anubis.chat agents execute my strategies faster than any manual workflow.',
      },
      {
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: 'Michael Roberts',
        },
        reviewRating: {
          '@type': 'Rating',
          ratingValue: '5',
          bestRating: '5',
        },
        reviewBody:
          'RAG quality is outstanding. Context retrieval feels effortless.',
      },
    ],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ANUBIS AI Chat',
    url: 'https://anubis.chat',
    description: 'Advanced AI chat platform with Web3 integration',
    publisher: {
      '@type': 'Organization',
      name: 'ANUBIS AI Chat',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://anubis.chat/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  const speakableSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'ANUBIS AI Chat',
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['#hero-title', '#features'],
    },
    url: 'https://anubis.chat',
  };

  return (
    <>
      <Script id="organization-schema" type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </Script>
      <Script id="software-application-schema" type="application/ld+json">
        {JSON.stringify(softwareApplicationSchema)}
      </Script>
      <Script id="product-schema" type="application/ld+json">
        {JSON.stringify(productSchema)}
      </Script>
      <Script id="website-schema" type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </Script>
      <Script id="speakable-schema" type="application/ld+json">
        {JSON.stringify(speakableSchema)}
      </Script>
    </>
  );
}
