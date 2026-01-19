'use client';

import { Wallet } from 'lucide-react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { WalletConnectButton } from '@/components/wallet/wallet-connect-button';
import { useWallet } from '@/hooks/useWallet';
import { formatSolanaAddress } from '@/lib/solana';

export default function WalletPage() {
  const { isAuthenticated } = useAuthContext();
  const {
    isConnected,
    isConnecting,
    publicKey,
    balance,
    connect,
    authenticateWithConvex,
    refreshBalance,
    isHealthy,
    // connectionHealthScore,
    error,
  } = useWallet();

  const address = publicKey?.toString() ?? '';

  return (
    <div className="w-full bg-gradient-to-b from-primary/5 dark:from-primary/10">
      {/* Full-width header */}
      <div className="w-full p-4 md:p-6">
        <div className="mx-auto w-full max-w-6xl">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto] md:items-center">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              <h1 className="whitespace-nowrap bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text font-semibold text-transparent text-xl sm:text-2xl">
                Wallet
              </h1>
            </div>
            <div className="flex md:justify-end">
              <Badge variant={isConnected ? 'default' : 'secondary'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Constrained content */}
      <div className="mx-auto mt-3 w-full max-w-6xl px-3 sm:px-4 md:px-6">
        <Card className="p-3 sm:p-4 md:p-6">
          {isConnected ? (
            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs">Address</p>
                  <p className="truncate font-mono text-sm" title={address}>
                    {formatSolanaAddress(address, 8)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-3">
                  <div className="rounded-md border p-2">
                    <p className="text-[10px] text-muted-foreground uppercase">
                      Balance
                    </p>
                    <p className="text-sm">
                      {Number(balance ?? 0).toFixed(4)} SOL
                    </p>
                  </div>
                  <div className="rounded-md border p-2">
                    <p className="text-[10px] text-muted-foreground uppercase">
                      Health
                    </p>
                    <p className="text-sm">{isHealthy ? 'Good' : 'Degraded'}</p>
                  </div>
                  <div className="rounded-md border p-2">
                    <p className="text-[10px] text-muted-foreground uppercase">
                      Auth
                    </p>
                    <p className="text-sm">
                      {isAuthenticated ? 'Signed in' : 'Guest'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={refreshBalance}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  Refresh balance
                </Button>
                {!isAuthenticated && (
                  <Button
                    onClick={authenticateWithConvex}
                    size="sm"
                    type="button"
                  >
                    Authenticate
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h2 className="font-medium text-sm">Connect your wallet</h2>
                <p className="text-muted-foreground text-xs">
                  Use your Solana wallet to authenticate and manage payments.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  disabled={isConnecting}
                  onClick={connect}
                  size="sm"
                  type="button"
                >
                  {isConnecting ? 'Connecting…' : 'Connect'}
                </Button>
                <WalletConnectButton />
              </div>
              {error && (
                <p
                  aria-live="polite"
                  className="text-destructive text-sm"
                  role="alert"
                >
                  {error}
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
