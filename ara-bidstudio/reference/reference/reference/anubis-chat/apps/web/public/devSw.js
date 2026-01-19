// Development service worker placeholder
// This file prevents 404 errors in development mode
// The actual PWA service worker is generated at build time

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  /* no-op in development */
});
