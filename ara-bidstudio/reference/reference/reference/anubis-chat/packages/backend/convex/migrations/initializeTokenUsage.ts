/**
 * Migration to initialize tokenUsage field for existing chats
 * Run this once to add the tokenUsage field to all existing chats
 */

import { v } from 'convex/values';
import { mutation } from '../_generated/server';

export const initializeTokenUsage = mutation({
  args: {},
  handler: async (ctx) => {
    const chats = await ctx.db.query('chats').collect();

    let updatedCount = 0;

    for (const chat of chats) {
      // Only update chats that don't have tokenUsage field
      if (!chat.tokenUsage) {
        await ctx.db.patch(chat._id, {
          tokenUsage: {
            totalPromptTokens: 0,
            totalCompletionTokens: 0,
            totalTokens: 0,
            totalCachedTokens: 0,
            totalEstimatedCost: 0,
            messageCount: 0,
          },
        });
        updatedCount++;
      }
    }

    return {
      success: true,
      message: `Initialized tokenUsage for ${updatedCount} chats`,
      totalChats: chats.length,
      updatedChats: updatedCount,
    };
  },
});

/**
 * Query to check migration status
 */
export const checkMigrationStatus = mutation({
  args: {},
  handler: async (ctx) => {
    const chats = await ctx.db.query('chats').collect();

    const chatsWithTokenUsage = chats.filter(
      (chat) => chat.tokenUsage !== undefined
    );
    const chatsWithoutTokenUsage = chats.filter(
      (chat) => chat.tokenUsage === undefined
    );

    return {
      totalChats: chats.length,
      withTokenUsage: chatsWithTokenUsage.length,
      withoutTokenUsage: chatsWithoutTokenUsage.length,
      migrationComplete: chatsWithoutTokenUsage.length === 0,
      pendingChatIds: chatsWithoutTokenUsage.map((chat) => chat._id),
    };
  },
});
