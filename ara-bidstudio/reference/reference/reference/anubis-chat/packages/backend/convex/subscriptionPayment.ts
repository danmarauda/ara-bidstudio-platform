/**
 * Subscription Payment HTTP Action
 * Handles subscription payments with SPL token support
 */

import { getAuthUserId } from '@convex-dev/auth/server';
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';
import { api, internal } from './_generated/api';
import { httpAction } from './_generated/server';
import { solanaConfig } from './env';
import { getConfiguredSPLTokens } from './splTokens';

// Payment verification types
interface VerificationResult {
  verified: boolean;
  confirmations?: number;
  error?: string;
}

interface PaymentRequest {
  txSignature: string;
  tier: 'pro' | 'pro_plus';
  amountSol: number;
  tokenAddress?: string;
  tokenAmount?: number;
  tokenSymbol?: string;
}

// Initialize Solana connection
const connection = new Connection(
  solanaConfig.rpcUrl,
  solanaConfig.commitmentLevel as any
);

function getTreasuryWallet(): string {
  const wallet = solanaConfig.paymentAddress;
  if (!wallet) {
    throw new Error('TREASURY_WALLET not configured');
  }
  return wallet;
}

// SOL payment verification
async function verifySOLPayment(
  signature: string,
  expectedAmount: number,
  senderAddress: string
): Promise<VerificationResult> {
  try {
    const transaction = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!transaction) {
      return { verified: false, error: 'Transaction not found' };
    }

    if (transaction.meta?.err) {
      return { verified: false, error: 'Transaction failed on blockchain' };
    }

    const message = transaction.transaction.message;
    const messageKeys = message.getAccountKeys({
      accountKeysFromLookups: transaction.meta?.loadedAddresses,
    });

    const allKeys = [
      ...messageKeys.staticAccountKeys,
      ...(messageKeys.accountKeysFromLookups?.writable ?? []),
      ...(messageKeys.accountKeysFromLookups?.readonly ?? []),
    ];

    let senderIndex = -1;
    let treasuryIndex = -1;

    for (let i = 0; i < allKeys.length; i++) {
      const key = allKeys[i].toBase58();
      if (key === senderAddress) senderIndex = i;
      if (key === getTreasuryWallet()) treasuryIndex = i;
    }

    if (senderIndex === -1 || treasuryIndex === -1) {
      return {
        verified: false,
        error: 'Sender or treasury not found in transaction',
      };
    }

    const pre = transaction.meta?.preBalances?.[senderIndex] ?? 0;
    const post = transaction.meta?.postBalances?.[senderIndex] ?? 0;
    const fee = transaction.meta?.fee ?? 0;
    const solTransferred = (pre - post - fee) / 1e9;

    const tolerance = 0.001;
    if (Math.abs(solTransferred - expectedAmount) > tolerance) {
      return {
        verified: false,
        error: `Amount mismatch: expected ${expectedAmount} SOL, got ${solTransferred} SOL`,
      };
    }

    const statuses = await connection.getSignatureStatuses([signature]);
    const confirmations = statuses.value[0]?.confirmations || 0;

    return { verified: true, confirmations };
  } catch (error) {
    return {
      verified: false,
      error: `Payment verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// SPL Token payment verification
async function verifySPLTokenPayment(
  signature: string,
  expectedAmount: number,
  senderAddress: string,
  tokenMintAddress: string
): Promise<VerificationResult> {
  try {
    const transaction = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!transaction) {
      return { verified: false, error: 'Transaction not found' };
    }

    if (transaction.meta?.err) {
      return { verified: false, error: 'Transaction failed on blockchain' };
    }

    const senderPubkey = new PublicKey(senderAddress);
    const treasuryPubkey = new PublicKey(getTreasuryWallet());
    const mintPubkey = new PublicKey(tokenMintAddress);

    const senderTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      senderPubkey
    );
    const treasuryTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      treasuryPubkey
    );

    const message = transaction.transaction.message;
    const messageKeys = message.getAccountKeys({
      accountKeysFromLookups: transaction.meta?.loadedAddresses,
    });

    const allKeys = [
      ...messageKeys.staticAccountKeys,
      ...(messageKeys.accountKeysFromLookups?.writable ?? []),
      ...(messageKeys.accountKeysFromLookups?.readonly ?? []),
    ];

    let senderTokenIndex = -1;
    let treasuryTokenIndex = -1;

    for (let i = 0; i < allKeys.length; i++) {
      const keyStr = allKeys[i].toBase58();
      if (keyStr === senderTokenAccount.toBase58()) senderTokenIndex = i;
      if (keyStr === treasuryTokenAccount.toBase58()) treasuryTokenIndex = i;
    }

    if (senderTokenIndex === -1 || treasuryTokenIndex === -1) {
      return {
        verified: false,
        error: 'Token accounts not found in transaction',
      };
    }

    const preBalances = transaction.meta?.preTokenBalances || [];
    const postBalances = transaction.meta?.postTokenBalances || [];

    const senderPreToken = preBalances.find(
      (balance) => balance.accountIndex === senderTokenIndex
    );
    const senderPostToken = postBalances.find(
      (balance) => balance.accountIndex === senderTokenIndex
    );

    const treasuryPreToken = preBalances.find(
      (balance) => balance.accountIndex === treasuryTokenIndex
    );
    const treasuryPostToken = postBalances.find(
      (balance) => balance.accountIndex === treasuryTokenIndex
    );

    const senderPreBalance = Number(senderPreToken?.uiTokenAmount?.amount || 0);
    const senderPostBalance = Number(
      senderPostToken?.uiTokenAmount?.amount || 0
    );
    const treasuryPreBalance = Number(
      treasuryPreToken?.uiTokenAmount?.amount || 0
    );
    const treasuryPostBalance = Number(
      treasuryPostToken?.uiTokenAmount?.amount || 0
    );

    const tokensTransferred = senderPreBalance - senderPostBalance;
    const tokensReceived = treasuryPostBalance - treasuryPreBalance;

    const tolerance = Math.max(1, expectedAmount * 0.001);

    if (Math.abs(tokensTransferred - expectedAmount) > tolerance) {
      return {
        verified: false,
        error: `Token amount mismatch: expected ${expectedAmount}, sender transferred ${tokensTransferred}`,
      };
    }

    if (Math.abs(tokensReceived - expectedAmount) > tolerance) {
      return {
        verified: false,
        error: `Token amount mismatch: expected ${expectedAmount}, treasury received ${tokensReceived}`,
      };
    }

    const statuses = await connection.getSignatureStatuses([signature]);
    const confirmations = statuses.value[0]?.confirmations || 0;

    return { verified: true, confirmations };
  } catch (error) {
    return {
      verified: false,
      error: `SPL token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export const processSubscriptionPayment = httpAction(async (ctx, request) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  try {
    // Get authenticated user
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers }
      );
    }

    const currentUser = await ctx.runQuery(api.users.getUserById, {
      userId,
    });

    if (!currentUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers,
      });
    }

    // Parse request body
    let body: PaymentRequest;
    try {
      body = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers }
      );
    }

    const {
      txSignature,
      tier,
      amountSol,
      tokenAddress,
      tokenAmount,
      tokenSymbol,
    } = body;

    // Validate required fields
    if (!(txSignature && tier) || typeof amountSol !== 'number') {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers }
      );
    }

    const walletAddress = currentUser.walletAddress;
    if (!walletAddress) {
      return new Response(
        JSON.stringify({ error: 'User wallet address is required' }),
        { status: 400, headers }
      );
    }

    // Verify payment on blockchain
    let verification: VerificationResult;

    if (tokenAddress && tokenAddress !== 'native' && tokenAmount) {
      // SPL Token payment verification
      verification = await verifySPLTokenPayment(
        txSignature,
        tokenAmount,
        walletAddress,
        tokenAddress
      );
    } else {
      // SOL payment verification
      verification = await verifySOLPayment(
        txSignature,
        amountSol,
        walletAddress
      );
    }

    if (!verification.verified) {
      return new Response(
        JSON.stringify({
          error: `Payment verification failed: ${verification.error}`,
        }),
        { status: 400, headers }
      );
    }

    // Process subscription payment
    const paymentResult = await ctx.runMutation(
      api.subscriptions.processPayment,
      {
        tier,
        txSignature,
        amountSol,
      }
    );

    // Confirm payment
    await ctx.runMutation(api.subscriptions.confirmPayment, {
      txSignature,
      confirmations: verification.confirmations || 0,
    });

    // Log successful payment
    console.log('Payment processed successfully', {
      userId: currentUser._id,
      walletAddress,
      tier,
      txSignature,
      amountSol,
      ...(tokenAddress && tokenAddress !== 'native'
        ? {
            tokenAddress,
            tokenAmount,
            tokenSymbol,
            paymentType: 'SPL_TOKEN',
          }
        : { paymentType: 'SOL' }),
      confirmations: verification.confirmations,
    });

    return new Response(
      JSON.stringify({
        success: true,
        paymentId: paymentResult.paymentId,
        tier: paymentResult.tier,
        confirmations: verification.confirmations,
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error('Payment processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process payment' }),
      { status: 500, headers }
    );
  }
});
