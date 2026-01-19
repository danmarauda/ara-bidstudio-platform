import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Rate a message (like or dislike)
 */
export const rateMessage = mutation({
  args: {
    messageId: v.id('messages'),
    rating: v.union(v.literal('like'), v.literal('dislike')),
    walletAddress: v.string(),
  },
  handler: async (ctx, { messageId, rating, walletAddress }) => {
    // Get the message
    const message = await ctx.db.get(messageId);
    if (!message) {
      throw new ConvexError('Message not found');
    }

    // Only allow rating assistant messages
    if (message.role !== 'assistant') {
      throw new ConvexError('Can only rate assistant messages');
    }

    // Update the message with the rating
    await ctx.db.patch(messageId, {
      rating: {
        userRating: rating,
        ratedAt: Date.now(),
        ratedBy: walletAddress,
      },
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Remove rating from a message
 */
export const removeRating = mutation({
  args: {
    messageId: v.id('messages'),
    walletAddress: v.string(),
  },
  handler: async (ctx, { messageId, walletAddress }) => {
    // Get the message
    const message = await ctx.db.get(messageId);
    if (!message) {
      throw new ConvexError('Message not found');
    }

    // Check if user rated this message
    if (!message.rating || message.rating.ratedBy !== walletAddress) {
      throw new ConvexError('No rating found for this user');
    }

    // Remove the rating
    await ctx.db.patch(messageId, {
      rating: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Track message actions (copy, share, regenerate)
 */
export const trackMessageAction = mutation({
  args: {
    messageId: v.id('messages'),
    action: v.union(
      v.literal('copy'),
      v.literal('share'),
      v.literal('regenerate')
    ),
  },
  handler: async (ctx, { messageId, action }) => {
    // Get the current message
    const message = await ctx.db.get(messageId);
    if (!message) {
      throw new ConvexError('Message not found');
    }

    // Get current actions or initialize
    const currentActions = message.actions || {
      copiedCount: 0,
      sharedCount: 0,
      regeneratedCount: 0,
    };

    // Increment the appropriate counter
    const updatedActions = {
      ...currentActions,
      lastActionAt: Date.now(),
    };

    switch (action) {
      case 'copy':
        updatedActions.copiedCount = (currentActions.copiedCount || 0) + 1;
        break;
      case 'share':
        updatedActions.sharedCount = (currentActions.sharedCount || 0) + 1;
        break;
      case 'regenerate':
        updatedActions.regeneratedCount =
          (currentActions.regeneratedCount || 0) + 1;
        break;
    }

    // Update the message
    await ctx.db.patch(messageId, {
      actions: updatedActions,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get message rating by user
 */
export const getMessageRating = query({
  args: {
    messageId: v.id('messages'),
    walletAddress: v.string(),
  },
  handler: async (ctx, { messageId, walletAddress }) => {
    const message = await ctx.db.get(messageId);
    if (!message) {
      return null;
    }

    // Return rating if it exists and belongs to this user
    if (message.rating && message.rating.ratedBy === walletAddress) {
      return message.rating;
    }

    return null;
  },
});

/**
 * Get message stats (ratings, actions)
 */
export const getMessageStats = query({
  args: {
    messageId: v.id('messages'),
  },
  handler: async (ctx, { messageId }) => {
    const message = await ctx.db.get(messageId);
    if (!message) {
      return null;
    }

    return {
      rating: message.rating || null,
      actions: message.actions || {
        copiedCount: 0,
        sharedCount: 0,
        regeneratedCount: 0,
      },
    };
  },
});
