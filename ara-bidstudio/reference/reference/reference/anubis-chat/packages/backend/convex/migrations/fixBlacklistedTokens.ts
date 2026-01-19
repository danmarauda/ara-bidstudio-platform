import { mutation } from '../_generated/server';

/**
 * Migration to fix blacklistedTokens table
 * Maps old field names to new schema
 */
export const fixBlacklistedTokens = mutation({
  handler: async (ctx) => {
    const tokens = await ctx.db.query('blacklistedTokens').collect();

    let updated = 0;
    const errors: string[] = [];

    await Promise.all(
      tokens.map(async (token) => {
        try {
          // Check if token needs migration
          if (!('createdAt' in token) && 'blacklistedAt' in token) {
            // Map old fields to new schema
            await ctx.db.patch(token._id, {
              createdAt:
                ((token as Record<string, unknown>).blacklistedAt as
                  | number
                  | undefined) || Date.now(),
              token:
                ((token as Record<string, unknown>).tokenId as
                  | string
                  | undefined) ||
                ((token as Record<string, unknown>).token as
                  | string
                  | undefined) ||
                'unknown',
            });
            updated++;
          } else if (!('token' in token) && 'tokenId' in token) {
            // Just fix the token field
            await ctx.db.patch(token._id, {
              token: (token as Record<string, unknown>).tokenId as string,
            });
            updated++;
          }
        } catch (error) {
          errors.push(`Failed to update token ${token._id}: ${error}`);
        }
      })
    );

    return {
      success: errors.length === 0,
      message: `Updated ${updated} tokens, ${errors.length} errors`,
      totalTokens: tokens.length,
      updated,
      errors,
    };
  },
});
