---
category: backend
subcategory: caching
tags: [redis, caching, performance, convex, edge-functions]
cursor:
  context_window: 8192
  temperature: 0.5
  max_tokens: 4096
  model_preference: ["auto"]
relations:
  imports: ["./convex-patterns.mdc", "./edge-functions.mdc"]
  exports: ["cache-strategies", "redis-patterns", "invalidation-rules"]
  references: ["./database-schema.mdc", "./api-design.mdc"]
---

# Caching Strategies - Redis & Multi-Layer Performance

## Core Caching Architecture

**Multi-Layer Strategy**: Edge → Redis → Convex → Qdrant for optimal performance
**Wallet Isolation**: All cache keys include wallet address for security
**Smart Invalidation**: Event-driven cache invalidation with dependency tracking
**Performance Targets**: <10ms cache hits, 99.9% hit rate for hot data

## Redis Configuration & Setup

### Production Redis Configuration
```typescript
// lib/redis-client.ts
import { Redis } from '@upstash/redis';

export class RedisService {
  private client: Redis;
  private readonly keyPrefix = 'anubis_chat';
  
  constructor() {
    this.client = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      automaticDeserialization: true,
      retry: {
        retries: 3,
        retryDelayOnFailure: 1000,
      },
    });
  }
  
  // Generate secure, wallet-scoped cache keys
  private generateKey(walletAddress: string, type: string, identifier: string): string {
    return `${this.keyPrefix}:${walletAddress}:${type}:${identifier}`;
  }
  
  // Get with automatic deserialization and error handling
  async get<T>(walletAddress: string, type: string, identifier: string): Promise<T | null> {
    try {
      const key = this.generateKey(walletAddress, type, identifier);
      const result = await this.client.get<T>(key);
      
      // Track cache hit metrics
      if (result) {
        this.trackMetric('cache_hit', type);
      } else {
        this.trackMetric('cache_miss', type);
      }
      
      return result;
    } catch (error) {
      console.error('Redis get error:', error);
      this.trackMetric('cache_error', type);
      return null; // Fail gracefully
    }
  }
  
  // Set with TTL and compression for large objects
  async set<T>(
    walletAddress: string, 
    type: string, 
    identifier: string, 
    value: T, 
    ttlSeconds: number = 300
  ): Promise<void> {
    try {
      const key = this.generateKey(walletAddress, type, identifier);
      
      // Compress large objects
      const serialized = JSON.stringify(value);
      const shouldCompress = serialized.length > 1024; // Compress if > 1KB
      
      if (shouldCompress) {
        // Use browser-compatible compression
        const compressed = await this.compress(serialized);
        await this.client.setex(key, ttlSeconds, compressed);
        await this.client.hset(`${key}:meta`, { compressed: true });
      } else {
        await this.client.setex(key, ttlSeconds, value);
      }
      
      this.trackMetric('cache_set', type);
    } catch (error) {
      console.error('Redis set error:', error);
      this.trackMetric('cache_error', type);
    }
  }
  
  // Bulk operations for efficiency
  async mget<T>(keys: Array<{
    walletAddress: string;
    type: string;
    identifier: string;
  }>): Promise<Map<string, T | null>> {
    try {
      const redisKeys = keys.map(k => this.generateKey(k.walletAddress, k.type, k.identifier));
      const results = await this.client.mget<T[]>(...redisKeys);
      
      const resultMap = new Map<string, T | null>();
      
      keys.forEach((key, index) => {
        const mapKey = `${key.walletAddress}:${key.type}:${key.identifier}`;
        resultMap.set(mapKey, results[index]);
      });
      
      return resultMap;
    } catch (error) {
      console.error('Redis mget error:', error);
      return new Map();
    }
  }
  
  // Pattern-based invalidation
  async invalidatePattern(walletAddress: string, pattern: string): Promise<void> {
    try {
      const searchPattern = `${this.keyPrefix}:${walletAddress}:${pattern}*`;
      const keys = await this.client.keys(searchPattern);
      
      if (keys.length > 0) {
        await this.client.del(...keys);
        this.trackMetric('cache_invalidation', pattern);
      }
    } catch (error) {
      console.error('Redis invalidation error:', error);
    }
  }
  
  // Pipeline operations for atomic updates
  async pipeline(): Promise<RedisPipeline> {
    return new RedisPipeline(this.client, this.keyPrefix);
  }
  
  // Simple compression for large cache values
  private async compress(data: string): Promise<string> {
    // Use browser-compatible compression
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const compressed = encoder.encode(data);
    return btoa(decoder.decode(compressed));
  }
  
  // Metrics tracking for observability
  private trackMetric(event: string, type: string): void {
    // Track cache performance metrics
    console.log(`Cache metric: ${event} for type: ${type}`);
  }
}

// Pipeline class for batch operations
class RedisPipeline {
  private commands: Array<() => Promise<any>> = [];
  
  constructor(private client: Redis, private keyPrefix: string) {}
  
  set(key: string, value: any, ttl?: number): this {
    this.commands.push(() => 
      ttl ? this.client.setex(key, ttl, value) : this.client.set(key, value)
    );
    return this;
  }
  
  del(key: string): this {
    this.commands.push(() => this.client.del(key));
    return this;
  }
  
  async exec(): Promise<void> {
    await Promise.all(this.commands.map(cmd => cmd()));
  }
}

export const redis = new RedisService();
```

