'use client';

import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { SolanaAgentKit } from 'solana-agent-kit';
import { useWallet } from '@/hooks/useWallet';
import { useAuthContext } from './auth-provider';

// Agent Types
export interface Agent {
  _id: Id<'agents'>;
  name: string;
  type: 'general' | 'trading' | 'defi' | 'nft' | 'dao' | 'portfolio' | 'custom';
  description: string;
  systemPrompt: string;
  capabilities: string[];
  model?: string;
  version?: string;
  temperature?: number;
  maxTokens?: number;
  config?: {
    rpcUrl?: string;
    priorityFee?: number;
    slippage?: number;
    gasBudget?: number;
  };
  isActive: boolean;
  isPublic: boolean;
  createdBy?: string;
  createdAt: number;
  updatedAt: number;
}

export interface BlockchainTransaction {
  _id: Id<'blockchainTransactions'>;
  chatId?: Id<'chats'>;
  messageId?: Id<'messages'>;
  agentId?: Id<'agents'>;
  userId: string;
  signature?: string;
  type:
    | 'transfer'
    | 'swap'
    | 'stake'
    | 'unstake'
    | 'lend'
    | 'borrow'
    | 'mint_nft'
    | 'buy_nft'
    | 'sell_nft'
    | 'vote'
    | 'create_token'
    | 'liquidity_add'
    | 'liquidity_remove'
    | 'other';
  operation: string;
  parameters: {
    amount?: string;
    tokenMint?: string;
    targetAddress?: string;
    slippage?: number;
    priority?: number;
  };
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled';
  errorMessage?: string;
  fee?: number;
  blockTime?: number;
  confirmations?: number;
  metadata?: {
    tokensBefore?: Array<{ mint: string; amount: string }>;
    tokensAfter?: Array<{ mint: string; amount: string }>;
    priceImpact?: number;
    executionTime?: number;
  };
  createdAt: number;
  updatedAt: number;
}

export interface ToolExecution {
  toolName: string;
  parameters?: any;
  category:
    | 'wallet'
    | 'trading'
    | 'defi'
    | 'nft'
    | 'governance'
    | 'social'
    | 'utility';
}

// Context Types
interface SolanaAgentContextType {
  // Agent Kit Instance
  agentKit: SolanaAgentKit | null;
  isInitialized: boolean;

  // Available Agents
  agents: Agent[] | null;
  selectedAgent: Agent | null;

  // Agent Management
  selectAgent: (agentId: string) => void;
  createCustomAgent: (config: Partial<Agent>) => Promise<string | null>;

  // Tool Execution
  executeTool: (execution: ToolExecution) => Promise<any>;

  // Transaction Management
  pendingTransactions: BlockchainTransaction[];
  recentTransactions: BlockchainTransaction[];

  // Utilities
  getBalance: () => Promise<number | null>;
  getTokenBalances: () => Promise<Array<{
    mint: string;
    amount: string;
  }> | null>;
  refreshData: () => void;

  // Error Handling
  error: string | null;
  clearError: () => void;
}

const SolanaAgentContext = createContext<SolanaAgentContextType | undefined>(
  undefined
);

interface SolanaAgentProviderProps {
  children: ReactNode;
}

/**
 * SolanaAgentProvider - Manages Solana Agent Kit integration
 * Provides access to blockchain operations and AI agents
 */
