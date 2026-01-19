/**
 * Service Worker Registration and Management for anubis.chat
 * Handles PWA functionality with error-resistant registration
 */

import { createModuleLogger } from '@/lib/utils/logger';

// Initialize logger
const log = createModuleLogger('service-worker');

export interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

/**
 * Register the anubis.chat service worker with error handling
 */
export async function registerServiceWorker(config: ServiceWorkerConfig = {}) {
  // Only run in browser environment
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    log.info('Service Worker not supported in this environment', {
      isWindow: typeof window !== 'undefined',
      hasServiceWorker: 'serviceWorker' in navigator,
    });
    return;
  }

  try {
    // Unregister any existing service workers to prevent conflicts
    const existingRegistrations =
      await navigator.serviceWorker.getRegistrations();

    for (const registration of existingRegistrations) {
      // Only unregister if it's not our current service worker
      if (
        registration.scope !== `${window.location.origin}/` ||
        !registration.active?.scriptURL.includes('/sw.js')
      ) {
        log.info('Unregistering conflicting service worker', {
          scope: registration.scope,
          scriptURL: registration.active?.scriptURL,
        });
        await registration.unregister();
      }
    }

    // Register our service worker
    // In development, use dev-sw.js to prevent 404 errors
    const swFile =
      process.env.NODE_ENV === 'development' ? '/dev-sw.js' : '/sw.js';
    const registration = await navigator.serviceWorker.register(swFile, {
      scope: '/',
      updateViaCache: 'imports',
    });

    log.info('Service Worker registered successfully', {
      scope: registration.scope,
      updateViaCache: 'imports',
      state: registration.active?.state,
    });

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const installingWorker = registration.installing;

      if (installingWorker) {
        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content is available
              log.info('Service Worker update available', {
                state: installingWorker.state,
                hasController: !!navigator.serviceWorker.controller,
              });
              config.onUpdate?.(registration);
            } else {
              // Content is cached for first time
              log.info('Service Worker content cached', {
                state: installingWorker.state,
                hasController: !!navigator.serviceWorker.controller,
              });
              config.onSuccess?.(registration);
            }
          }
        });
      }
    });

    config.onSuccess?.(registration);
    return registration;
  } catch (error) {
    log.error('Service Worker registration failed', {
      error,
      operation: 'register_service_worker',
    });
    config.onError?.(error as Error);
    throw error;
  }
}

/**
 * Unregister all service workers
 */
export async function unregisterServiceWorkers() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();

    for (const registration of registrations) {
      log.info('Unregistering service worker', {
        scope: registration.scope,
        operation: 'unregister_all',
      });
      await registration.unregister();
    }

    log.info('All service workers unregistered', {
      count: registrations.length,
    });
  } catch (error) {
    log.error('Failed to unregister service workers', {
      error,
      operation: 'unregister_all',
    });
  }
}

/**
 * Clear all caches
 */
export async function clearCaches() {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return;
  }

  try {
    const cacheNames = await caches.keys();

    for (const cacheName of cacheNames) {
      log.info('Clearing cache', {
        cacheName,
        operation: 'clear_caches',
      });
      await caches.delete(cacheName);
    }

    log.info('All caches cleared', {
      count: cacheNames.length,
    });
  } catch (error) {
    log.error('Failed to clear caches', {
      error,
      operation: 'clear_caches',
    });
  }
}

/**
 * Send a message to the service worker
 */
export function sendMessageToServiceWorker(message: any) {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  }
}

/**
 * Development helper to reset PWA state
 */
export async function resetPWAState() {
  if (process.env.NODE_ENV !== 'development') {
    log.warn('resetPWAState called in non-development environment', {
      nodeEnv: process.env.NODE_ENV,
      operation: 'reset_pwa_state',
    });
    return;
  }

  try {
    await Promise.all([unregisterServiceWorkers(), clearCaches()]);

    log.info('PWA state reset complete - refreshing page', {
      operation: 'reset_pwa_state',
    });

    // Reload the page to ensure clean state
    window.location.reload();
  } catch (error) {
    log.error('Failed to reset PWA state', {
      error,
      operation: 'reset_pwa_state',
    });
  }
}