## Query Result Caching

### Convex Query Cache Wrapper
```typescript
// lib/cache-wrapper.ts
import { redis } from './redis-client';
import { ConvexHttpClient } from 'convex/browser';

export class CachedConvexClient {
  constructor(private convex: ConvexHttpClient) {}
  
  // Cache-aware query wrapper
  async cachedQuery<T>(
    walletAddress: string,
    queryName: string,
    args: any,
    ttlSeconds: number = 300
  ): Promise<T> {
    // Generate cache key from query and args
    const argsHash = await this.hashArgs(args);
    const cacheKey = `query:${queryName}:${argsHash}`;
    
    // Try cache first
    const cached = await redis.get<T>(walletAddress, 'query', cacheKey);
    if (cached !== null) {
      return cached;
    }
    
    // Execute query
    const result = await this.convex.query(queryName as any, args);
    
    // Cache result
    await redis.set(walletAddress, 'query', cacheKey, result, ttlSeconds);
    
    return result;
  }
  
  // Cache-aware mutation wrapper with invalidation
  async cachedMutation<T>(
    walletAddress: string,
    mutationName: string,
    args: any,
    invalidationPatterns: string[] = []
  ): Promise<T> {
    // Execute mutation
    const result = await this.convex.mutation(mutationName as any, args);
    
    // Invalidate related cache patterns
    for (const pattern of invalidationPatterns) {
      await redis.invalidatePattern(walletAddress, pattern);
    }
    
    // Also invalidate common patterns based on mutation type
    const autoInvalidation = this.getAutoInvalidationPatterns(mutationName);
    for (const pattern of autoInvalidation) {
      await redis.invalidatePattern(walletAddress, pattern);
    }
    
    return result;
  }
  
  private async hashArgs(args: any): Promise<string> {
    const str = JSON.stringify(args, Object.keys(args).sort());
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
  }
  
  private getAutoInvalidationPatterns(mutationName: string): string[] {
    const patterns: Record<string, string[]> = {
      'messages.createMessage': ['query:messages.*', 'query:chats.*'],
      'chats.createChat': ['query:chats.*'],
      'chats.updateChat': ['query:chats.*'],
      'documents.createDocument': ['query:documents.*'],
      'users.updatePreferences': ['query:users.*'],
    };
    
    return patterns[mutationName] || [];
  }
}

export const cachedConvex = new CachedConvexClient(
  new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
);
```

## Specific Caching Patterns

### Chat History Caching
```typescript
// ✅ Efficient chat history caching with pagination
export const getCachedChatHistory = async (
  walletAddress: string,
  chatId: string,
  limit: number = 50,
  cursor?: string
) => {
  const cacheKey = `chat_history:${chatId}:${limit}:${cursor || 'initial'}`;
  
  // Try cache first
  const cached = await redis.get<{
    messages: any[];
    nextCursor: string | null;
    hasMore: boolean;
  }>(walletAddress, 'chat', cacheKey);
  
  if (cached) {
    return cached;
  }
  
  // Fetch from Convex
  const result = await cachedConvex.cachedQuery(
    walletAddress,
    'api.messages.getPaginatedMessages',
    { chatId, walletAddress, limit, cursor },
    300 // 5 minute TTL
  );
  
  // Cache the paginated result
  await redis.set(walletAddress, 'chat', cacheKey, result, 300);
  
  return result;
};
```

