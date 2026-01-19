'use client';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useWallet } from '@/hooks/useWallet';

export function WalletDebugPanel() {
  const {
    isConnected,
    isConnecting,
    publicKey,
    balance,
    error,
    isHealthy,
    connectionHealthScore,
    formatAddress,
  } = useWallet();

  if (!(isConnected || isConnecting || error)) {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Wallet Status
          {isHealthy ? (
            <Badge variant="default">Healthy</Badge>
          ) : (
            <Badge variant="destructive">Poor Connection</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Connection health: {connectionHealthScore}%
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <strong>Connected:</strong> {isConnected ? 'Yes' : 'No'}
        </div>
        {isConnecting && (
          <div>
            <strong>Status:</strong> Connecting...
          </div>
        )}
        {publicKey && (
          <div>
            <strong>Address:</strong> {formatAddress(8)}
          </div>
        )}
        {balance !== null && (
          <div>
            <strong>Balance:</strong> {balance.toFixed(4)} SOL
          </div>
        )}
        {error && (
          <div className="text-destructive">
            <strong>Error:</strong> {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
