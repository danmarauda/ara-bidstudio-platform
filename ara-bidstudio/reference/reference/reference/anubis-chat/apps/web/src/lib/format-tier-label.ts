export type SubscriptionTier = 'free' | 'pro' | 'pro_plus' | 'admin';

export const formatTierLabel = (tier?: string): string => {
  if (!tier) {
    return '';
  }
  const map: Record<string, string> = {
    free: 'Free',
    pro: 'Pro',
    pro_plus: 'Pro+',
    admin: 'Admin',
  };
  if (tier in map) {
    return map[tier];
  }
  // Fallback: Humanize unknown tiers like experimental_beta → Experimental Beta
  return tier
    .split('_')
    .map((part) =>
      part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : part
    )
    .join(' ');
};
