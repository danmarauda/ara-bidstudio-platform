/**
 * Solana Payment Webhook Handler
 * Processes subscription payments via Solana transactions
 */

import { api } from '@convex/_generated/api';
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';
import { ConvexHttpClient } from 'convex/browser';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { convexConfig, solanaConfig } from '@/lib/env';
import { authRateLimit } from '@/lib/middleware/rate-limit';
import {
  addSecurityHeaders,
  internalErrorResponse,
  successResponse,
  validationErrorResponse,
} from '@/lib/utils/apiResponse';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('payment-webhook-api');

// =============================================================================
// Request Validation
// =============================================================================

const paymentSchema = z.object({
  txSignature: z.string().min(64).max(128),
  tier: z.union([z.literal('pro'), z.literal('pro_plus')]),
  amountSol: z.number().min(0.01).max(1.0),
  // SPL Token fields (optional for backward compatibility)
  tokenAddress: z.string().optional(),
  tokenAmount: z.number().optional(),
  tokenSymbol: z.string().optional(),
});

// =============================================================================
// Solana Connection
// =============================================================================

const SOLANA_RPC_URL = solanaConfig.rpcUrl;
const TREASURY_WALLET: string = (() => {
  const address = solanaConfig.paymentAddress;
  if (!address) {
    throw new Error(
      'NEXT_PUBLIC_SOLANA_PAYMENT_ADDRESS environment variable is required'
    );
  }
  return address;
})();

const connection = new Connection(SOLANA_RPC_URL, solanaConfig.commitment);

// =============================================================================
// Transaction Verification
// =============================================================================

type VerificationResult = {
  verified: boolean;
  confirmations?: number;
  error?: string;
};

function fetchTransaction(signature: string) {
  return connection.getTransaction(signature, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0,
  });
}

function getAllAccountKeys(
  tx: NonNullable<Awaited<ReturnType<typeof fetchTransaction>>>
) {
  const message = tx.transaction.message;
  const messageKeys = message.getAccountKeys({
    accountKeysFromLookups: tx.meta?.loadedAddresses,
  });
  return [
    ...messageKeys.staticAccountKeys,
    ...(messageKeys.accountKeysFromLookups?.writable ?? []),
    ...(messageKeys.accountKeysFromLookups?.readonly ?? []),
  ];
}

function findAccountIndices(
  keys: ReturnType<typeof getAllAccountKeys>,
  sender: string,
  treasury: string
) {
  let senderIndex = -1;
  let treasuryIndex = -1;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i].toBase58();
    if (key === sender) {
      senderIndex = i;
    }
    if (key === treasury) {
      treasuryIndex = i;
    }
  }
  return { senderIndex, treasuryIndex };
}

function computeTransferredSol(
  tx: NonNullable<Awaited<ReturnType<typeof fetchTransaction>>>,
  senderIndex: number
): number {
  const pre = tx.meta?.preBalances?.[senderIndex] ?? 0;
  const post = tx.meta?.postBalances?.[senderIndex] ?? 0;
  const fee = tx.meta?.fee ?? 0;
  const lamports = pre - post - fee;
  return lamports / 1e9;
}

async function getConfirmationCount(signature: string): Promise<number> {
  const statuses = await connection.getSignatureStatuses([signature]);
  return statuses.value[0]?.confirmations || 0;
}

async function verifyPayment(
  signature: string,
  expectedAmount: number,
  senderAddress: string
): Promise<VerificationResult> {
  try {
    const transaction = await fetchTransaction(signature);
    if (!transaction) {
      return { verified: false, error: 'Transaction not found' };
    }
    if (transaction.meta?.err) {
      return { verified: false, error: 'Transaction failed on blockchain' };
    }

    const keys = getAllAccountKeys(transaction);
    const { senderIndex, treasuryIndex } = findAccountIndices(
      keys,
      senderAddress,
      TREASURY_WALLET
    );
    if (senderIndex === -1 || treasuryIndex === -1) {
      return {
        verified: false,
        error: 'Sender or treasury not found in transaction',
      };
    }

    const solTransferred = computeTransferredSol(transaction, senderIndex);
    const tolerance = 0.001;
    if (Math.abs(solTransferred - expectedAmount) > tolerance) {
      return {
        verified: false,
        error: `Amount mismatch: expected ${expectedAmount} SOL, got ${solTransferred} SOL`,
      };
    }

    const confirmations = await getConfirmationCount(signature);
    return { verified: true, confirmations };
  } catch (error) {
    log.error('Payment verification error', {
      signature,
      error: error instanceof Error ? error.message : String(error),
    });
    return { verified: false, error: 'Failed to verify transaction' };
  }
}

