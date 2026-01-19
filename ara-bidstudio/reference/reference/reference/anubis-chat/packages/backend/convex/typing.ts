import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Store typing indicators in memory (ephemeral)
const typingUsers = new Map<
  string,
  { walletAddress: string; timestamp: number }
>();

// Set typing status
export const setTyping = mutation({
  args: {
    chatId: v.id('chats'),
    walletAddress: v.string(),
    isTyping: v.boolean(),
  },
  handler: (_ctx, args) => {
    const key = `${args.chatId}:${args.walletAddress}`;

    if (args.isTyping) {
      // Add or update typing indicator
      typingUsers.set(key, {
        walletAddress: args.walletAddress,
        timestamp: Date.now(),
      });
    } else {
      // Remove typing indicator
      typingUsers.delete(key);
    }

    // Clean up old typing indicators (older than 5 seconds)
    const now = Date.now();
    for (const [entryKey, val] of typingUsers.entries()) {
      if (now - val.timestamp > 5000) {
        typingUsers.delete(entryKey);
      }
    }

    return { success: true };
  },
});

// Get users currently typing in a chat
export const getTypingUsers = query({
  args: {
    chatId: v.id('chats'),
    excludeWallet: v.optional(v.string()),
  },
  handler: (_ctx, args) => {
    const typingInChat: string[] = [];
    const now = Date.now();

    // Find all users typing in this chat
    for (const [key, value] of typingUsers.entries()) {
      if (key.startsWith(`${args.chatId}:`)) {
        // Check if still valid (within 5 seconds)
        if (now - value.timestamp <= 5000) {
          // Exclude the requesting user
          if (value.walletAddress !== args.excludeWallet) {
            typingInChat.push(value.walletAddress);
          }
        } else {
          // Clean up expired indicator
          typingUsers.delete(key);
        }
      }
    }

    return typingInChat;
  },
});
