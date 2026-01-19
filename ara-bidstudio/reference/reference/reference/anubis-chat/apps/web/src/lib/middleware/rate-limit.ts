/**
 * Rate Limiting Middleware for anubis.chat
 * Based on wallet addresses and August 2025 best practices
 */

import type { NextRequest } from 'next/server';
import { rateLimitConfig } from '../env';
import { addRateLimitHeaders, rateLimitResponse } from '../utils/apiResponse';
import { createModuleLogger } from '../utils/logger';
import { extractWalletFromRequest } from './auth';

const log = createModuleLogger('rate-limit-middleware');

// =============================================================================
// Extended Request Interface
// =============================================================================

interface ExtendedNextRequest extends NextRequest {
  ip?: string;
}

// =============================================================================
// Types
// =============================================================================

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: NextRequest) => string;
  onLimitReached?: (key: string, request: NextRequest) => void;
}

export interface RateLimitInfo {
  totalHits: number;
  totalHitsRemaining: number;
  resetTime: Date;
  retryAfter?: number;
}

// =============================================================================
// In-Memory Store (Production should use Redis)
// =============================================================================

interface RateLimitEntry {
  totalHits: number;
  resetTime: Date;
}

class MemoryStore {
  private store = new Map<string, RateLimitEntry>();

  get(key: string): RateLimitEntry | undefined {
    const entry = this.store.get(key);

    // Remove expired entries
    if (entry && entry.resetTime < new Date()) {
      this.store.delete(key);
      return;
    }

    return entry;
  }

  set(key: string, value: RateLimitEntry): void {
    this.store.set(key, value);
  }

  increment(key: string, windowMs: number): RateLimitEntry {
    const _now = new Date();
    const resetTime = new Date(Date.now() + windowMs);

    let entry = this.get(key);

    if (entry) {
      entry.totalHits++;
    } else {
      entry = { totalHits: 1, resetTime };
    }

    this.set(key, entry);
    return entry;
  }

  cleanup(): void {
    const now = new Date();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key);
      }
    }
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  entries(): IterableIterator<[string, RateLimitEntry]> {
    return this.store.entries();
  }
}

const store = new MemoryStore();

// Cleanup expired entries every 5 minutes
setInterval(() => store.cleanup(), 5 * 60 * 1000);

// =============================================================================
// Rate Limit Configurations
// =============================================================================

export const rateLimitConfigs = {
  // Authentication endpoints
  auth: {
    windowMs:
      process.env.NODE_ENV === 'development' ? 60 * 1000 : 15 * 60 * 1000, // 1 minute in dev, 15 minutes in prod
    maxRequests: process.env.NODE_ENV === 'development' ? 50 : 10, // 50 attempts in dev, 10 in prod
  },

  // Message sending
  messages: {
    windowMs: rateLimitConfig.windowMs,
    maxRequests: Math.floor(rateLimitConfig.maxRequests * 0.3), // 30% of global limit
  },

  // Chat operations
  chats: {
    windowMs: rateLimitConfig.windowMs,
    maxRequests: Math.floor(rateLimitConfig.maxRequests * 0.6), // 60% of global limit
  },

  // AI requests
  ai: {
    windowMs: rateLimitConfig.windowMs,
    maxRequests: Math.floor(rateLimitConfig.maxRequests * 0.2), // 20% of global limit
  },

  // Document uploads
  documents: {
    windowMs: rateLimitConfig.windowMs,
    maxRequests: Math.floor(rateLimitConfig.maxRequests * 0.1), // 10% of global limit
  },

  // Search requests
  search: {
    windowMs: rateLimitConfig.windowMs,
    maxRequests: rateLimitConfig.maxRequests, // Full global limit
  },

  // General API
  general: {
    windowMs: rateLimitConfig.windowMs,
    maxRequests: rateLimitConfig.maxRequests,
  },

  // Premium tier limits (higher)
  premium: {
    windowMs: rateLimitConfig.windowMs,
    maxRequests: rateLimitConfig.maxRequests * 5, // 5x the general limit
  },
} as const;

// =============================================================================
// Default Key Generators
// =============================================================================

export const keyGenerators = {
  // Rate limit by wallet address
  wallet: (request: NextRequest): string => {
    const walletAddress = extractWalletFromRequest(request);
    return walletAddress
      ? `wallet:${walletAddress}`
      : `ip:${getClientIP(request)}`;
  },

  // Rate limit by IP address
  ip: (request: NextRequest): string => {
    return `ip:${getClientIP(request)}`;
  },

  // Combined wallet + endpoint
  walletEndpoint: (request: NextRequest): string => {
    const walletAddress = extractWalletFromRequest(request);
    const endpoint = request.nextUrl.pathname;
    const key = walletAddress
      ? `wallet:${walletAddress}`
      : `ip:${getClientIP(request)}`;
    return `${key}:${endpoint}`;
  },

  // Global rate limit
  global: (_request: NextRequest): string => {
    return 'global';
  },
};

// =============================================================================
// Rate Limiting Middleware
// =============================================================================

