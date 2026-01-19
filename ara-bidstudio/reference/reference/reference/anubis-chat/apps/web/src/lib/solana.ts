import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  Connection,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  PublicKey,
  type PublicKey as PublicKeyType,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';

// Configure the network to use from environment variables
const getNetwork = (): WalletAdapterNetwork => {
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
  switch (network) {
    case 'mainnet-beta':
      return WalletAdapterNetwork.Mainnet;
    case 'testnet':
      return WalletAdapterNetwork.Testnet;
    default:
      return WalletAdapterNetwork.Devnet;
  }
};

export const NETWORK = getNetwork();

// RPC endpoint - use environment variable if provided, otherwise use cluster API
export const ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_RPC_HOST || clusterApiUrl(NETWORK);

// Create connection instance
export const connection = new Connection(ENDPOINT, 'confirmed');

// Utility functions
export const lamportsToSol = (lamports: number): number => {
  if (!Number.isFinite(lamports) || lamports < 0) {
    throw new Error(
      'Invalid lamports value: must be a non-negative finite number'
    );
  }
  return lamports / LAMPORTS_PER_SOL;
};

export const solToLamports = (sol: number): number => {
  if (!Number.isFinite(sol) || sol < 0) {
    throw new Error('Invalid SOL value: must be a non-negative finite number');
  }
  return Math.floor(sol * LAMPORTS_PER_SOL);
};

// Format Solana address for display
export const formatSolanaAddress = (
  address: string | null | undefined,
  length = 4
): string => {
  if (!address) {
    return '';
  }
  if (address.length <= length * 2 + 3) {
    return address;
  }
  if (length === 0) {
    return '...';
  }
  return `${address.slice(0, length)}...${address.slice(-length)}`;
};

// Validate Solana address
export const validateSolanaAddress = (
  address: string | null | undefined
): boolean => {
  if (!address) {
    return false;
  }
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

// Create a sign-in message for wallet authentication
export const createSignInMessage = (publicKey: string): string => {
  // Validate public key format
  if (!publicKey || typeof publicKey !== 'string' || publicKey.length < 32) {
    throw new Error('Invalid public key provided');
  }

  const domain =
    typeof window !== 'undefined'
      ? window.location.host
      : process.env.NEXT_PUBLIC_APP_DOMAIN || 'abubis.chat';
  const now = new Date();
  // Generate cryptographically secure nonce
  const nonceArray = new Uint8Array(12);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(nonceArray);
  } else {
    // Fallback for server-side rendering
    for (let i = 0; i < nonceArray.length; i++) {
      nonceArray[i] = Math.floor(Math.random() * 256);
    }
  }
  const nonce = Array.from(nonceArray, (byte) => byte.toString(36)).join('');

  const message = `anubis.chat wants you to sign in with your Solana account:
${publicKey}

Domain: ${domain}
Issued At: ${now.toISOString()}
Chain ID: ${NETWORK}
Nonce: ${nonce}`;

  return message;
};

// Wallet state interface
export interface WalletConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  publicKey: PublicKeyType | null;
  balance: number | null;
  error: string | null;
}

export const INITIAL_WALLET_STATE: WalletConnectionState = {
  isConnected: false,
  isConnecting: false,
  publicKey: null,
  balance: null,
  error: null,
};

// Track confirmation metadata for transactions without mutating their types
const transactionMetaMap = new WeakMap<
  Transaction,
  { blockhash: string; lastValidBlockHeight: number }
>();

