/**
 * Enhanced Referral System with Auto-Scaling Commission & Direct Payouts
 * Features tier-based commission scaling (3-5%) and competitive leaderboards
 */

import { v } from 'convex/values';
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server';
import { getCurrentUser, requireAuth } from './authHelpers';

// =============================================================================
// Commission Tier System (3% to 5% scaling)
// =============================================================================

/**
 * Calculate dynamic commission rate based on total referrals
 * Base: 3%, increases by 0.2% every 5 referrals, caps at 5%
 */
export function calculateCommissionRate(totalReferrals: number): number {
  const baseRate = 0.03; // 3%
  const maxRate = 0.05; // 5%
  const increment = 0.002; // 0.2%
  const referralsPerTier = 5;

  const tier = Math.floor(totalReferrals / referralsPerTier);
  const rate = Math.min(baseRate + tier * increment, maxRate);

  return Number(rate.toFixed(4));
}

/**
 * Get tier progression information
 */
export function getTierInfo(totalReferrals: number) {
  const referralsPerTier = 5;
  const maxTier = 10; // 50 referrals = max tier

  const currentTier = Math.floor(totalReferrals / referralsPerTier);
  const nextTierAt = (currentTier + 1) * referralsPerTier;
  const isMaxTier = currentTier >= maxTier;

  return {
    currentTier,
    nextTierAt: isMaxTier ? totalReferrals : nextTierAt,
    isMaxTier,
    referralsToNext: Math.max(0, nextTierAt - totalReferrals),
    currentRate: calculateCommissionRate(totalReferrals),
    nextRate: isMaxTier ? 0.05 : calculateCommissionRate(nextTierAt),
  };
}

// =============================================================================
// Referral Code Generation & Management
// =============================================================================

/**
 * Generate unique referral code avoiding confusing characters
 */
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // Avoid 0,O,1,I,l
  let code = '';

  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return code;
}

/**
 * Validate referral code format
 */
function validateReferralCode(code: string): {
  valid: boolean;
  error?: string;
} {
  if (!code) {
    return { valid: false, error: 'Referral code is required' };
  }

  if (code.length < 4 || code.length > 12) {
    return { valid: false, error: 'Referral code must be 4-12 characters' };
  }

  if (!/^[A-Z0-9]+$/i.test(code)) {
    return {
      valid: false,
      error: 'Referral code must contain only letters and numbers',
    };
  }

  return { valid: true };
}

/**
 * Create referral code (Pro+ members only)
 */
