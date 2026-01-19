---
category: web3
subcategory: transactions
tags: [transactions, solana, error-handling, retry, confirmation]
cursor:
  context_window: 8192
  temperature: 0.3
  max_tokens: 4096
  model_preference: ["auto"]
relations:
  imports: ["./rpc-optimization.mdc"]
  exports: ["transaction-patterns", "error-recovery"]
  references: ["./smart-contracts.mdc"]
---

# Transaction Handling & Error Recovery

## Transaction Lifecycle Management

### 1. Transaction Builder with Optimization
```typescript
import { 
  Transaction, 
  SystemProgram, 
  ComputeBudgetProgram,
  PublicKey,
  TransactionInstruction,
  Connection,
  SendOptions
} from '@solana/web3.js';
import { AnchorWallet } from '@solana/wallet-adapter-react';

export class OptimizedTransactionBuilder {
  private instructions: TransactionInstruction[] = [];
  private connection: Connection;
  private wallet: AnchorWallet;
  private priorityFee: number = 0;
  private computeUnitLimit: number = 200000;

  constructor(connection: Connection, wallet: AnchorWallet) {
    this.connection = connection;
    this.wallet = wallet;
  }

  public addInstruction(instruction: TransactionInstruction): this {
    this.instructions.push(instruction);
    return this;
  }

  public setPriorityFee(microLamports: number): this {
    this.priorityFee = microLamports;
    return this;
  }

  public setComputeUnitLimit(units: number): this {
    this.computeUnitLimit = units;
    return this;
  }

  public async build(): Promise<Transaction> {
    const transaction = new Transaction();

    // Add compute budget instructions if specified
    if (this.priorityFee > 0) {
      transaction.add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: this.priorityFee
        })
      );
    }

    if (this.computeUnitLimit !== 200000) {
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: this.computeUnitLimit
        })
      );
    }

    // Add all instructions
    transaction.add(...this.instructions);

    // Set recent blockhash and fee payer
    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = this.wallet.publicKey;

    return transaction;
  }

  public async estimateComputeUnits(): Promise<number> {
    try {
      const transaction = await this.build();
      
      // Simulate transaction to get compute unit usage
      const simulationResult = await this.connection.simulateTransaction(transaction);
      
      if (simulationResult.value.err) {
        console.warn('Transaction simulation failed:', simulationResult.value.err);
        return this.computeUnitLimit;
      }

      const computeUnitsUsed = simulationResult.value.unitsConsumed || 200000;
      
      // Add 20% buffer for safety
      return Math.ceil(computeUnitsUsed * 1.2);
    } catch (error) {
      console.error('Failed to estimate compute units:', error);
      return this.computeUnitLimit;
    }
  }

  public async estimateOptimalPriorityFee(): Promise<number> {
    try {
      // Get recent priority fees from successful transactions
      const recentPriorityFees = await this.connection.getRecentPrioritizationFees();
      
      if (recentPriorityFees.length === 0) {
        return 0;
      }

      // Calculate 75th percentile for competitive fees
      const sortedFees = recentPriorityFees
        .map(fee => fee.prioritizationFee)
        .sort((a, b) => a - b);
      
      const percentile75Index = Math.floor(sortedFees.length * 0.75);
      return sortedFees[percentile75Index];
      
    } catch (error) {
      console.error('Failed to estimate priority fee:', error);
      return 0;
    }
  }
}
```

