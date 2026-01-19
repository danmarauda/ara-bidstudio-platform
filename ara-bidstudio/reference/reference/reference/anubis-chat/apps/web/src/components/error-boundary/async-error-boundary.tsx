'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface AsyncErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
  timeout?: number;
  retryCount?: number;
}

interface AsyncErrorState {
  hasError: boolean;
  error: Error | null;
  isRetrying: boolean;
  attempts: number;
}

export function AsyncErrorBoundary({
  children,
  fallback,
  onError,
  timeout = 30000,
  retryCount = 3,
}: AsyncErrorBoundaryProps) {
  const [state, setState] = useState<AsyncErrorState>({
    hasError: false,
    error: null,
    isRetrying: false,
    attempts: 0,
  });

  const [isTimeout, setIsTimeout] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!state.hasError && !state.isRetrying) {
        setIsTimeout(true);
      }
    }, timeout);

    return () => clearTimeout(timeoutId);
  }, [timeout, state.hasError, state.isRetrying]);

  const handleError = (error: Error) => {
    setState(prev => ({
      ...prev,
      hasError: true,
      error,
      attempts: prev.attempts + 1,
    }));
    onError?.(error);
  };

  const retry = async () => {
    if (state.attempts >= retryCount) {
      return;
    }

    setState(prev => ({
      ...prev,
      isRetrying: true,
      hasError: false,
      error: null,
    }));

    // Wait a bit before retrying
    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, state.attempts)));

    setState(prev => ({
      ...prev,
      isRetrying: false,
    }));
  };

  const reset = () => {
    setState({
      hasError: false,
      error: null,
      isRetrying: false,
      attempts: 0,
    });
    setIsTimeout(false);
  };

  // Handle timeout
  if (isTimeout && !state.hasError) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading is taking longer than expected...</p>
        <Button onClick={reset} variant="outline" size="sm" className="mt-4">
          Refresh
        </Button>
      </div>
    );
  }

  // Handle retry state
  if (state.isRetrying) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        <span className="text-muted-foreground">Retrying...</span>
      </div>
    );
  }

  // Handle error state
  if (state.hasError && state.error) {
    if (fallback) {
      return <>{fallback}</>;
    }

    const canRetry = state.attempts < retryCount;

    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {state.error.message || 'An error occurred while loading'}
            {state.attempts > 1 && (
              <span className="mt-1 block text-xs">
                Attempt {state.attempts} of {retryCount}
              </span>
            )}
          </AlertDescription>
        </Alert>
        
        <div className="mt-4 flex gap-2">
          {canRetry && (
            <Button onClick={retry} size="sm">
              Try Again
            </Button>
          )}
          <Button onClick={reset} variant="outline" size="sm">
            Reset
          </Button>
        </div>
      </div>
    );
  }

  // Wrap children to catch async errors
  return (
    <AsyncErrorCatcher onError={handleError}>
      {children}
    </AsyncErrorCatcher>
  );
}

// Component to catch async errors from children
function AsyncErrorCatcher({
  children,
  onError,
}: {
  children: React.ReactNode;
  onError: (error: Error) => void;
}) {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      onError(new Error(event.reason));
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, [onError]);

  return <>{children}</>;
}

// Hook for manual async error handling
export function useAsyncError() {
  const [, setError] = useState();
  
  return React.useCallback(
    (error: Error) => {
      setError(() => {
        throw error;
      });
    },
    [setError]
  );
}