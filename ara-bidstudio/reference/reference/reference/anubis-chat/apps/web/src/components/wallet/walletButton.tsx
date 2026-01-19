'use client';

import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';

interface WalletButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
}

export function WalletButton({
  className,
  variant = 'default',
  size = 'default',
}: WalletButtonProps) {
  const { setVisible } = useWalletModal();
  const {
    isConnected,
    isConnecting,
    publicKey,
    balance,
    formatAddress,
    disconnect,
  } = useWallet();

  const handleClick = () => {
    if (isConnected) {
      disconnect();
    } else {
      setVisible(true);
    }
  };

  if (isConnected && publicKey) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="font-medium text-foreground text-sm">
            {formatAddress()}
          </div>
          {balance !== null && (
            <div className="text-muted-foreground text-xs">
              {balance.toFixed(4)} SOL
            </div>
          )}
        </div>
        <Button
          className={`${className ?? ''} border-destructive/20 bg-destructive/10 text-destructive transition-all duration-300 hover:border-destructive/40 hover:bg-destructive/20`}
          onClick={handleClick}
          size={size}
          variant={variant}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      className={`${className ?? ''} border-primary/30 bg-primary/10 font-medium text-primary transition-all duration-300 hover:border-primary/50 hover:bg-primary/20`}
      disabled={isConnecting}
      onClick={handleClick}
      size={size}
      variant={variant}
    >
      {isConnecting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        'Connect Wallet'
      )}
    </Button>
  );
}