export const createReferralCode = mutation({
  args: {
    customCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuth(ctx);

    // Check Pro+ membership requirement (admins are allowed)
    const isAdmin = user.role && user.role !== 'user';
    const isProPlus =
      user.subscription && user.subscription.tier === 'pro_plus';
    if (!(isAdmin || isProPlus)) {
      throw new Error('Only Pro+ members can create referral codes');
    }

    // Check if user already has a referral code
    const existingCode = await ctx.db
      .query('referralCodes')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    if (existingCode) {
      return {
        success: true,
        code: existingCode.code,
        referralId: existingCode._id,
        message: 'You already have an active referral code',
      };
    }

    // Validate custom code format if provided
    if (args.customCode) {
      const validation = validateReferralCode(args.customCode);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
    }

    // Generate unique code with proper duplicate checking
    let code = '';
    let attempts = 0;
    const maxAttempts = 10;

    if (args.customCode) {
      // For custom codes, check once and fail if taken
      code = args.customCode.toUpperCase();

      // Check for exact match (case-insensitive since we store uppercase)
      const existingCustomCode = await ctx.db
        .query('referralCodes')
        .withIndex('by_code', (q) => q.eq('code', code))
        .first();

      if (existingCustomCode) {
        throw new Error(
          `Referral code "${args.customCode}" is already taken. Please choose another.`
        );
      }

      // Also check for variations to prevent confusion
      const similarCodes = await ctx.db
        .query('referralCodes')
        .filter((q) =>
          q.or(
            q.eq(q.field('code'), code.toLowerCase()),
            q.eq(q.field('code'), code)
          )
        )
        .first();

      if (similarCodes) {
        throw new Error(
          'A similar referral code already exists. Please choose another.'
        );
      }
    } else {
      // For auto-generated codes, keep trying until we find a unique one
      let isUnique = false;

      while (!isUnique && attempts < maxAttempts) {
        code = generateReferralCode();

        const existingCode = await ctx.db
          .query('referralCodes')
          .withIndex('by_code', (q) => q.eq('code', code))
          .first();

        if (existingCode) {
          attempts++;
        } else {
          isUnique = true;
        }
      }

      if (!isUnique) {
        throw new Error(
          'Unable to generate unique referral code. Please try again.'
        );
      }
    }

    const now = Date.now();
    const tierInfo = getTierInfo(0);

    // Final duplicate check right before insertion (race condition protection)
    const finalCheck = await ctx.db
      .query('referralCodes')
      .withIndex('by_code', (q) => q.eq('code', code))
      .first();

    if (finalCheck) {
      throw new Error(
        `Referral code "${code}" was just created by another user. Please try again.`
      );
    }

    // Create referral code record with guaranteed uniqueness
    let referralId;
    try {
      referralId = await ctx.db.insert('referralCodes', {
        userId: user._id,
        code,
        customCode: args.customCode,
        isActive: true,
        totalReferrals: 0,
        currentCommissionRate: tierInfo.currentRate,
        totalEarnings: 0,
        lifetimePayouts: 0,
        tier: tierInfo.currentTier,
        nextTierAt: tierInfo.nextTierAt,
        createdAt: now,
        updatedAt: now,
      });
    } catch (_error) {
      throw new Error(
        'Failed to create referral code. The code may already exist. Please try again.'
      );
    }

    // Create initial balance record
    await ctx.db.insert('referralBalances', {
      userId: user._id,
      totalEarned: 0,
      availableBalance: 0,
      totalWithdrawn: 0,
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      code,
      referralId,
      currentRate: tierInfo.currentRate,
    };
  },
});

/**
 * Get user's referral code and stats
 */
export const getUserReferralCode = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    const referralCode = await ctx.db
      .query('referralCodes')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    if (!referralCode) {
      return null;
    }

    const balance = await ctx.db
      .query('referralBalances')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    const tierInfo = getTierInfo(referralCode.totalReferrals);

    return {
      ...referralCode,
      balance: balance || {
        totalEarned: 0,
        availableBalance: 0,
        totalWithdrawn: 0,
      },
      tierInfo,
    };
  },
});

/**
 * Get referrer payout info for the current authenticated user
 * Returns whether a referrer is set, the referral code, commission rate, and referrer's wallet
 */
export const getReferrerPayoutInfo = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return { hasReferrer: false } as const;
    }

    if (!(user.referredBy && user.referredByCode)) {
      return { hasReferrer: false } as const;
    }

    // Lookup referral code to get current commission rate
    const referredByCode = user.referredByCode;
    if (!referredByCode) {
      return { hasReferrer: false } as const;
    }

    const referralCodeRecord = await ctx.db
      .query('referralCodes')
      .withIndex('by_code', (q) => q.eq('code', referredByCode))
      .first();

    if (!referralCodeRecord?.isActive) {
      return { hasReferrer: false } as const;
    }

    const referrer = await ctx.db.get(user.referredBy);
    if (!referrer?.walletAddress) {
      return { hasReferrer: false } as const;
    }

    return {
      hasReferrer: true,
      referralCode: referredByCode,
      commissionRate: referralCodeRecord.currentCommissionRate,
      referrerWalletAddress: referrer.walletAddress,
      // Extra context for UI display
      referrerDisplayName: referrer.displayName || 'Anonymous Referrer',
      referrerAvatar: referrer.avatar,
    } as const;
  },
});

/**
 * Get referral code owner info
 * Returns the display name and info of the owner of a referral code
 */
export const getReferralCodeOwnerInfo = query({
  args: {
    referralCode: v.string(),
  },
  handler: async (ctx, args) => {
    // Normalize the code to uppercase for lookup (case-insensitive matching)
    const normalizedCode = args.referralCode.toUpperCase();

    // Get referral code info
    const referralCodeRecord = await ctx.db
      .query('referralCodes')
      .withIndex('by_code', (q) => q.eq('code', normalizedCode))
      .first();

    if (!referralCodeRecord) {
      return null;
    }

    // Get the owner's user info
    const owner = await ctx.db.get(referralCodeRecord.userId);
    if (!owner) {
      return null;
    }

    return {
      referralCode: normalizedCode,
      ownerId: owner._id,
      ownerDisplayName: owner.displayName || 'Anonymous User',
      ownerAvatar: owner.avatar,
      ownerWalletAddress: owner.walletAddress,
      isActive: referralCodeRecord.isActive,
    };
  },
});

