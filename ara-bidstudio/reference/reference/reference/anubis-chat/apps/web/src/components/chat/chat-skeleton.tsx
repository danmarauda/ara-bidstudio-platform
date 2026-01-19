import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for chat interface
 * Provides visual feedback during data loading
 */
export function ChatSkeleton() {
  return (
    <div className="flex h-screen flex-col">
      {/* Header skeleton */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="mb-1 h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>

      {/* Messages skeleton */}
      <div className="flex-1 space-y-4 overflow-hidden p-4">
        {/* User message skeleton */}
        <div className="flex justify-end">
          <div className="max-w-[70%] space-y-2">
            <Skeleton className="h-4 w-48 rounded-lg" />
            <Skeleton className="h-4 w-36 rounded-lg" />
          </div>
        </div>

        {/* AI message skeleton */}
        <div className="flex justify-start">
          <div className="max-w-[70%] space-y-2">
            <Skeleton className="h-4 w-64 rounded-lg" />
            <Skeleton className="h-4 w-52 rounded-lg" />
            <Skeleton className="h-4 w-40 rounded-lg" />
          </div>
        </div>

        {/* Another user message */}
        <div className="flex justify-end">
          <div className="max-w-[70%] space-y-2">
            <Skeleton className="h-4 w-56 rounded-lg" />
          </div>
        </div>

        {/* Loading indicator for AI response */}
        <div className="flex justify-start">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex space-x-1">
              <Skeleton className="h-2 w-2 animate-bounce rounded-full" />
              <Skeleton className="animation-delay-200 h-2 w-2 animate-bounce rounded-full" />
              <Skeleton className="animation-delay-400 h-2 w-2 animate-bounce rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Input skeleton */}
      <div className="border-t p-4">
        <div className="flex items-end gap-2">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for chat list sidebar
 */
export function ChatListSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="rounded-lg p-3">
          <Skeleton className="mb-2 h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

/**
 * Loading skeleton for message
 */
export function MessageSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="flex items-start gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </div>
  );
}