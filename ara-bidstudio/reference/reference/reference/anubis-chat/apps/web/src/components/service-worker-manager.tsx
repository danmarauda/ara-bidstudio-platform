'use client';

import { useEffect } from 'react';
import { registerServiceWorker, resetPWAState } from '@/lib/service-worker';
import { createModuleLogger } from '@/lib/utils/logger';

// Initialize logger
const log = createModuleLogger('service-worker-manager');

export default function ServiceWorkerManager() {
  useEffect(() => {
    // Register service worker on mount
    registerServiceWorker({
      onUpdate: (registration) => {
        log.info('Service Worker update available', {
          scope: registration.scope,
          state: registration.active?.state,
        });
        // Optionally show update notification to user
      },
      onSuccess: (registration) => {
        log.info('PWA ready for offline use', {
          scope: registration.scope,
          state: registration.active?.state,
        });
      },
      onError: (error) => {
        log.error('Service Worker registration failed', {
          error,
          operation: 'register_in_component',
        });
      },
    });

    // Development helper - expose reset function globally
    if (process.env.NODE_ENV === 'development') {
      // Safely extend window for development debugging
      interface WindowWithPWA extends Window {
        resetPWA?: () => Promise<void>;
      }
      (window as WindowWithPWA).resetPWA = resetPWAState;
      log.debug('Development mode PWA reset available', {
        nodeEnv: process.env.NODE_ENV,
        resetFunction: 'window.resetPWA()',
      });
    }
  }, []);

  return null; // This component doesn't render anything
}