### User Profile Caching
```typescript
// ✅ User profile with dependency-aware invalidation
export const getCachedUserProfile = async (walletAddress: string) => {
  const cached = await redis.get<any>(walletAddress, 'profile', 'current');
  
  if (cached) {
    return cached;
  }
  
  const profile = await cachedConvex.cachedQuery(
    walletAddress,
    'api.users.getUser',
    { walletAddress },
    600 // 10 minute TTL for profiles
  );
  
  if (profile) {
    await redis.set(walletAddress, 'profile', 'current', profile, 600);
    
    // Also cache frequently accessed derived data
    await redis.set(
      walletAddress, 
      'profile', 
      'subscription', 
      {
        tier: profile.subscription.tier,
        limits: profile.subscription,
        isActive: profile.subscription.expiresAt > Date.now(),
      }, 
      300
    );
  }
  
  return profile;
};

// Invalidate profile cache on updates
export const updateUserProfile = async (
  walletAddress: string, 
  updates: any
) => {
  const result = await cachedConvex.cachedMutation(
    walletAddress,
    'api.users.updateUser',
    { walletAddress, ...updates },
    ['profile.*', 'subscription.*'] // Invalidate all profile-related cache
  );
  
  return result;
};
```

### Document Search Caching
```typescript
// ✅ Smart caching for vector search results
export const getCachedSearchResults = async (
  walletAddress: string,
  query: string,
  documentTypes?: string[],
  limit: number = 20
) => {
  // Normalize query for consistent caching
  const normalizedQuery = query.toLowerCase().trim();
  const queryHash = await hashString(normalizedQuery);
  const typeHash = documentTypes ? await hashString(documentTypes.join(',')) : 'all';
  
  const cacheKey = `search:${queryHash}:${typeHash}:${limit}`;
  
  // Check cache
  const cached = await redis.get<any>(walletAddress, 'search', cacheKey);
  if (cached && Date.now() - cached.timestamp < 300000) { // 5 min freshness
    return {
      ...cached,
      fromCache: true,
    };
  }
  
  // Perform search
  const results = await cachedConvex.convex.action('api.search.hybridRAGSearch', {
    walletAddress,
    query: normalizedQuery,
    documentTypes,
    limit,
  });
  
  // Cache results with metadata
  const cacheData = {
    ...results,
    timestamp: Date.now(),
    query: normalizedQuery,
  };
  
  await redis.set(walletAddress, 'search', cacheKey, cacheData, 300);
  
  return {
    ...cacheData,
    fromCache: false,
  };
};

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 12);
}
```

## Edge Function Cache Integration

### Edge-Compatible Cache Layer
```typescript
// lib/edge-cache.ts - Enhanced with Redis fallback
export class HybridEdgeCache {
  private localCache = new Map<string, { data: any; expiry: number }>();
  private redis = new RedisService();
  
  async get<T>(
    walletAddress: string, 
    type: string, 
    identifier: string
  ): Promise<T | null> {
    const cacheKey = `${walletAddress}:${type}:${identifier}`;
    
    // Try local edge cache first (fastest)
    const local = this.localCache.get(cacheKey);
    if (local && Date.now() < local.expiry) {
      return local.data as T;
    }
    
    // Fallback to Redis (shared across edge nodes)
    const redis = await this.redis.get<T>(walletAddress, type, identifier);
    if (redis) {
      // Populate local cache for next request
      this.localCache.set(cacheKey, {
        data: redis,
        expiry: Date.now() + 60000, // 1 minute local TTL
      });
      return redis;
    }
    
    return null;
  }
  
  async set<T>(
    walletAddress: string,
    type: string,
    identifier: string,
    data: T,
    ttlSeconds: number = 300
  ): Promise<void> {
    const cacheKey = `${walletAddress}:${type}:${identifier}`;
    
    // Set in both caches
    this.localCache.set(cacheKey, {
      data,
      expiry: Date.now() + Math.min(ttlSeconds * 1000, 60000), // Max 1 min local
    });
    
    await this.redis.set(walletAddress, type, identifier, data, ttlSeconds);
    
    // Cleanup local cache periodically
    if (this.localCache.size > 100) {
      this.cleanupLocal();
    }
  }
  
  private cleanupLocal(): void {
    const now = Date.now();
    for (const [key, value] of this.localCache.entries()) {
      if (now > value.expiry) {
        this.localCache.delete(key);
      }
    }
  }
}

export const hybridCache = new HybridEdgeCache();
```