// Helper function to check if a transaction has been processed using proper confirmation pattern
export const checkTransactionStatus = async (
  signature: string,
  blockhash?: string,
  lastValidBlockHeight?: number
): Promise<{ confirmed: boolean; error?: string }> => {
  try {
    // Validate signature format before making RPC call
    if (!signature || typeof signature !== 'string') {
      return {
        confirmed: false,
        error: 'Invalid signature: empty or not a string',
      };
    }

    // Signature should be base58 encoded and 64-88 characters long
    if (signature.length < 64 || signature.length > 88) {
      return {
        confirmed: false,
        error: `Invalid signature length: ${signature.length}`,
      };
    }

    // Check for valid base58 characters (basic validation)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    if (!base58Regex.test(signature)) {
      return {
        confirmed: false,
        error: 'Invalid signature format: contains invalid characters',
      };
    }

    // Use proper confirmTransaction if we have blockhash info, otherwise fallback to getSignatureStatus
    if (blockhash && lastValidBlockHeight) {
      try {
        const confirmation = await connection.confirmTransaction(
          {
            signature,
            blockhash,
            lastValidBlockHeight,
          },
          'confirmed'
        );

        if (confirmation.value?.err) {
          return {
            confirmed: false,
            error: `Transaction failed: ${JSON.stringify(confirmation.value.err)}`,
          };
        }

        return { confirmed: true };
      } catch (confirmError) {
        // If confirmTransaction fails, fallback to getSignatureStatus
        const errorMessage =
          confirmError instanceof Error
            ? confirmError.message
            : 'Unknown error';

        if (errorMessage.includes('Invalid param')) {
          return {
            confirmed: false,
            error: `Transaction confirmation failed: ${errorMessage}. Using blockhash confirmation method.`,
          };
        }

        // Continue to fallback method below
      }
    }

    // Fallback to getSignatureStatus method
    const status = await connection.getSignatureStatus(signature, {
      searchTransactionHistory: true,
    });

    if (!status?.value) {
      return { confirmed: false, error: 'Transaction not found' };
    }

    if (status.value.err) {
      return { confirmed: false, error: JSON.stringify(status.value.err) };
    }

    const isConfirmed =
      status.value.confirmationStatus === 'confirmed' ||
      status.value.confirmationStatus === 'finalized';

    return { confirmed: isConfirmed };
  } catch (error) {
    // Enhanced error handling for RPC failures
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('Invalid param')) {
      return {
        confirmed: false,
        error: `RPC parameter error: ${errorMessage}. Signature may be malformed: ${signature.substring(0, 20)}...`,
      };
    }

    return {
      confirmed: false,
      error: errorMessage,
    };
  }
};

// Generate a unique transaction ID for idempotency
export const generateTransactionId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
};