// =============================================================================
// Attribution Tracking
// =============================================================================

/**
 * Track referral attribution from URL parameter
 */
export const trackReferralAttribution = mutation({
  args: {
    referralCode: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Normalize the code to uppercase for lookup (case-insensitive matching)
    const normalizedCode = args.referralCode.toUpperCase();

    // Validate referral code exists and is active
    const referralCode = await ctx.db
      .query('referralCodes')
      .withIndex('by_code', (q) => q.eq('code', normalizedCode))
      .first();

    if (!referralCode?.isActive) {
      throw new Error('Invalid or inactive referral code');
    }

    // Rate limiting: max 10 attributions per hour per referral code
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentAttributions = await ctx.db
      .query('referralAttributions')
      .withIndex('by_code', (q) => q.eq('referralCode', args.referralCode))
      .filter((q) => q.gte(q.field('createdAt'), oneHourAgo))
      .take(15);

    if (recentAttributions.length >= 10) {
      // Log fraud alert
      await ctx.db.insert('referralFraudAlerts', {
        type: 'rate_limit_exceeded',
        referralCode: args.referralCode,
        referrerId: referralCode.userId,
        details: {
          attributionCount: recentAttributions.length,
          timeWindow: '1h',
          additionalInfo: 'Hourly attribution limit exceeded',
        },
        severity: 'medium',
        resolved: false,
        createdAt: Date.now(),
      });

      throw new Error('Too many referral clicks. Please try again later.');
    }

    // Check for suspicious IP patterns
    if (args.ipAddress) {
      const ipAttributions = recentAttributions.filter(
        (attr) => attr.ipAddress === args.ipAddress
      );

      if (ipAttributions.length > 3) {
        await ctx.db.insert('referralFraudAlerts', {
          type: 'suspicious_ip_activity',
          referralCode: args.referralCode,
          referrerId: referralCode.userId,
          details: {
            ipAddress: args.ipAddress,
            attributionCount: ipAttributions.length,
            timeWindow: '1h',
            additionalInfo: 'Multiple attributions from same IP',
          },
          severity: 'medium',
          resolved: false,
          createdAt: Date.now(),
        });
      }
    }

    // Create attribution record (30 day expiry)
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

    const attributionId = await ctx.db.insert('referralAttributions', {
      referralCode: args.referralCode,
      referrerId: referralCode.userId,
      status: 'pending',
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      source: args.source,
      expiresAt,
      createdAt: Date.now(),
    });

    return { success: true, attributionId };
  },
});

/**
 * Allow users to claim a referral within 72 hours of account creation
 * This is for users who didn't use a referral link but want to give credit
 */
export const claimReferral = mutation({
  args: {
    referralCode: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireAuth(ctx);

    // Check if user already has a referrer
    if (user.referredBy) {
      throw new Error('You have already been referred by someone');
    }

    // Check if within 72-hour grace period
    const accountAge = Date.now() - (user.createdAt || Date.now());
    const graceperiod = 72 * 60 * 60 * 1000; // 72 hours in milliseconds

    if (accountAge > graceperiod) {
      throw new Error('The 72-hour grace period to add a referrer has expired');
    }

    // Normalize and validate the referral code
    const normalizedCode = args.referralCode.toUpperCase();

    // Get referral code info
    const referralCode = await ctx.db
      .query('referralCodes')
      .withIndex('by_code', (q) => q.eq('code', normalizedCode))
      .first();

    if (!referralCode) {
      throw new Error('Invalid referral code');
    }

    if (!referralCode.isActive) {
      throw new Error('This referral code is no longer active');
    }

    // Prevent self-referral
    if (referralCode.userId === user._id) {
      throw new Error('You cannot refer yourself');
    }

    // Update user with referrer information
    await ctx.db.patch(user._id, {
      referredBy: referralCode.userId,
      referredByCode: normalizedCode,
      referredAt: Date.now(),
    });

    // Check if there was an existing attribution record
    const existingAttribution = await ctx.db
      .query('referralAttributions')
      .withIndex('by_referred_wallet', (q) =>
        q.eq('referredWalletAddress', user.walletAddress || '')
      )
      .filter((q) => q.eq(q.field('status'), 'attributed'))
      .first();

    if (existingAttribution) {
      // Update the attribution to match the claimed referral
      await ctx.db.patch(existingAttribution._id, {
        referralCode: normalizedCode,
        referrerId: referralCode.userId,
      });
    } else {
      // Create new attribution record
      await ctx.db.insert('referralAttributions', {
        referralCode: normalizedCode,
        referrerId: referralCode.userId,
        referredUserId: user._id,
        referredWalletAddress: user.walletAddress,
        status: 'attributed',
        source: 'manual_claim',
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
        createdAt: Date.now(),
      });
    }

    // No retroactive commissions - only future payments count
    return {
      success: true,
      message:
        'Successfully claimed referral! Your referrer will receive commissions on all your future payments.',
    };
  },
});