### 2. Advanced Transaction Sender
```typescript
export interface TransactionOptions {
  maxRetries?: number;
  retryDelay?: number;
  skipPreflight?: boolean;
  preflightCommitment?: Commitment;
  maxSupportedTransactionVersion?: number;
  minContextSlot?: number;
}

export interface TransactionResult {
  signature: string;
  blockhash: string;
  lastValidBlockHeight: number;
  confirmationStatus: TransactionConfirmationStatus;
  slot?: number;
  err?: TransactionError | null;
}

export class AdvancedTransactionSender {
  private connection: Connection;
  private wallet: AnchorWallet;
  private metricsCollector?: RPCMetricsCollector;

  constructor(
    connection: Connection, 
    wallet: AnchorWallet,
    metricsCollector?: RPCMetricsCollector
  ) {
    this.connection = connection;
    this.wallet = wallet;
    this.metricsCollector = metricsCollector;
  }

  public async sendAndConfirmTransaction(
    transaction: Transaction,
    options: TransactionOptions = {}
  ): Promise<TransactionResult> {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      skipPreflight = false,
      preflightCommitment = 'confirmed'
    } = options;

    const sendOptions: SendOptions = {
      skipPreflight,
      preflightCommitment,
      maxRetries: 0 // We handle retries ourselves
    };

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const startTime = Date.now();
      
      try {
        // Sign transaction
        const signedTransaction = await this.wallet.signTransaction(transaction);
        
        // Send transaction
        const signature = await this.connection.sendRawTransaction(
          signedTransaction.serialize(),
          sendOptions
        );

        // Confirm transaction
        const confirmationResult = await this.confirmTransactionWithTimeout(
          signature,
          transaction.recentBlockhash!,
          30000 // 30 second timeout
        );

        const duration = Date.now() - startTime;
        
        // Record success metric
        this.metricsCollector?.recordMetric({
          provider: 'transaction-sender',
          method: 'sendAndConfirm',
          duration,
          success: true,
          timestamp: Date.now()
        });

        return {
          signature,
          blockhash: transaction.recentBlockhash!,
          lastValidBlockHeight: confirmationResult.context.lastValidBlockHeight,
          confirmationStatus: confirmationResult.value.confirmationStatus!,
          slot: confirmationResult.context.slot,
          err: confirmationResult.value.err
        };

      } catch (error) {
        lastError = error as Error;
        const duration = Date.now() - startTime;
        
        // Record error metric
        this.metricsCollector?.recordMetric({
          provider: 'transaction-sender',
          method: 'sendAndConfirm',
          duration,
          success: false,
          error: lastError.message,
          timestamp: Date.now()
        });

        console.warn(`Transaction attempt ${attempt} failed:`, error);

        // Check if we should retry
        if (!this.shouldRetryTransaction(error as Error) || attempt === maxRetries) {
          break;
        }

        // Exponential backoff with jitter
        const delay = retryDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));

        // Refresh blockhash for retry
        try {
          const { blockhash } = await this.connection.getLatestBlockhash();
          transaction.recentBlockhash = blockhash;
        } catch (refreshError) {
          console.warn('Failed to refresh blockhash:', refreshError);
        }
      }
    }

    throw lastError || new Error('Transaction failed after all retries');
  }

  private async confirmTransactionWithTimeout(
    signature: string,
    blockhash: string,
    timeoutMs: number = 30000
  ): Promise<RpcResponseAndContext<SignatureResult>> {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Transaction confirmation timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      const checkConfirmation = async () => {
        try {
          const result = await this.connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight: await this.getLastValidBlockHeight()
          });

          if (result.value.err) {
            clearTimeout(timeout);
            resolve(result);
            return;
          }

          if (result.value.confirmationStatus === 'confirmed' || 
              result.value.confirmationStatus === 'finalized') {
            clearTimeout(timeout);
            resolve(result);
            return;
          }

          // Continue checking if still within timeout
          if (Date.now() - startTime < timeoutMs) {
            setTimeout(checkConfirmation, 1000);
          } else {
            clearTimeout(timeout);
            reject(new Error('Transaction confirmation timeout'));
          }
        } catch (error) {
          if (Date.now() - startTime < timeoutMs) {
            setTimeout(checkConfirmation, 1000);
          } else {
            clearTimeout(timeout);
            reject(error);
          }
        }
      };

      checkConfirmation();
    });
  }

  private shouldRetryTransaction(error: Error): boolean {
    const retryableErrors = [
      'blockhash not found',
      'block height exceeded',
      'node is behind',
      'network error',
      'timeout',
      'rate limit',
      'insufficient funds for rent'
    ];

    const nonRetryableErrors = [
      'user rejected',
      'insufficient funds',
      'invalid account',
      'custom program error',
      'already processed'
    ];

    const errorMessage = error.message.toLowerCase();

    // Don't retry explicit non-retryable errors
    if (nonRetryableErrors.some(err => errorMessage.includes(err))) {
      return false;
    }

    // Retry known retryable errors
    if (retryableErrors.some(err => errorMessage.includes(err))) {
      return true;
    }

    // Default to not retrying unknown errors
    return false;
  }

  private async getLastValidBlockHeight(): Promise<number> {
    const { lastValidBlockHeight } = await this.connection.getLatestBlockhash();
    return lastValidBlockHeight;
  }
}
```

