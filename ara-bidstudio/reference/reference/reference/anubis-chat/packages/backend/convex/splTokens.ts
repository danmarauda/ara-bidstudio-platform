/**
 * SPL Token Configuration and Price Fetching System
 * Handles dynamic SPL token configuration and price conversion
 */

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { solanaConfig } from './env';

// SPL Token Configuration Types
export interface SPLTokenConfig {
  symbol: string;
  name: string;
  address: string; // Mint address
  decimals: number;
  logoUri?: string;
  enabled: boolean;
}

// Price Data Types
export interface TokenPrice {
  symbol: string;
  address: string;
  priceUsd: number;
  priceSol: number;
  lastUpdated: number;
}

// Default SPL Token Registry (can be overridden by environment config)
const DEFAULT_SPL_TOKENS: SPLTokenConfig[] = [
  {
    symbol: 'SYMX',
    name: 'Symbiosis Token',
    address: 'Fu4jQQpUnECSVQrVfeeVPpQpXQffM75LL328EJPtpump',
    decimals: 6,
    enabled: true,
  },
  {
    symbol: 'PUMP',
    name: 'Pump Token',
    address: 'pumpCmXqMfrsAkQ5r49WcJnRayYRqmXz6ae8H7H9Dfn',
    decimals: 6,
    enabled: true,
  },
];

// Get configured SPL tokens
export function getConfiguredSPLTokens(): SPLTokenConfig[] {
  if (!solanaConfig.splTokens.enabled) {
    return [];
  }

  // Use environment configuration if available, otherwise defaults
  const envTokens = solanaConfig.splTokens.tokens;
  if (envTokens && envTokens.length > 0) {
    return envTokens.map((token: any) => ({
      symbol: token.symbol,
      name: token.name || token.symbol,
      address: token.address,
      decimals: token.decimals || 6,
      logoUri: token.logoUri,
      enabled: token.enabled !== false,
    }));
  }

  return DEFAULT_SPL_TOKENS;
}

// Get available payment tokens (SOL + enabled SPL tokens)
export const getAvailablePaymentTokens = query({
  args: {},
  handler: async (_ctx) => {
    const splTokens = getConfiguredSPLTokens().filter((token) => token.enabled);

    return {
      sol: {
        symbol: 'SOL',
        name: 'Solana',
        address: 'native',
        decimals: 9,
        enabled: true,
      },
      splTokens,
    };
  },
});

// Price fetching service
class PriceFeedService {
  private cache = new Map<string, { price: TokenPrice; expiry: number }>();
  private readonly cacheTtl: number;

  constructor() {
    this.cacheTtl = solanaConfig.splTokens.priceFeed.cacheTtlSeconds * 1000;
  }

  private isValidCacheEntry(entry: {
    price: TokenPrice;
    expiry: number;
  }): boolean {
    return Date.now() < entry.expiry;
  }

  private getCachedPrice(address: string): TokenPrice | null {
    const entry = this.cache.get(address);
    if (entry && this.isValidCacheEntry(entry)) {
      return entry.price;
    }
    return null;
  }

  private setCachedPrice(address: string, price: TokenPrice): void {
    this.cache.set(address, {
      price,
      expiry: Date.now() + this.cacheTtl,
    });
  }

