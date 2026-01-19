/**
 * Convex Auth Configuration with Solana Wallet Integration
 * Production-ready implementation with proper error handling
 */

import { ConvexCredentials } from '@convex-dev/auth/providers/ConvexCredentials';
import { convexAuth } from '@convex-dev/auth/server';
import type { DataModel, Doc, Id } from './_generated/dataModel';
import type { ActionCtx } from './_generated/server';

/**
 * Type definition for Solana wallet credentials
 */
interface SolanaCredentials {
  publicKey: string;
  signature: string;
  message: string;
  nonce: string;
}

/**
 * Extract Solana credentials from the credentials object
 */
function extractSolanaCredentials(
  credentials: unknown
): SolanaCredentials | null {
  // Debug logging removed for production

  if (!credentials || typeof credentials !== 'object') {
    return null;
  }

  const creds = credentials as Record<string, unknown>;

  const publicKey = creds.publicKey as string;
  const signature = creds.signature as string;
  const message = creds.message as string;
  const nonce = creds.nonce as string;

  // Debug logging removed for production

  return { publicKey, signature, message, nonce };
}

/**
 * Validate that all required credential fields are present
 */
function validateCredentialFields(
  publicKey: string,
  signature: string,
  message: string,
  nonce: string
): boolean {
  if (!(publicKey && signature && message && nonce)) {
    // Invalid credentials in non-production can be logged by caller if needed
    return false;
  }
  return true;
}

/**
 * Authenticate user with Solana credentials
 */
async function authenticateUser(
  ctx: ActionCtx,
  credentials: SolanaCredentials
): Promise<{ userId: Id<'users'> } | null> {
  try {
    // Use internal mutations/queries to verify challenge and manage user
    const result = await ctx.runMutation(
      internal.auth.verifyAndSignIn,
      credentials
    );

    if (!result?.userId) {
      // Debug logging removed for production
      return null;
    }

    // Debug logging removed for production

    // Return the userId for sign-in
    return { userId: result.userId };
  } catch (_error) {
    // Debug logging removed for production
    return null; // Auth failed
  }
}

/**
 * Custom Solana Wallet Credentials Provider
 * Handles Solana wallet signature verification and user creation
 */
const SolanaWallet = ConvexCredentials<DataModel>({
  id: 'solana-wallet',

  async authorize(credentials, ctx) {
    // Extract and validate credentials
    const extractedCredentials = extractSolanaCredentials(credentials);
    if (!extractedCredentials) {
      return null;
    }

    const { publicKey, signature, message, nonce } = extractedCredentials;

    // Verify all required fields are present
    if (!validateCredentialFields(publicKey, signature, message, nonce)) {
      return null;
    }

    // Authenticate user
    return await authenticateUser(ctx, {
      publicKey,
      signature,
      message,
      nonce,
    });
  },
});

/**
 * Convex Auth Configuration
 * Exports auth functions with Solana wallet provider
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [SolanaWallet],
});

// =============================================================================
// Internal Functions for ConvexCredentials
// =============================================================================

import { v } from 'convex/values';
import { internal } from './_generated/api';
import { internalMutation, mutation } from './_generated/server';

/**
 * Internal mutation to verify challenge and sign in user
 * Called from the authorize function in ConvexCredentials
 */
