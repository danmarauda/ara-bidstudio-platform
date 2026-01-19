import { mutation } from '../_generated/server';

/**
 * Migration to ensure users table has proper updatedAt field
 * This migration adds updatedAt to users that don't have it
 */
export const cleanupUsersTable = mutation({
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect();

    let updated = 0;
    const errors: string[] = [];

    await Promise.all(
      users.map(async (user) => {
        try {
          // Only update if user doesn't have updatedAt or if it needs normalization
          const needsUpdate =
            !('updatedAt' in user) || typeof user.updatedAt !== 'number';

          if (needsUpdate) {
            // Add updatedAt field with current timestamp
            await ctx.db.patch(user._id, {
              updatedAt: Date.now(),
            });
            updated++;
          }
        } catch (error) {
          errors.push(`Failed to update user ${user.walletAddress}: ${error}`);
        }
      })
    );

    return {
      success: errors.length === 0,
      message: `Updated ${updated} users that needed updatedAt field, ${errors.length} errors`,
      totalUsers: users.length,
      updated,
      errors,
    };
  },
});