export function createRateLimiter(options: RateLimitOptions) {
  return async function rateLimitMiddleware(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<Response>
  ): Promise<Response> {
    const {
      windowMs,
      maxRequests,
      skipSuccessfulRequests = false,
      skipFailedRequests = false,
      keyGenerator = keyGenerators.wallet,
      onLimitReached,
    } = options;

    const key = keyGenerator(request);
    const entry = store.increment(key, windowMs);

    const totalHitsRemaining = Math.max(0, maxRequests - entry.totalHits);
    const isLimitExceeded = entry.totalHits > maxRequests;

    const _rateLimitInfo: RateLimitInfo = {
      totalHits: entry.totalHits,
      totalHitsRemaining,
      resetTime: entry.resetTime,
      retryAfter: isLimitExceeded
        ? Math.ceil((entry.resetTime.getTime() - Date.now()) / 1000)
        : undefined,
    };

    // Check if limit is exceeded
    if (isLimitExceeded) {
      if (onLimitReached) {
        onLimitReached(key, request);
      }

      const retryAfter = Math.ceil(
        (entry.resetTime.getTime() - Date.now()) / 1000
      );
      const response = rateLimitResponse(
        'Too many requests, please try again later',
        retryAfter
      );

      return addRateLimitHeaders(
        response,
        maxRequests,
        totalHitsRemaining,
        Math.floor(entry.resetTime.getTime() / 1000)
      );
    }

    // Execute the handler
    const response: Response = await handler(request);

    // Skip counting based on response status
    const shouldSkip =
      (skipSuccessfulRequests && response.status < 400) ||
      (skipFailedRequests && response.status >= 400);

    if (shouldSkip && entry.totalHits > 0) {
      // Decrement the counter if we're skipping
      entry.totalHits--;
      store.set(key, entry);
    }

    // Add rate limit headers to response
    return addRateLimitHeaders(
      response,
      maxRequests,
      Math.max(0, maxRequests - entry.totalHits),
      Math.floor(entry.resetTime.getTime() / 1000)
    );
  };
}

// =============================================================================
// Preset Rate Limiters
// =============================================================================

export const authRateLimit = createRateLimiter({
  ...rateLimitConfigs.auth,
  keyGenerator: keyGenerators.ip, // Auth by IP to prevent wallet enumeration
});

export const messageRateLimit = createRateLimiter({
  ...rateLimitConfigs.messages,
  keyGenerator: keyGenerators.wallet,
  skipFailedRequests: true, // Don't count failed validations
});

export const chatRateLimit = createRateLimiter({
  ...rateLimitConfigs.chats,
  keyGenerator: keyGenerators.wallet,
});

export const aiRateLimit = createRateLimiter({
  ...rateLimitConfigs.ai,
  keyGenerator: keyGenerators.wallet,
  onLimitReached: (key, request) => {
    log.warn('AI rate limit exceeded', {
      key,
      url: request.url,
      timestamp: new Date().toISOString(),
    });
  },
});

export const documentRateLimit = createRateLimiter({
  ...rateLimitConfigs.documents,
  keyGenerator: keyGenerators.wallet,
});

export const searchRateLimit = createRateLimiter({
  ...rateLimitConfigs.search,
  keyGenerator: keyGenerators.wallet,
  skipFailedRequests: true,
});

export const generalRateLimit = createRateLimiter({
  ...rateLimitConfigs.general,
  keyGenerator: keyGenerators.wallet,
});

// =============================================================================
// Tier-Based Rate Limiting
// =============================================================================

export interface UserTier {
  tier: 'free' | 'pro' | 'enterprise';
  limits: {
    messagesPerMinute: number;
    aiRequestsPerMinute: number;
    documentsPerMinute: number;
    searchesPerMinute: number;
  };
}

const tierLimits: Record<string, UserTier['limits']> = {
  free: {
    messagesPerMinute: 30,
    aiRequestsPerMinute: 20,
    documentsPerMinute: 5,
    searchesPerMinute: 50,
  },
  pro: {
    messagesPerMinute: 100,
    aiRequestsPerMinute: 60,
    documentsPerMinute: 20,
    searchesPerMinute: 200,
  },
  enterprise: {
    messagesPerMinute: 500,
    aiRequestsPerMinute: 200,
    documentsPerMinute: 100,
    searchesPerMinute: 1000,
  },
};

export function createTierRateLimit(limitType: keyof UserTier['limits']) {
  return async function tierRateLimitMiddleware(
    request: NextRequest & { user?: { tier?: string } },
    handler: (req: NextRequest) => Promise<Response>
  ): Promise<Response> {
    const userTier = (request as any).user?.tier || 'free';
    const limits = tierLimits[userTier];
    const maxRequests = limits[limitType];

    const rateLimiter = createRateLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests,
      keyGenerator: keyGenerators.wallet,
    });

    return rateLimiter(request, handler);
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

function getClientIP(request: ExtendedNextRequest): string {
  // Try various headers for client IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (clientIP) {
    return clientIP;
  }

  // Fallback to connection remote address
  return request.ip || 'unknown';
}

// =============================================================================
// Monitoring and Analytics
// =============================================================================

export function getRateLimitStats(key: string): RateLimitInfo | null {
  const entry = store.get(key);

  if (!entry) {
    return null;
  }

  return {
    totalHits: entry.totalHits,
    totalHitsRemaining: Math.max(
      0,
      rateLimitConfigs.general.maxRequests - entry.totalHits
    ),
    resetTime: entry.resetTime,
  };
}

export function clearRateLimit(key: string): void {
  store.delete(key);
}

export function getAllRateLimits(): Array<{
  key: string;
  info: RateLimitInfo;
}> {
  const results: Array<{ key: string; info: RateLimitInfo }> = [];

  for (const [key, entry] of store.entries()) {
    if (entry.resetTime >= new Date()) {
      results.push({
        key,
        info: {
          totalHits: entry.totalHits,
          totalHitsRemaining: 0, // Would need limit context to calculate
          resetTime: entry.resetTime,
        },
      });
    }
  }

  return results;
}
