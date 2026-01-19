/**
 * HTTP Authentication Middleware for Convex HTTP Actions
 * Provides JWT validation and rate limiting for HTTP endpoints
 */

import { getAuthUserId } from '@convex-dev/auth/server';
import { api } from './_generated/api';
import type { Doc } from './_generated/dataModel';
import type { ActionCtx } from './_generated/server';
import { createModuleLogger } from './utils/logger';

const logger = createModuleLogger('httpAuth');

// Rate limiting configuration
const RATE_LIMITS: Record<string, { requests: number; window: number }> = {
  // Per endpoint limits (requests per minute)
  '/stream-chat': { requests: 60, window: 60_000 }, // 60 req/min (legacy)
  '/generateUploadUrl': { requests: 10, window: 60_000 }, // 10 uploads/min
  '/verify-payment': { requests: 5, window: 60_000 }, // 5 payments/min
  default: { requests: 100, window: 60_000 }, // 100 req/min default
  // Note: WebSocket streaming uses Convex's built-in rate limiting
};

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Authenticate HTTP request using Convex Auth
 * Returns user document if authenticated, null otherwise
 */
export async function authenticateHttpRequest(
  ctx: ActionCtx,
  request: Request
): Promise<Doc<'users'> | null> {
  try {
    // Extract bearer token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      logger.warn('Missing or invalid Authorization header');
      return null;
    }

    // Get user ID from Convex Auth
    // Note: This requires proper JWT configuration in Convex Auth
    const userId = await getAuthUserId(ctx as any);
    if (!userId) {
      logger.warn('Invalid or expired auth token');
      return null;
    }

    // Fetch user document using the internal query
    const user = await ctx.runQuery(api.users.getUserById, { userId });

    if (!user?.isActive) {
      logger.warn('User not found or inactive', { userId });
      return null;
    }

    logger.info('HTTP request authenticated', {
      userId: user._id,
      walletAddress: user.walletAddress,
    });

    return user as Doc<'users'>;
  } catch (error) {
    logger.error('HTTP authentication error', error);
    return null;
  }
}

/**
 * Check rate limits for a given endpoint and user
 * Returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(
  endpoint: string,
  identifier: string // Can be userId, IP, or walletAddress
): boolean {
  const limit = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
  const key = `${endpoint}:${identifier}`;
  const now = Date.now();

  const current = rateLimitStore.get(key);

  // Check if we need to reset the window
  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + limit.window,
    });
    return true;
  }

  // Check if limit exceeded
  if (current.count >= limit.requests) {
    logger.warn('Rate limit exceeded', {
      endpoint,
      identifier,
      count: current.count,
    });
    return false;
  }

  // Increment counter
  current.count++;
  rateLimitStore.set(key, current);
  return true;
}

/**
 * Clean up expired rate limit entries (call periodically)
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(
  endpoint: string,
  identifier: string
): Record<string, string> {
  const limit = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
  const key = `${endpoint}:${identifier}`;
  const current = rateLimitStore.get(key);

  if (!current) {
    return {
      'X-RateLimit-Limit': String(limit.requests),
      'X-RateLimit-Remaining': String(limit.requests),
      'X-RateLimit-Reset': String(Date.now() + limit.window),
    };
  }

  return {
    'X-RateLimit-Limit': String(limit.requests),
    'X-RateLimit-Remaining': String(
      Math.max(0, limit.requests - current.count)
    ),
    'X-RateLimit-Reset': String(current.resetAt),
  };
}

/**
 * Create authenticated HTTP response with proper headers
 */
export function createAuthenticatedResponse(
  body: any,
  status: number,
  origin: string | null,
  rateLimitHeaders?: Record<string, string>
): Response {
  const ALLOWED_ORIGINS = [
    'https://www.anubis.chat',
    'https://anubis.chat',
    'https://anubis-chat-web.vercel.app',
    process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : null,
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
  ].filter(Boolean) as string[];

  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);
  const allowedOrigin = isAllowed ? origin : ALLOWED_ORIGINS[0];

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    ...rateLimitHeaders,
  };

  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers,
  });
}

/**
 * Validate request body against expected schema
 */
export function validateRequestBody<T>(
  body: unknown,
  schema: {
    [K in keyof T]: {
      type: 'string' | 'number' | 'boolean' | 'object' | 'array';
      required?: boolean;
      validator?: (value: unknown) => boolean;
    };
  }
): T | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const validated: Partial<T> = {};

  for (const [key, config] of Object.entries(schema)) {
    const value = (body as Record<string, unknown>)[key];
    const configTyped = config as {
      type: 'string' | 'number' | 'boolean' | 'object' | 'array';
      required?: boolean;
      validator?: (value: unknown) => boolean;
    };

    // Check required fields
    if (configTyped.required && value === undefined) {
      logger.warn('Missing required field', { field: key });
      return null;
    }

    // Skip optional undefined fields
    if (value === undefined) {
      continue;
    }

    // Type validation
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== configTyped.type) {
      logger.warn('Invalid field type', {
        field: key,
        expected: configTyped.type,
        actual: actualType,
      });
      return null;
    }

    // Custom validation
    if (configTyped.validator && !configTyped.validator(value)) {
      logger.warn('Field validation failed', { field: key });
      return null;
    }

    (validated as Record<string, unknown>)[key] = value;
  }

  return validated as T;
}

// Cleanup rate limits every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 5 * 60 * 1000);
}
