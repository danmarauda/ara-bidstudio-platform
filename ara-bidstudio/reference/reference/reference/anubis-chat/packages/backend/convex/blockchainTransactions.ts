import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Create a new blockchain transaction record
 */
export const create = mutation({
  args: {
    chatId: v.optional(v.id('chats')),
    messageId: v.optional(v.id('messages')),
    agentId: v.optional(v.id('agents')),
    userId: v.string(), // walletAddress
    type: v.union(
      v.literal('transfer'),
      v.literal('swap'),
      v.literal('stake'),
      v.literal('unstake'),
      v.literal('lend'),
      v.literal('borrow'),
      v.literal('mint_nft'),
      v.literal('buy_nft'),
      v.literal('sell_nft'),
      v.literal('vote'),
      v.literal('create_token'),
      v.literal('liquidity_add'),
      v.literal('liquidity_remove'),
      v.literal('other')
    ),
    operation: v.string(),
    parameters: v.object({
      amount: v.optional(v.string()),
      tokenMint: v.optional(v.string()),
      targetAddress: v.optional(v.string()),
      slippage: v.optional(v.number()),
      priority: v.optional(v.number()),
    }),
    signature: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal('pending'),
        v.literal('confirmed'),
        v.literal('failed'),
        v.literal('cancelled')
      )
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const transactionId = await ctx.db.insert('blockchainTransactions', {
      ...args,
      status: args.status ?? 'pending',
      createdAt: now,
      updatedAt: now,
    });

    return transactionId;
  },
});

/**
 * Update transaction status and details
 */
export const updateStatus = mutation({
  args: {
    id: v.id('blockchainTransactions'),
    signature: v.optional(v.string()),
    status: v.union(
      v.literal('pending'),
      v.literal('confirmed'),
      v.literal('failed'),
      v.literal('cancelled')
    ),
    errorMessage: v.optional(v.string()),
    fee: v.optional(v.number()),
    blockTime: v.optional(v.number()),
    confirmations: v.optional(v.number()),
    metadata: v.optional(
      v.object({
        tokensBefore: v.optional(
          v.array(
            v.object({
              mint: v.string(),
              amount: v.string(),
            })
          )
        ),
        tokensAfter: v.optional(
          v.array(
            v.object({
              mint: v.string(),
              amount: v.string(),
            })
          )
        ),
        priceImpact: v.optional(v.number()),
        executionTime: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

/**
 * Get transaction by ID
 */
export const get = query({
  args: { id: v.id('blockchainTransactions') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get transaction by signature
 */
export const getBySignature = query({
  args: { signature: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('blockchainTransactions')
      .withIndex('by_signature', (q) => q.eq('signature', args.signature))
      .first();
  },
});

/**
 * List transactions for a user
 */
export const listByUser = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal('pending'),
        v.literal('confirmed'),
        v.literal('failed'),
        v.literal('cancelled')
      )
    ),
  },
  handler: async (ctx, args) => {
    let dbQuery = ctx.db
      .query('blockchainTransactions')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc');

    if (args.status) {
      dbQuery = dbQuery.filter((q) => q.eq(q.field('status'), args.status));
    }

    // Take and collect must be done together
    if (args.limit) {
      return await dbQuery.take(args.limit);
    }
    return await dbQuery.collect();
  },
});

/**
 * List pending transactions for a user
 */
export const listPending = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('blockchainTransactions')
      .withIndex('by_status', (q) => q.eq('status', 'pending'))
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .order('desc')
      .collect();
  },
});

/**
 * List transactions by type
 */
export const listByType = query({
  args: {
    type: v.union(
      v.literal('transfer'),
      v.literal('swap'),
      v.literal('stake'),
      v.literal('unstake'),
      v.literal('lend'),
      v.literal('borrow'),
      v.literal('mint_nft'),
      v.literal('buy_nft'),
      v.literal('sell_nft'),
      v.literal('vote'),
      v.literal('create_token'),
      v.literal('liquidity_add'),
      v.literal('liquidity_remove'),
      v.literal('other')
    ),
    userId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let dbQuery = ctx.db
      .query('blockchainTransactions')
      .withIndex('by_type', (q) => q.eq('type', args.type))
      .order('desc');

    if (args.userId) {
      dbQuery = dbQuery.filter((q) => q.eq(q.field('userId'), args.userId));
    }

    // Take and collect must be done together
    if (args.limit) {
      return await dbQuery.take(args.limit);
    }
    return await dbQuery.collect();
  },
});

/**
 * Get transaction statistics for a user
 */
export const getStats = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query('blockchainTransactions')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    const stats = {
      total: transactions.length,
      confirmed: transactions.filter((t) => t.status === 'confirmed').length,
      pending: transactions.filter((t) => t.status === 'pending').length,
      failed: transactions.filter((t) => t.status === 'failed').length,
      totalFees: transactions
        .filter((t) => t.status === 'confirmed' && t.fee)
        .reduce((sum, t) => sum + (t.fee || 0), 0),
      byType: {} as Record<string, number>,
    };

    // Count by type
    for (const t of transactions) {
      stats.byType[t.type] = (stats.byType[t.type] || 0) + 1;
    }

    return stats;
  },
});

/**
 * Cancel a pending transaction
 */
export const cancel = mutation({
  args: {
    id: v.id('blockchainTransactions'),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.id);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.userId !== args.userId) {
      throw new Error('Not authorized to cancel this transaction');
    }

    if (transaction.status !== 'pending') {
      throw new Error('Can only cancel pending transactions');
    }

    await ctx.db.patch(args.id, {
      status: 'cancelled',
      updatedAt: Date.now(),
    });

    return args.id;
  },
});
