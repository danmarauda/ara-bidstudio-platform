import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'anubis.chat',
    short_name: 'anubis.chat',
    description:
      'Next-generation AI chat platform with Web3 integration and RAG capabilities',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: '/favicon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/favicon/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/favicon/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
