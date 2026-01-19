import { cronJobs } from 'convex/server';
import { api } from './_generated/api';

const crons = cronJobs();

// Clean up expired token price cache entries every hour
crons.hourly(
  'cleanup-expired-token-prices',
  {
    minuteUTC: 0, // Run at the top of every hour
  },
  api.tokenPrices.cleanupExpiredPrices
);

export default crons;
