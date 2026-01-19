/**
 * Migration to optimize Anubis agent token usage
 * Reduces system prompt from ~570 tokens to ~140 tokens (75% reduction)
 */

import { mutation } from '../_generated/server';
import {
  ANUBIS_OPTIMIZED_PROMPT,
  anubisAgent,
} from '../lib/agents/anubisAgent';

export const optimizeAnubisTokenUsage = mutation({
  args: {},
  handler: async (ctx) => {
    // Find the existing Anubis agent
    const existingAnubis = await ctx.db
      .query('agents')
      .withIndex('by_public', (q) => q.eq('isPublic', true))
      .filter((q) => q.eq(q.field('name'), 'Anubis'))
      .unique();

    if (!existingAnubis) {
      console.log(
        'Anubis agent not found - may need to run initializeDefaults first'
      );
      return {
        success: false,
        message: 'Anubis agent not found',
      };
    }

    // Check if already optimized
    if (existingAnubis.systemPrompt.includes('IDENTITY:')) {
      console.log('Anubis agent already optimized');
      return {
        success: true,
        message: 'Anubis agent already optimized',
        tokensSaved: 0,
      };
    }

    // Calculate token savings (rough estimate)
    const oldTokenCount = Math.ceil(existingAnubis.systemPrompt.length / 4);
    const newTokenCount = Math.ceil(ANUBIS_OPTIMIZED_PROMPT.length / 4);
    const tokensSaved = oldTokenCount - newTokenCount;

    // Update with optimized prompt and reduced max tokens
    await ctx.db.patch(existingAnubis._id, {
      systemPrompt: ANUBIS_OPTIMIZED_PROMPT,
      maxTokens: anubisAgent.maxTokens,
      updatedAt: Date.now(),
    });

    // Find all chats using Anubis agent
    const chatsWithAnubis = await ctx.db
      .query('chats')
      .filter((q) => q.eq(q.field('agentId'), existingAnubis._id))
      .collect();

    // Update all chats with the optimized prompt
    let updatedChats = 0;
    for (const chat of chatsWithAnubis) {
      // Only update if using the old prompt
      if (chat.agentPrompt && !chat.agentPrompt.includes('IDENTITY:')) {
        await ctx.db.patch(chat._id, {
          agentPrompt: ANUBIS_OPTIMIZED_PROMPT,
          maxTokens: Math.min(chat.maxTokens || 4000, anubisAgent.maxTokens),
          updatedAt: Date.now(),
        });
        updatedChats++;
      }
    }

    console.log(`Migration complete:
      - Anubis agent optimized
      - Tokens saved per message: ~${tokensSaved}
      - Chats updated: ${updatedChats}
      - Estimated cost reduction: 75%
    `);

    return {
      success: true,
      message: 'Anubis agent optimized successfully',
      tokensSaved,
      chatsUpdated: updatedChats,
    };
  },
});

export default optimizeAnubisTokenUsage;
