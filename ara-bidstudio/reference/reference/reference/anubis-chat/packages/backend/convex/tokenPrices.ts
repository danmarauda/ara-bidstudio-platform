import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Get cached token price or null if not cached/expired
 */
export const getCachedPrice = query({
  args: {
    tokenSymbol: v.string(),
  },
  handler: async (ctx, args) => {
    const price = await ctx.db
      .query('tokenPrices')
      .withIndex('by_symbol', (q) => q.eq('symbol', args.tokenSymbol))
      .first();

    if (!price) {
      return null;
    }

    // Check if cache is expired
    const now = Date.now();
    if (now - price.updatedAt > CACHE_DURATION) {
      return null; // Cache expired
    }

    return {
      symbol: price.symbol,
      price: price.priceUsd,
      priceChange24h: price.priceChange24h,
      marketCap: price.marketCap,
      volume24h: price.volume24h,
      updatedAt: price.updatedAt,
    };
  },
});

/**
 * Update cached token price
 */
export const updateCachedPrice = mutation({
  args: {
    symbol: v.string(),
    priceUsd: v.number(),
    priceChange24h: v.optional(v.number()),
    marketCap: v.optional(v.number()),
    volume24h: v.optional(v.number()),
    mintAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if price already exists
    const existingPrice = await ctx.db
      .query('tokenPrices')
      .withIndex('by_symbol', (q) => q.eq('symbol', args.symbol))
      .first();

    if (existingPrice) {
      // Update existing price
      await ctx.db.patch(existingPrice._id, {
        priceUsd: args.priceUsd,
        priceChange24h: args.priceChange24h,
        marketCap: args.marketCap,
        volume24h: args.volume24h,
        updatedAt: now,
      });
    } else {
      // Create new price entry
      await ctx.db.insert('tokenPrices', {
        symbol: args.symbol,
        priceUsd: args.priceUsd,
        priceChange24h: args.priceChange24h,
        marketCap: args.marketCap,
        volume24h: args.volume24h,
        mintAddress: args.mintAddress,
        createdAt: now,
        updatedAt: now,
      });
    }

    return {
      success: true,
      symbol: args.symbol,
      priceUsd: args.priceUsd,
      updatedAt: now,
    };
  },
});

/**
 * Get multiple token prices in batch
 */
export const getBatchPrices = query({
  args: {
    symbols: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    interface TokenPriceInfo {
      symbol: string;
      price: number;
      priceChange24h?: number;
      marketCap?: number;
      volume24h?: number;
      updatedAt: number;
    }

    const entries = await Promise.all(
      args.symbols.map(async (symbol) => {
        const price = await ctx.db
          .query('tokenPrices')
          .withIndex('by_symbol', (q) => q.eq('symbol', symbol))
          .first();
        if (price && now - price.updatedAt <= CACHE_DURATION) {
          const info: TokenPriceInfo = {
            symbol: price.symbol,
            price: price.priceUsd,
            priceChange24h: price.priceChange24h,
            marketCap: price.marketCap,
            volume24h: price.volume24h,
            updatedAt: price.updatedAt,
          };
          return [symbol, info] as const;
        }
        return null;
      })
    );

    const prices = entries.reduce<Record<string, TokenPriceInfo>>(
      (acc, entry) => {
        if (entry) {
          acc[entry[0]] = entry[1];
        }
        return acc;
      },
      {}
    );

    return prices;
  },
});

/**
 * Clean up expired price cache entries
 */
export const cleanupExpiredPrices = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expiredTime = now - CACHE_DURATION * 2; // Keep cache for 2x duration for fallback

    const expiredPrices = await ctx.db
      .query('tokenPrices')
      .filter((q) => q.lt(q.field('updatedAt'), expiredTime))
      .collect();

    await Promise.all(expiredPrices.map((price) => ctx.db.delete(price._id)));

    return {
      success: true,
      deletedCount: expiredPrices.length,
    };
  },
});