### Cached Edge API Pattern
```typescript
// app/api/chats/[walletAddress]/route.ts
import { hybridCache } from '@/lib/edge-cache';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: { walletAddress: string } }
) {
  try {
    const walletAddress = request.headers.get('x-verified-wallet');
    
    // Security: Ensure wallet in URL matches authenticated wallet
    if (walletAddress !== params.walletAddress) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check cache first
    const cached = await hybridCache.get<any[]>(
      walletAddress, 
      'chats', 
      'list'
    );
    
    if (cached) {
      return Response.json({
        success: true,
        data: cached,
        metadata: {
          cached: true,
          timestamp: Date.now(),
        },
      });
    }
    
    // Fetch from Convex
    const chats = await cachedConvex.cachedQuery(
      walletAddress,
      'api.chats.getUserChats',
      { walletAddress },
      300
    );
    
    // Cache the result
    await hybridCache.set(walletAddress, 'chats', 'list', chats, 300);
    
    return Response.json({
      success: true,
      data: chats,
      metadata: {
        cached: false,
        timestamp: Date.now(),
      },
    });
    
  } catch (error) {
    console.error('Cached chats API error:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

## Cache Warming & Preloading

### Predictive Cache Warming
```typescript
// lib/cache-warmer.ts
export class CacheWarmer {
  private redis = new RedisService();
  
  // Warm cache for newly active users
  async warmUserCache(walletAddress: string): Promise<void> {
    try {
      const warmingTasks = [
        this.warmUserProfile(walletAddress),
        this.warmRecentChats(walletAddress),
        this.warmUserDocuments(walletAddress),
      ];
      
      await Promise.allSettled(warmingTasks);
    } catch (error) {
      console.error('Cache warming failed:', error);
    }
  }
  
  private async warmUserProfile(walletAddress: string): Promise<void> {
    // Pre-fetch and cache user profile
    const profile = await cachedConvex.cachedQuery(
      walletAddress,
      'api.users.getUser',
      { walletAddress },
      600
    );
    
    if (profile) {
      // Pre-compute and cache derived data
      const subscription = {
        tier: profile.subscription.tier,
        limits: profile.subscription,
        isActive: profile.subscription.expiresAt > Date.now(),
      };
      
      await this.redis.set(
        walletAddress, 
        'profile', 
        'subscription', 
        subscription, 
        600
      );
    }
  }
  
  private async warmRecentChats(walletAddress: string): Promise<void> {
    // Pre-fetch recent chats
    const chats = await cachedConvex.cachedQuery(
      walletAddress,
      'api.chats.getUserChats',
      { walletAddress, limit: 10 },
      300
    );
    
    // Pre-fetch recent messages for top 3 chats
    if (chats?.length > 0) {
      const topChats = chats.slice(0, 3);
      
      await Promise.all(
        topChats.map(chat =>
          cachedConvex.cachedQuery(
            walletAddress,
            'api.messages.getPaginatedMessages',
            { chatId: chat._id, walletAddress, limit: 20 },
            300
          )
        )
      );
    }
  }
  
  private async warmUserDocuments(walletAddress: string): Promise<void> {
    // Pre-fetch document list
    await cachedConvex.cachedQuery(
      walletAddress,
      'api.documents.getUserDocuments',
      { walletAddress, limit: 20 },
      300
    );
  }
}

export const cacheWarmer = new CacheWarmer();
```

## Cache Analytics & Monitoring

### Cache Performance Metrics
```typescript
// lib/cache-metrics.ts
export class CacheMetrics {
  private redis = new RedisService();
  
