import { mutation } from './_generated/server';

// Ensure all users have complete subscription data
export const ensureCompleteSubscriptions = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect();
    let updatedCount = 0;

    await Promise.all(
      users.map(async (user) => {
        if (user.subscription) {
          // Check if subscription is missing any required fields
          const sub = user.subscription;
          let needsUpdate = false;
          const updates: Record<string, unknown> = { ...sub };

          // Ensure all required fields exist with proper defaults
          if (sub.tier === undefined) {
            updates.tier = 'free';
            needsUpdate = true;
          }
          if (
            sub.messagesUsed === undefined ||
            !Number.isFinite(sub.messagesUsed)
          ) {
            updates.messagesUsed = 0;
            needsUpdate = true;
          }
          if (
            sub.messagesLimit === undefined ||
            !Number.isFinite(sub.messagesLimit)
          ) {
            updates.messagesLimit = 50;
            needsUpdate = true;
          }
          if (
            sub.premiumMessagesUsed === undefined ||
            !Number.isFinite(sub.premiumMessagesUsed)
          ) {
            updates.premiumMessagesUsed = 0;
            needsUpdate = true;
          }
          if (
            sub.premiumMessagesLimit === undefined ||
            !Number.isFinite(sub.premiumMessagesLimit)
          ) {
            updates.premiumMessagesLimit = 0;
            needsUpdate = true;
          }
          if (!(sub.features && Array.isArray(sub.features))) {
            updates.features = ['basic_chat', 'limited_models'];
            needsUpdate = true;
          }
          if (sub.currentPeriodStart === undefined) {
            updates.currentPeriodStart = Date.now();
            needsUpdate = true;
          }
          if (sub.currentPeriodEnd === undefined) {
            updates.currentPeriodEnd = Date.now() + 30 * 24 * 60 * 60 * 1000;
            needsUpdate = true;
          }
          if (sub.subscriptionTxSignature === undefined) {
            updates.subscriptionTxSignature = '';
            needsUpdate = true;
          }
          if (sub.autoRenew === undefined) {
            updates.autoRenew = false;
            needsUpdate = true;
          }
          if (
            sub.planPriceSol === undefined ||
            !Number.isFinite(sub.planPriceSol)
          ) {
            updates.planPriceSol = 0;
            needsUpdate = true;
          }
          if (
            sub.tokensUsed === undefined ||
            !Number.isFinite(sub.tokensUsed)
          ) {
            updates.tokensUsed = 0;
            needsUpdate = true;
          }
          if (
            sub.tokensLimit === undefined ||
            !Number.isFinite(sub.tokensLimit)
          ) {
            updates.tokensLimit = 10_000;
            needsUpdate = true;
          }

          if (needsUpdate) {
            await ctx.db.patch(user._id, {
              subscription: updates as any, // Type assertion needed for complex migration logic
            });
            updatedCount++;
          }
        } else {
          // User has no subscription at all - create one
          const now = Date.now();
          await ctx.db.patch(user._id, {
            subscription: {
              tier: 'free',
              messagesUsed: 0,
              messagesLimit: 50,
              premiumMessagesUsed: 0,
              premiumMessagesLimit: 0,
              features: ['basic_chat', 'limited_models'],
              currentPeriodStart: now,
              currentPeriodEnd: now + 30 * 24 * 60 * 60 * 1000,
              subscriptionTxSignature: '',
              autoRenew: false,
              planPriceSol: 0,
              tokensUsed: 0,
              tokensLimit: 10_000,
            },
          });
          updatedCount++;
        }
      })
    );

    return {
      success: true,
      totalUsers: users.length,
      updatedUsers: updatedCount,
    };
  },
});
