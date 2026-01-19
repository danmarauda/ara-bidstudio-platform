/**
 * Convex React hooks with Result<T, E> pattern integration
 * Provides type-safe error handling for all Convex operations
 */

import { useMutation, useQuery } from 'convex/react';
import type { FunctionReference, OptionalRestArgs } from 'convex/server';
import { useCallback, useMemo, useState } from 'react';
import type { Result } from '@/lib/utils/result';
import { failure, safeAsync, success } from '@/lib/utils/result';

// =============================================================================
// Enhanced Query Hook with Result Pattern
// =============================================================================

export interface ConvexQueryResult<T> {
  data: T | undefined;
  error: Error | undefined;
  isLoading: boolean;
  result: Result<T, Error> | null;
}

/**
 * Enhanced useQuery hook that wraps results in Result<T, E> pattern
 */
export function useConvexQuery<Query extends FunctionReference<'query'>>(
  query: Query,
  ...args: OptionalRestArgs<Query>
): ConvexQueryResult<Query['_returnType']> {
  const data = useQuery(query, ...(args as any));

  return useMemo(() => {
    // Handle loading state
    if (data === undefined) {
      return {
        data: undefined,
        error: undefined,
        isLoading: true,
        result: null,
      };
    }

    // Handle potential Convex errors (they come as thrown errors)
    if (
      data &&
      typeof data === 'object' &&
      'message' in data &&
      'stack' in data
    ) {
      const error = data as Error;
      return {
        data: undefined,
        error,
        isLoading: false,
        result: failure(error),
      };
    }

    // Success case
    return {
      data,
      error: undefined,
      isLoading: false,
      result: success(data),
    };
  }, [data]);
}

// =============================================================================
// Enhanced Mutation Hook with Result Pattern
// =============================================================================

export interface ConvexMutationResult<T> {
  /**
   * Execute mutation and return Result<T, Error> - safer option that doesn't throw
   */
  mutate: (...args: any[]) => Promise<Result<T, Error>>;
  /**
   * Execute mutation and throw on error - use with try/catch
   */
  mutateAsync: (...args: any[]) => Promise<T>;
  isLoading: boolean;
}

/**
 * Enhanced useMutation hook that returns Results and handles errors gracefully
 */
export function useConvexMutation<
  Mutation extends FunctionReference<'mutation'>,
>(mutation: Mutation): ConvexMutationResult<Mutation['_returnType']> {
  const convexMutation = useMutation(mutation);
  const [isLoading, setIsLoading] = useState(false);

  const mutate = useCallback(
    async (
      ...args: OptionalRestArgs<Mutation>
    ): Promise<Result<Mutation['_returnType'], Error>> => {
      setIsLoading(true);
      try {
        const result = await safeAsync(async () => {
          return await convexMutation(...(args as any));
        });
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [convexMutation]
  );

  const mutateAsync = useCallback(
    async (
      ...args: OptionalRestArgs<Mutation>
    ): Promise<Mutation['_returnType']> => {
      setIsLoading(true);
      try {
        return await convexMutation(...(args as any));
      } finally {
        setIsLoading(false);
      }
    },
    [convexMutation]
  );

  return useMemo(
    () => ({
      mutate,
      mutateAsync,
      isLoading,
    }),
    [mutate, mutateAsync, isLoading]
  );
}

// =============================================================================
// Optimistic Updates Helper
// =============================================================================

export interface OptimisticUpdateConfig<T> {
  optimisticData?: T;
  rollbackOnError?: boolean;
  /** Called when optimistic update is applied and when mutation succeeds */
  onOptimisticSuccess?: (data: T) => void;
  /** Called when mutation fails and rollback is needed */
  onRollbackError?: (error: Error) => void;
}

/**
 * Hook for optimistic updates with Convex mutations
 */
export function useOptimisticMutation<
  Mutation extends FunctionReference<'mutation'>,
>(
  mutation: Mutation,
  config: OptimisticUpdateConfig<Mutation['_returnType']> = {}
): ConvexMutationResult<Mutation['_returnType']> {
  const {
    mutate: baseMutate,
    mutateAsync,
    isLoading,
  } = useConvexMutation(mutation);

  const mutate = useCallback(
    async (
      ...args: OptionalRestArgs<Mutation>
    ): Promise<Result<Mutation['_returnType'], Error>> => {
      // Apply optimistic update if provided
      if (config.optimisticData && config.onOptimisticSuccess) {
        config.onOptimisticSuccess(config.optimisticData);
      }

      const result = await baseMutate(...args);

      if (result.success) {
        config.onOptimisticSuccess?.(result.data);
      } else {
        // Rollback optimistic update on error if configured
        if (config.rollbackOnError && config.onRollbackError) {
          config.onRollbackError(result.error);
        }
      }

      return result;
    },
    [baseMutate, config]
  );

  return useMemo(
    () => ({
      mutate,
      mutateAsync,
      isLoading,
    }),
    [mutate, mutateAsync, isLoading]
  );
}

// =============================================================================
// Batch Operations Helper
// =============================================================================

/**
 * Executes multiple mutations in parallel with comprehensive error handling
 */
export function useBatchMutations() {
  return useCallback(
    async <T>(
      mutations: (() => Promise<Result<T, Error>>)[],
      options: {
        sequential?: boolean;
        collectAllErrors?: boolean;
      } = {}
    ): Promise<Result<T[], Error[]>> => {
      const { sequential = false, collectAllErrors = false } = options;

      if (sequential) {
        // Sequential execution
        const results: T[] = [];
        const errors: Error[] = [];

        for (const mutation of mutations) {
          const result = await mutation();

          if (result.success) {
            results.push(result.data);
          } else {
            errors.push(result.error);
            if (!collectAllErrors) {
              return failure([result.error]);
            }
          }
        }

        return errors.length > 0 && !collectAllErrors
          ? failure(errors)
          : success(results);
      }
      // Parallel execution
      const results = await Promise.all(
        mutations.map((mutation) => mutation())
      );
      const successes: T[] = [];
      const errors: Error[] = [];

      for (const result of results) {
        if (result.success) {
          successes.push(result.data);
        } else {
          errors.push(result.error);
        }
      }

      return errors.length > 0 && !collectAllErrors
        ? failure(errors)
        : success(successes);
    },
    []
  );
}

// =============================================================================
// Loading State Management
// =============================================================================

export interface LoadingState {
  isLoading: boolean;
  hasError: boolean;
  error: Error | null;
}

/**
 * Combines multiple query loading states
 */
export function useCombinedLoadingState(
  ...queryResults: ConvexQueryResult<any>[]
): LoadingState {
  return useMemo(() => {
    const isLoading = queryResults.some((result) => result.isLoading);
    const errors = queryResults.map((result) => result.error).filter(Boolean);
    const hasError = errors.length > 0;

    return {
      isLoading,
      hasError,
      error: errors[0] || null,
    };
  }, [queryResults]);
}