// SPL Token verification function
async function verifySPLTokenPayment(
  signature: string,
  expectedAmount: number,
  senderAddress: string,
  tokenMintAddress: string
): Promise<VerificationResult> {
  try {
    const transaction = await fetchTransaction(signature);
    if (!transaction) {
      return { verified: false, error: 'Transaction not found' };
    }
    if (transaction.meta?.err) {
      return { verified: false, error: 'Transaction failed on blockchain' };
    }

    // For SPL token transfers, we need to check token account balance changes
    const senderPubkey = new PublicKey(senderAddress);
    const treasuryPubkey = new PublicKey(TREASURY_WALLET);
    const mintPubkey = new PublicKey(tokenMintAddress);

    try {
      // Get associated token addresses
      const senderTokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        senderPubkey
      );
      const treasuryTokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        treasuryPubkey
      );

      // Find token accounts in transaction keys
      const keys = getAllAccountKeys(transaction);
      let senderTokenIndex = -1;
      let treasuryTokenIndex = -1;

      for (let i = 0; i < keys.length; i++) {
        const keyStr = keys[i].toBase58();
        if (keyStr === senderTokenAccount.toBase58()) {
          senderTokenIndex = i;
        }
        if (keyStr === treasuryTokenAccount.toBase58()) {
          treasuryTokenIndex = i;
        }
      }

      if (senderTokenIndex === -1 || treasuryTokenIndex === -1) {
        return {
          verified: false,
          error: 'Token accounts not found in transaction',
        };
      }

      // Check token balance changes
      const preBalances = transaction.meta?.preTokenBalances || [];
      const postBalances = transaction.meta?.postTokenBalances || [];

      let senderPreBalance = 0;
      let senderPostBalance = 0;
      let treasuryPreBalance = 0;
      let treasuryPostBalance = 0;

      // Find sender token account balance changes
      const senderPreToken = preBalances.find(
        (balance) => balance.accountIndex === senderTokenIndex
      );
      const senderPostToken = postBalances.find(
        (balance) => balance.accountIndex === senderTokenIndex
      );

      // Find treasury token account balance changes
      const treasuryPreToken = preBalances.find(
        (balance) => balance.accountIndex === treasuryTokenIndex
      );
      const treasuryPostToken = postBalances.find(
        (balance) => balance.accountIndex === treasuryTokenIndex
      );

      if (senderPreToken?.uiTokenAmount?.amount) {
        senderPreBalance = Number(senderPreToken.uiTokenAmount.amount);
      }
      if (senderPostToken?.uiTokenAmount?.amount) {
        senderPostBalance = Number(senderPostToken.uiTokenAmount.amount);
      }
      if (treasuryPreToken?.uiTokenAmount?.amount) {
        treasuryPreBalance = Number(treasuryPreToken.uiTokenAmount.amount);
      }
      if (treasuryPostToken?.uiTokenAmount?.amount) {
        treasuryPostBalance = Number(treasuryPostToken.uiTokenAmount.amount);
      }

      const tokensTransferred = senderPreBalance - senderPostBalance;
      const tokensReceived = treasuryPostBalance - treasuryPreBalance;

      // Verify amounts match (allow small tolerance for rounding)
      const tolerance = Math.max(1, expectedAmount * 0.001); // 0.1% tolerance or 1 token unit

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

      const confirmations = await getConfirmationCount(signature);
      return { verified: true, confirmations };
    } catch (error) {
      return {
        verified: false,
        error: `SPL token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  } catch (error) {
    log.error('SPL token payment verification error', {
      signature,
      tokenMintAddress,
      error: error instanceof Error ? error.message : String(error),
    });
    return { verified: false, error: 'Failed to verify SPL token transaction' };
  }
}

// =============================================================================
// Route Handlers
// =============================================================================

function ensureConvexClient(): ConvexHttpClient {
  const convexUrl = convexConfig.publicUrl;
  if (!convexUrl) {
    throw new Error('NEXT_PUBLIC_CONVEX_URL environment variable is required');
  }
  return new ConvexHttpClient(convexUrl);
}

async function getAuthenticatedUser(
  req: NextRequest,
  client: ConvexHttpClient
) {
  const authToken = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!authToken) {
    return { error: validationErrorResponse('Authentication required') };
  }
  client.setAuth(authToken);
  const currentUser = await client.query(api.users.getCurrentUserProfile);
  if (!currentUser) {
    return {
      error: validationErrorResponse('User not authenticated or not found'),
    };
  }
  return { currentUser } as const;
}

async function parsePaymentRequest(req: NextRequest) {
  const body = await req.json();
  const validation = paymentSchema.safeParse(body);
  if (!validation.success) {
    return {
      error: validationErrorResponse(
        'Invalid payment data',
        validation.error.flatten().fieldErrors
      ),
    } as const;
  }
  return { data: validation.data } as const;
}

async function processPaymentWithConvex(
  client: ConvexHttpClient,
  args: { tier: 'pro' | 'pro_plus'; txSignature: string; amountSol: number },
  confirmations: number
) {
  const paymentResult = await client.mutation(
    api.subscriptions.processPayment,
    args
  );
  await client.mutation(api.subscriptions.confirmPayment, {
    txSignature: args.txSignature,
    confirmations,
  });
  return paymentResult;
}

export function POST(request: NextRequest) {
  return authRateLimit(request, async (req): Promise<Response> => {
    try {
      const convexClient = ensureConvexClient();

      const userResult = await getAuthenticatedUser(req, convexClient);
      if ('error' in userResult) {
        return addSecurityHeaders(userResult.error as NextResponse);
      }
      const { currentUser } = userResult;

      const parseResult = await parsePaymentRequest(req);
      if ('error' in parseResult) {
        return addSecurityHeaders(parseResult.error as NextResponse);
      }
      const {
        txSignature,
        tier,
        amountSol,
        tokenAddress,
        tokenAmount,
        tokenSymbol,
      } = parseResult.data;
      const walletAddress = currentUser.walletAddress;

      if (typeof walletAddress !== 'string' || walletAddress.length === 0) {
        return validationErrorResponse('User wallet address is required');
      }
      const senderWalletAddress: string = walletAddress;

      // Verify payment on Solana blockchain
      let verification: VerificationResult;

      if (tokenAddress && tokenAddress !== 'native' && tokenAmount) {
        // SPL Token payment verification
        verification = await verifySPLTokenPayment(
          txSignature,
          tokenAmount,
          senderWalletAddress,
          tokenAddress
        );
      } else {
        // SOL payment verification
        verification = await verifyPayment(
          txSignature,
          amountSol,
          senderWalletAddress
        );
      }

      if (!verification.verified) {
        log.warn('Payment verification failed', {
          walletAddress: senderWalletAddress,
          txSignature,
          error: verification.error,
        });
        return validationErrorResponse(
          `Payment verification failed: ${verification.error}`
        );
      }

      const paymentResult = await processPaymentWithConvex(
        convexClient,
        { tier, txSignature, amountSol },
        verification.confirmations || 0
      );

      log.info('Payment processed successfully', {
        userId: currentUser._id,
        walletAddress: senderWalletAddress,
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

      const response = successResponse({
        success: true,
        paymentId: paymentResult.paymentId,
        tier: paymentResult.tier,
        confirmations: verification.confirmations,
      });

      return addSecurityHeaders(response);
    } catch (error) {
      log.error('Payment processing error', {
        error: error instanceof Error ? error.message : String(error),
      });

      return internalErrorResponse('Failed to process payment');
    }
  });
}

export async function GET(_request: NextRequest) {
  // Health check endpoint
  try {
    await connection.getVersion();
    return successResponse({ status: 'healthy', rpc: SOLANA_RPC_URL });
  } catch (_error) {
    return internalErrorResponse('Solana RPC connection failed');
  }
}

export function OPTIONS(_request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addSecurityHeaders(response);
}
