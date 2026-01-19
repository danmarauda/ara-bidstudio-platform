import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://anubis.chat';
  const lastModified = new Date();

  const paths = [
    '',
    'chat',
    'agents',
    'workflows',
    'mcp',
    'referral-info',
    'roadmap',
    'subscription',
    'dashboard',
    'book-of-the-dead',
    'legal/terms',
    'legal/privacy',
    'legal/cookies',
  ];

  const makeUrl = (path: string) => (path ? `${baseUrl}/${path}` : baseUrl);

  return paths.map((path) => ({
    url: makeUrl(path),
    lastModified,
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));
}
