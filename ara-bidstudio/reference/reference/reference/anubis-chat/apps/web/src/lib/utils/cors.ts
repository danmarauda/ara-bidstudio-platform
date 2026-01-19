/**
 * CORS Utility for anubis.chat API Routes
 * Provides secure CORS configuration with environment-based origin validation
 */

import { NextResponse } from 'next/server';
import { corsConfig } from '@/lib/env';

// =============================================================================
// CORS Configuration
// =============================================================================

// Regex patterns for development localhost validation
const LOCALHOST_PATTERN = /^https?:\/\/localhost(:\d+)?$/;

/**
 * Validates if an origin is allowed based on environment configuration
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) {
    return false;
  }

  // In development, allow localhost variants
  if (
    process.env.NODE_ENV === 'development' &&
    LOCALHOST_PATTERN.test(origin)
  ) {
    return true;
  }

  // Check against configured allowed origins
  return corsConfig.origins.includes(origin);
}

/**
 * Gets the appropriate CORS origin header value
 */
export function getCorsOrigin(requestOrigin: string | null): string {
  // Never use wildcard in production
  if (process.env.NODE_ENV === 'production') {
    return isOriginAllowed(requestOrigin) ? (requestOrigin ?? 'null') : 'null';
  }

  // In development, allow wildcard only if no specific origins configured
  if (corsConfig.origins.length === 1 && corsConfig.origins[0] === '*') {
    return '*';
  }

  // Return specific origin if allowed
  return isOriginAllowed(requestOrigin) ? (requestOrigin ?? 'null') : 'null';
}

// =============================================================================
// CORS Headers Configuration
// =============================================================================

export interface CorsOptions {
  methods?: string[];
  headers?: string[];
  credentials?: boolean;
  maxAge?: number;
}

const DEFAULT_CORS_OPTIONS: CorsOptions = {
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  headers: [
    'Content-Type',
    'Authorization',
    'X-Wallet-Signature',
    'X-Wallet-Message',
    'X-Wallet-Pubkey',
    'X-Timestamp',
    'X-Requested-With',
  ],
  credentials: corsConfig.credentials,
  maxAge: 86_400, // 24 hours
};

/**
 * Adds secure CORS headers to a response
 */
export function addCorsHeaders(
  response: NextResponse,
  requestOrigin: string | null,
  options: CorsOptions = {}
): NextResponse {
  const corsOptions = { ...DEFAULT_CORS_OPTIONS, ...options };
  const allowedOrigin = getCorsOrigin(requestOrigin);

  // Only set origin if it's allowed
  if (allowedOrigin !== 'null') {
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  }

  response.headers.set(
    'Access-Control-Allow-Methods',
    corsOptions.methods?.join(', ') ??
      DEFAULT_CORS_OPTIONS.methods?.join(', ') ??
      'GET, POST, PUT, DELETE, OPTIONS'
  );

  response.headers.set(
    'Access-Control-Allow-Headers',
    corsOptions.headers?.join(', ') ??
      DEFAULT_CORS_OPTIONS.headers?.join(', ') ??
      'Content-Type, Authorization'
  );

  if (corsOptions.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  response.headers.set(
    'Access-Control-Max-Age',
    String(corsOptions.maxAge ?? DEFAULT_CORS_OPTIONS.maxAge ?? 0)
  );

  return response;
}

/**
 * Creates a preflight OPTIONS response with CORS headers
 */
export function createCorsPreflightResponse(
  requestOrigin: string | null,
  options: CorsOptions = {}
): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  return addCorsHeaders(response, requestOrigin, options);
}

// =============================================================================
// Security Headers
// =============================================================================

/**
 * Adds comprehensive security headers to a response
 */
export function addSecurityHeaders(
  response: NextResponse,
  requestOrigin: string | null = null,
  options: CorsOptions = {}
): NextResponse {
  // Add CORS headers
  addCorsHeaders(response, requestOrigin, options);

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // CSP for API endpoints
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none';"
  );

  return response;
}

// =============================================================================
// Streaming Response CORS
// =============================================================================

/**
 * Gets secure headers for streaming responses (SSE)
 */
export function getStreamingHeaders(
  requestOrigin: string | null,
  options: CorsOptions = {}
): Record<string, string> {
  const corsOptions = { ...DEFAULT_CORS_OPTIONS, ...options };
  const allowedOrigin = getCorsOrigin(requestOrigin);

  const headers: Record<string, string> = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Connection: 'keep-alive',
    'X-Content-Type-Options': 'nosniff',
  };

  // Only set CORS headers if origin is allowed
  if (allowedOrigin !== 'null') {
    headers['Access-Control-Allow-Origin'] = allowedOrigin;
    headers['Access-Control-Allow-Methods'] =
      corsOptions.methods?.join(', ') ??
      DEFAULT_CORS_OPTIONS.methods?.join(', ') ??
      'GET, POST, PUT, DELETE, OPTIONS';
    headers['Access-Control-Allow-Headers'] =
      corsOptions.headers?.join(', ') ??
      DEFAULT_CORS_OPTIONS.headers?.join(', ') ??
      'Content-Type, Authorization';

    if (corsOptions.credentials) {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
  }

  return headers;
}

// =============================================================================
// CORS Middleware Helper
// =============================================================================

/**
 * Higher-order function to wrap API handlers with CORS support
 */
export function withCors<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
  corsOptions: CorsOptions = {}
) {
  return async (...args: T): Promise<NextResponse> => {
    const request = args[0] as Request;
    const origin = request.headers.get('origin');

    try {
      const response = await handler(...args);
      return addSecurityHeaders(response, origin, corsOptions);
    } catch (_error) {
      // Create error response with proper CORS headers
      const errorResponse = NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
      return addSecurityHeaders(errorResponse, origin, corsOptions);
    }
  };
}
