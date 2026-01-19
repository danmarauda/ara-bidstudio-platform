/**
 * Solana Payment Verification System
 * Production-ready blockchain transaction verification for subscription payments
 */

import { getAssociatedTokenAddress } from '@solana/spl-token';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { internal } from './_generated/api';
import { httpAction } from './_generated/server';
import { solanaConfig, subscriptionConfig } from './env';
import {
  calculateReferralPayout,
  validatePayoutParams,
  verifyDualPayment,
} from './solanaPayouts';
import { getConfiguredSPLTokens } from './splTokens';

// Types for transaction verification
interface VerificationResult {
  success: boolean;
  error?: string;
  transactionDetails?: {
    signature: string;
    recipient: string;
    sender: string;
    amount: number;
    timestamp: number;
    slot: number;
    confirmationStatus: string;
  };
}

interface PaymentVerificationRequest {
  txSignature: string;
  expectedAmount: number;
  tier?: 'pro' | 'pro_plus';
  walletAddress: string;
  isProrated?: boolean;
  isUpgrade?: boolean;
  previousTier?: 'free' | 'pro' | 'pro_plus';
  referralCode?: string; // Optional referral code for attribution
  referralPayoutTx?: string; // Optional referral payout transaction signature
  referrerWalletAddress?: string; // Optional referrer wallet if client executed split
  commissionRate?: number; // Optional rate used for client-executed split
  paymentType?: 'subscription' | 'message_credits';
  packType?: 'standard';
  numberOfPacks?: number;
  // SPL Token fields
  tokenAddress?: string;
  tokenAmount?: number;
  tokenSymbol?: string;
}

// Initialize Solana connection with proper configuration
function createSolanaConnection(): Connection {
  const commitment = solanaConfig.commitmentLevel as unknown as
    | 'processed'
    | 'confirmed'
    | 'finalized';
  return new Connection(solanaConfig.rpcUrl, {
    commitment,
    httpHeaders: {
      'User-Agent': 'anubis.chat/1.0',
    },
    disableRetryOnRateLimit: false,
    confirmTransactionInitialTimeout: 60_000, // 60 seconds
  });
}