/**
 * Get remaining time for claiming a referral (for UI countdown)
 */
export const getReferralClaimStatus = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    // If user already has a referrer, they can't claim
    if (user.referredBy) {
      return {
        canClaim: false,
        reason: 'already_referred',
      };
    }

    // Calculate time remaining
    const accountAge = Date.now() - (user.createdAt || Date.now());
    const graceperiod = 72 * 60 * 60 * 1000; // 72 hours
    const timeRemaining = Math.max(0, graceperiod - accountAge);

    if (timeRemaining === 0) {
      return {
        canClaim: false,
        reason: 'expired',
      };
    }

    return {
      canClaim: true,
      timeRemaining,
      expiresAt: (user.createdAt || Date.now()) + graceperiod,
    };
  },
});

/**
 * Attribute referral to newly signed up user
 */
export const attributeReferralToUser = mutation({
  args: {
    referralCode: v.string(),
    walletAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the user by wallet address
    const user = await ctx.db
      .query('users')
      .withIndex('by_wallet', (q) => q.eq('walletAddress', args.walletAddress))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    // Normalize the code to uppercase for lookup (case-insensitive matching)
    const normalizedCode = args.referralCode.toUpperCase();

    // Get referral code info
    const referralCode = await ctx.db
      .query('referralCodes')
      .withIndex('by_code', (q) => q.eq('code', normalizedCode))
      .first();

    if (!referralCode) {
      throw new Error('Invalid referral code');
    }

    if (!referralCode.isActive) {
      throw new Error('This referral code is no longer active');
    }

    // Prevent self-referrals
    if (referralCode.userId === user._id) {
      await ctx.db.insert('referralFraudAlerts', {
        type: 'self_referral_attempt',
        referralCode: args.referralCode,
        referrerId: referralCode.userId,
        details: {
          additionalInfo: `User attempted to refer themselves: ${args.walletAddress}`,
        },
        severity: 'low',
        resolved: false,
        createdAt: Date.now(),
      });

      throw new Error('Cannot refer yourself');
    }

    // Find pending attribution for this referral code
    const attribution = await ctx.db
      .query('referralAttributions')
      .withIndex('by_code', (q) => q.eq('referralCode', args.referralCode))
      .filter((q) => q.eq(q.field('status'), 'pending'))
      .filter((q) => q.gt(q.field('expiresAt'), Date.now()))
      .first();

    if (attribution) {
      // Update attribution with user info
      await ctx.db.patch(attribution._id, {
        referredUserId: user._id,
        referredWalletAddress: args.walletAddress,
        status: 'attributed',
      });
    }

    // If within 72-hour grace period and user has no referrer yet, set it now
    const alreadyHasReferrer = Boolean(user.referredBy && user.referredByCode);
    const accountAgeMs = Date.now() - (user.createdAt || Date.now());
    const withinGracePeriod = accountAgeMs <= 72 * 60 * 60 * 1000; // 72 hours

    if (!alreadyHasReferrer && withinGracePeriod) {
      await ctx.db.patch(user._id, {
        referredBy: referralCode.userId,
        referredByCode: normalizedCode,
        referredAt: Date.now(),
      });

      // If we didn't find a pending attribution earlier, create an attributed record for consistency
      if (!attribution) {
        await ctx.db.insert('referralAttributions', {
          referralCode: normalizedCode,
          referrerId: referralCode.userId,
          referredUserId: user._id,
          referredWalletAddress: args.walletAddress,
          status: 'attributed',
          source: 'auto_attribute_on_signup',
          expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // keep for 1 year
          createdAt: Date.now(),
        });
      }

      return { success: true, attributed: true, assigned: true } as const;
    }

    return {
      success: true,
      attributed: Boolean(attribution),
      assigned: false,
      reason: alreadyHasReferrer
        ? 'already_has_referrer'
        : withinGracePeriod
          ? 'unknown'
          : 'grace_period_expired',
    } as const;
  },
});

