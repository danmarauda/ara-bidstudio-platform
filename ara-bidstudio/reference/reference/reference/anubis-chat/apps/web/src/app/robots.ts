import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const host = 'https://anubis.chat';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/account',
          '/book-of-the-dead/',
          '/_next/',
          '/private/',
        ],
      },
      {
        userAgent: 'GPTBot',
        allow: ['/', '/.well-known/'],
        disallow: ['/api/', '/admin/', '/dashboard/', '/account', '/private/'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/', '/.well-known/'],
        disallow: ['/api/', '/admin/', '/dashboard/', '/account', '/private/'],
      },
      {
        userAgent: 'Claude-Web',
        allow: ['/', '/.well-known/'],
        disallow: ['/api/', '/admin/', '/dashboard/', '/account', '/private/'],
      },
    ],
    sitemap: `${host}/sitemap.xml`,
    host,
  };
}
