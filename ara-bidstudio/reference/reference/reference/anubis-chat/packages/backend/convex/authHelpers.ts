/**
 * Authorization Helper Functions for Convex Auth
 * Provides proper authorization patterns using getAuthUserId
 */

import { getAuthUserId } from '@convex-dev/auth/server';
import type { Doc } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';

// =============================================================================
// Core Authorization Helpers
// =============================================================================

/**
 * Get the current authenticated user with full profile data
 */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    return null;
  }

  const user = await ctx.db.get(userId);
  return user;
}

/**
 * Require authentication - throws if user is not authenticated
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error('Authentication required');
  }

  const user = await ctx.db.get(userId);
  if (!user?.isActive) {
    throw new Error('User account is inactive');
  }

  return { userId, user };
}

/**
 * Get the current user's wallet address
 */
export async function getCurrentWalletAddress(ctx: QueryCtx | MutationCtx) {
  const user = await getCurrentUser(ctx);
  return user?.walletAddress || null;
}

// =============================================================================
// Admin Authorization Helpers
// =============================================================================

/**
 * Check if the current user has admin privileges
 */
export async function isCurrentUserAdmin(
  ctx: QueryCtx | MutationCtx
): Promise<boolean> {
  const user = await getCurrentUser(ctx);
  if (!user) {
    return false;
  }

  return (
    user.role === 'admin' ||
    user.role === 'super_admin' ||
    user.role === 'moderator'
  );
}

/**
 * Require admin privileges - throws if user is not an admin
 */
export async function requireAdmin(
  ctx: QueryCtx | MutationCtx,
  requiredRole?: 'moderator' | 'admin' | 'super_admin'
) {
  const { user } = await requireAuth(ctx);

  if (!user.role || user.role === 'user') {
    throw new Error('Admin privileges required');
  }

  // Check specific role requirement if provided
  if (requiredRole) {
    const roleHierarchy = { moderator: 1, admin: 2, super_admin: 3 };
    const userLevel =
      roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole];

    if (userLevel < requiredLevel) {
      throw new Error(`${requiredRole} role required`);
    }
  }

  return { user, role: user.role };
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(
  ctx: QueryCtx | MutationCtx,
  permission: string
): Promise<boolean> {
  const user = await getCurrentUser(ctx);
  if (!user) {
    return false;
  }

  // Super admins have all permissions
  if (user.role === 'super_admin') {
    return true;
  }

  // Admins have most permissions by default
  if (user.role === 'admin') {
    const adminImplicitPermissions = [
      'user_management',
      'subscription_management',
      'content_moderation',
      'usage_analytics',
    ];
    if (adminImplicitPermissions.includes(permission)) {
      return true;
    }
  }

  // Check explicit permissions
  if (!user.permissions) {
    return false;
  }
  return (user.permissions as string[]).includes(permission);
}

/**
 * Require a specific permission - throws if user doesn't have it
 */
export async function requirePermission(
  ctx: QueryCtx | MutationCtx,
  permission: string
) {
  const { user } = await requireAuth(ctx);

  // Super admins have all permissions
  if (user.role === 'super_admin') {
    return { user };
  }

  // Admins have most permissions by default
  if (user.role === 'admin') {
    // Admin role has implicit permissions for most operations
    const adminImplicitPermissions = [
      'user_management',
      'subscription_management',
      'content_moderation',
      'usage_analytics',
    ];
    if (adminImplicitPermissions.includes(permission)) {
      return { user };
    }
  }

  // Check explicit permissions for all roles
  if (!(user.permissions as string[] | undefined)?.includes(permission)) {
    throw new Error(`Permission '${permission}' required`);
  }

  return { user };
}

// =============================================================================
// Resource Ownership Helpers
// =============================================================================

/**
 * Check if the current user owns a resource
 */
export async function isResourceOwner(
  ctx: QueryCtx | MutationCtx,
  resource: { walletAddress?: string; ownerId?: string; userId?: string }
): Promise<boolean> {
  const user = await getCurrentUser(ctx);
  if (!user) {
    return false;
  }

  // Check various owner field patterns
  return (
    resource.walletAddress === user.walletAddress ||
    resource.ownerId === user.walletAddress ||
    resource.userId === user.walletAddress ||
    resource.ownerId === user._id ||
    resource.userId === user._id
  );
}

