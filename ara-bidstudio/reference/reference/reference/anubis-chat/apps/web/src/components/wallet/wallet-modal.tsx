'use client';

import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useWallet } from '@/hooks/useWallet';

interface WalletInfo {
  name: string;
  icon: string;
  adapter: any;
}

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
}

export function WalletModal({ open, onClose }: WalletModalProps) {
  const { wallets, select } = useSolanaWallet();
  const { connect, isConnecting, error } = useWallet();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const handleWalletSelect = async (walletName: string) => {
    try {
      setSelectedWallet(walletName);
      const wallet = wallets.find((w) => w.adapter.name === walletName);
      if (wallet) {
        select(wallet.adapter.name);
        await connect();
        onClose();
      }
    } catch (_err) {
    } finally {
      setSelectedWallet(null);
    }
  };

  const supportedWallets: WalletInfo[] = [
    {
      name: 'Phantom',
      icon: 'https://phantom.app/img/phantom-logo.png',
      adapter: wallets.find((w) => w.adapter.name === 'Phantom')?.adapter,
    },
    {
      name: 'Backpack',
      icon: 'https://backpack.app/backpack.png',
      adapter: wallets.find((w) => w.adapter.name === 'Backpack')?.adapter,
    },
    {
      name: 'Solflare',
      icon: 'https://solflare.com/img/logo.svg',
      adapter: wallets.find((w) => w.adapter.name === 'Solflare')?.adapter,
    },
    {
      name: 'Torus',
      icon: 'https://tor.us/img/favicon.png',
      adapter: wallets.find((w) => w.adapter.name === 'Torus')?.adapter,
    },
    {
      name: 'Ledger',
      icon: 'https://www.ledger.com/favicon.ico',
      adapter: wallets.find((w) => w.adapter.name === 'Ledger')?.adapter,
    },
  ].filter((wallet) => wallet.adapter);

  return (
    <Dialog onOpenChange={onClose} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle
            className="text-center"
            style={{
              background:
                'linear-gradient(135deg, #FFD700 0%, #14F195 50%, #FFD700 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Connect Your Solana Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-center text-amber-200/80 text-sm">
            Choose your preferred wallet to connect to abubis.chat
          </p>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="grid gap-3">
            {supportedWallets.map((wallet) => (
              <Card
                className="cursor-pointer border-amber-600/20 transition-all hover:bg-amber-600/5"
                key={wallet.name}
                onClick={() => handleWalletSelect(wallet.name)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-3">
                    <img
                      alt={`${wallet.name} icon`}
                      className="h-8 w-8 rounded"
                      onError={(e) => {
                        e.currentTarget.src = '/favicon/favicon.svg';
                      }}
                      src={wallet.icon}
                    />
                    <div>
                      <p className="font-medium text-amber-200">
                        {wallet.name}
                      </p>
                      <p className="text-amber-200/60 text-xs">
                        {wallet.adapter?.readyState === 'Installed'
                          ? 'Installed'
                          : 'Not Installed'}
                      </p>
                    </div>
                  </div>

                  {selectedWallet === wallet.name && isConnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Button
                      className="border-amber-600/30 text-amber-200 hover:bg-amber-600/10"
                      size="sm"
                      variant="outline"
                    >
                      Connect
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="border-amber-600/20 border-t pt-4">
            <p className="text-center text-amber-200/60 text-xs">
              New to Solana wallets?{' '}
              <a
                className="text-[#14F195] hover:underline"
                href="https://phantom.app"
                rel="noopener noreferrer"
                target="_blank"
              >
                Download Phantom
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