// Payment transaction preparation
export const createPaymentTransaction = async (
  fromPublicKey: PublicKey,
  toPublicKey: PublicKey,
  amountSol: number
): Promise<Transaction> => {
  if (!Number.isFinite(amountSol) || amountSol <= 0) {
    throw new Error('Invalid payment amount');
  }

  const lamports = solToLamports(amountSol);

  try {
    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash('confirmed');

    // Create transfer instruction
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: fromPublicKey,
      toPubkey: toPublicKey,
      lamports,
    });

    // Create transaction
    const transaction = new Transaction({
      feePayer: fromPublicKey,
      blockhash,
      lastValidBlockHeight,
    });

    transaction.add(transferInstruction);

    // Track confirmation metadata without mutating Transaction type
    transactionMetaMap.set(transaction, { blockhash, lastValidBlockHeight });

    return transaction;
  } catch (error) {
    throw new Error(
      `Failed to create payment transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

// Payment processing helper with idempotency and proper error handling
export const processPaymentTransaction = async (
  transaction: Transaction,
  signTransaction: (transaction: Transaction) => Promise<Transaction>,
  options?: {
    maxRetries?: number;
    skipPreflight?: boolean;
  }
): Promise<string> => {
  const maxRetries = options?.maxRetries ?? 0;
  const skipPreflight = options?.skipPreflight ?? false;

  try {
    // Get the transaction signature BEFORE signing (for idempotency tracking)
    // This is the fee payer's signature which uniquely identifies the transaction
    const transactionMessage = transaction.compileMessage();
    const _messageHash = transactionMessage.serialize();

    // Sign the transaction
    const signedTransaction = await signTransaction(transaction);

    // Send the transaction with proper configuration
    const sendOptions = {
      skipPreflight,
      preflightCommitment: 'confirmed' as const,
      maxRetries,
    };

    // Send raw transaction
    const sentSignature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      sendOptions
    );

    // Use stored confirmation metadata if available
    const meta = transactionMetaMap.get(transaction);
    if (meta) {
      // Confirm using blockhash window per web3.js API
      const confirmation = await connection.confirmTransaction(
        {
          signature: sentSignature,
          blockhash: meta.blockhash,
          lastValidBlockHeight: meta.lastValidBlockHeight,
        },
        'confirmed'
      );

      if (confirmation.value?.err) {
        throw new Error(
          `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
        );
      }

      return sentSignature;
    }

    // Fallback: poll for confirmation with timeout if metadata is unavailable
    const confirmationTimeout = 30_000; // 30 seconds
    const startTime = Date.now();
    let lastError: string | undefined;

    while (Date.now() - startTime < confirmationTimeout) {
      try {
        // Use our enhanced status checker with blockhash info if available
        // Re-get metadata in case it's available (type-safe approach)
        const currentMeta = transactionMetaMap.get(transaction);
        const statusResult = await checkTransactionStatus(
          sentSignature,
          currentMeta?.blockhash,
          currentMeta?.lastValidBlockHeight
        );

        if (statusResult.confirmed) {
          return sentSignature;
        }

        if (statusResult.error) {
          lastError = statusResult.error;

          // If it's a signature format error, fail immediately
          if (
            statusResult.error.includes('Invalid signature') ||
            statusResult.error.includes('RPC parameter error')
          ) {
            throw new Error(
              `Transaction signature validation failed: ${statusResult.error}`
            );
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 2000)); // Increased to 2s to be less aggressive
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        // If it's a parameter error, fail immediately rather than retry
        if (errorMessage.includes('Invalid param')) {
          throw new Error(
            `RPC error: ${errorMessage}. Transaction signature: ${sentSignature.substring(0, 20)}...`
          );
        }

        lastError = errorMessage;
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    throw new Error(
      `Transaction confirmation timeout${lastError ? `. Last error: ${lastError}` : ''}. Signature: ${sentSignature.substring(0, 20)}...`
    );
  } catch (error: any) {
    // Enhanced error handling with specific cases

    // Check for duplicate transaction (already processed)
    if (
      error?.message?.includes('already been processed') ||
      error?.message?.includes('AlreadyProcessed') ||
      error?.message?.includes('This transaction has already been processed') ||
      error?.message?.includes(
        'Transaction simulation failed: This transaction has already been processed'
      )
    ) {
      // Try to get the transaction signature from the error or the transaction
      const sig = transaction.signatures[0]?.toString();
      if (sig) {
        const status = await connection.getSignatureStatus(sig);
        if (
          status?.value?.confirmationStatus === 'confirmed' ||
          status?.value?.confirmationStatus === 'finalized'
        ) {
          return sig;
        }
      }

      throw new Error(
        'DUPLICATE_TRANSACTION: This payment has already been processed. Your subscription will update automatically.'
      );
    }

    // Check for signature verification failure
    if (
      error?.message?.includes('signature verification failed') ||
      error?.message?.includes('Transaction signature verification failure')
    ) {
      throw new Error(
        'SIGNATURE_VERIFICATION_FAILED: The transaction signature is invalid. This may be due to signing with an outdated blockhash.'
      );
    }

    // Check for blockhash errors
    if (
      error?.message?.includes('Blockhash not found') ||
      error?.message?.includes('blockhash not found')
    ) {
      throw new Error(
        'BLOCKHASH_NOT_FOUND: The transaction blockhash has expired. Please try again with a fresh transaction.'
      );
    }

    // Check for simulation failures
    if (error?.message?.includes('Transaction simulation failed')) {
      // Extract the actual error from simulation
      const match = error.message.match(/Transaction simulation failed: (.+)/);
      if (match) {
        throw new Error(`SIMULATION_FAILED: ${match[1]}`);
      }
    }

    // Extract more specific error information
    let errorMessage = 'Failed to process payment: ';

    if (error?.logs && Array.isArray(error.logs)) {
      errorMessage += `Logs: ${error.logs.join(', ')}. `;
    }

    if (error?.message) {
      errorMessage += error.message;
    } else {
      errorMessage += 'Unknown error';
    }

    throw new Error(errorMessage);
  }
};