// =============================================================================
// Leaderboard & Statistics
// =============================================================================

/**
 * Get enhanced leaderboard with user profiles and system stats
 */
export const getEnhancedLeaderboard = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    // Get system-wide statistics
    const systemStats = await ctx.db.query('referralSystemStats').first();

    // Get top referrers by total earnings (ordered by totalEarnings desc)
    const allReferralCodes = await ctx.db
      .query('referralCodes')
      .withIndex('by_active', (q) => q.eq('isActive', true))
      .collect();

    // Sort by totalEarnings descending and take top N
    const topReferralCodes = allReferralCodes
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .slice(0, limit);

    // Build leaderboard with user details
    const leaderboard = [];
    for (const ref of topReferralCodes) {
      const user = await ctx.db.get(ref.userId);
      if (user) {
        const tierInfo = getTierInfo(ref.totalReferrals);

        leaderboard.push({
          rank: leaderboard.length + 1,
          displayName: user.displayName || 'Anonymous Referrer',
          avatar: user.avatar || '/default-avatar.png',
          referralCode: ref.code,
          totalReferrals: ref.totalReferrals,
          currentCommissionRate: ref.currentCommissionRate,
          totalEarnings: ref.totalEarnings,
          lifetimePayouts: ref.lifetimePayouts,
          tier: ref.tier,
          nextTierAt: ref.nextTierAt,
          tierInfo,
        });
      }
    }

    // Calculate real-time system stats if not available
    const calculatedStats = {
      totalPayoutsSOL: 0,
      totalReferrers: allReferralCodes.length,
      totalReferrals: allReferralCodes.reduce(
        (sum, ref) => sum + ref.totalReferrals,
        0
      ),
      averageCommissionRate:
        allReferralCodes.length > 0
          ? allReferralCodes.reduce(
              (sum, ref) => sum + ref.currentCommissionRate,
              0
            ) / allReferralCodes.length
          : 0.03,
      topTierReferrers: allReferralCodes.filter(
        (ref) => ref.currentCommissionRate >= 0.05
      ).length,
    };

    // Get total payouts from database
    const payouts = await ctx.db
      .query('referralPayouts')
      .withIndex('by_status', (q) => q.eq('status', 'paid'))
      .collect();

    calculatedStats.totalPayoutsSOL = payouts.reduce(
      (sum, payout) => sum + payout.commissionAmount,
      0
    );

    return {
      leaderboard,
      systemStats: systemStats || calculatedStats,
    };
  },
});

/**
 * Get user's detailed referral statistics
 */
export const getUserReferralStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    const referralCode = await ctx.db
      .query('referralCodes')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    if (!referralCode) {
      return null;
    }

    const balance = await ctx.db
      .query('referralBalances')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    const payouts = await ctx.db
      .query('referralPayouts')
      .withIndex('by_referrer', (q) => q.eq('referrerId', user._id))
      .collect();

    const recentPayouts = payouts.slice(-10); // Last 10 payouts

    return {
      referralCode: referralCode.code,
      totalReferrals: referralCode.totalReferrals,
      currentCommissionRate: referralCode.currentCommissionRate,
      totalEarnings: referralCode.totalEarnings,
      lifetimePayouts: referralCode.lifetimePayouts,
      tier: referralCode.tier,
      nextTierAt: referralCode.nextTierAt,
      tierInfo: getTierInfo(referralCode.totalReferrals),
      balance: balance || {
        totalEarned: 0,
        availableBalance: 0,
        totalWithdrawn: 0,
      },
      recentPayouts: recentPayouts.map((payout) => ({
        amount: payout.commissionAmount,
        rate: payout.commissionRate,
        date: payout.createdAt,
        status: payout.status,
      })),
    };
  },
});

// =============================================================================
// Internal Functions for Payment Integration
// =============================================================================

/**
 * Get referral code by code string (internal)
 */
export const getReferralCodeByCode = internalQuery({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    // Normalize the code to uppercase for lookup (case-insensitive matching)
    const normalizedCode = args.code.toUpperCase();

    return await ctx.db
      .query('referralCodes')
      .withIndex('by_code', (q) => q.eq('code', normalizedCode))
      .first();
  },
});

