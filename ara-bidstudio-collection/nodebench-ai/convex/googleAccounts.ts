// convex/googleAccounts.ts --------------------------------------------------------
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get Google account by user
export const getGoogleAccountByUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query('googleAccounts')
      .withIndex('by_user', q => q.eq('userId', identity.subject as any))
      .first();
  },
});

// Save Google account token
export const saveGoogleAccount = mutation({
  args: {
    email: v.optional(v.string()),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    scope: v.optional(v.string()),
    expiryDate: v.optional(v.number()),
    tokenType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('User not authenticated');
    }

    const existing = await ctx.db
      .query("googleAccounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const userId = identity.subject as any;
    const accountData = {
      userId,
      provider: 'google' as const,
      email: args.email,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      scope: args.scope,
      expiryDate: args.expiryDate,
      tokenType: args.tokenType,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, accountData);
    } else {
      await ctx.db.insert('googleAccounts', {
        ...accountData,
        createdAt: Date.now(),
      });
    }
  },
});

// Delete Google account
export const deleteGoogleAccount = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('User not authenticated');
    }

    const existing = await ctx.db
      .query('googleAccounts')
      .withIndex('by_user', q => q.eq('userId', identity.subject as any))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
