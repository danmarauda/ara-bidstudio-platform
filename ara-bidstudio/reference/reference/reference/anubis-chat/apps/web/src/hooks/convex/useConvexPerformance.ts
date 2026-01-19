/**
 * Performance optimization hooks for Convex integration
 * Provides caching, deduplication, and efficient data management
 */

import type { FunctionReference, OptionalRestArgs } from 'convex/server';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useConvexQuery } from './useConvexResult';

// =============================================================================
// Query Deduplication Hook
// =============================================================================

/**
 * Cache for query results to prevent duplicate requests
 */
const queryCache = new Map<string, any>();
const queryTimestamps = new Map<string, number>();

function generateCacheKey(query: any, args: any): string {
  return `${query}:${JSON.stringify(args)}`;
}

/**
 * Hook that deduplicates queries within a specified time window
 */
export function useDeduplicatedQuery<Query extends FunctionReference<'query'>>(
  query: Query,
  args: OptionalRestArgs<Query>,
  options: {
    dedupWindow?: number; // milliseconds
    enabled?: boolean;
  } = {}
) {
  const { dedupWindow = 1000, enabled = true } = options;

  const cacheKey = useMemo(
    () => (enabled ? generateCacheKey(query, args) : null),
    [query, args, enabled]
  );

  const shouldQuery = useMemo(() => {
    if (!(enabled && cacheKey)) {
      return false;
    }

    const lastQuery = queryTimestamps.get(cacheKey);
    const now = Date.now();

    return !lastQuery || now - lastQuery > dedupWindow;
  }, [cacheKey, dedupWindow, enabled]);

  const queryResult = useConvexQuery(
    query,
    ...(shouldQuery ? args : ([] as any))
  );

  useEffect(() => {
    if (shouldQuery && cacheKey && queryResult.data !== undefined) {
      queryCache.set(cacheKey, queryResult.data);
      queryTimestamps.set(cacheKey, Date.now());
    }
  }, [shouldQuery, cacheKey, queryResult.data]);

  return useMemo(() => {
    if (!enabled) {
      return queryResult;
    }

    if (!shouldQuery && cacheKey && queryCache.has(cacheKey)) {
      return {
        ...queryResult,
        data: queryCache.get(cacheKey),
        isLoading: false,
      };
    }

    return queryResult;
  }, [queryResult, shouldQuery, cacheKey, enabled]);
}

// =============================================================================
// Mutation Queue Hook
// =============================================================================

interface QueuedMutation<T> {
  id: string;
  mutation: () => Promise<T>;
  onSuccess?: (result: T) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for queuing mutations to prevent overwhelming the server
 */
export function useMutationQueue<T>() {
  const [queue, setQueue] = useState<QueuedMutation<T>[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);

  const addToQueue = useCallback((mutation: Omit<QueuedMutation<T>, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setQueue((prev) => [...prev, { ...mutation, id }]);
    return id;
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const processQueue = useCallback(async () => {
    if (processingRef.current || queue.length === 0) {
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);

    while (queue.length > 0) {
      const currentMutation = queue[0];
      if (!currentMutation) {
        break;
      }

      try {
        const result = await currentMutation.mutation();
        currentMutation.onSuccess?.(result);
      } catch (error) {
        currentMutation.onError?.(error as Error);
      }

      setQueue((prev) => prev.slice(1));

      // Add small delay between mutations
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    processingRef.current = false;
    setIsProcessing(false);
  }, [queue]);

  // Auto-process queue when items are added
  useEffect(() => {
    if (queue.length > 0 && !processingRef.current) {
      processQueue();
    }
  }, [queue, processQueue]);

  return {
    addToQueue,
    removeFromQueue,
    queueLength: queue.length,
    isProcessing,
  };
}

// =============================================================================
// Virtual List Hook for Large Data Sets
// =============================================================================

interface VirtualListConfig {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

/**
 * Hook for virtualizing large lists to improve performance
 */
export function useVirtualizedList<T>(items: T[], config: VirtualListConfig) {
  const { itemHeight, containerHeight, overscan = 5 } = config;
  const [scrollTop, setScrollTop] = useState(0);

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    startIndex + visibleCount + overscan * 2
  );

  const visibleItems = useMemo(
    () =>
      items.slice(startIndex, endIndex).map((item, index) => ({
        item,
        index: startIndex + index,
      })),
    [items, startIndex, endIndex]
  );

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
  };
}

// =============================================================================
// Connection Quality Hook
// =============================================================================

/**
 * Hook for monitoring connection quality and adjusting query frequency
 */
export function useConnectionQuality() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [connectionSpeed, setConnectionSpeed] = useState<
    'fast' | 'slow' | 'offline'
  >('fast');
  const latencyRef = useRef<number[]>([]);

  const measureLatency = useCallback(async () => {
    const start = performance.now();

    try {
      // Try to fetch a small resource to measure latency
      await fetch('/api/health', { method: 'HEAD' });
      const latency = performance.now() - start;

      latencyRef.current = [...latencyRef.current.slice(-9), latency];

      const avgLatency =
        latencyRef.current.reduce((a, b) => a + b, 0) /
        latencyRef.current.length;

      if (avgLatency > 1000) {
        setConnectionSpeed('slow');
      } else {
        setConnectionSpeed('fast');
      }
    } catch {
      setConnectionSpeed('offline');
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionSpeed('fast');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionSpeed('offline');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Measure latency periodically
      const interval = setInterval(measureLatency, 10_000);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        clearInterval(interval);
      };
    }
  }, [measureLatency]);

  return {
    isOnline,
    connectionSpeed,
    avgLatency:
      latencyRef.current.length > 0
        ? latencyRef.current.reduce((a, b) => a + b, 0) /
          latencyRef.current.length
        : 0,
  };
}

// =============================================================================
// Smart Refresh Hook
// =============================================================================

/**
 * Hook for smart refresh based on user activity and connection quality
 */
export function useSmartRefresh() {
  const [isUserActive, setIsUserActive] = useState(true);
  const { connectionSpeed } = useConnectionQuality();
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const resetInactivityTimer = useCallback(() => {
    setIsUserActive(true);

    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    inactivityTimeoutRef.current = setTimeout(() => {
      setIsUserActive(false);
    }, 30_000); // 30 seconds of inactivity
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const events = [
        'mousedown',
        'mousemove',
        'keypress',
        'scroll',
        'touchstart',
      ];

      for (const event of events) {
        document.addEventListener(event, resetInactivityTimer, true);
      }

      return () => {
        for (const event of events) {
          document.removeEventListener(event, resetInactivityTimer, true);
        }

        if (inactivityTimeoutRef.current) {
          clearTimeout(inactivityTimeoutRef.current);
        }
      };
    }
  }, [resetInactivityTimer]);

  const getRefreshInterval = useCallback(() => {
    if (connectionSpeed === 'offline') {
      return null;
    }
    if (!isUserActive) {
      return 60_000; // 1 minute when inactive
    }
    if (connectionSpeed === 'slow') {
      return 10_000; // 10 seconds on slow connection
    }
    return 5000; // 5 seconds when active and fast connection
  }, [isUserActive, connectionSpeed]);

  return {
    isUserActive,
    connectionSpeed,
    refreshInterval: getRefreshInterval(),
  };
}
