/**
 * Subscription-aware Authentication Middleware
 * Extends base auth to include subscription status and usage limits
 */

import 'server-only';
import { api } from '@convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';
import type { NextRequest } from 'next/server';
import { convexConfig } from '@/lib/env';
import { APIErrorCode } from '@/lib/types/api';
import { createErrorResponse } from '@/lib/utils/apiResponse';
import { createModuleLogger } from '@/lib/utils/logger';
import { isValidSolanaAddress, verifyJWTToken } from './auth';

const log = createModuleLogger('subscription-auth-middleware');

// =============================================================================
// Types
// =============================================================================

export interface SubscriptionSession {
  walletAddress: string;
  publicKey: string;
  subscription: {
    tier: 'free' | 'pro' | 'pro_plus' | 'admin';
    messagesUsed: number;
    messagesLimit: number;
    premiumMessagesUsed: number;
    premiumMessagesLimit: number;
    currentPeriodStart: number;
    currentPeriodEnd: number;
    autoRenew: boolean;
    planPriceSol: number;
    isAdmin?: boolean;
  };
  limits: {
    canSendMessage: boolean;
    canUsePremiumModel: boolean;
    canUploadLargeFiles: boolean;
    canAccessAdvancedFeatures: boolean;
    canUseAPI: boolean;
    messagesRemaining: number;
    premiumMessagesRemaining: number;
  };
}

export interface SubscriptionAuthenticatedRequest extends NextRequest {
  user: SubscriptionSession;
}

// =============================================================================
// Subscription Verification
// =============================================================================

type AllowedTier = SubscriptionSession['subscription']['tier'];

function isAllowedTier(value: unknown): value is AllowedTier {
  return (
    value === 'free' ||
    value === 'pro' ||
    value === 'pro_plus' ||
    value === 'admin'
  );
}

type SubscriptionLike = {
  tier: string;
  messagesUsed: number;
  messagesLimit: number;
  premiumMessagesUsed: number;
  premiumMessagesLimit: number;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  autoRenew: boolean;
  planPriceSol: number;
  isAdmin?: boolean;
};

function toSubscription(
  raw: unknown
): SubscriptionSession['subscription'] {
  // Be permissive in parsing to avoid runtime failures when backend evolves
  const obj = (raw ?? {}) as Partial<Record<string, unknown>>;

  const tierString = typeof obj.tier === 'string' ? obj.tier : 'free';
  const tier: AllowedTier = isAllowedTier(tierString) ? tierString : 'free';

  const toNumber = (value: unknown, fallback = 0): number =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;

  return {
    tier,
    messagesUsed: toNumber(obj.messagesUsed),
    messagesLimit: toNumber(obj.messagesLimit),
    premiumMessagesUsed: toNumber(obj.premiumMessagesUsed),
    premiumMessagesLimit: toNumber(obj.premiumMessagesLimit),
    currentPeriodStart: toNumber(obj.currentPeriodStart),
    currentPeriodEnd: toNumber(obj.currentPeriodEnd),
    autoRenew: Boolean(obj.autoRenew),
    planPriceSol: toNumber(obj.planPriceSol),
    isAdmin: typeof obj.isAdmin === 'boolean' ? obj.isAdmin : undefined,
  } satisfies SubscriptionLike as SubscriptionSession['subscription'];
}

