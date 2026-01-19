/**
 * Cleanup script to remove all public agents except Anubis
 * This will keep only one active Anubis agent and deactivate all others
 */

import { mutation } from './_generated/server';

export const cleanupDuplicateAgents = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all public agents
    const publicAgents = await ctx.db
      .query('agents')
      .withIndex('by_public', (q) => q.eq('isPublic', true))
      .collect();

    // Find the main Anubis agent (the one that's active)
    const anubisAgents = publicAgents.filter(
      (agent) => agent.name === 'Anubis' && agent.isActive
    );
    const mainAnubis = anubisAgents.length > 0 ? anubisAgents[0] : null;

    if (!mainAnubis) {
      return 'No active Anubis agent found';
    }

    // Deactivate all other public agents
    const others = publicAgents.filter((a) => a._id !== mainAnubis._id);
    await Promise.all(
      others.map((agent) =>
        ctx.db.patch(agent._id, { isActive: false, updatedAt: Date.now() })
      )
    );
    const deactivatedCount = others.length;

    return `Cleanup complete: Kept 1 Anubis agent, deactivated ${deactivatedCount} other agents`;
  },
});

export const removeInactivePublicAgents = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all inactive public agents
    const inactiveAgents = await ctx.db
      .query('agents')
      .withIndex('by_public', (q) => q.eq('isPublic', true))
      .filter((q) => q.eq(q.field('isActive'), false))
      .collect();

    // Delete all inactive public agents
    await Promise.all(inactiveAgents.map((agent) => ctx.db.delete(agent._id)));
    const deletedCount = inactiveAgents.length;

    return `Deleted ${deletedCount} inactive public agents`;
  },
});