### 3. Transaction Status Tracking
```typescript
export enum TransactionState {
  PENDING = 'pending',
  CONFIRMING = 'confirming',
  CONFIRMED = 'confirmed',
  FINALIZED = 'finalized',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

export interface TrackedTransaction {
  signature: string;
  blockhash: string;
  lastValidBlockHeight: number;
  state: TransactionState;
  createdAt: number;
  confirmedAt?: number;
  error?: string;
  retryCount: number;
}

export class TransactionTracker {
  private transactions: Map<string, TrackedTransaction> = new Map();
  private connection: Connection;
  private eventEmitter = new EventEmitter();

  constructor(connection: Connection) {
    this.connection = connection;
    this.startPolling();
  }

  public trackTransaction(
    signature: string,
    blockhash: string,
    lastValidBlockHeight: number
  ): void {
    this.transactions.set(signature, {
      signature,
      blockhash,
      lastValidBlockHeight,
      state: TransactionState.PENDING,
      createdAt: Date.now(),
      retryCount: 0
    });

    this.eventEmitter.emit('transaction-added', signature);
  }

  public getTransaction(signature: string): TrackedTransaction | null {
    return this.transactions.get(signature) || null;
  }

  public getAllPendingTransactions(): TrackedTransaction[] {
    return Array.from(this.transactions.values()).filter(
      tx => tx.state === TransactionState.PENDING || tx.state === TransactionState.CONFIRMING
    );
  }

  public removeTransaction(signature: string): void {
    this.transactions.delete(signature);
    this.eventEmitter.emit('transaction-removed', signature);
  }

  public on(event: string, callback: (...args: any[]) => void): void {
    this.eventEmitter.on(event, callback);
  }

  public off(event: string, callback: (...args: any[]) => void): void {
    this.eventEmitter.off(event, callback);
  }

  private async startPolling(): Promise<void> {
    setInterval(async () => {
      await this.checkPendingTransactions();
    }, 5000); // Check every 5 seconds
  }

  private async checkPendingTransactions(): Promise<void> {
    const pendingTransactions = this.getAllPendingTransactions();
    
    if (pendingTransactions.length === 0) {
      return;
    }

    try {
      const signatures = pendingTransactions.map(tx => tx.signature);
      const statuses = await this.connection.getSignatureStatuses(signatures);

      for (let i = 0; i < signatures.length; i++) {
        const signature = signatures[i];
        const status = statuses.value[i];
        const transaction = this.transactions.get(signature)!;

        if (!status) {
          // Check if transaction has expired
          const currentBlockHeight = await this.connection.getBlockHeight();
          if (currentBlockHeight > transaction.lastValidBlockHeight) {
            transaction.state = TransactionState.EXPIRED;
            this.eventEmitter.emit('transaction-expired', signature);
          }
          continue;
        }

        if (status.err) {
          transaction.state = TransactionState.FAILED;
          transaction.error = JSON.stringify(status.err);
          this.eventEmitter.emit('transaction-failed', signature, status.err);
        } else {
          const confirmationStatus = status.confirmationStatus;
          
          if (confirmationStatus === 'processed') {
            transaction.state = TransactionState.CONFIRMING;
          } else if (confirmationStatus === 'confirmed') {
            transaction.state = TransactionState.CONFIRMED;
            transaction.confirmedAt = Date.now();
            this.eventEmitter.emit('transaction-confirmed', signature);
          } else if (confirmationStatus === 'finalized') {
            transaction.state = TransactionState.FINALIZED;
            transaction.confirmedAt = Date.now();
            this.eventEmitter.emit('transaction-finalized', signature);
          }
        }
      }
    } catch (error) {
      console.error('Failed to check transaction statuses:', error);
    }
  }
}
```

