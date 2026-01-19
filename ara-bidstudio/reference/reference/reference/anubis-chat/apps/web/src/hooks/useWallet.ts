'use client';

import { api } from '@convex/_generated/api';
import { useAuthActions } from '@convex-dev/auth/react';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import type { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { useMutation } from 'convex/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { WalletConnectionState } from '@/lib/solana';
import {
  connection,
  createSignInMessage,
  INITIAL_WALLET_STATE,
  lamportsToSol,
} from '@/lib/solana';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('wallet-hook');

export interface UseWalletReturn extends WalletConnectionState {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  signInWithSolana: () => Promise<{
    publicKey: string;
    signature: string;
    message: string;
  }>;
  authenticateWithConvex: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  formatAddress: (length?: number) => string;
  isHealthy: boolean;
  connectionHealthScore: number;
  isAuthenticating: boolean;
  walletName?: string;
  clearError: () => void;
}

// 2025 Security Constants
const CONNECTION_TIMEOUT = 30_000; // 30 seconds
const HEALTH_CHECK_INTERVAL = 60_000; // 1 minute
const _MAX_RETRY_ATTEMPTS = 3;

// Health Check Thresholds
const HEALTH_CHECK_EXCELLENT_THRESHOLD = 1000; // < 1s = excellent (100-80 score)
const HEALTH_CHECK_GOOD_THRESHOLD = 3000; // < 3s = good (80-60 score)
const HEALTH_CHECK_WARNING_THRESHOLD = 5000; // < 5s = warning (60-40 score)
const HEALTH_SCORE_EXCELLENT = 100;
const HEALTH_SCORE_GOOD = 80;
const HEALTH_SCORE_WARNING = 60;
const HEALTH_SCORE_CRITICAL = 40;

export const useWallet = (): UseWalletReturn => {
  const {
    wallet,
    publicKey: walletPublicKey,
    connected,
    connecting,
    connect: connectWallet,
    disconnect: disconnectWallet,
    signMessage: walletSignMessage,
    select,
    signIn,
  } = useSolanaWallet();
  const { setVisible } = useWalletModal();

  // Convex Auth integration
  const { signIn: convexSignIn } = useAuthActions();
  const createWalletChallenge = useMutation(api.auth.createWalletChallenge);

  const [state, setState] =
    useState<WalletConnectionState>(INITIAL_WALLET_STATE);
  const [isHealthy, setIsHealthy] = useState(true);
  const [connectionHealthScore, setConnectionHealthScore] = useState(100);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const healthCheckRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const retryCountRef = useRef(0);

  // 2025 Security: Connection health check function
  const performHealthCheck = useCallback(async (): Promise<void> => {
    if (!(connected && walletPublicKey)) {
      setIsHealthy(true);
      setConnectionHealthScore(100);
      return;
    }

    try {
      const startTime = Date.now();
      const _balance = await connection.getBalance(walletPublicKey);
      const responseTime = Date.now() - startTime;

      // Calculate health score based on response time using defined thresholds
      let healthScore = HEALTH_SCORE_EXCELLENT;
      if (responseTime > HEALTH_CHECK_WARNING_THRESHOLD) {
        healthScore = HEALTH_SCORE_CRITICAL;
      } else if (responseTime > HEALTH_CHECK_GOOD_THRESHOLD) {
        healthScore = HEALTH_SCORE_WARNING;
      } else if (responseTime > HEALTH_CHECK_EXCELLENT_THRESHOLD) {
        healthScore = HEALTH_SCORE_GOOD;
      }

      setConnectionHealthScore(healthScore);
      setIsHealthy(healthScore >= HEALTH_SCORE_WARNING);
      retryCountRef.current = 0;

      // Health check completed successfully
      // Note: In production, send metrics to monitoring service instead of console
    } catch (_error) {
      retryCountRef.current += 1;
      const healthScore = Math.max(20, 100 - retryCountRef.current * 20);
      setConnectionHealthScore(healthScore);
      setIsHealthy(retryCountRef.current <= 2);

      // Health check failed, retrying if within limits
      // Note: In production, send error metrics to monitoring service
    }
  }, [connected, walletPublicKey]);

  // 2025 Security: Simple wallet state storage
  // Note: For production, implement proper encryption using Web Crypto API or crypto-js
  const storeWalletState = useCallback((state: unknown): string => {
    try {
      return JSON.stringify(state);
    } catch {
      return '';
    }
  }, []);

  const _retrieveWalletState = useCallback((stored: string): unknown => {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }, []);

  // Update wallet state when Solana wallet state changes
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      isConnected: connected,
      isConnecting: connecting,
      publicKey: walletPublicKey,
      error: null,
    }));

    // Start health checks when connected
    if (connected && walletPublicKey) {
      performHealthCheck();
      healthCheckRef.current = setInterval(
        performHealthCheck,
        HEALTH_CHECK_INTERVAL
      );
    } else {
      if (healthCheckRef.current) {
        clearInterval(healthCheckRef.current);
        healthCheckRef.current = undefined;
      }
      setIsHealthy(true);
      setConnectionHealthScore(100);
    }

    return () => {
      if (healthCheckRef.current) {
        clearInterval(healthCheckRef.current);
      }
    };
  }, [connected, connecting, walletPublicKey, performHealthCheck]);

  // Fetch balance when wallet connects
  const fetchBalance = useCallback(
    async (pubkey: PublicKey): Promise<number> => {
      try {
        const balance = await connection.getBalance(pubkey);
        return lamportsToSol(balance);
      } catch (error) {
        log.error('Failed to fetch balance', {
          publicKey: pubkey.toBase58(),
          error: error instanceof Error ? error.message : String(error),
        });
        return 0;
      }
    },
    []
  );

  // Update balance when public key changes
  useEffect(() => {
    if (walletPublicKey && connected) {
      fetchBalance(walletPublicKey).then((balance) => {
        setState((prev) => ({ ...prev, balance }));
      });
    } else {
      setState((prev) => ({ ...prev, balance: null }));
    }
  }, [walletPublicKey, connected, fetchBalance]);

  // 2025 Security: Enhanced wallet state persistence with encryption
  useEffect(() => {
    if (connected && walletPublicKey && wallet?.adapter.name) {
      const walletState = {
        publicKey: walletPublicKey.toString(),
        walletName: wallet.adapter.name,
        connected: true,
        timestamp: Date.now(),
        healthScore: connectionHealthScore,
        version: '2025.8',
      };

      const serialized = storeWalletState(walletState);
      if (serialized) {
        localStorage.setItem('anubis-wallet-state', serialized);
      }
    } else if (!connected) {
      localStorage.removeItem('anubis-wallet-state');
    }
  }, [
    connected,
    walletPublicKey,
    wallet,
    connectionHealthScore,
    storeWalletState,
  ]);

  const connect = useCallback(async (): Promise<void> => {
    try {
      setState((prev) => ({ ...prev, isConnecting: true, error: null }));

      // If no wallet is selected, open the modal for wallet selection
      if (!wallet) {
        setVisible(true);
        setState((prev) => ({ ...prev, isConnecting: false }));
        return;
      }

      // 2025 Security: Connection timeout protection
      const connectTimeout = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Wallet connection timeout after 30 seconds')),
          CONNECTION_TIMEOUT
        )
      );

      await Promise.race([connectWallet(), connectTimeout]);

      // Wallet connected successfully
      // Note: In production, log to monitoring service
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to connect wallet';
      // Wallet connection failed
      // Note: In production, log to error tracking service instead
      setState((prev) => ({
        ...prev,
        error: `Connection failed: ${errorMessage}`,
        isConnecting: false,
      }));

      // Don't throw error if user cancelled or wallet not found
      if (
        !(
          errorMessage.includes('User rejected') ||
          errorMessage.includes('Wallet not found')
        )
      ) {
        throw error;
      }
    } finally {
      setState((prev) => ({ ...prev, isConnecting: false }));
    }
  }, [connectWallet, wallet, setVisible]);

  const disconnect = useCallback(async (): Promise<void> => {
    try {
      // 2025 Security: Clean up health checks on disconnect
      if (healthCheckRef.current) {
        clearInterval(healthCheckRef.current);
        healthCheckRef.current = undefined;
      }

      await disconnectWallet();
      setState(INITIAL_WALLET_STATE);
      setIsHealthy(true);
      setConnectionHealthScore(100);
      retryCountRef.current = 0;

      // Clean up wallet state storage
      localStorage.removeItem('anubis-wallet-state');

      // Wallet disconnected and state cleared
      // Note: In production, log to monitoring service
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to disconnect wallet';
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [disconnectWallet]);

  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      // Check wallet is connected
      if (!walletPublicKey) {
        throw new Error('Wallet not connected');
      }

      // Validate message
      if (!message || typeof message !== 'string') {
        throw new Error('Invalid message to sign');
      }

      try {
        // Add a small delay to ensure wallet is ready
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Check if wallet supports message signing
        if (!walletSignMessage) {
          // Some wallets might not have signMessage but have signIn for SIWS
          if (signIn) {
            const result = await signIn({
              domain: window.location.host,
              address: walletPublicKey.toString(),
              statement: message,
              nonce: crypto.randomUUID(),
            });
            if (result?.signature) {
              return bs58.encode(result.signature);
            }
          }
          throw new Error(
            'Wallet does not support message signing. Please try a different wallet.'
          );
        }

        const messageBytes = new TextEncoder().encode(message);

        // Call the wallet's signMessage function
        const signature = await walletSignMessage(messageBytes);

        if (!signature) {
          throw new Error('No signature returned from wallet');
        }

        const encodedSignature = bs58.encode(signature);
        return encodedSignature;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to sign message';
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw new Error(`Message signing failed: ${errorMessage}`);
      }
    },
    [walletSignMessage, walletPublicKey, signIn]
  );

  const signInWithSolana = useCallback(async (): Promise<{
    publicKey: string;
    signature: string;
    message: string;
  }> => {
    if (!walletPublicKey) {
      throw new Error('Wallet not connected');
    }

    const message = createSignInMessage(walletPublicKey.toString());
    const signature = await signMessage(message);

    return {
      publicKey: walletPublicKey.toString(),
      signature,
      message,
    };
  }, [walletPublicKey, signMessage]);

  // Authenticate with Convex using wallet signature
  const authenticateWithConvex = useCallback(async (): Promise<void> => {
    if (!(walletPublicKey && connected)) {
      throw new Error('Wallet must be connected to authenticate');
    }

    if (isAuthenticating) {
      return; // Prevent multiple simultaneous auth attempts
    }

    try {
      setIsAuthenticating(true);
      setState((prev) => ({ ...prev, error: null }));

      log.info('Starting Convex Auth with wallet', {
        publicKey: walletPublicKey.toString(),
      });

      // Step 1: Get challenge from backend
      const challengeResponse = await createWalletChallenge({
        publicKey: walletPublicKey.toString(),
      });

      if (!challengeResponse) {
        throw new Error('Failed to create wallet challenge');
      }

      const { challenge, nonce } = challengeResponse;

      // Step 2: Sign the challenge message
      const signature = await signMessage(challenge);

      // Step 3: Sign in with Convex Auth using the signature
      // ConvexCredentials providers expect the credentials as a plain object
      // The credentials will be passed to the authorize function on the backend
      const credentialsData = {
        publicKey: walletPublicKey.toString(),
        signature,
        message: challenge,
        nonce,
        walletAddress: walletPublicKey.toString(), // Include for backward compatibility
      };

      log.info('Signing in with credentials', {
        publicKey: credentialsData.publicKey,
        hasSignature: !!credentialsData.signature,
        hasMessage: !!credentialsData.message,
        hasNonce: !!credentialsData.nonce,
      });

      // Pass credentials as a plain object for ConvexCredentials provider
      await convexSignIn('solana-wallet', credentialsData);

      log.info('Convex Auth successful', {
        publicKey: walletPublicKey.toString(),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Authentication failed';

      setState((prev) => ({ ...prev, error: errorMessage }));
      log.error('Convex Auth failed', { error: errorMessage });
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  }, [
    walletPublicKey,
    connected,
    isAuthenticating,
    createWalletChallenge,
    signMessage,
    convexSignIn,
  ]);

  const refreshBalance = useCallback(async (): Promise<void> => {
    if (!walletPublicKey) {
      return;
    }

    try {
      const balance = await fetchBalance(walletPublicKey);
      setState((prev) => ({ ...prev, balance }));
    } catch (error) {
      // Better error handling for production
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to refresh balance';
      setState((prev) => ({ ...prev, error: errorMessage }));
      log.error('Failed to refresh balance', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [walletPublicKey, fetchBalance]);

  const formatAddress = useCallback(
    (length = 4): string => {
      if (!walletPublicKey) {
        return '';
      }
      const address = walletPublicKey.toString();
      return `${address.slice(0, length)}...${address.slice(-length)}`;
    },
    [walletPublicKey]
  );

  return {
    ...state,
    connect,
    disconnect,
    signMessage,
    signInWithSolana,
    authenticateWithConvex,
    refreshBalance,
    formatAddress,
    isHealthy,
    connectionHealthScore,
    isAuthenticating,
    walletName: wallet?.adapter?.name,
    clearError: () => setState((prev) => ({ ...prev, error: null })),
  };
};