/**
 * Get user by ID (internal helper)
 */
export const getUserById = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

/**
 * Update referrer tier and stats after successful referral conversion
 */
export const updateReferrerStats = internalMutation({
  args: {
    referrerId: v.id('users'),
    referralCode: v.string(),
    commissionAmount: v.number(),
    referredUserId: v.id('users'),
    isFirstConversion: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Update referral code stats
    const referralCode = await ctx.db
      .query('referralCodes')
      .withIndex('by_code', (q) => q.eq('code', args.referralCode))
      .first();

    if (!referralCode) {
      throw new Error('Referral code not found');
    }

    // Only increment totalReferrals on the first successful conversion for this referred user
    const shouldIncrement = Boolean(args.isFirstConversion);
    const newTotalReferrals =
      referralCode.totalReferrals + (shouldIncrement ? 1 : 0);
    const tierInfo = getTierInfo(newTotalReferrals);

    // Update referral code record
    await ctx.db.patch(referralCode._id, {
      totalReferrals: newTotalReferrals,
      currentCommissionRate: tierInfo.currentRate,
      totalEarnings: referralCode.totalEarnings + args.commissionAmount,
      lifetimePayouts: referralCode.lifetimePayouts + args.commissionAmount,
      tier: tierInfo.currentTier,
      nextTierAt: tierInfo.nextTierAt,
      updatedAt: Date.now(),
    });

    // Update referrer balance
    const balance = await ctx.db
      .query('referralBalances')
      .withIndex('by_user', (q) => q.eq('userId', args.referrerId))
      .first();

    if (balance) {
      await ctx.db.patch(balance._id, {
        totalEarned: balance.totalEarned + args.commissionAmount,
        availableBalance: balance.availableBalance + args.commissionAmount,
        lastPayoutAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Update system stats
    await updateSystemStats(ctx);

    return { success: true };
  },
});

/**
 * Update system-wide referral statistics
 */
async function updateSystemStats(ctx: any) {
  const now = Date.now();

  // Calculate fresh stats
  const allReferralCodes = await ctx.db
    .query('referralCodes')
    .withIndex('by_active', (q: any) => q.eq('isActive', true))
    .collect();

  const allPayouts = await ctx.db
    .query('referralPayouts')
    .withIndex('by_status', (q: any) => q.eq('status', 'paid'))
    .collect();

  const stats = {
    totalReferrers: allReferralCodes.length,
    totalReferrals: allReferralCodes.reduce(
      (sum: number, ref: any) => sum + ref.totalReferrals,
      0
    ),
    totalPayoutsSOL: allPayouts.reduce(
      (sum: number, payout: any) => sum + payout.commissionAmount,
      0
    ),
    averageCommissionRate:
      allReferralCodes.length > 0
        ? allReferralCodes.reduce(
            (sum: number, ref: any) => sum + ref.currentCommissionRate,
            0
          ) / allReferralCodes.length
        : 0.03,
    topTierReferrers: allReferralCodes.filter(
      (ref: any) => ref.currentCommissionRate >= 0.05
    ).length,
    lastUpdated: now,
  };

  // Update or create system stats record
  const existingStats = await ctx.db.query('referralSystemStats').first();

  if (existingStats) {
    await ctx.db.patch(existingStats._id, stats);
  } else {
    await ctx.db.insert('referralSystemStats', stats);
  }
}

// =============================================================================
// Admin & Maintenance Functions
// =============================================================================

/**
 * Cleanup expired attributions (cron job)
 */
export const cleanupExpiredAttributions = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Find expired attributions
    const expiredAttributions = await ctx.db
      .query('referralAttributions')
      .withIndex('by_expires', (q) => q.lt('expiresAt', now))
      .filter((q) => q.eq(q.field('status'), 'pending'))
      .take(100);

    // Mark as expired
    for (const attribution of expiredAttributions) {
      await ctx.db.patch(attribution._id, {
        status: 'pending', // Keep as pending but they're expired
      });
    }

    return { expiredCount: expiredAttributions.length };
  },
});

/**
 * Get users referred by the current user
 */
