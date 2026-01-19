// Anubis Chat Service Worker
// This is a basic service worker for Anubis Chat platform

const CACHE_NAME = 'anubis-chat-v1';
const STATIC_CACHE = 'anubis-chat-static-v1';

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll([
        '/',
        '/favicon.ico',
        '/favicon/apple-touch-icon.png',
        '/favicon/web-app-manifest-192x192.png',
        '/favicon/web-app-manifest-512x512.png',
      ]);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE;
          })
          .map((cacheName) => {
            return caches.delete(cacheName);
          })
      );
    })
  );
  // Take control immediately
  self.clients.claim();
});

// Fetch event - network first for dynamic content, cache first for static
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip API routes - always go to network
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Skip browser extension requests
  if (
    url.origin.includes('extension://') ||
    url.pathname.includes('solanaActionsContentScript') ||
    url.pathname.includes('contentScript') ||
    url.pathname.includes('injected.js')
  ) {
    return;
  }

  // Skip Vite development server requests (shouldn't happen in production)
  if (
    url.pathname.startsWith('/@vite/') ||
    url.pathname.startsWith('/@react-refresh') ||
    url.pathname.startsWith('/@vite-plugin-pwa/') ||
    url.pathname === '/src/main.tsx'
  ) {
    return;
  }

  // Handle static assets
  if (
    url.pathname.includes('/favicon/') ||
    url.pathname === '/favicon.ico' ||
    url.pathname === '/manifest.webmanifest'
  ) {
    event.respondWith(
      caches.match(request).then((response) => {
        return (
          response ||
          fetch(request).then((fetchResponse) => {
            // Cache successful responses
            if (fetchResponse.ok) {
              const responseClone = fetchResponse.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return fetchResponse;
          })
        );
      })
    );
    return;
  }

  // For other requests, try network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses for same-origin requests
        if (response.ok && url.origin === self.location.origin) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache on network failure
        return caches.match(request);
      })
  );
});

// Message event - handle commands from the app
self.addEventListener('message', (event) => {
  const { command } = event.data || {};

  switch (command) {
    case 'skipWaiting':
      self.skipWaiting();
      break;
    case 'clearCache':
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      });
      break;
    default:
    // Unknown command - no action needed
  }
});
