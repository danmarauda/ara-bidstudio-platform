/**
 * Solana Direct Wallet Payout System
 * Handles referral commission payouts during payment processing
 */

import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { solanaConfig } from './env';

// Types for payout operations
interface PayoutResult {
  success: boolean;
  txSignature?: string;
  error?: string;
}

// Reserved for future use when constructing client-orchestrated dual transfers
// type DualTransferRequest = {
//   mainPaymentAmount: number; // SOL amount for main payment
//   referrerWallet: string; // Referrer's wallet address
//   referralAmount: number; // Commission amount in SOL
//   originalTxSignature: string; // Original payment transaction
// };

/**
 * Create Solana connection for payout operations
 */
function createPayoutConnection(): Connection {
  return new Connection(solanaConfig.rpcUrl, {
    commitment: 'confirmed',
    httpHeaders: {
      'User-Agent': 'anubis.chat-payouts/1.0',
    },
    disableRetryOnRateLimit: false,
    confirmTransactionInitialTimeout: 30_000,
  });
}

/**
 * Verify dual payment: main payment + referral payout
 * This function validates that both transfers occurred correctly
 */
export async function verifyDualPayment(
  mainTxSignature: string,
  referralTxSignature: string,
  expectedMainAmount: number,
  expectedReferralAmount: number,
  referrerWalletAddress: string
): Promise<{
  mainPayment: { success: boolean; error?: string };
  referralPayout: { success: boolean; error?: string };
  allVerified: boolean;
}> {
  const connection = createPayoutConnection();

  try {
    // Ensure configured payment address is available
    const paymentAddress = solanaConfig.paymentAddress;
    if (!paymentAddress) {
      return {
        mainPayment: {
          success: false,
          error: 'Payment address not configured',
        },
        referralPayout: {
          success: false,
          error: 'Payment address not configured',
        },
        allVerified: false,
      };
    }

    // Verify main payment transaction
    const mainResult = await verifyTransaction(
      connection,
      mainTxSignature,
      paymentAddress,
      expectedMainAmount
    );

    // Verify referral payout transaction
    const referralResult = await verifyTransaction(
      connection,
      referralTxSignature,
      referrerWalletAddress,
      expectedReferralAmount
    );

    return {
      mainPayment: mainResult,
      referralPayout: referralResult,
      allVerified: mainResult.success && referralResult.success,
    };
  } catch (_error) {
    return {
      mainPayment: {
        success: false,
        error: 'Main payment verification failed',
      },
      referralPayout: {
        success: false,
        error: 'Referral payout verification failed',
      },
      allVerified: false,
    };
  }
}

/**
 * Verify individual transaction
 */
async function verifyTransaction(
  connection: Connection,
  signature: string,
  expectedRecipient: string,
  expectedAmount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const transaction = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!transaction) {
      return { success: false, error: 'Transaction not found' };
    }

    if (transaction.meta?.err) {
      return { success: false, error: 'Transaction failed on blockchain' };
    }

    // Get account keys
    const message = transaction.transaction.message;
    const messageKeys = message.getAccountKeys({
      accountKeysFromLookups: transaction.meta?.loadedAddresses,
    });

    const allAccountKeys: PublicKey[] = [
      ...messageKeys.staticAccountKeys,
      ...(messageKeys.accountKeysFromLookups?.writable ?? []),
      ...(messageKeys.accountKeysFromLookups?.readonly ?? []),
    ];

    // Find recipient in account keys
    const recipientPubkey = new PublicKey(expectedRecipient);
    const recipientIndex = allAccountKeys.findIndex((key: PublicKey) =>
      key.equals(recipientPubkey)
    );

    if (recipientIndex === -1) {
      return { success: false, error: 'Recipient not found in transaction' };
    }

    // Verify balance changes
    if (!(transaction.meta?.preBalances && transaction.meta?.postBalances)) {
      return { success: false, error: 'Balance data unavailable' };
    }

    const preBalance = transaction.meta.preBalances[recipientIndex] ?? 0;
    const postBalance = transaction.meta.postBalances[recipientIndex] ?? 0;
    const balanceChange = (postBalance - preBalance) / LAMPORTS_PER_SOL;

    // Verify amount with tolerance
    const tolerance = 0.001; // 0.001 SOL tolerance
    if (Math.abs(balanceChange - expectedAmount) > tolerance) {
      return {
        success: false,
        error: `Amount mismatch: expected ${expectedAmount} SOL, got ${balanceChange.toFixed(6)} SOL`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Transaction verification failed',
    };
  }
}

/**
 * Simulate referral payout execution
 * In production, this would be handled by your payment processor or wallet service
 * For now, we'll focus on verification of existing transactions
 */
export function simulateReferralPayout(
  referrerWallet: string,
  amount: number,
  _originalTxSignature: string
): PayoutResult {
  try {
    // Validate inputs
    if (!(referrerWallet && amount) || amount <= 0) {
      return {
        success: false,
        error: 'Invalid payout parameters',
      };
    }

    // Validate wallet address format
    try {
      new PublicKey(referrerWallet);
    } catch {
      return {
        success: false,
        error: 'Invalid referrer wallet address',
      };
    }

    // Check if amount is reasonable (between 0.0015 and 0.005 SOL for our tiers)
    if (amount < 0.0015 || amount > 0.005) {
      return {
        success: false,
        error: 'Payout amount outside expected range',
      };
    }

    // In a real implementation, you would:
    // 1. Create and sign a transaction to transfer SOL to the referrer
    // 2. Submit the transaction to the network
    // 3. Wait for confirmation
    // 4. Return the transaction signature

    // For simulation purposes, generate a mock transaction signature
    const mockTxSignature = generateMockTransactionSignature();

    return {
      success: true,
      txSignature: mockTxSignature,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payout execution failed',
    };
  }
}

/**
 * Generate mock transaction signature for simulation
 */
function generateMockTransactionSignature(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let signature = '';

  for (let i = 0; i < 88; i++) {
    // Solana signatures are 88 characters
    signature += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return signature;
}

/**
 * Calculate referral payout amount based on payment and commission rate
 */
export function calculateReferralPayout(
  paymentAmount: number,
  commissionRate: number
): number {
  if (paymentAmount <= 0 || commissionRate <= 0) {
    return 0;
  }

  const payout = paymentAmount * commissionRate;

  // Round to 6 decimal places to avoid floating point issues
  return Math.round(payout * 1_000_000) / 1_000_000;
}

/**
 * Validate payout parameters before execution
 */
export function validatePayoutParams(
  referrerWallet: string,
  amount: number,
  paymentAmount: number,
  commissionRate: number
): { valid: boolean; error?: string } {
  // Check wallet address
  try {
    new PublicKey(referrerWallet);
  } catch {
    return { valid: false, error: 'Invalid referrer wallet address' };
  }

  // Check amount is positive
  if (amount <= 0) {
    return { valid: false, error: 'Payout amount must be positive' };
  }

  // Check commission rate is reasonable (3-5%)
  if (commissionRate < 0.03 || commissionRate > 0.05) {
    return {
      valid: false,
      error: 'Commission rate outside valid range (3-5%)',
    };
  }

  // Verify calculated amount matches expected amount
  const expectedAmount = calculateReferralPayout(paymentAmount, commissionRate);
  if (Math.abs(amount - expectedAmount) > 0.000_001) {
    return {
      valid: false,
      error: `Amount mismatch: expected ${expectedAmount}, got ${amount}`,
    };
  }

  // Check payout amount is within reasonable bounds
  if (amount > paymentAmount) {
    return { valid: false, error: 'Payout amount exceeds payment amount' };
  }

  return { valid: true };
}