async function getSubscriptionStatus(walletAddress: string) {
  try {
    const convexUrl = convexConfig.publicUrl;
    if (!convexUrl) {
      throw new Error(
        'NEXT_PUBLIC_CONVEX_URL environment variable is required'
      );
    }

    const convexClient = new ConvexHttpClient(convexUrl);

    const subscription = await convexClient.query(
      api.subscriptions.getSubscriptionStatus,
      {}
    );

    if (!subscription) {
      // Create default free subscription if none exists
      await convexClient.mutation(
        api.subscriptions.initializeUserSubscription,
        {}
      );

      // Retry getting the subscription
      const newSubscription = await convexClient.query(
        api.subscriptions.getSubscriptionStatus,
        {}
      );

      return newSubscription;
    }

    return subscription;
  } catch (error) {
    log.error('Failed to get subscription status', {
      walletAddress,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

function calculateLimits(subscription: SubscriptionSession['subscription']) {
  const isAdmin = subscription.tier === 'admin' || subscription.isAdmin;

  // Admins have unlimited access
  if (isAdmin) {
    return {
      canSendMessage: true,
      canUsePremiumModel: true,
      canUploadLargeFiles: true,
      canAccessAdvancedFeatures: true,
      canUseAPI: true,
      messagesRemaining: Number.MAX_SAFE_INTEGER,
      premiumMessagesRemaining: Number.MAX_SAFE_INTEGER,
    };
  }

  const messagesRemaining = Math.max(
    0,
    subscription.messagesLimit - subscription.messagesUsed
  );
  const premiumMessagesRemaining = Math.max(
    0,
    subscription.premiumMessagesLimit - subscription.premiumMessagesUsed
  );

  return {
    canSendMessage: messagesRemaining > 0,
    canUsePremiumModel:
      premiumMessagesRemaining > 0 && subscription.tier !== 'free',
    canUploadLargeFiles: subscription.tier === 'pro_plus',
    canAccessAdvancedFeatures: subscription.tier === 'pro_plus',
    canUseAPI: subscription.tier === 'pro_plus',
    messagesRemaining,
    premiumMessagesRemaining,
  };
}

// =============================================================================
// Authentication Result Types
// =============================================================================

export interface AuthResult {
  success: boolean;
  walletAddress?: string;
  publicKey?: string;
  subscription?: SubscriptionSession['subscription'];
  limits?: SubscriptionSession['limits'];
  error?: string;
  errorCode?: APIErrorCode;
}

// =============================================================================
// Core Authentication Functions
// =============================================================================

export async function verifyAuthToken(
  request: NextRequest
): Promise<AuthResult> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Missing or invalid authorization header',
        errorCode: APIErrorCode.UNAUTHORIZED,
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const session = await verifyJWTToken(token);
    if (!session) {
      return {
        success: false,
        error: 'Invalid or expired token',
        errorCode: APIErrorCode.TOKEN_EXPIRED,
      };
    }

    // Validate wallet address format
    if (!isValidSolanaAddress(session.walletAddress)) {
      return {
        success: false,
        error: 'Invalid wallet address in token',
        errorCode: APIErrorCode.INVALID_TOKEN,
      };
    }

    // Get subscription status
    const subscription = await getSubscriptionStatus(session.walletAddress);
    if (!subscription) {
      return {
        success: false,
        error: 'Subscription status not found',
        errorCode: APIErrorCode.INTERNAL_ERROR,
      };
    }

    const normalized = toSubscription(subscription);
    const limits = calculateLimits(normalized);

    return {
      success: true,
      walletAddress: session.walletAddress,
      publicKey: session.publicKey,
      subscription: normalized,
      limits,
    };
  } catch (error) {
    log.error('Token verification error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: 'Authentication failed',
      errorCode: APIErrorCode.INTERNAL_ERROR,
    };
  }
}

// =============================================================================
// Subscription-Aware Middleware
// =============================================================================

export async function withSubscriptionAuth<T extends NextRequest>(
  request: T,
  handler: (req: SubscriptionAuthenticatedRequest) => Promise<Response>
): Promise<Response> {
  const authResult = await verifyAuthToken(request);

  if (!authResult.success) {
    return createErrorResponse(
      authResult.errorCode || APIErrorCode.UNAUTHORIZED,
      authResult.error || 'Authentication required'
    );
  }

  // Create subscription-aware authenticated request
  const authenticatedRequest = Object.assign(request, {
    user: {
      walletAddress: authResult.walletAddress!,
      publicKey: authResult.publicKey!,
      subscription: authResult.subscription!,
      limits: authResult.limits!,
    },
  }) as SubscriptionAuthenticatedRequest;

  try {
    return await handler(authenticatedRequest);
  } catch (error) {
    log.error('Subscription auth middleware error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return createErrorResponse(
      APIErrorCode.INTERNAL_ERROR,
      'Request processing failed'
    );
  }
}

// =============================================================================
// Feature-Specific Middleware
// =============================================================================

export async function requireMessagesRemaining<T extends NextRequest>(
  request: T,
  handler: (req: SubscriptionAuthenticatedRequest) => Promise<Response>
): Promise<Response> {
  return withSubscriptionAuth(request, async (req) => {
    // Admin users always have messages remaining
    const isAdmin =
      req.user.subscription.tier === 'admin' || req.user.subscription.isAdmin;

    if (!(isAdmin || req.user.limits.canSendMessage)) {
      return createErrorResponse(
        APIErrorCode.QUOTA_EXCEEDED,
        'Message limit reached for current subscription tier',
        {
          details: {
            messagesRemaining: req.user.limits.messagesRemaining,
            tier: req.user.subscription.tier,
            nextReset: req.user.subscription.currentPeriodEnd,
          },
        }
      );
    }

    return handler(req);
  });
}

export async function requirePremiumAccess<T extends NextRequest>(
  request: T,
  handler: (req: SubscriptionAuthenticatedRequest) => Promise<Response>
): Promise<Response> {
  return withSubscriptionAuth(request, async (req) => {
    // Admin users always have premium access
    const isAdmin =
      req.user.subscription.tier === 'admin' || req.user.subscription.isAdmin;

    if (!(isAdmin || req.user.limits.canUsePremiumModel)) {
      return createErrorResponse(
        APIErrorCode.FORBIDDEN,
        'Premium model access requires Pro or Pro+ subscription',
        {
          details: {
            currentTier: req.user.subscription.tier,
            premiumMessagesRemaining: req.user.limits.premiumMessagesRemaining,
            requiredTier: 'pro',
          },
        }
      );
    }

    return handler(req);
  });
}

export async function requireProPlusAccess<T extends NextRequest>(
  request: T,
  feature: 'large_files' | 'api_access' | 'advanced_features',
  handler: (req: SubscriptionAuthenticatedRequest) => Promise<Response>
): Promise<Response> {
  return withSubscriptionAuth(request, async (req) => {
    const hasAccess =
      req.user.subscription.tier === 'pro_plus' ||
      req.user.subscription.tier === 'admin' ||
      req.user.subscription.isAdmin === true;

    if (!hasAccess) {
      const featureNames = {
        large_files: 'Large file uploads',
        api_access: 'API access',
        advanced_features: 'Advanced features',
      };

      return createErrorResponse(
        APIErrorCode.FORBIDDEN,
        `${featureNames[feature]} requires Pro+ subscription`,
        {
          details: {
            currentTier: req.user.subscription.tier,
            requiredTier: 'pro_plus',
            feature,
          },
        }
      );
    }

    return handler(req);
  });
}

// =============================================================================
// Usage Tracking Middleware
// =============================================================================

export async function trackMessageUsage<T extends NextRequest>(
  request: T,
  isPremiumModel: boolean,
  handler: (req: SubscriptionAuthenticatedRequest) => Promise<Response>
): Promise<Response> {
  return withSubscriptionAuth(request, async (req) => {
    // Skip all checks for admin users
    const isAdmin =
      req.user.subscription.tier === 'admin' || req.user.subscription.isAdmin;

    if (!isAdmin) {
      // Check if user can send message
      if (!req.user.limits.canSendMessage) {
        return createErrorResponse(
          APIErrorCode.QUOTA_EXCEEDED,
          'Message limit reached'
        );
      }

      // Check premium model access
      if (isPremiumModel && !req.user.limits.canUsePremiumModel) {
        return createErrorResponse(
          APIErrorCode.FORBIDDEN,
          'Premium model access not available for current tier'
        );
      }
    }

    try {
      // Execute the handler first
      const response = await handler(req);

      // Only track usage on successful responses (skip for admin users)
      if (response.ok && !isAdmin) {
        // Track message usage asynchronously (don't block the response)
        const convexUrl = convexConfig.publicUrl;
        if (convexUrl) {
          const convexClient = new ConvexHttpClient(convexUrl);

          // Fire and forget - don't await to avoid blocking response
          convexClient
            .mutation(api.subscriptions.trackMessageUsage, {
              isPremiumModel,
            })
            .catch((error) => {
              log.error('Failed to track message usage', {
                walletAddress: req.user.walletAddress,
                isPremiumModel,
                error: error instanceof Error ? error.message : String(error),
              });
            });
        }
      }

      return response;
    } catch (error) {
      log.error('Message usage tracking error', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  });
}

// =============================================================================
// Utility Functions
// =============================================================================

export async function getUserSubscriptionStatus(walletAddress: string) {
  try {
    const raw = await getSubscriptionStatus(walletAddress);
    const subscription = toSubscription(raw);
    const limits = calculateLimits(subscription);

    return {
      subscription,
      limits,
      success: true,
    };
  } catch (error) {
    log.error('Failed to get user subscription status', {
      walletAddress,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      subscription: null,
      limits: null,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
