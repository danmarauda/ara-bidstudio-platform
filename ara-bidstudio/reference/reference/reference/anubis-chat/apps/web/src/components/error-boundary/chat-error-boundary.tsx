'use client';

import { RefreshCw, WifiOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ErrorBoundary, { type ErrorBoundaryFallbackProps } from './error-boundary';

function ChatErrorFallback({ error, resetError }: ErrorBoundaryFallbackProps) {
  const isNetworkError = error.message.toLowerCase().includes('network') || 
                        error.message.toLowerCase().includes('fetch');
  const isConvexError = error.message.toLowerCase().includes('convex');
  
  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <div className="max-w-md space-y-4 text-center">
        {isNetworkError ? (
          <>
            <WifiOff className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Connection Lost</h2>
            <p className="text-muted-foreground">
              Unable to connect to the chat service. Please check your internet connection.
            </p>
          </>
        ) : isConvexError ? (
          <>
            <AlertTriangle className="mx-auto h-12 w-12 text-warning" />
            <h2 className="text-xl font-semibold">Database Error</h2>
            <p className="text-muted-foreground">
              There was a problem connecting to the database. Please try again.
            </p>
          </>
        ) : (
          <>
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
            <h2 className="text-xl font-semibold">Chat Error</h2>
            <p className="text-muted-foreground">
              Something went wrong with the chat. Please refresh to continue.
            </p>
          </>
        )}
        
        <Alert variant={isNetworkError ? 'default' : 'destructive'}>
          <AlertDescription className="text-sm">
            {error.message}
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-center gap-2">
          <Button onClick={resetError} size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            size="sm"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ChatErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={ChatErrorFallback}
      level="section"
      onError={(error) => {
        console.error('[Chat Error]:', error);
        // Could send to error tracking service
      }}
      resetOnPropsChange
    >
      {children}
    </ErrorBoundary>
  );
}