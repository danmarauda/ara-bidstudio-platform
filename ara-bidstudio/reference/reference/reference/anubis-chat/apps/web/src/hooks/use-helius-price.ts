'use client';

import { api } from '@convex/_generated/api';
import { useMutation, useQuery } from 'convex/react';
import { useCallback, useEffect, useState } from 'react';
import { env } from '@/lib/env';

// Solana token mint addresses
const TOKEN_MINTS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
} as const;

interface TokenPrice {
  symbol: string;
  price: number;
  priceChange24h?: number;
  marketCap?: number;
  volume24h?: number;
  updatedAt?: number;
}

interface HeliusPriceResponse {
  result?: {
    token_info?: {
      price_info?: {
        price_per_token: number;
        currency: string;
      };
      supply?: number;
      decimals?: number;
    };
  };
}

/**
 * Hook to fetch token prices using Helius API with Convex caching
 * This reduces API calls and provides faster response times
 */
export function useHeliusPrice(symbol = 'SOL') {
  const [price, setPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get cached price from Convex
  const cachedPrice = useQuery(api.tokenPrices.getCachedPrice, {
    tokenSymbol: symbol,
  });

  // Mutation to update cache
  const updateCache = useMutation(api.tokenPrices.updateCachedPrice);

  /**
   * Alternative method to fetch SOL price using Jupiter aggregator
   */
  const fetchSolPriceAlternative = useCallback(
    async (_apiKey: string): Promise<number> => {
      // Use Jupiter Price API as fallback
      const response = await fetch('https://price.jup.ag/v4/price?ids=SOL');

      if (!response.ok) {
        throw new Error('Failed to fetch from Jupiter');
      }

      const data = await response.json();
      if (data.data?.SOL?.price) {
        const price = data.data.SOL.price;

        // Update cache
        await updateCache({
          symbol: 'SOL',
          priceUsd: price,
          mintAddress: TOKEN_MINTS.SOL,
        });

        return price;
      }

      throw new Error('No price data available');
    },
    [updateCache]
  );

  /**
   * Fetch price from Helius API
   */
  const fetchPriceFromHelius = useCallback(async () => {
    const mintAddress = TOKEN_MINTS[symbol as keyof typeof TOKEN_MINTS];
    if (!mintAddress) {
      throw new Error(`Unsupported token: ${symbol}`);
    }

    // Get RPC URL from environment
    const rpcUrl = env.NEXT_PUBLIC_SOLANA_RPC_URL;
    if (!rpcUrl?.includes('helius')) {
      // Fallback to a basic Helius endpoint if not configured
      throw new Error('Helius RPC URL not configured');
    }

    // Extract API key from URL if present
    const apiKeyMatch = rpcUrl.match(/api-key=([^&]+)/);
    const apiKey = apiKeyMatch ? apiKeyMatch[1] : null;

    if (!apiKey) {
      throw new Error('Helius API key not found in RPC URL');
    }

    // Call Helius DAS API to get asset info including price
    const response = await fetch(
      `https://mainnet.helius-rpc.com/?api-key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'price-fetch',
          method: 'getAsset',
          params: {
            id: mintAddress,
            displayOptions: {
              showFungible: true,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Helius');
    }

    const data: HeliusPriceResponse = await response.json();

    if (data.result?.token_info?.price_info) {
      const pricePerToken = data.result.token_info.price_info.price_per_token;

      // Update local state
      setPrice(pricePerToken);

      // Update Convex cache
      await updateCache({
        symbol,
        priceUsd: pricePerToken,
        mintAddress,
      });

      return pricePerToken;
    }
    // If Helius doesn't have price data, try alternative method
    // For SOL, we can use a different endpoint
    if (symbol === 'SOL') {
      return await fetchSolPriceAlternative(apiKey);
    }
    throw new Error('Price data not available from Helius');
  }, [symbol, updateCache, fetchSolPriceAlternative]);

  useEffect(() => {
    let isMounted = true;

    const fetchPrice = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if we have a valid cached price
        if (cachedPrice?.price) {
          setPrice(cachedPrice.price);
          setPriceChange(cachedPrice.priceChange24h || null);

          // Cache is valid, no need to fetch
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        // No valid cache, fetch from Helius
        const fetchedPrice = await fetchPriceFromHelius();

        if (isMounted) {
          setPrice(fetchedPrice);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Failed to fetch price'
          );
          setIsLoading(false);

          // If fetch fails but we have cached data, use it as fallback
          if (cachedPrice) {
            setPrice(cachedPrice.price);
            setPriceChange(cachedPrice.priceChange24h || null);
          }
        }
      }
    };

    fetchPrice();

    // Refresh price every 60 seconds if cache is stale
    const interval = setInterval(() => {
      if (!cachedPrice || Date.now() - (cachedPrice.updatedAt || 0) > 60_000) {
        fetchPrice();
      }
    }, 60_000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [cachedPrice, fetchPriceFromHelius]);

  /**
   * Convert token amount to USD
   */
  const tokenToUsd = (amount: number): number | null => {
    if (price === null) {
      return null;
    }
    return amount * price;
  };

  /**
   * Format USD amount with proper currency formatting
   */
  const formatUsd = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  /**
   * Format price change percentage
   */
  const formatPriceChange = (): string => {
    if (priceChange === null) {
      return '';
    }
    const sign = priceChange >= 0 ? '+' : '';
    return `${sign}${priceChange.toFixed(2)}%`;
  };

  return {
    price,
    priceChange,
    isLoading,
    error,
    tokenToUsd,
    formatUsd,
    formatPriceChange,
    cachedAt: cachedPrice?.updatedAt,
  };
}
