/**
 * Convex integration hooks index
 * Centralized exports for all Convex-related functionality
 */

// Error handling
export {
  ConvexErrorBoundary,
  ConvexErrorFallback,
  useErrorBoundary,
} from '@/components/error/ConvexErrorBoundary';
// Loading states
export {
  ChatListSkeleton,
  ConnectionStatus,
  DocumentListSkeleton,
  LoadingDots,
  LoadingSpinner,
  MessageListSkeleton,
  OptimisticUpdateIndicator,
  ProgressiveLoading,
  QueryStateIndicator,
  UserProfileSkeleton,
} from '@/components/loading/ConvexLoadingStates';
// Re-export commonly used patterns
export type { Result } from '@/lib/utils/result';
export {
  failure,
  isFailure,
  isSuccess,
  success,
  unwrap,
  unwrapOr,
} from '@/lib/utils/result';
export * from './useChats';
// Performance hooks
export * from './useConvexPerformance';
// Core Result utilities
export * from './useConvexResult';
// Entity-specific hooks
export * from './useUsers';
