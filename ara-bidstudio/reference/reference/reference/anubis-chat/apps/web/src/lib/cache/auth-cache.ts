/**
 * Authentication Cache System
 * Provides efficient caching for authentication state with multiple storage layers
 */

import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('auth-cache');

export interface AuthCacheData {
  user: {
    walletAddress: string;
    publicKey?: string;
    username?: string;
    email?: string;
    avatar?: string;
  } | null;
  token: string | null;
  refreshToken?: string | null;
  expiresAt: number;
  isAuthenticated: boolean;
  lastVerified: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  storage?: 'memory' | 'session' | 'local' | 'all';
  encrypt?: boolean;
}

class AuthCache {
  private memoryCache: Map<string, AuthCacheData> = new Map();
  private readonly CACHE_KEY = 'anubis_auth_cache';
  private readonly SECURE_CACHE_KEY = 'anubis_auth_secure';
  private readonly DEFAULT_TTL = 1000 * 60 * 60; // 1 hour
  private readonly REFRESH_THRESHOLD = 1000 * 60 * 5; // 5 minutes before expiry

  /**
   * Get cached authentication data
   */
  get(options: CacheOptions = {}): AuthCacheData | null {
    const { storage = 'all' } = options;

    // Check memory cache first (fastest)
    const memoryData = this.getFromMemory();
    if (memoryData && this.isValid(memoryData)) {
      log.debug('Auth cache hit (memory)');
      return memoryData;
    }

    // Check session storage
    if (storage === 'session' || storage === 'all') {
      const sessionData = this.getFromSession();
      if (sessionData && this.isValid(sessionData)) {
        log.debug('Auth cache hit (session)');
        // Update memory cache
        this.memoryCache.set(this.CACHE_KEY, sessionData);
        return sessionData;
      }
    }

    // Check local storage (persistent)
    if (storage === 'local' || storage === 'all') {
      const localData = this.getFromLocal();
      if (localData && this.isValid(localData)) {
        log.debug('Auth cache hit (local)');
        // Update faster caches
        this.memoryCache.set(this.CACHE_KEY, localData);
        this.setToSession(localData);
        return localData;
      }
    }

    log.debug('Auth cache miss');
    return null;
  }

  /**
   * Set authentication data in cache
   */
  set(data: AuthCacheData, options: CacheOptions = {}): void {
    const {
      ttl = this.DEFAULT_TTL,
      storage = 'all',
      encrypt = false,
    } = options;

    // Add expiration
    const cacheData: AuthCacheData = {
      ...data,
      expiresAt: Date.now() + ttl,
      lastVerified: Date.now(),
    };

    // Store in memory (always)
    this.memoryCache.set(this.CACHE_KEY, cacheData);

    // Store in session storage
    if (storage === 'session' || storage === 'all') {
      this.setToSession(cacheData, encrypt);
    }

    // Store in local storage (persistent)
    if (storage === 'local' || storage === 'all') {
      this.setToLocal(cacheData, encrypt);
    }

    log.debug('Auth cache updated', { storage, ttl });
  }

  /**
   * Clear all cached authentication data
   */
  clear(): void {
    // Clear memory cache
    this.memoryCache.clear();

    // Clear session storage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.CACHE_KEY);
      sessionStorage.removeItem(this.SECURE_CACHE_KEY);
    }