// Retry wrapper with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * 2 ** attempt + Math.random() * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Core transaction verification function with enhanced error handling
async function verifyTransaction(
  signature: string,
  expectedRecipient: string,
  expectedAmount: number,
  senderAddress: string
): Promise<VerificationResult> {
  try {
    // Validate inputs
    if (!signature || typeof signature !== 'string' || signature.length < 64) {
      return {
        success: false,
        error: 'Invalid transaction signature format',
      };
    }

    if (!expectedRecipient || typeof expectedRecipient !== 'string') {
      return {
        success: false,
        error: 'Invalid recipient address',
      };
    }

    if (
      !expectedAmount ||
      typeof expectedAmount !== 'number' ||
      expectedAmount <= 0
    ) {
      return {
        success: false,
        error: 'Invalid payment amount',
      };
    }

    if (!senderAddress || typeof senderAddress !== 'string') {
      return {
        success: false,
        error: 'Invalid sender address',
      };
    }

    // Validate public key formats
    try {
      new PublicKey(expectedRecipient);
      new PublicKey(senderAddress);
    } catch (_keyError) {
      return {
        success: false,
        error: 'Invalid Solana address format',
      };
    }

    const connection = createSolanaConnection();

    // Verify the transaction exists and get details with enhanced error handling
    const transaction = await withRetry(
      async () => {
        // Prefer finalized; fall back to confirmed to avoid blocking upgrades
        const finalizedTx = await connection.getTransaction(signature, {
          commitment: 'finalized',
          maxSupportedTransactionVersion: 0,
        });

        if (finalizedTx) {
          return finalizedTx;
        }

        const confirmedTx = await connection.getTransaction(signature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
        });

        if (confirmedTx) {
          return confirmedTx;
        }

        throw new Error(
          'Transaction not found on blockchain - please verify the transaction ID'
        );
      },
      5,
      2000
    ); // More retries for RPC calls, longer delays

    // Check transaction success
    if (transaction.meta?.err) {
      const errorDetails =
        typeof transaction.meta.err === 'object'
          ? JSON.stringify(transaction.meta.err)
          : String(transaction.meta.err);

      return {
        success: false,
        error: `Transaction failed on blockchain: ${errorDetails}`,
      };
    }

    // Verify transaction is finalized
    if (!transaction.slot) {
      return {
        success: false,
        error:
          'Transaction not yet finalized - please wait for blockchain confirmation',
      };
    }

    // Get account keys from transaction (supports v0 messages with address table lookups)
    const message = transaction.transaction.message;
    const messageKeys = message.getAccountKeys({
      accountKeysFromLookups: transaction.meta?.loadedAddresses,
    });

    const allAccountKeys: PublicKey[] = [
      ...messageKeys.staticAccountKeys,
      ...(messageKeys.accountKeysFromLookups?.writable ?? []),
      ...(messageKeys.accountKeysFromLookups?.readonly ?? []),
    ];

    if (allAccountKeys.length === 0) {
      return {
        success: false,
        error: 'Transaction data incomplete - no account information found',
      };
    }

    // Find the expected recipient in account keys
    const recipientPubkey = new PublicKey(expectedRecipient);
    const recipientIndex = allAccountKeys.findIndex((key: PublicKey) =>
      key.equals(recipientPubkey)
    );

    if (recipientIndex === -1) {
      return {
        success: false,
        error:
          'Payment recipient mismatch - transaction was not sent to the correct address',
      };
    }

    // Verify balance changes exist
    if (!(transaction.meta?.preBalances && transaction.meta?.postBalances)) {
      return {
        success: false,
        error: 'Transaction balance data unavailable - blockchain sync issue',
      };
    }

    // Verify balance changes
    const preBalance = transaction.meta.preBalances[recipientIndex] ?? 0;
    const postBalance = transaction.meta.postBalances[recipientIndex] ?? 0;
    const balanceChange = (postBalance - preBalance) / LAMPORTS_PER_SOL;

    // Verify amount (allow small tolerance for rounding)
    const tolerance = 0.001; // 0.001 SOL tolerance for rounding differences
    if (Math.abs(balanceChange - expectedAmount) > tolerance) {
      return {
        success: false,
        error: `Payment amount mismatch: expected ${expectedAmount} SOL, received ${balanceChange.toFixed(6)} SOL`,
      };
    }

    // Verify sender (first account key is typically the signer)
    const actualSender = allAccountKeys[0]?.toBase58();
    if (actualSender !== senderAddress) {
      return {
        success: false,
        error: `Payment sender mismatch: expected from ${senderAddress}, got from ${actualSender}`,
      };
    }

    // Verify transaction is recent (within last 24 hours for security)
    const blockTime = transaction.blockTime ?? Date.now() / 1000;
    const transactionAge = Date.now() / 1000 - blockTime;
    const maxAge = 24 * 60 * 60; // 24 hours in seconds

    if (transactionAge > maxAge) {
      return {
        success: false,
        error:
          'Transaction is too old - payments must be verified within 24 hours',
      };
    }

    // Get transaction timestamp
    return {
      success: true,
      transactionDetails: {
        signature,
        recipient: expectedRecipient,
        sender: senderAddress,
        amount: balanceChange,
        timestamp: blockTime * 1000, // Convert to milliseconds
        slot: transaction.slot,
        confirmationStatus: 'finalized',
      },
    };
  } catch (error) {
    // Enhanced error categorization
    let errorMessage = 'Transaction verification failed';

    if (error instanceof Error) {
      if (
        error.message.includes('network') ||
        error.message.includes('timeout')
      ) {
        errorMessage = 'Network connectivity issue - please try again';
      } else if (error.message.includes('not found')) {
        errorMessage =
          'Transaction not found - please verify the transaction ID';
      } else if (error.message.includes('rate limit')) {
        errorMessage =
          'RPC rate limit exceeded - please wait a moment and try again';
      } else if (error.message.includes('finalized')) {
        errorMessage =
          'Transaction still processing - please wait for blockchain confirmation';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// SPL Token transaction verification function
async function verifySPLTokenTransaction(
  signature: string,
  expectedRecipient: string,
  expectedAmount: number,
  senderAddress: string,
  tokenMintAddress: string
): Promise<VerificationResult> {
  try {
    const connection = createSolanaConnection();

    // Fetch the transaction with full details
    const transaction = await connection.getTransaction(signature, {
      commitment: 'finalized',
      maxSupportedTransactionVersion: 0,
    });

    if (!transaction) {
      return {
        success: false,
        error:
          'Transaction not found on blockchain - please check the transaction ID',
      };
    }

    // Check if transaction failed
    if (transaction.meta?.err) {
      return {
        success: false,
        error: 'Transaction failed on blockchain - payment was not successful',
      };
    }

    // Get associated token accounts
    const senderPubkey = new PublicKey(senderAddress);
    const recipientPubkey = new PublicKey(expectedRecipient);
    const mintPubkey = new PublicKey(tokenMintAddress);

    const senderTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      senderPubkey
    );
    const recipientTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      recipientPubkey
    );

    // Get all account keys from transaction
    const message = transaction.transaction.message;
    const messageKeys = message.getAccountKeys({
      accountKeysFromLookups: transaction.meta?.loadedAddresses,
    });

    const allAccountKeys: PublicKey[] = [
      ...messageKeys.staticAccountKeys,
      ...(messageKeys.accountKeysFromLookups?.writable ?? []),
      ...(messageKeys.accountKeysFromLookups?.readonly ?? []),
    ];

    // Find token account indices
    let senderTokenIndex = -1;
    let recipientTokenIndex = -1;

    for (let i = 0; i < allAccountKeys.length; i++) {
      const keyStr = allAccountKeys[i].toBase58();
      if (keyStr === senderTokenAccount.toBase58()) senderTokenIndex = i;
      if (keyStr === recipientTokenAccount.toBase58()) recipientTokenIndex = i;
    }

    if (senderTokenIndex === -1 || recipientTokenIndex === -1) {
      return {
        success: false,
        error: 'SPL token accounts not found in transaction',
      };
    }

    // Check token balance changes
    const preBalances = transaction.meta?.preTokenBalances || [];
    const postBalances = transaction.meta?.postTokenBalances || [];

    const senderPreToken = preBalances.find(
      (balance) => balance.accountIndex === senderTokenIndex
    );
    const senderPostToken = postBalances.find(
      (balance) => balance.accountIndex === senderTokenIndex
    );

    const recipientPreToken = preBalances.find(
      (balance) => balance.accountIndex === recipientTokenIndex
    );
    const recipientPostToken = postBalances.find(
      (balance) => balance.accountIndex === recipientTokenIndex
    );

    const senderPreBalance = Number(senderPreToken?.uiTokenAmount?.amount || 0);
    const senderPostBalance = Number(
      senderPostToken?.uiTokenAmount?.amount || 0
    );
    const recipientPreBalance = Number(
      recipientPreToken?.uiTokenAmount?.amount || 0
    );
    const recipientPostBalance = Number(
      recipientPostToken?.uiTokenAmount?.amount || 0
    );

    const tokensTransferred = senderPreBalance - senderPostBalance;
    const tokensReceived = recipientPostBalance - recipientPreBalance;

    // Verify amounts match (allow small tolerance for rounding)
    const tolerance = Math.max(1, expectedAmount * 0.001); // 0.1% tolerance or 1 token unit

    if (Math.abs(tokensTransferred - expectedAmount) > tolerance) {
      return {
        success: false,
        error: `Token amount mismatch: expected ${expectedAmount}, sender transferred ${tokensTransferred}`,
      };
    }

    if (Math.abs(tokensReceived - expectedAmount) > tolerance) {
      return {
        success: false,
        error: `Token amount mismatch: expected ${expectedAmount}, recipient received ${tokensReceived}`,
      };
    }

    // Verify transaction is recent (within last 24 hours for security)
    const blockTime = transaction.blockTime ?? Date.now() / 1000;
    const transactionAge = Date.now() / 1000 - blockTime;
    const maxAge = 24 * 60 * 60; // 24 hours in seconds

    if (transactionAge > maxAge) {
      return {
        success: false,
        error:
          'Transaction is too old - payments must be verified within 24 hours',
      };
    }

    // Get token decimals for proper amount display
    const decimals = senderPreToken?.uiTokenAmount?.decimals || 6;
    const uiAmount = tokensReceived / 10 ** decimals;

    return {
      success: true,
      transactionDetails: {
        signature,
        recipient: expectedRecipient,
        sender: senderAddress,
        amount: uiAmount,
        timestamp: blockTime * 1000, // Convert to milliseconds
        slot: transaction.slot,
        confirmationStatus: 'finalized',
      },
    };
  } catch (error) {
    // Enhanced error categorization
    let errorMessage = 'SPL token transaction verification failed';

    if (error instanceof Error) {
      if (
        error.message.includes('network') ||
        error.message.includes('timeout')
      ) {
        errorMessage = 'Network connectivity issue - please try again';
      } else if (error.message.includes('not found')) {
        errorMessage =
          'Transaction not found - please verify the transaction ID';
      } else if (error.message.includes('rate limit')) {
        errorMessage =
          'RPC rate limit exceeded - please wait a moment and try again';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Helper function to log payment events
async function logPaymentEvent(
  ctx: any,
  eventType: string,
  metadata: any,
  severity: 'info' | 'warning' | 'error' | 'critical' = 'info'
) {
  try {
    await ctx.runMutation(internal.monitoring.logPaymentEvent, {
      eventType,
      timestamp: Date.now(),
      metadata,
      severity,
    });
  } catch (_error) {}
}

// HTTP Action for payment verification with enhanced error handling
export const verifyPaymentTransaction = httpAction(async (ctx, request) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  const startTime = Date.now();
  let txSignature: string | undefined;
  let walletAddress: string | undefined;
  let tier: string | undefined;
  let paymentType: 'subscription' | 'message_credits' = 'subscription';

  try {
    // Parse request body with error handling
    let body: PaymentVerificationRequest;
    try {
      body = await request.json();
    } catch (_parseError) {
      await logPaymentEvent(
        ctx,
        'verification_failed',
        {
          errorMessage: 'Invalid JSON in request body',
          errorCode: 'PARSE_ERROR',
        },
        'error'
      );

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body',
        }),
        { status: 400, headers }
      );
    }

    const {
      expectedAmount,
      isProrated,
      isUpgrade,
      previousTier,
      referralCode,
      referralPayoutTx,
      referrerWalletAddress,
      commissionRate,
    } = body;
    ({ txSignature, tier, walletAddress, paymentType = 'subscription' } = body);

    // Log verification start
    await logPaymentEvent(
      ctx,
      'verification_started',
      {
        txSignature,
        tier,
        amount: expectedAmount,
        walletAddress,
        network: solanaConfig.network,
        isUpgrade,
        previousTier: previousTier || 'free',
      },
      'info'
    );

    // Early duplicate check will be handled in processVerifiedPayment
    // to avoid HTTP action database access limitations

    // Enhanced input validation with specific error messages
    if (!txSignature || typeof txSignature !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Transaction signature is required',
        }),
        { status: 400, headers }
      );
    }

    if (txSignature.length < 64 || txSignature.length > 88) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid transaction signature format',
        }),
        { status: 400, headers }
      );
    }

    if (
      !expectedAmount ||
      typeof expectedAmount !== 'number' ||
      expectedAmount <= 0
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Valid payment amount is required',
        }),
        { status: 400, headers }
      );
    }

    if (expectedAmount > 1000) {
      // Sanity check for very large amounts
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Payment amount exceeds maximum allowed',
        }),
        { status: 400, headers }
      );
    }

    // For subscription payments, a valid tier is required. For message credits, tier is not required.
    if (
      paymentType === 'subscription' &&
      !(tier && ['pro', 'pro_plus'].includes(tier))
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Valid subscription tier is required (pro or pro_plus)',
        }),
        { status: 400, headers }
      );
    }

    if (!walletAddress || typeof walletAddress !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Wallet address is required' }),
        { status: 400, headers }
      );
    }

    // Validate Solana address format
    try {
      new PublicKey(walletAddress);
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid Solana wallet address format',
        }),
        { status: 400, headers }
      );
    }

    // Validate payment address is configured
    if (!solanaConfig.paymentAddress) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Payment system not configured - please contact support',
        }),
        { status: 500, headers }
      );
    }

    // Validate pricing: for subscription payments, ensure amount matches configured tier price
    if (paymentType === 'subscription') {
      const tierPricing =
        (tier as string) === 'pro'
          ? subscriptionConfig.pricing.pro
          : subscriptionConfig.pricing.proPlus;

      // Calculate expected amount based on whether it's a prorated upgrade
      let expectedTierAmount = tierPricing.priceSOL;
      if (isProrated && tier === 'pro_plus') {
        expectedTierAmount =
          subscriptionConfig.pricing.proPlus.priceSOL -
          subscriptionConfig.pricing.pro.priceSOL;
      }

      if (Math.abs(expectedAmount - expectedTierAmount) > 0.001) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Payment amount doesn't match ${isUpgrade ? 'upgrade' : 'tier'} pricing: expected ${expectedTierAmount} SOL`,
          }),
          { status: 400, headers }
        );
      }
    }

    // Add timeout wrapper for blockchain verification
    const VERIFICATION_TIMEOUT = 30_000; // 30 seconds
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () =>
          reject(
            new Error('Verification timeout - blockchain query took too long')
          ),
        VERIFICATION_TIMEOUT
      );
    });

    // Handle split/dual payment verification if referral payout is present
    let verificationResult;
    let _referralVerificationResult = null;

    if (referralCode && (referralPayoutTx || referrerWalletAddress)) {
      // Get referral code info to find referrer wallet
      const referralCodeRecord = await ctx.runQuery(
        internal.referrals.getReferralCodeByCode,
        { code: referralCode }
      );

      if (!referralCodeRecord) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid referral code',
          }),
          { status: 400, headers }
        );
      }

      const referrer = await ctx.runQuery(internal.referrals.getUserById, {
        userId: referralCodeRecord.userId,
      });

      if (!referrer?.walletAddress) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Referrer wallet not found',
          }),
          { status: 400, headers }
        );
      }

      // Calculate expected referral payout
      const rateToUse =
        commissionRate || referralCodeRecord.currentCommissionRate || 0.03;
      // Determine gross payment amount based on payment type
      // - For subscriptions: use configured tier pricing (with prorate rules)
      // - For message credits: use the provided expectedAmount (credits total)
      let grossPaymentAmount: number;
      if (paymentType === 'message_credits') {
        grossPaymentAmount = expectedAmount;
      } else {
        const tierPricing =
          (tier as string) === 'pro'
            ? subscriptionConfig.pricing.pro
            : subscriptionConfig.pricing.proPlus;
        grossPaymentAmount =
          isProrated && tier === 'pro_plus'
            ? subscriptionConfig.pricing.proPlus.priceSOL -
              subscriptionConfig.pricing.pro.priceSOL
            : tierPricing.priceSOL;
      }

      const expectedReferralAmount = calculateReferralPayout(
        grossPaymentAmount,
        rateToUse
      );
      const expectedMainAmount = Math.max(
        0,
        grossPaymentAmount - expectedReferralAmount
      );

      // Validate payout parameters
      const validation = validatePayoutParams(
        referrer.walletAddress,
        expectedReferralAmount,
        grossPaymentAmount,
        rateToUse
      );

      if (!validation.valid) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Referral payout validation failed: ${validation.error}`,
          }),
          { status: 400, headers }
        );
      }
      // Two cases:
      // A) Two separate transactions provided -> verify both via helper
      // B) Single transaction with both transfers (referralPayoutTx equals txSignature or only referrerWallet provided)
      if (referralPayoutTx && referralPayoutTx !== txSignature) {
        const dualVerificationResult = await Promise.race([
          verifyDualPayment(
            txSignature,
            referralPayoutTx,
            expectedMainAmount,
            expectedReferralAmount,
            referrer.walletAddress
          ),
          timeoutPromise,
        ]);

        verificationResult = dualVerificationResult.mainPayment;
        _referralVerificationResult = dualVerificationResult.referralPayout;

        if (!dualVerificationResult.allVerified) {
          const errors = [] as string[];
          if (!dualVerificationResult.mainPayment.success) {
            errors.push(
              `Main payment: ${dualVerificationResult.mainPayment.error}`
            );
          }
          if (!dualVerificationResult.referralPayout.success) {
            errors.push(
              `Referral payout: ${dualVerificationResult.referralPayout.error}`
            );
          }

          await logPaymentEvent(
            ctx,
            'verification_failed',
            {
              txSignature,
              referralPayoutTx,
              errorMessage: errors.join('; '),
              errorCode: 'DUAL_PAYMENT_VERIFICATION_FAILED',
            },
            'error'
          );

          return new Response(
            JSON.stringify({
              success: false,
              error: `Payment verification failed: ${errors.join('; ')}`,
            }),
            { status: 400, headers }
          );
        }
      } else {
        // Single transaction with two transfers: verify both recipient balance changes within the same tx
        const connection = createSolanaConnection();
        // Try finalized first, then confirmed
        const tx = await Promise.race([
          (async () => {
            const finalized = await connection.getTransaction(txSignature, {
              commitment: 'finalized',
              maxSupportedTransactionVersion: 0,
            });
            if (finalized) {
              return finalized;
            }
            return await connection.getTransaction(txSignature, {
              commitment: 'confirmed',
              maxSupportedTransactionVersion: 0,
            });
          })(),
          timeoutPromise,
        ]);
        if (!tx || tx.meta?.err) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Transaction not found or failed on blockchain',
            }),
            { status: 400, headers }
          );
        }
        const message = tx.transaction.message;
        const messageKeys = message.getAccountKeys({
          accountKeysFromLookups: tx.meta?.loadedAddresses,
        });
        const allAccountKeys = [
          ...messageKeys.staticAccountKeys,
          ...(messageKeys.accountKeysFromLookups?.writable ?? []),
          ...(messageKeys.accountKeysFromLookups?.readonly ?? []),
        ];
        const paymentKey = new PublicKey(solanaConfig.paymentAddress);
        const referrerKey = new PublicKey(referrer.walletAddress);
        const paymentIndex = allAccountKeys.findIndex((k) =>
          k.equals(paymentKey)
        );
        const referrerIndex = allAccountKeys.findIndex((k) =>
          k.equals(referrerKey)
        );
        if (paymentIndex === -1 || referrerIndex === -1) {
          return new Response(
            JSON.stringify({
              success: false,
              error:
                'Expected recipients not found in transaction account keys',
            }),
            { status: 400, headers }
          );
        }
        const pre = tx.meta?.preBalances ?? [];
        const post = tx.meta?.postBalances ?? [];
        const paymentDelta =
          (post[paymentIndex] - pre[paymentIndex]) / LAMPORTS_PER_SOL;
        const referrerDelta =
          (post[referrerIndex] - pre[referrerIndex]) / LAMPORTS_PER_SOL;
        const tolerance = 0.001;
        if (Math.abs(paymentDelta - expectedMainAmount) > tolerance) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Main amount mismatch: expected ${expectedMainAmount} SOL, received ${paymentDelta.toFixed(6)} SOL`,
            }),
            { status: 400, headers }
          );
        }
        if (Math.abs(referrerDelta - expectedReferralAmount) > tolerance) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Referral amount mismatch: expected ${expectedReferralAmount} SOL, received ${referrerDelta.toFixed(6)} SOL`,
            }),
            { status: 400, headers }
          );
        }
        // Build verification result shape
        verificationResult = {
          success: true,
          transactionDetails: {
            signature: txSignature,
            recipient: solanaConfig.paymentAddress,
            sender: walletAddress,
            amount: paymentDelta,
            timestamp: (tx.blockTime ?? Math.floor(Date.now() / 1000)) * 1000,
            slot: tx.slot,
            confirmationStatus: 'finalized',
          },
        } as VerificationResult;
        _referralVerificationResult = { success: true };
      }

      // Override expectedAmount semantics: for processing, use gross amount to compute commissions
      // Later mutation will receive the full amount so commissions are based on gross
      (body as any).expectedAmount = grossPaymentAmount;
    } else {
      // Check if this is an SPL token payment
      const { tokenAddress, tokenAmount } = body;

      if (tokenAddress && tokenAddress !== 'native' && tokenAmount) {
        // SPL Token payment verification
        verificationResult = await Promise.race([
          verifySPLTokenTransaction(
            txSignature,
            solanaConfig.paymentAddress,
            tokenAmount,
            walletAddress,
            tokenAddress
          ),
          timeoutPromise,
        ]);
      } else {
        // Single SOL payment verification (original flow)
        verificationResult = await Promise.race([
          verifyTransaction(
            txSignature,
            solanaConfig.paymentAddress,
            expectedAmount,
            walletAddress
          ),
          timeoutPromise,
        ]);
      }
    }

    if (!verificationResult.success) {
      // Log verification failures for monitoring
      await logPaymentEvent(
        ctx,
        'verification_failed',
        {
          txSignature,
          errorMessage: verificationResult.error,
          errorCode: 'BLOCKCHAIN_VERIFICATION_FAILED',
          amount: expectedAmount,
          tier,
          walletAddress,
          processingTime: Date.now() - startTime,
          network: solanaConfig.network,
        },
        'error'
      );

      return new Response(
        JSON.stringify({
          success: false,
          error: verificationResult.error || 'Transaction verification failed',
        }),
        { status: 400, headers }
      );
    }

    // Log successful verification
    await logPaymentEvent(
      ctx,
      'verification_completed',
      {
        txSignature,
        tier,
        amount: expectedAmount,
        walletAddress,
        processingTime: Date.now() - startTime,
        network: solanaConfig.network,
      },
      'info'
    );

    // Process the payment or credit purchase through Convex mutation with error handling
    try {
      // Determine amount to record in Convex (gross for split, otherwise provided expectedAmount)
      const amountForProcessing =
        referralCode && (referralPayoutTx || referrerWalletAddress)
          ? (body.expectedAmount as number)
          : expectedAmount;

      if (paymentType === 'message_credits') {
        const result = await ctx.runMutation(
          internal.subscriptions.processVerifiedMessageCreditPurchase,
          {
            txSignature,
            amountSol: amountForProcessing,
            walletAddress,
            verificationDetails: (verificationResult as any)
              .transactionDetails || {
              signature: txSignature,
              recipient: solanaConfig.paymentAddress,
              sender: walletAddress,
              amount: amountForProcessing,
              timestamp: Date.now(),
              slot: 0,
              confirmationStatus: 'finalized',
            },
            referralCode: referralCode || undefined,
            referralPayoutTx:
              referralCode && (referralPayoutTx || referrerWalletAddress)
                ? txSignature
                : referralPayoutTx || undefined,
            // forward pack info for fallback record creation
            packType: (body.packType as 'standard') || 'standard',
            numberOfPacks: body.numberOfPacks || 1,
          } as any
        );

        return new Response(
          JSON.stringify({
            success: true,
            paymentId: result.purchaseId,
            transactionDetails: (verificationResult as any).transactionDetails,
          }),
          { status: 200, headers }
        );
      }

      const result = await ctx.runMutation(
        internal.subscriptions.processVerifiedPayment,
        {
          tier: tier as 'pro' | 'pro_plus',
          txSignature,
          amountSol: amountForProcessing,
          walletAddress,
          isProrated,
          verificationDetails: (verificationResult as any)
            .transactionDetails || {
            signature: txSignature,
            recipient: solanaConfig.paymentAddress,
            sender: walletAddress,
            amount: amountForProcessing,
            timestamp: Date.now(),
            slot: 0,
            confirmationStatus: 'finalized',
          },
          referralCode: referralCode || undefined,
          referralPayoutTx:
            referralCode && (referralPayoutTx || referrerWalletAddress)
              ? txSignature
              : referralPayoutTx || undefined,
        }
      );

      // Log successful payment for monitoring
      await logPaymentEvent(
        ctx,
        'payment_verified',
        {
          txSignature,
          tier,
          amount: expectedAmount,
          walletAddress,
          paymentId: result.paymentId,
          processingTime: Date.now() - startTime,
          network: solanaConfig.network,
        },
        'info'
      );

      return new Response(
        JSON.stringify({
          success: true,
          paymentId: result.paymentId,
          transactionDetails: (verificationResult as any).transactionDetails,
        }),
        { status: 200, headers }
      );
    } catch (mutationError) {
      // Log payment processing failure
      await logPaymentEvent(
        ctx,
        'payment_failed',
        {
          txSignature,
          tier,
          amount: expectedAmount,
          walletAddress,
          errorMessage:
            mutationError instanceof Error
              ? mutationError.message
              : 'Unknown mutation error',
          errorCode: 'PAYMENT_PROCESSING_FAILED',
          processingTime: Date.now() - startTime,
          network: solanaConfig.network,
        },
        'error'
      );

      // Specific error handling for common Convex errors
      let errorMessage = 'Payment processing failed after verification';
      if (mutationError instanceof Error) {
        if (mutationError.message.includes('User not found')) {
          errorMessage = 'User account not found - please sign in again';
        } else if (mutationError.message.includes('already processed')) {
          errorMessage = 'This payment has already been processed';
        } else if (mutationError.message.includes('duplicate')) {
          errorMessage =
            'Duplicate payment detected - transaction already exists';
        }
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
        }),
        { status: 500, headers }
      );
    }
  } catch (error) {
    // Log critical system errors
    await logPaymentEvent(
      ctx,
      'blockchain_error',
      {
        txSignature,
        tier,
        walletAddress,
        errorMessage:
          error instanceof Error ? error.message : 'Unknown system error',
        errorCode: 'HTTP_ACTION_ERROR',
        processingTime: Date.now() - startTime,
        network: solanaConfig.network,
      },
      'critical'
    );

    // Enhanced error categorization for HTTP action errors
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout - please try again';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error - please check your connection';
      } else if (error.message.includes('rate limit')) {
        errorMessage =
          'Service temporarily unavailable - please wait and try again';
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      { status: 500, headers }
    );
  }
});

// Helper function for testing transaction verification (for development)
export const testTransactionVerification = httpAction(async (_, request) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return new Response(
      JSON.stringify({ error: 'Test endpoint not available in production' }),
      { status: 403, headers }
    );
  }

  try {
    const body = await request.json();
    const { txSignature, expectedRecipient, expectedAmount, senderAddress } =
      body;

    const result = await verifyTransaction(
      txSignature,
      expectedRecipient,
      expectedAmount,
      senderAddress
    );

    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers }
    );
  }
});
