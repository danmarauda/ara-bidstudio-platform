'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createModuleLogger } from '@/lib/utils/logger';

// Initialize logger
const log = createModuleLogger('error-boundary');

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Filter out known Solana extension errors that don't affect functionality
    const isSolanaExtensionError =
      error.message?.includes('MutationObserver') ||
      error.message?.includes('solanaActionsContentScript') ||
      error.stack?.includes('solanaActionsContentScript');

    if (isSolanaExtensionError) {
      // Log but don't trigger error boundary for Solana extension issues
      log.warn('Solana extension error filtered (non-critical)', {
        error: error.message,
        stack: error.stack?.slice(0, 500), // Truncate stack trace
        type: 'solana_extension_error',
      });
      return { hasError: false };
    }

    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Filter out Solana extension errors
    const isSolanaExtensionError =
      error.message?.includes('MutationObserver') ||
      error.message?.includes('solanaActionsContentScript');

    if (!isSolanaExtensionError) {
      log.error('Uncaught error in application', {
        error,
        errorInfo: {
          componentStack: errorInfo.componentStack?.slice(0, 1000), // Truncate
          errorBoundary: 'ErrorBoundary',
        },
        type: 'uncaught_error',
      });
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-destructive">
                Something went wrong
              </CardTitle>
              <CardDescription>
                An unexpected error occurred. This has been logged and will be
                investigated.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <pre className="whitespace-pre-wrap text-destructive">
                    {this.state.error.message}
                  </pre>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={this.handleReset}
                  variant="outline"
                >
                  Try Again
                </Button>
                <Button className="flex-1" onClick={this.handleReload}>
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Global error handler for unhandled promise rejections and errors
if (typeof window !== 'undefined') {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;

    // Filter out Solana extension errors
    if (
      error?.message?.includes('MutationObserver') ||
      error?.message?.includes('solanaActionsContentScript') ||
      error?.stack?.includes('solanaActionsContentScript')
    ) {
      log.warn('Solana extension promise rejection filtered', {
        error: error?.message || 'Unknown error',
        stack: error?.stack?.slice(0, 500),
        type: 'solana_extension_promise_rejection',
      });
      event.preventDefault(); // Prevent logging to console
      return;
    }

    log.error('Unhandled promise rejection', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: 'unhandled_promise_rejection',
    });
  });

  // Handle general errors
  window.addEventListener('error', (event) => {
    const error = event.error;

    // Filter out Solana extension errors
    if (
      error?.message?.includes('MutationObserver') ||
      error?.message?.includes('solanaActionsContentScript') ||
      event.filename?.includes('solanaActionsContentScript')
    ) {
      log.warn('Solana extension error filtered', {
        error: error?.message || 'Unknown error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'solana_extension_window_error',
      });
      event.preventDefault(); // Prevent logging to console
      return;
    }
  });
}

// Hook version for functional components
export function withErrorBoundary<T extends Record<string, unknown>>(
  Component: React.ComponentType<T>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: T) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
