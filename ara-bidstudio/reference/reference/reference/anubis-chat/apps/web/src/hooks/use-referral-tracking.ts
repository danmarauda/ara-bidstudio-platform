'use client';

import { api } from '@convex/_generated/api';
import { useMutation } from 'convex/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect } from 'react';

/**
 * Custom hook for tracking referral attribution from URL parameters
 * Captures referral codes from ?ref= parameter and persists them for user attribution
 */
export function useReferralTracking() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const trackAttribution = useMutation(api.referrals.trackReferralAttribution);

  const captureReferralCode = useCallback(
    async (referralCode: string) => {
      try {
        // Get client IP and user agent for fraud detection
        let ipAddress: string | undefined;
        let userAgent: string | undefined;

        try {
          // Get user agent
          userAgent = navigator.userAgent;

          // Try to get IP address from a service (optional - you may want to use your own IP detection)
          // For now, we'll rely on server-side IP detection in the mutation
          ipAddress = undefined;
        } catch (_error) {
          // Ignore client-side detection errors
        }

        // Track the attribution
        const result = await trackAttribution({
          referralCode,
          ipAddress,
          userAgent,
          source: 'website_link',
        });

        if (result.success) {
          // Store referral code in localStorage for persistence across pages
          localStorage.setItem('referralCode', referralCode);
          localStorage.setItem('referralTimestamp', Date.now().toString());

          // Remove the ref parameter from URL for clean browsing
          const newSearchParams = new URLSearchParams(searchParams.toString());
          newSearchParams.delete('ref');

          const newUrl = newSearchParams.toString()
            ? `${window.location.pathname}?${newSearchParams.toString()}`
            : window.location.pathname;

          router.replace(newUrl);
          return true;
        }
      } catch (_error) {
        // Still store in localStorage even if tracking fails (for retry later)
        if (referralCode) {
          localStorage.setItem('referralCode', referralCode);
          localStorage.setItem('referralTimestamp', Date.now().toString());
        }

        return false;
      }
    },
    [trackAttribution, searchParams, router]
  );

  // Check for referral code in URL on component mount
  useEffect(() => {
    const refParam = searchParams.get('ref');

    if (refParam) {
      // Validate referral code format (8 characters, alphanumeric)
      const isValidCode = /^[A-Z0-9]{4,12}$/i.test(refParam);

      if (isValidCode) {
        captureReferralCode(refParam.toUpperCase());
      } else {
      }
    }
  }, [searchParams, captureReferralCode]);

  // Function to get stored referral code
  const getStoredReferralCode = useCallback(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    const referralCode = localStorage.getItem('referralCode');
    const timestamp = localStorage.getItem('referralTimestamp');

    if (referralCode && timestamp) {
      const storedTime = Number.parseInt(timestamp, 10);
      const now = Date.now();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

      // Check if referral code is still valid (within 30 days)
      if (now - storedTime <= thirtyDays) {
        return referralCode;
      }
      // Clean up expired referral code
      localStorage.removeItem('referralCode');
      localStorage.removeItem('referralTimestamp');
    }

    return null;
  }, []);

  // Function to clear stored referral code (call after successful attribution)
  const clearStoredReferralCode = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.removeItem('referralCode');
    localStorage.removeItem('referralTimestamp');
  }, []);

  // Function to manually track a referral code (for programmatic use)
  const trackReferralCode = useCallback(
    async (code: string) => {
      return await captureReferralCode(code);
    },
    [captureReferralCode]
  );

  return {
    getStoredReferralCode,
    clearStoredReferralCode,
    trackReferralCode,
  };
}

/**
 * Hook specifically for handling referral attribution during user signup
 * Should be called when a user signs up with a wallet
 */
export function useReferralAttribution() {
  const attributeReferral = useMutation(api.referrals.attributeReferralToUser);
  const { getStoredReferralCode, clearStoredReferralCode } =
    useReferralTracking();

  const attributeStoredReferral = useCallback(
    async (walletAddress: string) => {
      const referralCode = getStoredReferralCode();

      if (!referralCode) {
        return { success: false, reason: 'No stored referral code' };
      }

      try {
        const result = await attributeReferral({
          referralCode,
          walletAddress,
        });

        if (result.success && result.attributed) {
          // Clear stored referral code after successful attribution
          clearStoredReferralCode();
          return { success: true, referralCode };
        }
        if (result.success && !result.attributed) {
          return { success: false, reason: 'No pending attribution found' };
        }
      } catch (error) {
        return {
          success: false,
          reason: error instanceof Error ? error.message : 'Attribution failed',
        };
      }

      return { success: false, reason: 'Unknown error' };
    },
    [attributeReferral, getStoredReferralCode, clearStoredReferralCode]
  );

  // Auto-attempt attribution immediately for eligible users right after sign-in
  // Consumers can call this with walletAddress to ensure auto-claim within 72h
  const autoAssignIfEligible = useCallback(
    async (walletAddress: string) => {
      const referralCode = getStoredReferralCode();
      if (!referralCode) {
        return { success: false } as const;
      }
      try {
        const res = await attributeReferral({ referralCode, walletAddress });
        if (res?.success && (res.attributed || res.assigned)) {
          clearStoredReferralCode();
          return { success: true } as const;
        }
        return { success: false } as const;
      } catch (_e) {
        return { success: false } as const;
      }
    },
    [attributeReferral, getStoredReferralCode, clearStoredReferralCode]
  );

  return {
    attributeStoredReferral,
    getStoredReferralCode,
    clearStoredReferralCode,
    autoAssignIfEligible,
  };
}
