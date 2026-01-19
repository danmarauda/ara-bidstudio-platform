/**
 * Authentication Middleware for anubis.chat
 * Based on latest Solana wallet patterns and August 2025 best practices
 */

import 'server-only'; // Ensure this module is never imported on the client side
import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { sign, verify } from 'jsonwebtoken';
import type { NextRequest } from 'next/server';
import nacl from 'tweetnacl';
import { getStorage } from '../database/storage';
import { corsConfig, isProduction, jwtConfig } from '../env';
import { APIErrorCode } from '../types/api';
import { createErrorResponse } from '../utils/apiResponse';
import { createModuleLogger } from '../utils/logger';

const log = createModuleLogger('auth-middleware');

// =============================================================================
// Types
// =============================================================================

export interface AuthenticatedRequest extends NextRequest {
  user: {
    walletAddress: string;
    publicKey: string;
  };
}

export interface WalletSession {
  walletAddress: string;
  publicKey: string;
  issuedAt: number;
  expiresAt: number;
}

// =============================================================================
// JWT Token Management
// =============================================================================

// JWT configuration from environment
const JWT_SECRET = jwtConfig.secret;
const _JWT_EXPIRES_IN = jwtConfig.expiresIn;

// Validate JWT secret - required for server-side operations
if (!JWT_SECRET) {
  if (isProduction) {
    throw new Error('JWT_SECRET is required in production environment');
  }
  // In development, warn but allow fallback for testing
  log.warn('JWT_SECRET not configured - authentication will not work properly');
}

// Validate JWT secret strength in production
if (isProduction && JWT_SECRET && JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production');
}

export function createJWTToken(
  walletAddress: string,
  publicKey: string
): string {
  if (!JWT_SECRET) {
    throw new Error(
      'JWT_SECRET is not configured - cannot create authentication tokens'
    );
  }

  const payload: WalletSession & { jti: string } = {
    walletAddress,
    publicKey,
    issuedAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    jti: bs58.encode(crypto.getRandomValues(new Uint8Array(16))), // Unique token ID for blacklisting
  };

  return sign(payload, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '24h',
  });
}

export async function verifyJWTToken(
  token: string
): Promise<WalletSession | null> {
  if (!JWT_SECRET) {
    log.error(
      'JWT_SECRET is not configured - cannot verify authentication tokens'
    );
    return null;
  }

  try {
    const decoded = verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    }) as unknown as WalletSession & { jti?: string };

    // Check if token is expired
    if (decoded.expiresAt < Date.now()) {
      return null;
    }

    // Check if token is blacklisted (for logout support)
    if (decoded.jti) {
      const storage = getStorage();
      const isBlacklisted = await storage.isTokenBlacklisted(decoded.jti);
      if (isBlacklisted) {
        return null;
      }
    }

    return decoded;
  } catch (error) {
    log.error('JWT verification failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

// =============================================================================
// Wallet Signature Verification
// =============================================================================

export function verifyWalletSignature(
  message: string,
  signature: string,
  publicKey: string
): boolean {
  try {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = new PublicKey(publicKey).toBytes();

    return nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );
  } catch (error) {
    log.error('Signature verification failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

// =============================================================================
// Nonce Management
// =============================================================================

export async function createNonce(publicKey: string): Promise<string> {
  // Generate cryptographically secure nonce
  const nonce = bs58.encode(crypto.getRandomValues(new Uint8Array(32)));
  const expires = Date.now() + 5 * 60 * 1000; // 5 minutes

  const storage = getStorage();
  await storage.storeNonce(publicKey, nonce, expires);

  return nonce;
}

export async function validateNonce(
  publicKey: string,
  nonce: string
): Promise<boolean> {
  const storage = getStorage();
  return await storage.validateAndRemoveNonce(publicKey, nonce);
}

// =============================================================================
// Authentication Middleware
// =============================================================================

export async function withAuth<T extends NextRequest>(
  request: T,
  handler: (req: AuthenticatedRequest) => Promise<Response>
): Promise<Response> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return createErrorResponse(
        APIErrorCode.UNAUTHORIZED,
        'Missing or invalid authorization header'
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const session = await verifyJWTToken(token);
    if (!session) {
      return createErrorResponse(
        APIErrorCode.TOKEN_EXPIRED,
        'Invalid or expired token'
      );
    }

    // Validate wallet address format
    if (!isValidSolanaAddress(session.walletAddress)) {
      return createErrorResponse(
        APIErrorCode.INVALID_TOKEN,
        'Invalid wallet address in token'
      );
    }

    // Create authenticated request
    const authenticatedRequest = Object.assign(request, {
      user: {
        walletAddress: session.walletAddress,
        publicKey: session.publicKey,
      },
    }) as AuthenticatedRequest;

    // Call the handler with authenticated request
    return await handler(authenticatedRequest);
  } catch (error) {
    log.error('Authentication middleware error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return createErrorResponse(
      APIErrorCode.INTERNAL_ERROR,
      'Authentication failed'
    );
  }
}

// =============================================================================
// Optional Authentication Middleware
// =============================================================================

export async function withOptionalAuth<T extends NextRequest>(
  request: T,
  handler: (
    req: T & { user?: { walletAddress: string; publicKey: string } }
  ) => Promise<Response>
): Promise<Response> {
  try {
    const authHeader = request.headers.get('Authorization');

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const session = await verifyJWTToken(token);

      if (session && isValidSolanaAddress(session.walletAddress)) {
        (request as any).user = {
          walletAddress: session.walletAddress,
          publicKey: session.publicKey,
        };
      }
    }

    return await handler(
      request as T & { user?: { walletAddress: string; publicKey: string } }
    );
  } catch (error) {
    // For optional auth, we continue without auth on errors
    log.error('Optional authentication error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return await handler(
      request as T & { user?: { walletAddress: string; publicKey: string } }
    );
  }
}

// =============================================================================
// Validation Helpers
// =============================================================================

export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  } catch {
    return false;
  }
}