  // Fetch price from Jupiter API
  private async fetchJupiterPrice(
    tokenAddress: string
  ): Promise<number | null> {
    try {
      const response = await fetch(
        `https://price.jup.ag/v6/price?ids=${tokenAddress}`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.data?.[tokenAddress]?.price || null;
    } catch (error) {
      console.error('Jupiter price fetch error:', error);
      return null;
    }
  }

  // Fetch SOL price (needed for conversion)
  private async fetchSOLPrice(): Promise<number | null> {
    try {
      const response = await fetch(
        'https://price.jup.ag/v6/price?ids=So11111111111111111111111111111111111111112'
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return (
        data.data?.['So11111111111111111111111111111111111111112']?.price ||
        null
      );
    } catch (error) {
      console.error('SOL price fetch error:', error);
      return null;
    }
  }

  // Get token price with SOL conversion
  async getTokenPrice(tokenConfig: SPLTokenConfig): Promise<TokenPrice | null> {
    // Check cache first
    const cached = this.getCachedPrice(tokenConfig.address);
    if (cached) {
      return cached;
    }

    try {
      const [tokenPriceUsd, solPriceUsd] = await Promise.all([
        this.fetchJupiterPrice(tokenConfig.address),
        this.fetchSOLPrice(),
      ]);

      if (!(tokenPriceUsd && solPriceUsd)) {
        return null;
      }

      const priceSol = tokenPriceUsd / solPriceUsd;

      const price: TokenPrice = {
        symbol: tokenConfig.symbol,
        address: tokenConfig.address,
        priceUsd: tokenPriceUsd,
        priceSol,
        lastUpdated: Date.now(),
      };

      // Cache the result
      this.setCachedPrice(tokenConfig.address, price);

      return price;
    } catch (error) {
      console.error(`Error fetching price for ${tokenConfig.symbol}:`, error);
      return null;
    }
  }

  // Get all token prices
  async getAllTokenPrices(): Promise<TokenPrice[]> {
    const tokens = getConfiguredSPLTokens().filter((token) => token.enabled);
    const prices = await Promise.all(
      tokens.map((token) => this.getTokenPrice(token))
    );

    return prices.filter((price): price is TokenPrice => price !== null);
  }
}

// Global price feed service instance
const priceFeedService = new PriceFeedService();

// Get token prices (with caching)
export const getTokenPrices = query({
  args: {
    tokenAddresses: v.optional(v.array(v.string())),
  },
  handler: async (_ctx, args) => {
    try {
      if (args.tokenAddresses && args.tokenAddresses.length > 0) {
        // Get prices for specific tokens
        const tokens = getConfiguredSPLTokens().filter((token) =>
          args.tokenAddresses!.includes(token.address)
        );

        const prices = await Promise.all(
          tokens.map((token) => priceFeedService.getTokenPrice(token))
        );

        return prices.filter((price): price is TokenPrice => price !== null);
      }
      // Get all token prices
      return await priceFeedService.getAllTokenPrices();
    } catch (error) {
      console.error('Error fetching token prices:', error);
      return [];
    }
  },
});

// Calculate payment amount in tokens for subscription pricing
export const calculateTokenPaymentAmount = query({
  args: {
    tokenAddress: v.string(),
    subscriptionTier: v.union(v.literal('pro'), v.literal('pro_plus')),
  },
  handler: async (_ctx, args) => {
    try {
      // Get SOL price for the subscription tier
      const subscriptionPrices = {
        pro: 0.05, // SOL
        pro_plus: 0.1, // SOL
      };

      const solAmount = subscriptionPrices[args.subscriptionTier];

      // If requesting SOL payment, return SOL amount
      if (args.tokenAddress === 'native' || args.tokenAddress === 'SOL') {
        return {
          tokenAddress: 'native',
          symbol: 'SOL',
          amount: solAmount,
          decimals: 9,
          rawAmount: Math.floor(solAmount * 10 ** 9), // Convert to lamports
        };
      }

      // Find the token configuration
      const tokenConfig = getConfiguredSPLTokens().find(
        (token) => token.address === args.tokenAddress
      );

      if (!tokenConfig) {
        throw new Error(
          `Token ${args.tokenAddress} not found in configuration`
        );
      }

      // Get current token price
      const tokenPrice = await priceFeedService.getTokenPrice(tokenConfig);
      if (!tokenPrice) {
        throw new Error(`Unable to fetch price for ${tokenConfig.symbol}`);
      }

      // Calculate token amount needed
      const tokenAmount = solAmount / tokenPrice.priceSol;
      const rawAmount = Math.floor(tokenAmount * 10 ** tokenConfig.decimals);

      return {
        tokenAddress: args.tokenAddress,
        symbol: tokenConfig.symbol,
        amount: tokenAmount,
        decimals: tokenConfig.decimals,
        rawAmount,
        priceInfo: {
          solPrice: tokenPrice.priceSol,
          usdPrice: tokenPrice.priceUsd,
          lastUpdated: tokenPrice.lastUpdated,
        },
      };
    } catch (error) {
      console.error('Error calculating token payment amount:', error);
      throw new Error(
        `Failed to calculate payment amount: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});

// Validate SPL token configuration
export const validateSPLTokenConfig = mutation({
  args: {},
  handler: async (_ctx) => {
    const tokens = getConfiguredSPLTokens();
    const validationResults = [];

    for (const token of tokens) {
      try {
        const price = await priceFeedService.getTokenPrice(token);
        validationResults.push({
          symbol: token.symbol,
          address: token.address,
          valid: !!price,
          price: price?.priceUsd || null,
          error: price ? null : 'Unable to fetch price',
        });
      } catch (error) {
        validationResults.push({
          symbol: token.symbol,
          address: token.address,
          valid: false,
          price: null,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      configured: tokens.length,
      valid: validationResults.filter((r) => r.valid).length,
      results: validationResults,
    };
  },
});
