'use client';

import { Suspense, useTransition, startTransition, useCallback, Component, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { errorMonitor } from '@/lib/monitoring/errorMonitor';
import { LoadingStates } from '@/components/data/loading-states';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface StreamingSuspenseWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  isStreaming?: boolean;
  className?: string;
  onError?: (error: Error) => void;
  onRetry?: () => void;
}

/**
 * Default loading fallback for streaming content
 */
function StreamingFallback({ isStreaming }: { isStreaming?: boolean }) {
  return (
    <div className="flex h-full items-center justify-center">
      <LoadingStates
        size="lg"
        text={isStreaming ? "Streaming response..." : "Loading..."}
        variant={isStreaming ? "pulse" : "spinner"}
      />
    </div>
  );
}

/**
 * Custom Error Boundary for streaming content
 */
class StreamingErrorBoundary extends Component<
  { children: ReactNode; onError?: (error: Error) => void; onRetry?: () => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; onError?: (error: Error) => void; onRetry?: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('StreamingSuspenseWrapper error boundary caught an error:', error, errorInfo);
    
    // Report to error monitoring system
    errorMonitor.captureError(error, {
      category: 'javascript',
      severity: 'high',
      component: 'StreamingSuspenseWrapper',
      context: {
        componentStack: errorInfo.componentStack,
        errorBoundary: 'StreamingErrorBoundary'
      }
    });
    
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription className="mt-2">
              {this.state.error?.message || "An unexpected error occurred while loading the content."}
            </AlertDescription>
            <div className="mt-4 flex gap-2">
              <Button
                onClick={this.handleRetry}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * StreamingSuspenseWrapper - Enhanced Suspense wrapper for streaming content
 * 
 * Features:
 * - React 18+ concurrent features with useTransition
 * - Streaming-aware loading states
 * - Error boundaries with retry logic
 * - Smooth transitions between states
 */
export function StreamingSuspenseWrapper({
  children,
  fallback,
  isStreaming = false,
  className,
  onError,
  onRetry
}: StreamingSuspenseWrapperProps) {
  const [isPending, startTransition] = useTransition();

  const handleErrorBoundary = useCallback((error: Error) => {
    if (onError) {
      onError(error);
    }
    console.error('StreamingSuspenseWrapper caught error:', error);
  }, [onError]);

  const wrappedRetry = useCallback(() => {
    startTransition(() => {
      if (onRetry) {
        onRetry();
      }
    });
  }, [onRetry]);

  return (
    <div className={cn('relative h-full', className)}>
      <StreamingErrorBoundary
        onError={handleErrorBoundary}
        onRetry={wrappedRetry}
      >
        <Suspense 
          fallback={
            fallback || <StreamingFallback isStreaming={isStreaming} />
          }
        >
          <div className={cn(
            'h-full transition-opacity duration-200',
            isPending && 'opacity-50'
          )}>
            {children}
          </div>
        </Suspense>
      </StreamingErrorBoundary>
    </div>
  );
}

/**
 * Hook to manage streaming transitions with React 18+ concurrent features
 */
export function useStreamingTransition() {
  const [isPending, startTransition] = useTransition();
  
  const updateStreamingContent = useCallback((updateFn: () => void) => {
    startTransition(() => {
      updateFn();
    });
  }, []);
  
  return {
    isPending,
    updateStreamingContent
  };
}

export default StreamingSuspenseWrapper;