export function SolanaAgentProvider({ children }: SolanaAgentProviderProps) {
  const wallet = useWallet();
  const { user, isAuthenticated } = useAuthContext();
  const userWalletAddress = user?.walletAddress;
  const canQueryByUser = isAuthenticated && !!userWalletAddress;

  const [agentKit, setAgentKit] = useState<SolanaAgentKit | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch available agents
  const agents = useQuery(
    api.agents.list,
    canQueryByUser
      ? ({ includePublic: true, userId: userWalletAddress as string } as const)
      : 'skip'
  );

  // Fetch user's recent transactions
  const recentTransactions = useQuery(
    api.blockchainTransactions.listByUser,
    canQueryByUser
      ? ({ userId: userWalletAddress as string, limit: 10 } as const)
      : 'skip'
  ) as BlockchainTransaction[] | undefined;

  // Fetch pending transactions
  const pendingTransactions = useQuery(
    api.blockchainTransactions.listPending,
    canQueryByUser ? ({ userId: userWalletAddress as string } as const) : 'skip'
  ) as BlockchainTransaction[] | undefined;

  // Initialize Solana Agent Kit when wallet connects
  useEffect(() => {
    const initializeAgentKit = async () => {
      if (
        !(wallet.isConnected && wallet.publicKey && isAuthenticated && user)
      ) {
        setAgentKit(null);
        setIsInitialized(false);
        return;
      }

      try {
        // In production, the private key should NOT be stored on the frontend
        // Instead, the agent operations should be executed on the backend
        // For now, we'll create the kit without the private key and use it for read-only operations
        const _rpcUrl =
          process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
          process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'mainnet-beta'
            ? 'https://api.mainnet-beta.solana.com'
            : process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'testnet'
              ? 'https://api.testnet.solana.com'
              : 'https://api.devnet.solana.com';

        // Skip agent kit instantiation on the client for read-only operations
        // Server-side should handle transaction-capable agent actions
        setAgentKit(null);
        setIsInitialized(true);
        setError(null);
      } catch (_err) {
        setError('Failed to initialize blockchain agent');
        setIsInitialized(false);
      }
    };

    initializeAgentKit();
  }, [wallet.isConnected, wallet.publicKey, isAuthenticated, user]);

  // Auto-select first agent when available
  useEffect(() => {
    if (agents && agents.length > 0 && !selectedAgent) {
      const generalAgent =
        agents.find((agent: Agent) => agent.type === 'general') || agents[0];
      setSelectedAgent(generalAgent);
    }
  }, [agents, selectedAgent]);

  const selectAgent = useCallback(
    (agentId: string) => {
      const agent = agents?.find((a: Agent) => a._id === agentId);
      if (agent) {
        setSelectedAgent(agent);
      }
    },
    [agents]
  );

  const createCustomAgent = useCallback(
    async (_config: Partial<Agent>): Promise<string | null> => {
      if (!user) {
        return null;
      }

      try {
        return null;
      } catch (_err) {
        setError('Failed to create custom agent');
        return null;
      }
    },
    [user]
  );

  const executeTool = useCallback(
    async (execution: ToolExecution): Promise<any> => {
      if (!(agentKit && selectedAgent && wallet.isConnected)) {
        throw new Error(
          'Agent kit not initialized, no agent selected, or wallet not connected'
        );
      }
      // Execute the tool based on its name
      // This is a simplified example - you'd have a proper tool registry
      switch (execution.toolName) {
        case 'getBalance':
          // Use wallet balance since we have access to it
          return wallet.balance || 0;

        case 'getAddress':
          return wallet.publicKey;

        case 'getTokenBalances':
          // For now, return empty array - would need to implement token balance fetching
          return [];

        // Transaction-based tools should be executed server-side with proper security
        case 'deployToken':
        case 'transfer':
        case 'swap':
          throw new Error(
            `Tool '${execution.toolName}' requires server-side execution for security`
          );

        // Add more read-only tools as needed
        default:
          throw new Error(`Unknown tool: ${execution.toolName}`);
      }
    },
    [agentKit, selectedAgent, wallet]
  );

  const getBalance = useCallback(async (): Promise<number | null> => {
    if (!wallet.isConnected) {
      return null;
    }

    try {
      // Use the balance from the wallet hook
      await wallet.refreshBalance();
      return wallet.balance;
    } catch (_err) {
      setError('Failed to get wallet balance');
      return null;
    }
  }, [wallet]);

  const getTokenBalances = useCallback(async (): Promise<Array<{
    mint: string;
    amount: string;
  }> | null> => {
    if (!wallet.isConnected) {
      return null;
    }

    try {
      // For now, return empty array
      // In production, this would fetch token balances from the RPC
      // using the connection and wallet's public key
      return [];
    } catch (_err) {
      setError('Failed to get token balances');
      return null;
    }
  }, [wallet.isConnected]);

  const refreshData = useCallback(() => {}, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const contextValue: SolanaAgentContextType = {
    // Agent Kit Instance
    agentKit,
    isInitialized,

    // Available Agents
    agents: agents || null,
    selectedAgent,

    // Agent Management
    selectAgent,
    createCustomAgent,

    // Tool Execution
    executeTool,

    // Transaction Management
    pendingTransactions: pendingTransactions || [],
    recentTransactions: recentTransactions || [],

    // Utilities
    getBalance,
    getTokenBalances,
    refreshData,

    // Error Handling
    error,
    clearError,
  };

  return (
    <SolanaAgentContext.Provider value={contextValue}>
      {children}
    </SolanaAgentContext.Provider>
  );
}

/**
 * Hook to use Solana Agent context
 */
export function useSolanaAgent(): SolanaAgentContextType {
  const context = useContext(SolanaAgentContext);
  if (context === undefined) {
    throw new Error('useSolanaAgent must be used within a SolanaAgentProvider');
  }
  return context;
}

export default SolanaAgentProvider;
