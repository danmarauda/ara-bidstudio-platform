/**
 * Convex-specific caching utilities
 * Optimizes Convex queries and mutations with intelligent caching
 */

import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('convex-cache');

interface CachedQuery<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

interface QueryOptions {
  ttl?: number;
  force?: boolean;
  background?: boolean;
}

class ConvexCache {
  private queryCache = new Map<string, CachedQuery<any>>();
  private pendingQueries = new Map<string, Promise<any>>();
  private subscriptions = new Map<string, Set<(data: any) => void>>();

  /**
   * Cache a Convex query result
   */
  cacheQuery<T>(
    key: string,
    data: T,
    ttl = 60_000 // Default 1 minute
  ): void {
    this.queryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      key,
    });

    // Notify subscribers
    const subscribers = this.subscriptions.get(key);
    if (subscribers) {
      for (const callback of subscribers) {
        callback(data);
      }
    }
  }

  /**
   * Get cached query result
   */
  getCachedQuery<T>(key: string): T | null {
    const cached = this.queryCache.get(key);

    if (!cached) {
      return null;
    }

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.queryCache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Execute query with caching
   */
  async queryWithCache<T>(
    key: string,
    queryFn: () => Promise<T>,
    options: QueryOptions = {}
  ): Promise<T> {
    const { ttl = 60_000, force = false, background = false } = options;

    // Return cached if valid and not forced
    if (!force) {
      const cached = this.getCachedQuery<T>(key);
      if (cached !== null) {
        log.debug(`Cache hit for ${key}`);

        // Background refresh if needed
        if (background) {
          this.backgroundRefresh(key, queryFn, ttl);
        }

        return cached;
      }
    }

    // Check if query is already pending (deduplication)
    const pending = this.pendingQueries.get(key);
    if (pending) {
      log.debug(`Reusing pending query for ${key}`);
      return pending;
    }

    // Execute query
    const queryPromise = queryFn();
    this.pendingQueries.set(key, queryPromise);

    try {
      const result = await queryPromise;
      this.cacheQuery(key, result, ttl);
      log.debug(`Cached result for ${key}`);
      return result;
    } finally {
      this.pendingQueries.delete(key);
    }
  }

  /**
   * Invalidate specific cache entries
   */
  invalidate(pattern: string | RegExp): void {
    const keys = Array.from(this.queryCache.keys());

    for (const key of keys) {
      if (typeof pattern === 'string') {
        if (key.includes(pattern)) {
          this.queryCache.delete(key);
          log.debug(`Invalidated cache for ${key}`);
        }
      } else if (pattern.test(key)) {
        this.queryCache.delete(key);
        log.debug(`Invalidated cache for ${key}`);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.queryCache.clear();
    this.pendingQueries.clear();
    this.subscriptions.clear();
    log.debug('All cache cleared');
  }

  /**
   * Subscribe to cache updates
   */
  subscribe(key: string, callback: (data: any) => void): () => void {
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }

    this.subscriptions.get(key)?.add(callback);

    // Return unsubscribe function
    return () => {
      const subscribers = this.subscriptions.get(key);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscriptions.delete(key);
        }
      }
    };
  }

  /**
   * Background refresh
   */
  private async backgroundRefresh<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl: number
  ): Promise<void> {
    try {
      const result = await queryFn();
      this.cacheQuery(key, result, ttl);
      log.debug(`Background refresh completed for ${key}`);
    } catch (error) {
      log.error(`Background refresh failed for ${key}`, { error });
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const stats = {
      totalEntries: this.queryCache.size,
      pendingQueries: this.pendingQueries.size,
      subscriptions: this.subscriptions.size,
      memoryUsage: 0,
      oldestEntry: null as Date | null,
      newestEntry: null as Date | null,
    };

    let oldest = Number.POSITIVE_INFINITY;
    let newest = 0;

    for (const entry of this.queryCache.values()) {
      // Rough memory estimation
      stats.memoryUsage += JSON.stringify(entry.data).length;

      if (entry.timestamp < oldest) {
        oldest = entry.timestamp;
      }
      if (entry.timestamp > newest) {
        newest = entry.timestamp;
      }
    }

    if (oldest !== Number.POSITIVE_INFINITY) {
      stats.oldestEntry = new Date(oldest);
    }
    if (newest !== 0) {
      stats.newestEntry = new Date(newest);
    }

    return stats;
  }

  /**
   * Optimize cache by removing expired entries
   */
  optimize(): void {
    const now = Date.now();
    let removed = 0;

    this.queryCache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        this.queryCache.delete(key);
        removed++;
      }
    });

    if (removed > 0) {
      log.debug(`Removed ${removed} expired cache entries`);
    }
  }
}

// Export singleton instance
export const convexCache = new ConvexCache();

// Helper functions for common Convex queries
export const cachedQueries = {
  /**
   * Get user with caching
   */
  getUser: async (
    walletAddress: string,
    queryFn: () => Promise<any>,
    ttl = 300_000 // 5 minutes
  ) => {
    const key = `user:${walletAddress}`;
    return convexCache.queryWithCache(key, queryFn, { ttl });
  },

  /**
   * Get chats with caching
   */
  getChats: async (
    ownerId: string,
    queryFn: () => Promise<any>,
    ttl = 60_000 // 1 minute
  ) => {
    const key = `chats:${ownerId}`;
    return convexCache.queryWithCache(key, queryFn, { ttl });
  },

  /**
   * Get messages with caching
   */
  getMessages: async (
    chatId: string,
    queryFn: () => Promise<any>,
    ttl = 30_000 // 30 seconds
  ) => {
    const key = `messages:${chatId}`;
    return convexCache.queryWithCache(key, queryFn, { ttl });
  },

  /**
   * Invalidate user-related caches
   */
  invalidateUser: (walletAddress: string) => {
    convexCache.invalidate(`user:${walletAddress}`);
    convexCache.invalidate(`chats:${walletAddress}`);
  },

  /**
   * Invalidate chat-related caches
   */
  invalidateChat: (chatId: string) => {
    convexCache.invalidate(`messages:${chatId}`);
  },
};

// Auto-optimize cache every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(
    () => {
      convexCache.optimize();
    },
    5 * 60 * 1000
  );
}