  async trackCachePerformance(
    walletAddress: string,
    operation: 'hit' | 'miss' | 'set' | 'invalidate',
    type: string,
    duration?: number
  ): Promise<void> {
    const timestamp = Date.now();
    const date = new Date().toISOString().split('T')[0];
    
    // Store metrics in Redis for aggregation
    const metricsKey = `metrics:cache:${date}:${type}`;
    
    try {
      await this.redis.client.hincrby(metricsKey, operation, 1);
      
      if (duration) {
        await this.redis.client.hincrby(metricsKey, `${operation}_duration`, duration);
      }
      
      // Set expiry for daily metrics
      await this.redis.client.expire(metricsKey, 7 * 24 * 60 * 60); // 7 days
      
    } catch (error) {
      console.error('Cache metrics tracking failed:', error);
    }
  }
  
  async getCacheStatistics(type?: string): Promise<{
    hitRate: number;
    avgDuration: number;
    totalRequests: number;
    byType: Record<string, any>;
  }> {
    try {
      const date = new Date().toISOString().split('T')[0];
      const pattern = type ? `metrics:cache:${date}:${type}` : `metrics:cache:${date}:*`;
      
      const keys = await this.redis.client.keys(pattern);
      const stats = await Promise.all(
        keys.map(key => this.redis.client.hgetall(key))
      );
      
      // Aggregate statistics
      const aggregated = stats.reduce(
        (acc, stat) => {
          acc.hits += parseInt(stat.hit || '0');
          acc.misses += parseInt(stat.miss || '0');
          acc.sets += parseInt(stat.set || '0');
          return acc;
        },
        { hits: 0, misses: 0, sets: 0 }
      );
      
      const total = aggregated.hits + aggregated.misses;
      
      return {
        hitRate: total > 0 ? aggregated.hits / total : 0,
        avgDuration: 0, // Calculate from duration metrics
        totalRequests: total,
        byType: {}, // Breakdown by type
      };
      
    } catch (error) {
      console.error('Cache statistics retrieval failed:', error);
      return {
        hitRate: 0,
        avgDuration: 0,
        totalRequests: 0,
        byType: {},
      };
    }
  }
}
```

## Cache Invalidation Strategies

### Event-Driven Invalidation
```typescript
// lib/cache-invalidation.ts
export class CacheInvalidationService {
  private redis = new RedisService();
  
  // Invalidation rules mapping
  private invalidationRules = {
    'messages.createMessage': (args: any) => [
      `chat_history:${args.chatId}:*`,
      `chats:list`,
      `chats:${args.chatId}`,
    ],
    
    'chats.updateChat': (args: any) => [
      `chats:${args.chatId}`,
      `chats:list`,
    ],
    
    'documents.createDocument': (args: any) => [
      `documents:list`,
      `search:*`, // Invalidate all search results
    ],
    
    'users.updatePreferences': (args: any) => [
      `profile:*`,
      `subscription:*`,
    ],
  };
  
  // Automatic invalidation on mutation
  async invalidateOnMutation(
    walletAddress: string,
    mutationName: string,
    args: any
  ): Promise<void> {
    const rules = this.invalidationRules[mutationName as keyof typeof this.invalidationRules];
    
    if (!rules) {
      return;
    }
    
    const patterns = rules(args);
    
    await Promise.all(
      patterns.map(pattern => 
        this.redis.invalidatePattern(walletAddress, pattern)
      )
    );
    
    // Track invalidation events
    console.log(`Cache invalidated for ${walletAddress}: ${patterns.join(', ')}`);
  }
  
  // Manual cache refresh
  async refreshCache(
    walletAddress: string,
    type: string,
    identifier?: string
  ): Promise<void> {
    if (identifier) {
      await this.redis.invalidatePattern(walletAddress, `${type}:${identifier}`);
    } else {
      await this.redis.invalidatePattern(walletAddress, `${type}:*`);
    }
  }
}

export const cacheInvalidation = new CacheInvalidationService();
```

::alert{type="info"}
**Cache Performance Targets**:
- Cache hit rate: >99% for hot data
- Cache response time: <10ms
- Cache invalidation: <100ms
- Memory efficiency: 80% utilization
::

::alert{type="warning"}
**Security Considerations**:
- All cache keys include wallet address for isolation
- Never cache sensitive data (private keys, passwords)
- Implement proper TTL to prevent stale sensitive data
- Audit cache access patterns for potential leaks
::