    // Clear local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.CACHE_KEY);
      localStorage.removeItem(this.SECURE_CACHE_KEY);
    }

    log.debug('Auth cache cleared');
  }

  /**
   * Check if cached data needs refresh
   */
  needsRefresh(data?: AuthCacheData | null): boolean {
    if (!data) {
      data = this.get();
    }

    if (!data) {
      return true;
    }

    const now = Date.now();
    const timeUntilExpiry = data.expiresAt - now;

    // Refresh if expired or within threshold
    return timeUntilExpiry <= this.REFRESH_THRESHOLD;
  }

  /**
   * Update specific fields in cache
   */
  update(updates: Partial<AuthCacheData>, options: CacheOptions = {}): void {
    const current = this.get();
    if (!current) {
      return;
    }

    const updated = {
      ...current,
      ...updates,
      lastVerified: Date.now(),
    };

    this.set(updated, options);
  }

  /**
   * Validate token without full authentication
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      // Quick validation - check if token exists and has proper format
      if (!token || typeof token !== 'string') {
        return false;
      }

      // Check if it's a JWT token
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }

      // Decode and check expiration
      try {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          return false;
        }
      } catch {
        return false;
      }

      return true;
    } catch (error) {
      log.error('Token validation failed', { error });
      return false;
    }
  }

  // Private methods

  private isValid(data: AuthCacheData): boolean {
    if (!data) {
      return false;
    }

    // Check expiration
    if (data.expiresAt && data.expiresAt < Date.now()) {
      log.debug('Auth cache expired');
      return false;
    }

    // Validate required fields
    if (!(data.isAuthenticated && data.user?.walletAddress)) {
      return false;
    }

    // Validate token if present
    if (data.token && !this.validateToken(data.token)) {
      return false;
    }

    return true;
  }

  private getFromMemory(): AuthCacheData | null {
    return this.memoryCache.get(this.CACHE_KEY) || null;
  }

  private getFromSession(): AuthCacheData | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const data = sessionStorage.getItem(this.CACHE_KEY);
      if (!data) {
        return null;
      }
      return JSON.parse(data);
    } catch (error) {
      log.error('Failed to parse session cache', { error });
      return null;
    }
  }

  private getFromLocal(): AuthCacheData | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const data = localStorage.getItem(this.CACHE_KEY);
      if (!data) {
        return null;
      }

      const parsed = JSON.parse(data);

      // Don't use local storage data if it's too old (security)
      const MAX_LOCAL_AGE = 1000 * 60 * 60 * 24 * 7; // 7 days
      if (
        parsed.lastVerified &&
        Date.now() - parsed.lastVerified > MAX_LOCAL_AGE
      ) {
        localStorage.removeItem(this.CACHE_KEY);
        return null;
      }

      return parsed;
    } catch (error) {
      log.error('Failed to parse local cache', { error });
      return null;
    }
  }

  private setToSession(data: AuthCacheData, encrypt = false): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const toStore = encrypt ? this.encrypt(data) : JSON.stringify(data);
      sessionStorage.setItem(this.CACHE_KEY, toStore);
    } catch (error) {
      log.error('Failed to set session cache', { error });
    }
  }

  private setToLocal(data: AuthCacheData, encrypt = false): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // Don't store sensitive data in local storage
      const safeData = {
        ...data,
        token: null, // Don't persist tokens in local storage
        refreshToken: null,
      };

      const toStore = encrypt
        ? this.encrypt(safeData)
        : JSON.stringify(safeData);
      localStorage.setItem(this.CACHE_KEY, toStore);
    } catch (error) {
      log.error('Failed to set local cache', { error });
    }
  }

  private encrypt(data: AuthCacheData): string {
    // Simple obfuscation - in production, use proper encryption
    return btoa(JSON.stringify(data));
  }
}

// Export singleton instance
export const authCache = new AuthCache();

// Export cache utilities
export const cacheUtils = {
  /**
   * Decorator for caching async auth operations
   */
  withCache: <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options: CacheOptions = {}
  ) => {
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      // Check cache first
      const cached = authCache.get(options);
      if (cached && !authCache.needsRefresh(cached)) {
        return cached as any;
      }

      // Execute function
      const result = await fn(...args);

      // Cache result if it's auth data
      if (result && typeof result === 'object' && 'user' in result) {
        authCache.set(result as AuthCacheData, options);
      }

      return result;
    };
  },

  /**
   * Invalidate cache on certain conditions
   */
  invalidateOn: (condition: () => boolean) => {
    if (condition()) {
      authCache.clear();
    }
  },

  /**
   * Auto-refresh cache before expiration
   */
  setupAutoRefresh: (
    refreshFn: () => Promise<AuthCacheData>,
    interval = 60_000
  ) => {
    const checkAndRefresh = async () => {
      const cached = authCache.get();
      if (cached && authCache.needsRefresh(cached)) {
        try {
          const fresh = await refreshFn();
          authCache.set(fresh);
        } catch (error) {
          log.error('Auto-refresh failed', { error });
        }
      }
    };

    // Initial check
    checkAndRefresh();

    // Set up interval
    const intervalId = setInterval(checkAndRefresh, interval);

    // Return cleanup function
    return () => clearInterval(intervalId);
  },
};
