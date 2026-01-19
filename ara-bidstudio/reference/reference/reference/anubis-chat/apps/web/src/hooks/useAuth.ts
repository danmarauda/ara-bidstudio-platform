'use client';

import { api } from '@convex/_generated/api';
import { useAuthActions, useAuthToken } from '@convex-dev/auth/react';
import { useMutation, useQuery } from 'convex/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { AuthSession, User } from '@/lib/types/api';
import { createModuleLogger } from '@/lib/utils/logger';
import { useReferralAttribution } from './use-referral-tracking';
import { useWallet } from './useWallet';

const log = createModuleLogger('useAuth');

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  error: string | null;
}

interface UseAuthReturn extends AuthState {
  login: () => Promise<AuthSession | null>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  clearError: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const { publicKey, signMessage, isConnected } = useWallet();
  const { signIn, signOut } = useAuthActions();
  const token = useAuthToken();
  const { autoAssignIfEligible, getStoredReferralCode } =
    useReferralAttribution();

  // Convex mutations for wallet auth
  const createWalletChallenge = useMutation(api.auth.createWalletChallenge);
  const getReferralCodeOwnerInfo = useQuery(
    api.referrals.getReferralCodeOwnerInfo,
    getStoredReferralCode()
      ? { referralCode: getStoredReferralCode()! }
      : 'skip'
  );

  // Get current user from Convex
  const currentUser = useQuery(
    api.users.getUserByWallet,
    token && publicKey ? { walletAddress: publicKey.toString() } : 'skip'
  );

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Derived state from Convex Auth
  const isAuthenticated = !!token;

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Login with Solana wallet using Convex Auth
   */
  const login = useCallback(async (): Promise<AuthSession | null> => {
    if (!(isConnected && publicKey && signMessage)) {
      const errorMsg = 'Wallet not connected or missing required methods';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    setIsLoading(true);
    setError(null);

    try {
      log.info('Starting Convex Auth login with Solana wallet');

      // Step 1: Get challenge from Convex
      const challengeData = await createWalletChallenge({
        publicKey: publicKey.toString(),
      });

      if (!(challengeData?.challenge && challengeData?.nonce)) {
        throw new Error('Failed to receive valid challenge from server');
      }

      // Step 2: Sign the challenge
      const signature = await signMessage(challengeData.challenge);

      if (!signature) {
        throw new Error('Failed to sign challenge message');
      }

      // Step 3: Authenticate with ConvexAuth using credentials shape expected by ConvexCredentials
      const result = await signIn('solana-wallet', {
        account: {
          id: publicKey.toString(),
          secret: signature,
        },
        profile: {
          publicKey: publicKey.toString(),
          signature,
          message: challengeData.challenge,
          nonce: challengeData.nonce,
        },
      });

      log.info('Convex Auth login completed', { result });

      // After successful login, try to automatically assign referral if eligible
      const walletAddress = publicKey.toString();
      const storedReferralCode = getStoredReferralCode();

      if (storedReferralCode && walletAddress) {
        log.info('Attempting automatic referral assignment', {
          referralCode: storedReferralCode,
          walletAddress,
        });

        try {
          const assignmentResult = await autoAssignIfEligible(walletAddress);

          if (assignmentResult.success) {
            // Get referrer name for the toast notification
            const referrerName =
              getReferralCodeOwnerInfo?.ownerDisplayName || 'your referrer';

            toast.success(
              `Congratulations! ${referrerName} has been set as your referral.`,
              {
                duration: 5000,
                description:
                  "You'll support them with your future transactions.",
              }
            );

            log.info('Referral successfully assigned', {
              referralCode: storedReferralCode,
              referrerName,
            });
          } else {
            log.info('Referral assignment not successful', {
              referralCode: storedReferralCode,
              reason:
                'User may already have a referrer or grace period expired',
            });
          }
        } catch (referralError) {
          log.warn('Failed to assign referral', {
            error:
              referralError instanceof Error
                ? referralError.message
                : 'Unknown error',
            referralCode: storedReferralCode,
          });
          // Don't throw - referral assignment failure shouldn't break login
        }
      }

      // Return session data (token will be available via useAuthToken)
      return {
        walletAddress: publicKey.toString(),
        publicKey: publicKey.toString(),
        user: currentUser as User,
        token: token || '',
        refreshToken: '', // Not implemented yet
        expiresAt: Date.now() + 3_600_000, // 1 hour
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Wallet authentication failed';

      log.error('Convex Auth login failed', { error: errorMessage });
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [
    isConnected,
    publicKey,
    signMessage,
    createWalletChallenge,
    signIn,
    currentUser,
    token,
    getStoredReferralCode,
    autoAssignIfEligible,
    getReferralCodeOwnerInfo,
  ]);

  /**
   * Logout using Convex Auth
   */
  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await signOut();
      log.info('User signed out successfully via Convex Auth');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Sign out failed';

      log.error('Convex Auth sign out failed', { error: errorMessage });
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [signOut]);

  /**
   * Refresh token - Convex Auth handles this automatically
   */
  const refreshToken = useCallback(async (): Promise<string | null> => {
    // Convex Auth handles token refresh automatically
    // Just return the current token
    return token;
  }, [token]);

  // Auto-authenticate when wallet connects
  useEffect(() => {
    if (isConnected && publicKey && !isAuthenticated && !isLoading && !error) {
      log.info('Wallet connected, attempting auto-authentication');

      // Small delay to ensure wallet is fully initialized
      const timeoutId = setTimeout(() => {
        login().catch((error) => {
          log.warn('Auto-authentication failed', { error: error.message });
          // Don't throw here - user can manually retry
        });
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [isConnected, publicKey, isAuthenticated, isLoading, error, login]);

  // Auto-logout when wallet disconnects
  useEffect(() => {
    if (!isConnected && isAuthenticated) {
      log.info('Wallet disconnected, signing out');
      logout().catch((error) => {
        log.warn('Auto-logout failed', { error: error.message });
      });
    }
  }, [isConnected, isAuthenticated, logout]);

  return {
    isAuthenticated,
    isLoading,
    user: currentUser as User | null,
    token,
    error,
    login,
    logout,
    refreshToken,
    clearError,
  };
};