export async function extractWalletFromRequest(
  request: NextRequest
): Promise<string | null> {
  // Try Authorization header first
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const session = await verifyJWTToken(token);
    return session?.walletAddress || null;
  }

  // Try custom wallet headers (for direct wallet integration)
  const walletAddress = request.headers.get('X-Wallet-Address');
  if (walletAddress && isValidSolanaAddress(walletAddress)) {
    return walletAddress;
  }

  return null;
}

// =============================================================================
// Rate Limiting Integration
// =============================================================================

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
}

const rateLimits = new Map<string, { count: number; resetTime: number }>();

// Periodic cleanup for expired rate limit entries (every 5 minutes)
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of rateLimits.entries()) {
      if (entry.resetTime <= now) {
        rateLimits.delete(key);
      }
    }
  },
  5 * 60 * 1000
);

export function checkRateLimit(
  walletAddress: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowStart = Math.floor(now / config.windowMs) * config.windowMs;
  const resetTime = windowStart + config.windowMs;

  const key = `${walletAddress}:${windowStart}`;
  const current = rateLimits.get(key) || { count: 0, resetTime };

  if (current.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime,
    };
  }

  // Increment counter
  current.count++;
  rateLimits.set(key, current);

  return {
    allowed: true,
    remaining: config.maxRequests - current.count,
    resetTime: current.resetTime,
  };
}

// =============================================================================
// CORS Headers for Web3 Compatibility
// =============================================================================

export function addWeb3CorsHeaders(response: Response): Response {
  const headers = new Headers(response.headers);

  headers.set('Access-Control-Allow-Origin', corsConfig.origins.join(','));
  headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
  headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Wallet-Signature, X-Wallet-Message, X-Wallet-Pubkey, X-Timestamp'
  );
  headers.set('Access-Control-Max-Age', '86400'); // 24 hours

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// =============================================================================
// JWT Token Blacklisting Support
// =============================================================================

export async function blacklistToken(token: string): Promise<boolean> {
  if (!JWT_SECRET) {
    log.error('JWT_SECRET is not configured - cannot blacklist tokens');
    return false;
  }

  try {
    const decoded = verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    }) as unknown as WalletSession & { jti?: string };

    if (!decoded.jti) {
      return false; // Cannot blacklist token without ID
    }

    const storage = getStorage();
    await storage.blacklistToken(decoded.jti, decoded.expiresAt);
    return true;
  } catch (error) {
    log.error('Token blacklisting failed', {
      token: `${token.substring(0, 20)}...`, // Log partial token for debugging
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