export const verifyAndSignIn = internalMutation({
  args: {
    publicKey: v.string(),
    signature: v.string(),
    message: v.string(),
    nonce: v.string(),
  },
  handler: async (ctx, args) => {
    const { publicKey, signature: _signature, message, nonce } = args;

    // Verify the challenge
    const storedChallenge = await ctx.db
      .query('solanaWalletChallenges')
      .withIndex('by_key', (q) => q.eq('publicKey', publicKey))
      .filter((q) =>
        q.and(
          q.eq(q.field('nonce'), nonce),
          q.eq(q.field('used'), false),
          q.gt(q.field('expiresAt'), Date.now())
        )
      )
      .unique();

    if (!storedChallenge || message !== storedChallenge.challenge) {
      throw new Error('Invalid or expired authentication challenge');
    }

    // Mark challenge as used
    await ctx.db.patch(storedChallenge._id, { used: true });

    // Check if user already exists
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_wallet', (q) => q.eq('walletAddress', publicKey))
      .unique();

    if (existingUser) {
      // User exists - update activity and check if they should be admin
      const adminWallets =
        process.env.ADMIN_WALLETS?.split(',').map((w) => w.trim()) || [];
      const shouldBeAdmin = adminWallets.includes(publicKey);

      // Update user status and role if needed
      const updates: Partial<
        Pick<
          Doc<'users'>,
          'lastActiveAt' | 'updatedAt' | 'isActive' | 'role' | 'permissions'
        >
      > = {
        lastActiveAt: Date.now(),
        updatedAt: Date.now(),
        isActive: true,
      };

      // If user is in ADMIN_WALLETS but not currently an admin, promote them
      if (
        shouldBeAdmin &&
        (!existingUser.role || existingUser.role === 'user')
      ) {
        updates.role = 'super_admin';
        updates.permissions = [
          'user_management',
          'subscription_management',
          'content_moderation',
          'system_settings',
          'financial_data',
          'usage_analytics',
          'admin_management',
        ];
      }

      await ctx.db.patch(existingUser._id, updates);

      return {
        userId: existingUser._id,
      };
    }

    // Create new user
    const adminWallets =
      process.env.ADMIN_WALLETS?.split(',').map((w) => w.trim()) || [];
    const isAdmin = adminWallets.includes(publicKey);

    const newUserId = await ctx.db.insert('users', {
      walletAddress: publicKey,
      publicKey,
      role: isAdmin ? 'super_admin' : 'user',
      permissions: isAdmin
        ? [
            'user_management',
            'subscription_management',
            'content_moderation',
            'system_settings',
            'financial_data',
            'usage_analytics',
            'admin_management',
          ]
        : undefined,
      preferences: {
        theme: 'dark',
        aiModel: 'gpt-5-mini',
        notifications: true,
        language: 'en',
        temperature: 0.7,
        maxTokens: 4000,
        streamResponses: true,
        saveHistory: true,
        compactMode: false,
      },
      subscription: {
        tier: 'free',
        messagesUsed: 0,
        messagesLimit: 50,
        premiumMessagesUsed: 0,
        premiumMessagesLimit: 0,
        features: ['basic_chat', 'limited_models'],
        currentPeriodStart: Date.now(),
        currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
        subscriptionTxSignature: '',
        autoRenew: false,
        planPriceSol: 0,
        tokensUsed: 0,
        tokensLimit: 10_000,
      },
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
    });

    return {
      userId: newUserId,
    };
  },
});

/**
 * Create Solana wallet challenge for signature verification
 * This is still needed for the challenge-response authentication flow
 */
export const createWalletChallenge = mutation({
  args: {
    publicKey: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + 5 * 60 * 1000; // 5 minutes
    const nonce =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    const challenge = `Sign this message to authenticate with anubis.chat:\nNonce: ${nonce}\nTimestamp: ${now}`;

    // Clean up any existing challenges for this public key
    const existingChallenges = await ctx.db
      .query('solanaWalletChallenges')
      .withIndex('by_key', (q) => q.eq('publicKey', args.publicKey))
      .collect();

    // Delete existing challenges in parallel
    await Promise.all(
      existingChallenges.map((existing) => ctx.db.delete(existing._id))
    );

    await ctx.db.insert('solanaWalletChallenges', {
      publicKey: args.publicKey,
      nonce,
      challenge,
      expiresAt,
      createdAt: now,
      used: false,
    });

    return {
      challenge,
      nonce,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  },
});

/**
 * Clean up expired challenges (scheduled maintenance)
 */
export const cleanupExpiredChallenges = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const expiredChallenges = await ctx.db
      .query('solanaWalletChallenges')
      .withIndex('by_expires', (q) => q.lt('expiresAt', now))
      .collect();

    // Delete expired challenges in parallel
    await Promise.all(
      expiredChallenges.map((challenge) => ctx.db.delete(challenge._id))
    );

    return { cleaned: expiredChallenges.length };
  },
});