## Error Classification & Recovery

### 1. Error Classification System
```typescript
export enum TransactionErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  BLOCKHASH_EXPIRED = 'BLOCKHASH_EXPIRED',
  USER_REJECTED = 'USER_REJECTED',
  PROGRAM_ERROR = 'PROGRAM_ERROR',
  ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',
  INVALID_INSTRUCTION = 'INVALID_INSTRUCTION',
  RATE_LIMITED = 'RATE_LIMITED',
  SIMULATION_FAILED = 'SIMULATION_FAILED',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

export interface ClassifiedError {
  type: TransactionErrorType;
  message: string;
  retryable: boolean;
  suggestedDelay?: number;
  recovery?: () => Promise<void>;
}

export class TransactionErrorClassifier {
  public static classify(error: any): ClassifiedError {
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code;

    // Network-related errors
    if (errorMessage.includes('network') || 
        errorMessage.includes('connection') || 
        errorCode === 'NETWORK_ERROR') {
      return {
        type: TransactionErrorType.NETWORK_ERROR,
        message: error.message,
        retryable: true,
        suggestedDelay: 2000
      };
    }

    // Insufficient funds
    if (errorMessage.includes('insufficient funds') || 
        errorMessage.includes('not enough')) {
      return {
        type: TransactionErrorType.INSUFFICIENT_FUNDS,
        message: error.message,
        retryable: false
      };
    }

    // Blockhash expired
    if (errorMessage.includes('blockhash not found') || 
        errorMessage.includes('block height exceeded')) {
      return {
        type: TransactionErrorType.BLOCKHASH_EXPIRED,
        message: error.message,
        retryable: true,
        suggestedDelay: 1000,
        recovery: async () => {
          // Recovery will refresh blockhash
        }
      };
    }

    // User rejected
    if (errorMessage.includes('user rejected') || 
        errorMessage.includes('user denied')) {
      return {
        type: TransactionErrorType.USER_REJECTED,
        message: error.message,
        retryable: false
      };
    }

    // Program errors
    if (errorMessage.includes('custom program error') || 
        errorMessage.includes('program error')) {
      return {
        type: TransactionErrorType.PROGRAM_ERROR,
        message: error.message,
        retryable: false
      };
    }

    // Rate limiting
    if (errorMessage.includes('rate limit') || 
        errorMessage.includes('too many requests')) {
      return {
        type: TransactionErrorType.RATE_LIMITED,
        message: error.message,
        retryable: true,
        suggestedDelay: 5000
      };
    }

    // Timeout
    if (errorMessage.includes('timeout') || 
        errorCode === 'TIMEOUT') {
      return {
        type: TransactionErrorType.TIMEOUT,
        message: error.message,
        retryable: true,
        suggestedDelay: 1000
      };
    }

    // Default classification
    return {
      type: TransactionErrorType.UNKNOWN,
      message: error.message,
      retryable: false
    };
  }

  public static getRecoveryStrategy(
    errorType: TransactionErrorType
  ): (() => Promise<void>) | null {
    switch (errorType) {
      case TransactionErrorType.BLOCKHASH_EXPIRED:
        return async () => {
          // Refresh blockhash will be handled by the transaction sender
        };
      
      case TransactionErrorType.RATE_LIMITED:
        return async () => {
          // Wait longer before retry
          await new Promise(resolve => setTimeout(resolve, 10000));
        };
      
      default:
        return null;
    }
  }
}
```