export const getReferredUsers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    const limit = args.limit || 20;

    // Get users who have this user as their referrer
    const referredUsers = await ctx.db
      .query('users')
      .withIndex('by_referrer', (q) => q.eq('referredBy', user._id))
      .take(limit);

    // Get additional info for each referred user
    const referredUsersList = [];
    for (const referredUser of referredUsers) {
      // Get their subscription status
      const subscription = referredUser.subscription || {
        tier: 'free',
        messagesUsed: 0,
        messagesLimit: 0,
      };

      // Get total payments from this user
      const payments = await ctx.db
        .query('subscriptionPayments')
        .withIndex('by_user', (q) => q.eq('userId', referredUser._id))
        .filter((q) => q.eq(q.field('status'), 'confirmed'))
        .collect();

      const totalPayments = payments.reduce((sum, p) => sum + p.amountSol, 0);

      // Get total commissions earned from this user
      const payouts = await ctx.db
        .query('referralPayouts')
        .withIndex('by_referred', (q) =>
          q.eq('referredUserId', referredUser._id)
        )
        .filter((q) => q.eq(q.field('referrerId'), user._id))
        .collect();

      const totalCommissions = payouts.reduce(
        (sum, p) => sum + p.commissionAmount,
        0
      );

      referredUsersList.push({
        userId: referredUser._id,
        displayName: referredUser.displayName || 'Anonymous User',
        avatar: referredUser.avatar,
        walletAddress: referredUser.walletAddress,
        referredAt: referredUser.referredAt || referredUser.createdAt,
        subscriptionTier: subscription.tier,
        totalPayments,
        totalCommissionsEarned: totalCommissions,
        lastActiveAt: referredUser.lastActiveAt,
        isActive: subscription.tier !== 'free',
      });
    }

    // Sort by referral date (newest first)
    referredUsersList.sort((a, b) => (b.referredAt || 0) - (a.referredAt || 0));

    return {
      referredUsers: referredUsersList,
      totalCount: referredUsersList.length,
    };
  },
});

/**
 * Get detailed commission history for a specific referred user
 */
export const getReferredUserCommissions = query({
  args: {
    referredUserId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    // Verify this user was referred by the current user
    const referredUser = await ctx.db.get(args.referredUserId);
    if (!referredUser || referredUser.referredBy !== user._id) {
      throw new Error('Unauthorized: User was not referred by you');
    }

    // Get all commission payouts from this referred user
    const payouts = await ctx.db
      .query('referralPayouts')
      .withIndex('by_referred', (q) =>
        q.eq('referredUserId', args.referredUserId)
      )
      .filter((q) => q.eq(q.field('referrerId'), user._id))
      .collect();

    // Sort by date (newest first)
    payouts.sort((a, b) => b.createdAt - a.createdAt);

    return {
      referredUser: {
        displayName: referredUser.displayName || 'Anonymous User',
        avatar: referredUser.avatar,
        walletAddress: referredUser.walletAddress,
      },
      commissions: payouts.map((payout) => ({
        paymentAmount: payout.paymentAmount,
        commissionRate: payout.commissionRate,
        commissionAmount: payout.commissionAmount,
        status: payout.status,
        date: payout.createdAt,
        isRetroactive: false,
      })),
      totalCommissions: payouts.reduce((sum, p) => sum + p.commissionAmount, 0),
      totalPayments: payouts.reduce((sum, p) => sum + p.paymentAmount, 0),
    };
  },
});

/**
 * Get admin referral statistics
 */
export const getAdminReferralStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role === 'user') {
      throw new Error('Admin access required');
    }

    const [referralCodes, attributions, payouts, fraudAlerts] =
      await Promise.all([
        ctx.db.query('referralCodes').collect(),
        ctx.db.query('referralAttributions').collect(),
        ctx.db.query('referralPayouts').collect(),
        ctx.db
          .query('referralFraudAlerts')
          .filter((q) => q.eq(q.field('resolved'), false))
          .collect(),
      ]);

    return {
      totalReferralCodes: referralCodes.length,
      activeReferralCodes: referralCodes.filter((r) => r.isActive).length,
      totalAttributions: attributions.length,
      convertedAttributions: attributions.filter(
        (a) => a.status === 'converted'
      ).length,
      totalPayouts: payouts.length,
      totalCommissionPaid: payouts
        .filter((p) => p.status === 'paid')
        .reduce((sum, p) => sum + p.commissionAmount, 0),
      pendingFraudAlerts: fraudAlerts.length,
      averageCommissionRate:
        referralCodes.length > 0
          ? referralCodes.reduce((sum, r) => sum + r.currentCommissionRate, 0) /
            referralCodes.length
          : 0.03,
    };
  },
});
