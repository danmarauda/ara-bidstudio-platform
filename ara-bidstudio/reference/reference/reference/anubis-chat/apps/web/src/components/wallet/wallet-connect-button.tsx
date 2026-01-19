'use client';

import { useAuthActions } from '@convex-dev/auth/react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { ChevronDown, LogOut, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWallet } from '@/hooks/useWallet';

// UI Health Score Threshold
const HEALTH_SCORE_THRESHOLD = 80;

interface WalletConnectButtonProps {
  collapsed?: boolean;
}

export function WalletConnectButton({
  collapsed = false,
}: WalletConnectButtonProps) {
  const {
    isConnected,
    isConnecting,
    formatAddress,
    disconnect,
    error,
    isHealthy,
    connectionHealthScore,
  } = useWallet();
  const { setVisible } = useWalletModal();
  const router = useRouter();
  const { signOut } = useAuthActions();

  const handleSignOut = async () => {
    // First sign out from Convex
    await signOut();
    // Then disconnect wallet
    await disconnect();
    // Navigate to home page
    router.push('/');
  };

  const handleConnectClick = () => {
    setVisible(true);
  };

  // 2025 UX: Dynamic styling based on connection health
  const getButtonVariant = () => {
    if (!isConnected) {
      return 'outline';
    }
    if (!isHealthy) {
      return 'destructive';
    }
    if (connectionHealthScore < HEALTH_SCORE_THRESHOLD) {
      return 'secondary';
    }
    return 'default';
  };

  const getHealthIndicator = () => {
    if (!isConnected) {
      return null;
    }
    if (!isHealthy) {
      return '🔴';
    }
    if (connectionHealthScore < HEALTH_SCORE_THRESHOLD) {
      return '🟡';
    }
    return '🟢';
  };

  if (collapsed) {
    if (isConnected) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="h-10 w-10 border-2 p-0 transition-colors hover:border-primary"
              size="icon"
              title={`${formatAddress()} - Health: ${connectionHealthScore}% ${isHealthy ? '(Good)' : '(Poor)'}`}
              variant={getButtonVariant()}
            >
              <Wallet className="h-5 w-5" />
              {getHealthIndicator() && (
                <span className="-top-1 -right-1 absolute text-[10px]">
                  {getHealthIndicator()}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="font-medium text-sm">{formatAddress()}</p>
              <p className="text-muted-foreground text-xs">
                Health: {connectionHealthScore}%
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <Button
        className="h-10 w-10 border-2 p-0 transition-colors hover:border-primary"
        disabled={isConnecting}
        onClick={handleConnectClick}
        size="icon"
        title={error || 'Connect your Solana wallet'}
        variant="outline"
      >
        <Wallet className="h-5 w-5" />
      </Button>
    );
  }

  if (isConnected) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="w-full justify-between border-2 transition-colors hover:border-primary"
            size="sm"
            title={`Health: ${connectionHealthScore}% ${isHealthy ? '(Good)' : '(Poor)'}`}
            variant={getButtonVariant()}
          >
            <div className="flex items-center">
              <Wallet className="mr-2 h-4 w-4" />
              {getHealthIndicator()}
              {formatAddress()}
            </div>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-full">
          <div className="px-2 py-1.5">
            <p className="font-medium text-sm">Connected Wallet</p>
            <p className="text-muted-foreground text-xs">{formatAddress(8)}</p>
            <p className="mt-1 text-muted-foreground text-xs">
              Health: {connectionHealthScore}% {isHealthy ? '(Good)' : '(Poor)'}
            </p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      className="w-full border-2 transition-colors hover:border-primary"
      disabled={isConnecting}
      onClick={handleConnectClick}
      size="sm"
      title={error || 'Connect your Solana wallet'}
      variant="outline"
    >
      <Wallet className="mr-2 h-4 w-4" />
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      {error && <span className="ml-2 text-destructive text-xs">!</span>}
    </Button>
  );
}