/**
 * Require resource ownership or admin privileges
 */
export async function requireOwnershipOrAdmin(
  ctx: QueryCtx | MutationCtx,
  resource: { walletAddress?: string; ownerId?: string; userId?: string }
) {
  const { user } = await requireAuth(ctx);

  const isOwner = await isResourceOwner(ctx, resource);
  const isAdmin = await isCurrentUserAdmin(ctx);

  if (!(isOwner || isAdmin)) {
    throw new Error(
      'Resource access denied: ownership or admin privileges required'
    );
  }

  return { user, isOwner, isAdmin };
}

// =============================================================================
// Subscription & Usage Helpers
// =============================================================================

/**
 * Check if user has an active subscription of a specific tier
 */
export async function hasSubscriptionTier(
  ctx: QueryCtx | MutationCtx,
  tier: 'free' | 'pro' | 'pro_plus'
): Promise<boolean> {
  const user = await getCurrentUser(ctx);
  if (!user?.subscription) {
    return false;
  }

  const tierHierarchy = { free: 1, pro: 2, pro_plus: 3 };
  const userLevel = tierHierarchy[user.subscription.tier];
  const requiredLevel = tierHierarchy[tier];

  return userLevel >= requiredLevel;
}

/**
 * Require a minimum subscription tier
 */
export async function requireSubscriptionTier(
  ctx: QueryCtx | MutationCtx,
  tier: 'free' | 'pro' | 'pro_plus'
) {
  const { user } = await requireAuth(ctx);

  if (!hasSubscriptionTier(ctx, tier)) {
    throw new Error(`${tier} subscription required`);
  }

  return { user };
}

/**
 * Check user's message usage against limits
 */
export async function checkMessageUsage(ctx: QueryCtx | MutationCtx) {
  const user = await getCurrentUser(ctx);
  if (!user?.subscription) {
    return { canSendMessage: false, usage: null };
  }

  const { subscription } = user;
  const regularUsage = subscription.messagesUsed || 0;
  const regularLimit = subscription.messagesLimit || 0;
  const premiumUsage = subscription.premiumMessagesUsed || 0;
  const premiumLimit = subscription.premiumMessagesLimit || 0;

  return {
    canSendMessage: regularUsage < regularLimit,
    canSendPremiumMessage: premiumUsage < premiumLimit,
    usage: {
      regular: { used: regularUsage, limit: regularLimit },
      premium: { used: premiumUsage, limit: premiumLimit },
    },
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get user by wallet address
 */
export async function getUserByWallet(
  ctx: QueryCtx | MutationCtx,
  walletAddress: string
): Promise<Doc<'users'> | null> {
  return await ctx.db
    .query('users')
    .withIndex('by_wallet', (q) => q.eq('walletAddress', walletAddress))
    .unique();
}

/**
 * Get all admin users
 */
export async function getAllAdmins(ctx: QueryCtx | MutationCtx) {
  return await ctx.db
    .query('users')
    .withIndex('by_role', (q) => q.eq('role', 'admin'))
    .collect();
}

/**
 * Check if wallet address is configured as admin
 */
export function isWalletAdmin(walletAddress: string): boolean {
  const adminWallets =
    process.env.ADMIN_WALLETS?.split(',').map((w) => w.trim()) || [];
  return adminWallets.includes(walletAddress);
}

/**
 * Get user statistics (for admin dashboard)
 */
export async function getUserStats(ctx: QueryCtx | MutationCtx) {
  const users = await ctx.db.query('users').collect();

  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    byTier: {
      free: users.filter((u) => u.subscription?.tier === 'free').length,
      pro: users.filter((u) => u.subscription?.tier === 'pro').length,
      pro_plus: users.filter((u) => u.subscription?.tier === 'pro_plus').length,
    },
    admins: users.filter((u) => u.role && u.role !== 'user').length,
  };

  return stats;
}
