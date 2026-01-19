'use client';

import { api } from '@convex/_generated/api';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { useMutation, useQuery } from 'convex/react';
import {
  AlertCircle,
  Check,
  CreditCard,
  ExternalLink,
  Loader,
  Plus,
  Wallet,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSubscription } from '@/hooks/use-subscription';
import { solanaConfig } from '@/lib/env';
import {
  createPaymentTransaction,
  processPaymentTransaction,
} from '@/lib/solana';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('message-credits-modal');

export interface MessageCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Message credit pack configuration
const CREDIT_PACK = {
  standardCredits: 150,
  premiumCredits: 25,
  priceSOL: 0.025,
  priceUSD: 3.5, // Approximate USD value
};

export function MessageCreditsModal({
  isOpen,
  onClose,
}: MessageCreditsModalProps) {
  const [numberOfPacks, setNumberOfPacks] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<
    'select' | 'payment' | 'processing' | 'success' | 'error'
  >('select');
  const [error, setError] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<{
    walletAddress?: string;
    txSignature?: string;
    amount?: number;
  }>({});

  // User data and subscriptions
  const { subscription } = useSubscription();
  const user = useQuery(api.users.getCurrentUserProfile);
  const _purchaseMessageCredits = useMutation(
    api.subscriptions.purchaseMessageCredits
  );

  // Check payment status
  const checkPurchaseStatus = useQuery(
    api.subscriptions.checkMessageCreditPurchaseStatus,
    paymentDetails.txSignature
      ? { txSignature: paymentDetails.txSignature }
      : 'skip'
  );

  // Get user's message credit purchase history
  const purchaseHistory = useQuery(
    api.subscriptions.getMessageCreditPurchases,
    user ? { limit: 5 } : 'skip'
  );

  // Referral payout info (if user has a referrer)
  const referrerInfo = useQuery(api.referrals.getReferrerPayoutInfo, {});

  // Solana wallet integration
  const { publicKey, signTransaction, connected } = useWallet();
  const { setVisible } = useWalletModal();

  const isSendingRef = useRef(false);
  const totalCost = CREDIT_PACK.priceSOL * numberOfPacks;
  const totalStandardCredits = CREDIT_PACK.standardCredits * numberOfPacks;
  const totalPremiumCredits = CREDIT_PACK.premiumCredits * numberOfPacks;

  // Initialize Solana connection
  const connection = new Connection(
    solanaConfig.rpcUrl || 'https://api.devnet.solana.com',
    'confirmed'
  );

  // Poll payment status when processing
  useEffect(() => {
    if (
      paymentStep === 'processing' &&
      paymentDetails.txSignature &&
      checkPurchaseStatus
    ) {
      const pollStatus = () => {
        if (checkPurchaseStatus.status === 'confirmed') {
          setPaymentStep('success');
          log.info('Message credits purchase confirmed', {
            txSignature: paymentDetails.txSignature,
          });
        } else if (checkPurchaseStatus.status === 'failed') {
          setPaymentStep('error');
          setError('Purchase verification failed');
          log.error('Purchase failed via polling', {
            txSignature: paymentDetails.txSignature,
          });
        }
      };

      const interval = setInterval(pollStatus, 3000);
      const timeout = setTimeout(() => {
        clearInterval(interval);
        if (paymentStep === 'processing') {
          setPaymentStep('error');
          setError('Purchase verification timeout - please contact support');
        }
      }, 300_000); // 5 minute timeout

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [paymentStep, paymentDetails.txSignature, checkPurchaseStatus]);

  const handlePurchase = () => {
    if (!user) {
      setError('Please sign in first');
      return;
    }

    if (!(connected && publicKey)) {
      setError('Please connect your wallet first');
      return;
    }

    if (!solanaConfig.paymentAddress) {
      setError('Payment system not configured - please contact support');
      return;
    }

    try {
      setIsProcessing(true);
      setPaymentStep('payment');

      setPaymentDetails({
        walletAddress: publicKey.toString(),
        amount: totalCost,
      });

      log.info('Message credits purchase initiated', {
        numberOfPacks,
        totalCost,
        user: user._id,
        walletAddress: publicKey.toString(),
      });
    } catch (err) {
      log.error('Purchase initiation failed', { error: err });
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
      setPaymentStep('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentComplete = async (retryAttempt = 0) => {
    const MAX_RETRIES = 3;

    if (!(connected && publicKey && signTransaction)) {
      setError('Please connect your wallet first');
      return;
    }

    if (!solanaConfig.paymentAddress) {
      setError('Payment address not configured - please contact support');
      return;
    }

    try {
      setIsProcessing(true);
      setPaymentStep('processing');
      setError(null);

      let txSignatureToVerify = paymentDetails.txSignature;

      // Only create and send a new transaction if we don't have a prior signature
      if (!txSignatureToVerify) {
        if (isSendingRef.current) {
          throw new Error('Payment already in progress');
        }

        isSendingRef.current = true;

        // Check wallet balance first
        const balance = await connection.getBalance(publicKey);
        const balanceSol = balance / 1_000_000_000;
        if (balanceSol < totalCost) {
          throw new Error(
            `Insufficient balance. Required: ${totalCost} SOL, Available: ${balanceSol.toFixed(4)} SOL`
          );
        }

        // Build transaction with referral payout if applicable
        const recipientPublicKey = new PublicKey(solanaConfig.paymentAddress);
        let tx = new Transaction();
        let mainAmount = totalCost;
        let referralAmount = 0;
        let referralWallet: string | undefined;

        if (referrerInfo?.hasReferrer) {
          referralAmount =
            Math.round(
              totalCost * (referrerInfo.commissionRate ?? 0) * 1_000_000
            ) / 1_000_000;
          mainAmount = Math.max(0, totalCost - referralAmount);
          referralWallet = referrerInfo.referrerWalletAddress;
        }

        // Create transfer to treasury
        const mainTx = await createPaymentTransaction(
          publicKey,
          recipientPublicKey,
          mainAmount
        );
        tx = mainTx;

        // Add referral payout transfer if applicable
        if (referralWallet && referralAmount > 0) {
          const referralIx = SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(referralWallet),
            lamports: Math.floor(referralAmount * 1_000_000_000),
          });
          tx.add(referralIx);
        }

        log.info('Message credits transaction created', {
          numberOfPacks,
          amount: totalCost,
          recipient: solanaConfig.paymentAddress,
          sender: publicKey.toString(),
          attempt: retryAttempt + 1,
        });

        // Send transaction
        const sentSignature = await processPaymentTransaction(
          tx,
          signTransaction,
          {
            maxRetries: 0,
            skipPreflight: false,
          }
        );

        if (
          !sentSignature ||
          typeof sentSignature !== 'string' ||
          sentSignature.length < 64
        ) {
          throw new Error(`Invalid transaction signature: "${sentSignature}"`);
        }

        txSignatureToVerify = sentSignature;
        setPaymentDetails((prev) => ({ ...prev, txSignature: sentSignature }));

        log.info('Message credits transaction sent', {
          txSignature: sentSignature,
          attempt: retryAttempt + 1,
        });
      }

      // Submit to backend for verification
      let verificationResult: {
        success: boolean;
        purchaseId?: string;
        error?: string;
      } | null = null;
      let lastError: unknown;

      {
        const attempts = [0, 1, 2] as const;
        for (const i of attempts) {
          try {
            const verificationResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                txSignature: txSignatureToVerify,
                expectedAmount: totalCost,
                paymentType: 'message_credits',
                packType: 'standard',
                numberOfPacks,
                walletAddress: publicKey.toString(),
                referralCode: referrerInfo?.hasReferrer
                  ? referrerInfo.referralCode
                  : undefined,
                referralPayoutTx: referrerInfo?.hasReferrer
                  ? txSignatureToVerify
                  : undefined,
                referrerWalletAddress: referrerInfo?.referrerWalletAddress,
                commissionRate: referrerInfo?.commissionRate,
              }),
            });

            if (!verificationResponse.ok) {
              const errorText = await verificationResponse.text();
              throw new Error(
                `HTTP ${verificationResponse.status}: ${errorText}`
              );
            }

            verificationResult = (await verificationResponse.json()) as {
              success: boolean;
              purchaseId?: string;
              error?: string;
            };
            break;
          } catch (fetchError) {
            lastError = fetchError;
            if (i < 2) {
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * 2 ** i)
              );
            }
          }
        }
      }

      if (!verificationResult) {
        throw new Error(
          `Verification failed after 3 attempts: ${lastError instanceof Error ? lastError.message : 'Unknown error'}`
        );
      }

      if (verificationResult.success) {
        setPaymentStep('success');

        log.info('Message credits purchase verified', {
          txSignature: txSignatureToVerify,
          purchaseId: verificationResult.purchaseId,
          standardCredits: totalStandardCredits,
          premiumCredits: totalPremiumCredits,
        });

        // No full page reload needed; Convex queries update in realtime.
        // Briefly show success, then close the modal.
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        throw new Error(
          verificationResult.error || 'Purchase verification failed'
        );
      }
    } catch (err) {
      log.error('Message credits purchase failed', {
        error: err,
        attempt: retryAttempt + 1,
      });

      let errorMessage = 'Purchase processing failed';
      let isRetryable = false;

      if (err instanceof Error) {
        if (
          err.message.includes('DUPLICATE_TRANSACTION') ||
          err.message.includes('already been processed') ||
          err.message.includes('ALREADY_PROCESSED')
        ) {
          errorMessage =
            'This purchase has already been processed. Your credits will update automatically.';
          setPaymentStep('success');
          return;
        }

        // Handle other error types similar to subscription upgrade
        errorMessage = err.message;
        isRetryable =
          err.message.includes('Network') ||
          err.message.includes('timeout') ||
          err.message.includes('SIMULATION_FAILED');
      }

      if (isRetryable && retryAttempt < MAX_RETRIES) {
        const delay = 2000 * 2 ** retryAttempt;
        setTimeout(() => {
          handlePaymentComplete(retryAttempt + 1);
        }, delay);

        setError(
          `${errorMessage} - Retrying in ${delay / 1000} seconds... (Attempt ${retryAttempt + 1}/${MAX_RETRIES})`
        );
        return;
      }

      setError(errorMessage);
      setPaymentStep('error');
    } finally {
      isSendingRef.current = false;
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (paymentStep !== 'processing') {
      onClose();
      setPaymentStep('select');
      setError(null);
      setPaymentDetails({});
      setNumberOfPacks(1);
    }
  };

  const renderPackSelector = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mb-4 inline-flex rounded-full bg-gradient-to-r from-green-500 to-green-600 p-4">
          <CreditCard className="h-8 w-8 text-white" />
        </div>
        <h3 className="mb-2 font-semibold text-xl">Purchase Message Credits</h3>
        <p className="text-muted-foreground">
          Get additional messages without upgrading your plan
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Message Credit Pack</h4>
            <Badge className="bg-green-100 text-green-800">Best Value</Badge>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
            <div className="rounded-lg border p-4 text-center">
              <div className="font-bold text-2xl">
                {CREDIT_PACK.standardCredits}
              </div>
              <div className="text-muted-foreground text-sm">
                Standard Messages
              </div>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <div className="font-bold text-2xl">
                {CREDIT_PACK.premiumCredits}
              </div>
              <div className="text-muted-foreground text-sm">
                Premium Messages
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Price per pack:</span>
              <div className="text-right">
                <div className="font-bold">{CREDIT_PACK.priceSOL} SOL</div>
                <div className="text-muted-foreground text-sm">
                  ≈ ${CREDIT_PACK.priceUSD} USD
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-medium text-sm">Number of packs:</div>
              <div className="flex items-center space-x-3">
                <Button
                  disabled={numberOfPacks <= 1}
                  onClick={() =>
                    setNumberOfPacks(Math.max(1, numberOfPacks - 1))
                  }
                  size="sm"
                  variant="outline"
                >
                  -
                </Button>
                <span className="w-12 text-center font-bold">
                  {numberOfPacks}
                </span>
                <Button
                  disabled={numberOfPacks >= 10}
                  onClick={() =>
                    setNumberOfPacks(Math.min(10, numberOfPacks + 1))
                  }
                  size="sm"
                  variant="outline"
                >
                  +
                </Button>
              </div>
              <div className="text-muted-foreground text-xs">
                Maximum 10 packs per purchase
              </div>
            </div>
          </div>

          {numberOfPacks > 1 && (
            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
              <h5 className="font-medium text-green-800 dark:text-green-200">
                Total Purchase:
              </h5>
              <div className="mt-2 flex flex-col gap-3 text-sm sm:flex-row sm:justify-between">
                <div className="space-y-1">
                  <div className="font-bold text-green-800 dark:text-green-200">
                    {totalStandardCredits} Standard
                  </div>
                  <div className="font-bold text-green-800 dark:text-green-200">
                    {totalPremiumCredits} Premium
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="font-bold text-green-800 text-xl dark:text-green-200">
                    {totalCost} SOL
                  </div>
                  <div className="text-green-600 dark:text-green-300">
                    ≈ ${(CREDIT_PACK.priceUSD * numberOfPacks).toFixed(2)} USD
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Current balance display */}
      {subscription && (
        <Card className="p-4">
          <h5 className="mb-3 font-medium">Current Credit Balance</h5>
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 text-sm">
            <div className="rounded border p-3 text-center">
              <div className="font-bold text-lg">
                {subscription.messageCredits || 0}
              </div>
              <div className="text-muted-foreground">Standard Credits</div>
            </div>
            <div className="rounded border p-3 text-center">
              <div className="font-bold text-lg">
                {subscription.premiumMessageCredits || 0}
              </div>
              <div className="text-muted-foreground">Premium Credits</div>
            </div>
          </div>
        </Card>
      )}

      {/* Recent purchases */}
      {purchaseHistory && purchaseHistory.length > 0 && (
        <Card className="p-4">
          <h5 className="mb-3 font-medium">Recent Purchases</h5>
          <div className="space-y-2">
            {purchaseHistory
              .slice(0, 3)
              .map(
                (purchase: {
                  id: string;
                  standardCredits: number;
                  premiumCredits: number;
                  createdAt: number;
                  priceSOL: number;
                  status: string;
                }) => (
                  <div
                    className="flex items-center justify-between border-b pb-2 text-sm"
                    key={purchase.id}
                  >
                    <div>
                      <div className="font-medium">
                        {purchase.standardCredits + purchase.premiumCredits}{' '}
                        credits
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {new Date(purchase.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{purchase.priceSOL} SOL</div>
                      <Badge
                        size="sm"
                        variant={
                          purchase.status === 'confirmed'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {purchase.status}
                      </Badge>
                    </div>
                  </div>
                )
              )}
          </div>
        </Card>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          className="w-full sm:w-auto"
          onClick={handleClose}
          variant="outline"
        >
          Cancel
        </Button>
        <Button
          className="w-full bg-gradient-to-r from-green-500 to-green-600 sm:w-auto"
          disabled={isProcessing}
          onClick={handlePurchase}
        >
          {isProcessing && <Loader className="mr-2 h-4 w-4 animate-spin" />}
          Purchase {numberOfPacks} Pack{numberOfPacks > 1 ? 's' : ''} •{' '}
          {totalCost} SOL
        </Button>
      </div>
    </div>
  );

  const renderPaymentInstructions = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mb-4 inline-flex rounded-full bg-gradient-to-r from-green-500 to-green-600 p-4">
          <Wallet className="h-8 w-8 text-white" />
        </div>
        <h3 className="mb-2 font-semibold text-xl">Send Payment</h3>
        <p className="text-muted-foreground">
          {connected
            ? 'Click "Send Payment" to create and sign the transaction'
            : 'Connect your wallet to proceed with the payment'}
        </p>
      </div>

      <Card className="bg-gray-50 p-6 dark:bg-gray-800/50">
        <div className="space-y-4">
          <div>
            <div className="font-medium text-gray-700 text-sm dark:text-gray-300">
              Purchase Summary
            </div>
            <div className="mt-1 rounded-lg border bg-white p-3 dark:bg-gray-900">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Packs:</span>
                  <span className="font-medium">{numberOfPacks}</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard Credits:</span>
                  <span className="font-medium">{totalStandardCredits}</span>
                </div>
                <div className="flex justify-between">
                  <span>Premium Credits:</span>
                  <span className="font-medium">{totalPremiumCredits}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Total:</span>
                  <span className="font-bold">{totalCost} SOL</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="font-medium text-gray-700 text-sm dark:text-gray-300">
              Your Wallet
            </div>
            <div className="mt-1 rounded-lg border bg-white p-3 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                {connected && publicKey ? (
                  <span className="break-all font-mono text-sm">
                    {publicKey.toString()}
                  </span>
                ) : (
                  <span className="text-gray-500 text-sm">
                    Wallet not connected
                  </span>
                )}
                {connected && (
                  <Badge className="ml-2" variant="secondary">
                    Connected
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="font-medium text-gray-700 text-sm dark:text-gray-300">
              Payment Address
            </div>
            <div className="mt-1 rounded-lg border bg-white p-3 font-mono text-sm dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <span className="break-all">
                  {solanaConfig.paymentAddress ||
                    'Payment address not configured'}
                </span>
                <Button
                  disabled={!solanaConfig.paymentAddress}
                  onClick={() =>
                    navigator.clipboard.writeText(
                      solanaConfig.paymentAddress || ''
                    )
                  }
                  size="sm"
                  variant="ghost"
                >
                  Copy
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
        <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          <div className="space-y-2">
            <p>
              <strong>Important:</strong> Send exactly {totalCost} SOL to avoid
              processing delays.
            </p>
            <p>
              Your message credits will be added automatically once payment is
              confirmed.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      <div className="flex flex-col space-y-3">
        {!connected && (
          <Button
            className="w-full"
            onClick={() => setVisible(true)}
            variant="outline"
          >
            <Wallet className="mr-2 h-4 w-4" />
            Connect Wallet
          </Button>
        )}
        {connected && (
          <Button
            className="w-full bg-gradient-to-r from-green-500 to-green-600"
            disabled={isProcessing || !publicKey}
            onClick={() => handlePaymentComplete()}
          >
            {isProcessing ? 'Processing Payment...' : 'Send Payment'}
          </Button>
        )}
      </div>
    </div>
  );

  const renderProcessingState = () => (
    <div className="space-y-6 py-8 text-center">
      <div className="relative">
        <Loader className="mx-auto h-12 w-12 animate-spin text-green-500" />
        <div className="absolute inset-0 flex items-center justify-center">
          <CreditCard className="h-6 w-6 text-green-600" />
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-semibold text-xl">Processing Purchase</h3>
        <p className="text-muted-foreground">
          We're verifying your transaction on the Solana blockchain...
        </p>
        <p className="mt-2 text-muted-foreground text-sm">
          This usually takes 30-60 seconds
        </p>
      </div>

      {paymentDetails.txSignature && (
        <div className="space-y-3">
          <div className="rounded-lg border bg-gray-50 p-3 dark:bg-gray-800/50">
            <p className="font-medium text-sm">Transaction ID:</p>
            <p className="break-all font-mono text-muted-foreground text-xs">
              {paymentDetails.txSignature}
            </p>
          </div>
          <Button
            onClick={() =>
              window.open(
                `https://explorer.solana.com/tx/${paymentDetails.txSignature}${
                  solanaConfig.network !== 'mainnet-beta'
                    ? `?cluster=${solanaConfig.network}`
                    : ''
                }`,
                '_blank'
              )
            }
            size="sm"
            variant="outline"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View on Solana Explorer
          </Button>
        </div>
      )}
    </div>
  );

  const renderSuccessState = () => (
    <div className="space-y-4 py-8 text-center">
      <div className="inline-flex rounded-full bg-gradient-to-r from-green-500 to-green-600 p-4">
        <Check className="h-8 w-8 text-white" />
      </div>
      <div>
        <h3 className="mb-2 font-semibold text-xl">Purchase Successful!</h3>
        <p className="text-muted-foreground">
          Your message credits have been added to your account.
        </p>
        <div className="mt-4 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
          <div className="space-y-1">
            <div className="font-medium text-green-800 dark:text-green-200">
              Credits Added:
            </div>
            <div className="text-green-700 dark:text-green-300">
              {totalStandardCredits} Standard + {totalPremiumCredits} Premium
            </div>
          </div>
        </div>
        {paymentDetails.txSignature && (
          <div className="mt-4">
            <Button
              onClick={() =>
                window.open(
                  `https://explorer.solana.com/tx/${paymentDetails.txSignature}`,
                  '_blank'
                )
              }
              size="sm"
              variant="outline"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View Transaction
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="space-y-6 py-8 text-center">
      <div className="inline-flex rounded-full bg-red-100 p-4 dark:bg-red-900/20">
        <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>

      <div>
        <h3 className="mb-2 font-semibold text-xl">Purchase Failed</h3>
        <p className="mb-4 text-muted-foreground">
          {error ||
            'There was an issue processing your purchase. Please try again.'}
        </p>

        <div className="flex flex-col space-y-3">
          <Button
            className="w-full"
            onClick={() => {
              setPaymentStep('select');
              setError(null);
            }}
          >
            Try Again
          </Button>
        </div>

        {paymentDetails.txSignature && (
          <div className="rounded-lg border bg-gray-50 p-3 text-left dark:bg-gray-800/50">
            <p className="font-medium text-sm">Transaction ID for Support:</p>
            <p className="break-all font-mono text-muted-foreground text-xs">
              {paymentDetails.txSignature}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Dialog onOpenChange={handleClose} open={isOpen}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-4xl overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Purchase Message Credits</span>
          </DialogTitle>
          <DialogDescription>
            Get additional messages without upgrading your subscription plan
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          {paymentStep === 'select' && renderPackSelector()}
          {paymentStep === 'payment' && renderPaymentInstructions()}
          {paymentStep === 'processing' && renderProcessingState()}
          {paymentStep === 'success' && renderSuccessState()}
          {paymentStep === 'error' && renderErrorState()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MessageCreditsModal;
