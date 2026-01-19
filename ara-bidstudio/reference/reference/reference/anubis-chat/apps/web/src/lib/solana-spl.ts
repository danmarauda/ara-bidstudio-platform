/**
 * SPL Token Utilities for Frontend
 * Handles SPL token transfers, account creation, and transaction building
 */

import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddress,
  getMint,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  type Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';

// SPL Token Configuration (matches backend)
export interface SPLTokenConfig {
  symbol: string;
  name: string;
  address: string; // Mint address
  decimals: number;
  logoUri?: string;
  enabled: boolean;
}

// Payment calculation result
export interface TokenPaymentCalculation {
  tokenAddress: string;
  symbol: string;
  amount: number;
  decimals: number;
  rawAmount: number;
  priceInfo?: {
    solPrice: number;
    usdPrice: number;
    lastUpdated: number;
  };
}

/**
 * Create SPL token transfer transaction
 * @param connection Solana connection
 * @param fromPublicKey Sender's public key
 * @param toPublicKey Recipient's public key
 * @param mintAddress SPL token mint address
 * @param amount Amount of tokens to transfer (in smallest unit)
 * @param decimals Number of decimals for the token
 * @returns Transaction ready for signing
 */
export async function createSPLTokenTransferTransaction(
  connection: Connection,
  fromPublicKey: PublicKey,
  toPublicKey: PublicKey,
  mintAddress: string,
  amount: number,
  decimals: number
): Promise<Transaction> {
  const mint = new PublicKey(mintAddress);

  try {
    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash('confirmed');

    // Get associated token addresses
    const fromTokenAccount = await getAssociatedTokenAddress(
      mint,
      fromPublicKey
    );
    const toTokenAccount = await getAssociatedTokenAddress(mint, toPublicKey);

    const transaction = new Transaction({
      feePayer: fromPublicKey,
      blockhash,
      lastValidBlockHeight,
    });

    // Check if sender's token account exists
    try {
      await getAccount(connection, fromTokenAccount);
    } catch (error) {
      throw new Error(
        'Sender does not have a token account for this SPL token. Please create one first.'
      );
    }

    // Check if recipient's token account exists, create if not
    let needsRecipientAccount = false;
    try {
      await getAccount(connection, toTokenAccount);
    } catch (error) {
      needsRecipientAccount = true;
    }

    if (needsRecipientAccount) {
      // Add instruction to create recipient's associated token account
      transaction.add(
        createAssociatedTokenAccountInstruction(
          fromPublicKey, // payer
          toTokenAccount,
          toPublicKey, // owner
          mint
        )
      );
    }

    // Add transfer instruction
    transaction.add(
      createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        fromPublicKey,
        amount
      )
    );

    return transaction;
  } catch (error) {
    throw new Error(
      `Failed to create SPL token transfer transaction: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Validate SPL token transfer requirements
 * @param connection Solana connection
 * @param userPublicKey User's public key
 * @param mintAddress SPL token mint address
 * @param requiredAmount Required amount in smallest units
 * @returns Validation result with balance and account info
 */
export async function validateSPLTokenTransfer(
  connection: Connection,
  userPublicKey: PublicKey,
  mintAddress: string,
  requiredAmount: number
): Promise<{
  isValid: boolean;
  hasTokenAccount: boolean;
  balance: number;
  requiredAmount: number;
  sufficientBalance: boolean;
  error?: string;
}> {
  try {
    const mint = new PublicKey(mintAddress);
    const userTokenAccount = await getAssociatedTokenAddress(
      mint,
      userPublicKey
    );

    try {
      // Check if user has token account
      const accountInfo = await getAccount(connection, userTokenAccount);
      const balance = Number(accountInfo.amount);

      return {
        isValid: balance >= requiredAmount,
        hasTokenAccount: true,
        balance,
        requiredAmount,
        sufficientBalance: balance >= requiredAmount,
      };
    } catch (error) {
      // Token account doesn't exist
      return {
        isValid: false,
        hasTokenAccount: false,
        balance: 0,
        requiredAmount,
        sufficientBalance: false,
        error: 'You do not have a token account for this SPL token',
      };
    }
  } catch (error) {
    return {
      isValid: false,
      hasTokenAccount: false,
      balance: 0,
      requiredAmount,
      sufficientBalance: false,
      error: error instanceof Error ? error.message : 'Validation failed',
    };
  }
}

/**
 * Get token metadata (decimals, supply, etc.)
 * @param connection Solana connection
 * @param mintAddress SPL token mint address
 * @returns Token metadata
 */
export async function getTokenMetadata(
  connection: Connection,
  mintAddress: string
): Promise<{
  address: string;
  decimals: number;
  supply: string;
  isInitialized: boolean;
} | null> {
  try {
    const mint = new PublicKey(mintAddress);
    const mintInfo = await getMint(connection, mint);

    return {
      address: mintAddress,
      decimals: mintInfo.decimals,
      supply: mintInfo.supply.toString(),
      isInitialized: mintInfo.isInitialized,
    };
  } catch (error) {
    console.error(`Failed to get token metadata for ${mintAddress}:`, error);
    return null;
  }
}

/**
 * Get user's SPL token balance
 * @param connection Solana connection
 * @param userPublicKey User's public key
 * @param mintAddress SPL token mint address
 * @returns Token balance information
 */
export async function getUserSPLTokenBalance(
  connection: Connection,
  userPublicKey: PublicKey,
  mintAddress: string
): Promise<{
  hasAccount: boolean;
  balance: number;
  balanceFormatted: string;
  decimals: number;
} | null> {
  try {
    const mint = new PublicKey(mintAddress);
    const userTokenAccount = await getAssociatedTokenAddress(
      mint,
      userPublicKey
    );

    try {
      const [accountInfo, mintInfo] = await Promise.all([
        getAccount(connection, userTokenAccount),
        getMint(connection, mint),
      ]);

      const balance = Number(accountInfo.amount);
      const balanceFormatted = (balance / 10 ** mintInfo.decimals).toString();

      return {
        hasAccount: true,
        balance,
        balanceFormatted,
        decimals: mintInfo.decimals,
      };
    } catch (error) {
      // Account doesn't exist
      const mintInfo = await getMint(connection, mint);
      return {
        hasAccount: false,
        balance: 0,
        balanceFormatted: '0',
        decimals: mintInfo.decimals,
      };
    }
  } catch (error) {
    console.error(`Failed to get SPL token balance for ${mintAddress}:`, error);
    return null;
  }
}

/**
 * Format token amount for display
 * @param amount Raw token amount
 * @param decimals Token decimals
 * @param maxDecimals Maximum decimals to show
 * @returns Formatted amount string
 */
export function formatTokenAmount(
  amount: number,
  decimals: number,
  maxDecimals = 6
): string {
  const formattedAmount = amount / 10 ** decimals;

  if (formattedAmount === 0) {
    return '0';
  }

  if (formattedAmount < 0.000_001) {
    return '<0.000001';
  }

  return formattedAmount
    .toFixed(Math.min(maxDecimals, decimals))
    .replace(/\.?0+$/, '');
}

/**
 * Parse token amount from user input
 * @param input User input string
 * @param decimals Token decimals
 * @returns Raw token amount (smallest units)
 */
export function parseTokenAmount(input: string, decimals: number): number {
  const cleanInput = input.trim();
  if (!cleanInput || isNaN(Number(cleanInput))) {
    throw new Error('Invalid token amount');
  }

  const amount = Number.parseFloat(cleanInput);
  if (amount < 0) {
    throw new Error('Token amount must be positive');
  }

  return Math.floor(amount * 10 ** decimals);
}

/**
 * Estimate transaction fee for SPL token transfer
 * @param connection Solana connection
 * @param needsTokenAccountCreation Whether recipient needs token account creation
 * @returns Estimated fee in lamports
 */
export async function estimateSPLTokenTransferFee(
  connection: Connection,
  needsTokenAccountCreation = false
): Promise<number> {
  try {
    // Base transfer instruction fee
    let estimatedFee = 5000; // ~0.000005 SOL

    // Add fee for creating associated token account if needed
    if (needsTokenAccountCreation) {
      const rentExemption =
        await connection.getMinimumBalanceForRentExemption(165); // Token account size
      estimatedFee += rentExemption;
    }

    return estimatedFee;
  } catch (error) {
    // Fallback estimate
    return needsTokenAccountCreation ? 2_040_000 : 5000; // ~0.002 SOL or ~0.000005 SOL
  }
}
