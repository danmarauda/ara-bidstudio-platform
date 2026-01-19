/**
 * Convex Database Client
 * Simple client for API route integration with Convex backend
 */

import { api } from '@convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';
import { convexConfig } from '@/lib/env';

// Environment validation
if (!convexConfig.publicUrl) {
  throw new Error('NEXT_PUBLIC_CONVEX_URL environment variable is required');
}

// Create a singleton Convex client instance
const convex = new ConvexHttpClient(convexConfig.publicUrl);

export { convex, api };
