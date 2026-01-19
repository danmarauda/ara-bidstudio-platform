'use client';

import { Loader2, LogOut, Wallet } from 'lucide-react';
import { useCallback } from 'react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { useReferralAttribution } from '@/hooks/use-referral-tracking';
import { useWallet } from '@/hooks/useWallet';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('wallet-auth-button');

interface WalletAuthButtonProps {
  className?: string;
  showAddress?: boolean;
}

/**
 * Wallet Authentication Button
 *
 * Provides a unified interface for:
 * - Wallet connection/disconnection
 * - Convex Auth authentication
 * - User session management
 *
 * Features:
 * - Automatic authentication after wallet connection
 * - Loading states and error handling
 * - Responsive design and accessibility
 * - Integration with Convex Auth system
 */
export function WalletAuthButton({
  className = '',
  showAddress = false,
}: WalletAuthButtonProps) {
  const wallet = useWallet();
  const { isAuthenticated, user } = useAuthContext();
  const { attributeStoredReferral } = useReferralAttribution();

  const handleConnect = useCallback(async () => {
    try {
      log.info('Starting wallet connection flow');

      // Step 1: Connect wallet
      await wallet.connect();

      if (!(wallet.isConnected && wallet.publicKey)) {
        throw new Error('Wallet connection failed');
      }

      // Step 2: Authenticate with Convex
      await wallet.authenticateWithConvex();

      // Step 3: Handle referral attribution if successful
      if (wallet.publicKey) {
        try {
          const attributionResult = await attributeStoredReferral(
            wallet.publicKey.toBase58()
          );

          if (attributionResult.success) {
            log.info('Referral attribution successful', {
              referralCode: attributionResult.referralCode,
            });
          } else if (attributionResult.reason !== 'No stored referral code') {
            log.warn('Referral attribution failed', {
              reason: attributionResult.reason,
            });
          }
        } catch (attributionError) {
          // Don't fail wallet connection if referral attribution fails
          log.warn('Referral attribution error (non-critical)', {
            error:
              attributionError instanceof Error
                ? attributionError.message
                : 'Unknown error',
          });
        }
      }

      log.info('Wallet connection and authentication successful', {
        publicKey: wallet.publicKey,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Connection failed';
      log.error('Wallet connection/authentication failed', {
        error: errorMessage,
      });
    }
  }, [wallet, attributeStoredReferral]);

  const handleDisconnect = useCallback(async () => {
    try {
      log.info('Starting wallet disconnection');
      await wallet.disconnect();
      log.info('Wallet disconnected successfully');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Disconnection failed';
      log.error('Wallet disconnection failed', { error: errorMessage });
    }
  }, [wallet]);

  // Loading state
  if (wallet.isConnecting || wallet.isAuthenticating) {
    return (
      <Button className={className} disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {wallet.isConnecting ? 'Connecting...' : 'Authenticating...'}
      </Button>
    );
  }

  // Connected and authenticated
  if (wallet.isConnected && isAuthenticated && user) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showAddress && wallet.publicKey && (
          <div className="font-mono text-muted-foreground text-sm">
            {wallet.formatAddress(6)}
          </div>
        )}
        <Button className="gap-2" onClick={handleDisconnect} variant="outline">
          <LogOut className="h-4 w-4" />
          Disconnect
        </Button>
      </div>
    );
  }

  // Connected but not authenticated
  if (wallet.isConnected && !isAuthenticated) {
    return (
      <Button
        className={className}
        disabled={wallet.isAuthenticating}
        onClick={wallet.authenticateWithConvex}
      >
        <Wallet className="mr-2 h-4 w-4" />
        Authenticate
      </Button>
    );
  }

  // Not connected
  return (
    <Button className={className} onClick={handleConnect}>
      <Wallet className="mr-2 h-4 w-4" />
      Connect Wallet
    </Button>
  );
}

// Helper hook for wallet connection status
export function useWalletConnectionStatus() {
  const wallet = useWallet();
  const { isAuthenticated, user } = useAuthContext();

  return {
    // Connection states
    isConnected: wallet.isConnected,
    isConnecting: wallet.isConnecting,

    // Authentication states
    isAuthenticated,
    isAuthenticating: wallet.isAuthenticating,

    // User info
    user,
    publicKey: wallet.publicKey,
    walletName: wallet.walletName,
    balance: wallet.balance,

    // Actions
    connect: wallet.connect,
    disconnect: wallet.disconnect,
    authenticate: wallet.authenticateWithConvex,
    refreshBalance: wallet.refreshBalance,

    // Utilities
    formatAddress: wallet.formatAddress,

    // Error handling
    error: wallet.error,
    clearError: wallet.clearError,

    // Health monitoring
    isHealthy: wallet.isHealthy,
    connectionHealthScore: wallet.connectionHealthScore,
  };
}

export default WalletAuthButton;
