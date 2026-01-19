/**
 * Error boundary specifically for Convex-related errors
 * Provides graceful fallbacks and error reporting
 */

'use client';

import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import React, { Component, type ErrorInfo, type ReactNode } from 'react';
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
const log = createModuleLogger('convex-error-boundary');

interface ConvexError extends Error {
  code?: string;
  details?: Record<string, any>;
  isConvexError?: boolean;
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: ConvexError | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class ConvexErrorBoundary extends Component<Props, State> {
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: ConvexError): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: ConvexError, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log to error tracking service
    log.error('ConvexErrorBoundary caught an error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      errorInfo: {
        componentStack: errorInfo.componentStack?.slice(0, 1000),
        errorBoundary: 'ConvexErrorBoundary',
      },
      errorCode: (error as ConvexError).code,
      errorDetails: (error as ConvexError).details,
      operation: 'error_boundary_catch',
    });
  }

  componentWillUnmount() {
    // Clear any pending timeouts
    this.retryTimeouts.forEach(clearTimeout);
  }

  private handleRetry = () => {
    const { retryCount } = this.state;

    // Exponential backoff: 1s, 2s, 4s, max 10s
    const delay = Math.min(1000 * 2 ** retryCount, 10_000);

    const timeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
      });
    }, delay);

    this.retryTimeouts.push(timeout);
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private renderConvexErrorDetails(error: ConvexError) {
    if (!this.props.showDetails) {
      return null;
    }

    return (
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
          Technical Details
        </summary>
        <div className="mt-2 space-y-2 rounded-md bg-muted/30 p-3">
          {error.code && (
            <div>
              <span className="font-medium">Error Code:</span> {error.code}
            </div>
          )}
          {error.message && (
            <div>
              <span className="font-medium">Message:</span> {error.message}
            </div>
          )}
          {error.stack && (
            <div>
              <span className="font-medium">Stack:</span>
              <pre className="mt-1 whitespace-pre-wrap text-xs">
                {error.stack}
              </pre>
            </div>
          )}
          {error.details && (
            <div>
              <span className="font-medium">Details:</span>
              <pre className="mt-1 whitespace-pre-wrap text-xs">
                {JSON.stringify(error.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </details>
    );
  }

  private getErrorMessage(error: ConvexError): {
    title: string;
    description: string;
  } {
    // Handle specific Convex error types
    if (error.code) {
      switch (error.code) {
        case 'UNAUTHORIZED':
          return {
            title: 'Authentication Required',
            description: 'Please connect your wallet and try again.',
          };
        case 'FORBIDDEN':
          return {
            title: 'Access Denied',
            description: "You don't have permission to perform this action.",
          };
        case 'RATE_LIMIT_EXCEEDED':
          return {
            title: 'Too Many Requests',
            description: 'Please wait a moment before trying again.',
          };
        case 'VALIDATION_ERROR':
          return {
            title: 'Invalid Data',
            description:
              'The information provided is invalid. Please check and try again.',
          };
        case 'RESOURCE_NOT_FOUND':
          return {
            title: 'Not Found',
            description: 'The requested resource could not be found.',
          };
        default:
          return {
            title: 'System Error',
            description: error.message || 'An unexpected error occurred.',
          };
      }
    }

    // Handle network errors
    if (error.message?.includes('fetch')) {
      return {
        title: 'Connection Error',
        description:
          'Unable to connect to the server. Please check your internet connection.',
      };
    }

    // Generic error
    return {
      title: 'Something went wrong',
      description:
        error.message || 'An unexpected error occurred. Please try again.',
    };
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const error = this.state.error!;
      const { title, description } = this.getErrorMessage(error);
      const canRetry = this.state.retryCount < 3;

      return (
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-xl">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center gap-2">
                {canRetry && (
                  <Button
                    className="flex items-center gap-2"
                    onClick={this.handleRetry}
                    size="sm"
                    variant="default"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                )}
                <Button
                  className="flex items-center gap-2"
                  onClick={this.handleGoHome}
                  size="sm"
                  variant="outline"
                >
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </div>

              {!canRetry && (
                <p className="text-center text-muted-foreground text-sm">
                  Maximum retry attempts reached. Please refresh the page or
                  contact support.
                </p>
              )}

              {this.renderConvexErrorDetails(error)}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// =============================================================================
// Hook-based Error Boundary
// =============================================================================

export interface ErrorBoundaryContextValue {
  error: Error | null;
  hasError: boolean;
  reset: () => void;
}

const ErrorBoundaryContext =
  React.createContext<ErrorBoundaryContextValue | null>(null);

export function useErrorBoundary() {
  const context = React.useContext(ErrorBoundaryContext);
  if (!context) {
    throw new Error(
      'useErrorBoundary must be used within a ConvexErrorBoundary'
    );
  }
  return context;
}

// =============================================================================
// Functional Error Boundary Wrapper
// =============================================================================

interface ConvexErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export function ConvexErrorFallback({
  error,
  resetError,
}: ConvexErrorFallbackProps) {
  const convexError = error as ConvexError;

  return (
    <ConvexErrorBoundary
      fallback={null}
      showDetails={process.env.NODE_ENV === 'development'}
    >
      <div className="flex min-h-[200px] items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Error
            </CardTitle>
            <CardDescription>
              {convexError.message || 'Something went wrong'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={resetError} size="sm">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    </ConvexErrorBoundary>
  );
}