### 2. Recovery Strategies
```typescript
export interface RecoveryContext {
  originalTransaction: Transaction;
  error: ClassifiedError;
  retryCount: number;
  wallet: AnchorWallet;
  connection: Connection;
}

export class TransactionRecoveryManager {
  public static async recoverFromError(
    context: RecoveryContext
  ): Promise<Transaction> {
    const { originalTransaction, error, retryCount, connection } = context;

    switch (error.type) {
      case TransactionErrorType.BLOCKHASH_EXPIRED:
        return this.refreshBlockhash(originalTransaction, connection);
      
      case TransactionErrorType.INSUFFICIENT_FUNDS:
        throw new Error('Cannot recover from insufficient funds');
      
      case TransactionErrorType.RATE_LIMITED:
        // Reduce priority fee if set to lower cost
        return this.reducePriorityFee(originalTransaction);
      
      case TransactionErrorType.SIMULATION_FAILED:
        return this.increaseComputeLimit(originalTransaction);
      
      default:
        // For unknown errors, just refresh blockhash
        return this.refreshBlockhash(originalTransaction, connection);
    }
  }

  private static async refreshBlockhash(
    transaction: Transaction,
    connection: Connection
  ): Promise<Transaction> {
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    return transaction;
  }

  private static reducePriorityFee(transaction: Transaction): Transaction {
    // Find and reduce compute budget instructions
    transaction.instructions.forEach((instruction, index) => {
      if (instruction.programId.equals(ComputeBudgetProgram.programId)) {
        // This is a simplified approach - in practice, you'd need to 
        // parse the instruction data to identify and modify priority fees
        console.log('Reducing priority fee for retry');
      }
    });
    
    return transaction;
  }

  private static increaseComputeLimit(transaction: Transaction): Transaction {
    // Add or modify compute unit limit instruction
    const hasComputeLimit = transaction.instructions.some(
      instruction => instruction.programId.equals(ComputeBudgetProgram.programId)
    );

    if (!hasComputeLimit) {
      transaction.instructions.unshift(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: 400000 // Double the default
        })
      );
    }

    return transaction;
  }
}
```

## Transaction Analytics

### 1. Performance Metrics
```typescript
export interface TransactionMetrics {
  signature: string;
  txType: string;
  startTime: number;
  endTime?: number;
  confirmationTime?: number;
  retryCount: number;
  finalState: TransactionState;
  error?: string;
  gasUsed?: number;
  priorityFee?: number;
}

export class TransactionAnalytics {
  private metrics: TransactionMetrics[] = [];
  private readonly MAX_METRICS = 5000;

  public recordTransactionStart(
    signature: string,
    txType: string,
    priorityFee?: number
  ): void {
    this.metrics.push({
      signature,
      txType,
      startTime: Date.now(),
      retryCount: 0,
      finalState: TransactionState.PENDING,
      priorityFee
    });
  }

  public recordTransactionEnd(
    signature: string,
    finalState: TransactionState,
    error?: string,
    gasUsed?: number
  ): void {
    const metric = this.metrics.find(m => m.signature === signature);
    if (metric) {
      metric.endTime = Date.now();
      metric.finalState = finalState;
      metric.error = error;
      metric.gasUsed = gasUsed;
    }
  }

  public recordTransactionConfirmed(signature: string): void {
    const metric = this.metrics.find(m => m.signature === signature);
    if (metric) {
      metric.confirmationTime = Date.now();
    }
  }

  public getSuccessRate(timeWindow = 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(
      m => m.endTime && (now - m.startTime) <= timeWindow
    );

    if (recentMetrics.length === 0) return 0;

    const successfulTx = recentMetrics.filter(
      m => m.finalState === TransactionState.CONFIRMED || 
           m.finalState === TransactionState.FINALIZED
    );

    return successfulTx.length / recentMetrics.length;
  }

  public getAverageConfirmationTime(timeWindow = 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    const confirmedMetrics = this.metrics.filter(
      m => m.confirmationTime && (now - m.startTime) <= timeWindow
    );

    if (confirmedMetrics.length === 0) return 0;

    const totalTime = confirmedMetrics.reduce(
      (sum, m) => sum + (m.confirmationTime! - m.startTime), 
      0
    );

    return totalTime / confirmedMetrics.length;
  }

  public getErrorBreakdown(timeWindow = 24 * 60 * 60 * 1000): Record<string, number> {
    const now = Date.now();
    const failedMetrics = this.metrics.filter(
      m => m.finalState === TransactionState.FAILED && 
           (now - m.startTime) <= timeWindow
    );

    const errorCounts: Record<string, number> = {};
    
    failedMetrics.forEach(m => {
      if (m.error) {
        const errorType = TransactionErrorClassifier.classify({ message: m.error }).type;
        errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
      }
    });

    return errorCounts;
  }
}
```