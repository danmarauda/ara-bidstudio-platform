'use client';

import { useEffect, useState } from 'react';

interface PriceData {
  usd: number;
  usd_24h_change: number;
}

/**
 * Hook to fetch current Solana price in USD
 * Uses CoinGecko API (free tier, no API key needed for basic requests)
 */
export function useSolanaPrice() {
  const [price, setPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchPrice = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // CoinGecko API - Free tier endpoint
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true'
        );

        if (!response.ok) {
          throw new Error('Failed to fetch price');
        }

        const data = await response.json();

        if (isMounted && data.solana) {
          setPrice(data.solana.usd);
          setPriceChange(data.solana.usd_24h_change);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Failed to fetch price'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Fetch immediately
    fetchPrice();

    // Refresh every 60 seconds
    const interval = setInterval(fetchPrice, 60_000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  /**
   * Convert SOL amount to USD
   */
  const solToUsd = (solAmount: number): number | null => {
    if (price === null) {
      return null;
    }
    return solAmount * price;
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
    solToUsd,
    formatUsd,
    formatPriceChange,
  };
}
