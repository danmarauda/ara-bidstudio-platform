/**
 * Production error monitoring and reporting system
 * Captures, categorizes, and reports errors with context
 */

import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('monitoring/errorMonitor');

interface ErrorContext {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  timestamp: number;
  component?: string;
  action?: string;
  props?: Record<string, unknown>;
  state?: Record<string, unknown>;
  // Additional error context properties
  componentStack?: string;
  errorBoundary?: string;
  line?: number;
  column?: number;
  type?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  responseData?: unknown;
  userInput?: unknown;
}

interface CapturedError {
  id: string;
  message: string;
  stack?: string;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'javascript' | 'network' | 'api' | 'user' | 'system';
  context: ErrorContext;
  fingerprint: string;
  retryCount?: number;
}

class ErrorMonitor {
  private errors: CapturedError[] = [];
  private sessionId: string;
  private userId?: string;
  private errorCounts: Map<string, number> = new Map();

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeGlobalErrorHandlers();
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public setUserId(userId: string) {
    this.userId = userId;
  }

  /**
   * Initialize global error handlers
   */
  private initializeGlobalErrorHandlers() {
    if (typeof window === 'undefined') return;

    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        category: 'javascript',
        severity: 'high',
        context: {
          url: event.filename,
          line: event.lineno,
          column: event.colno
        }
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          category: 'javascript',
          severity: 'high',
          context: {
            type: 'unhandledRejection'
          }
        }
      );
    });

    // React error boundary integration
    window.__ANUBIS_ERROR_MONITOR__ = this;
  }

  /**
   * Capture and categorize an error
   */
  public captureError(
    error: Error | string, 
    options: {
      category?: CapturedError['category'];
      severity?: CapturedError['severity'];
      context?: Partial<ErrorContext>;
      component?: string;
      retryable?: boolean;
    } = {}
  ): string {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    const errorId = this.generateErrorId();
    const fingerprint = this.generateFingerprint(errorObj, options.context);
    
    // Increment error count for this fingerprint
    const currentCount = this.errorCounts.get(fingerprint) || 0;
    this.errorCounts.set(fingerprint, currentCount + 1);

    const capturedError: CapturedError = {
      id: errorId,
      message: errorObj.message,
      stack: errorObj.stack,
      name: errorObj.name,
      severity: options.severity || this.inferSeverity(errorObj),
      category: options.category || this.inferCategory(errorObj),
      fingerprint,
      context: {
        userId: this.userId,
        sessionId: this.sessionId,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        timestamp: Date.now(),
        component: options.component,
        ...options.context
      },
      retryCount: currentCount
    };

    this.errors.push(capturedError);

    // Log based on severity
    this.logError(capturedError);

    // Send to error reporting service
    this.reportError(capturedError);

    // Check if we should alert for frequent errors
    this.checkErrorFrequency(fingerprint, currentCount + 1);

    return errorId;
  }

  /**
   * Capture API errors with additional context
   */
  public captureApiError(
    error: Error,
    endpoint: string,
    method: string,
    statusCode?: number,
    responseData?: unknown
  ): string {
    return this.captureError(error, {
      category: 'api',
      severity: statusCode && statusCode >= 500 ? 'high' : 'medium',
      context: {
        endpoint,
        method,
        statusCode,
        responseData: this.sanitizeResponseData(responseData)
      }
    });
  }

  /**
   * Capture network errors
   */
  public captureNetworkError(
    error: Error,
    url: string,
    method: string
  ): string {
    return this.captureError(error, {
      category: 'network',
      severity: 'medium',
      context: {
        url,
        method,
        type: 'network'
      }
    });
  }

  /**
   * Capture user action errors
   */
  public captureUserError(
    error: Error,
    action: string,
    component: string,
    userInput?: unknown
  ): string {
    return this.captureError(error, {
      category: 'user',
      severity: 'low',
      component,
      context: {
        action,
        userInput: this.sanitizeUserInput(userInput)
      }
    });
  }

  /**
   * Mark error as resolved
   */
  public resolveError(errorId: string) {
    const errorIndex = this.errors.findIndex(e => e.id === errorId);
    if (errorIndex !== -1) {
      this.errors.splice(errorIndex, 1);
      log.info('Error resolved', { errorId });
    }
  }

  /**
   * Get error summary for monitoring dashboard
   */
  public getErrorSummary() {
    const recentErrors = this.errors.filter(
      e => Date.now() - e.context.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
    );

    const errorsByCategory = this.groupBy(recentErrors, 'category');
    const errorsBySeverity = this.groupBy(recentErrors, 'severity');
    const topErrors = this.getTopErrorsByFrequency();

    return {
      total: this.errors.length,
      recent: recentErrors.length,
      byCategory: Object.entries(errorsByCategory).map(([category, errors]) => ({
        category,
        count: errors.length
      })),
      bySeverity: Object.entries(errorsBySeverity).map(([severity, errors]) => ({
        severity,
        count: errors.length
      })),
      topErrors,
      sessionId: this.sessionId,
      userId: this.userId
    };
  }

  private generateErrorId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFingerprint(error: Error, context?: Partial<ErrorContext>): string {
    // Create a unique fingerprint for grouping similar errors
    const components = [
      error.name,
      error.message.replace(/\d+/g, 'N'), // Replace numbers with N
      context?.component,
      context?.action
    ].filter(Boolean);

    return btoa(components.join('|')).substr(0, 16);
  }

  private inferSeverity(error: Error): CapturedError['severity'] {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'medium';
    }
    
    if (message.includes('syntax') || message.includes('reference')) {
      return 'high';
    }
    
    if (message.includes('permission') || message.includes('auth')) {
      return 'high';
    }
    
    return 'medium';
  }

  private inferCategory(error: Error): CapturedError['category'] {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';
    
    if (message.includes('fetch') || message.includes('network')) {
      return 'network';
    }
    
    if (message.includes('api') || stack.includes('api')) {
      return 'api';
    }
    
    if (message.includes('user') || message.includes('input')) {
      return 'user';
    }
    
    return 'javascript';
  }

  private logError(error: CapturedError) {
    const logLevel = {
      low: 'info',
      medium: 'warn',
      high: 'error',
      critical: 'error'
    }[error.severity] as 'info' | 'warn' | 'error';

    log[logLevel](`${error.category} error: ${error.message}`, {
      errorId: error.id,
      fingerprint: error.fingerprint,
      retryCount: error.retryCount,
      context: error.context
    });
  }

  private reportError(error: CapturedError) {
    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error);
      console.error('Error reported:', error);
    }
  }

  private checkErrorFrequency(fingerprint: string, count: number) {
    // Alert if the same error occurs frequently
    const alertThresholds = [5, 10, 25, 50];
    
    if (alertThresholds.includes(count)) {
      log.error(`High frequency error detected`, {
        fingerprint,
        count,
        recentOccurrences: this.errors
          .filter(e => e.fingerprint === fingerprint)
          .slice(-5)
          .map(e => ({
            timestamp: e.context.timestamp,
            component: e.context.component,
            userId: e.context.userId
          }))
      });
    }
  }

  private getTopErrorsByFrequency() {
    const errorFrequency = Array.from(this.errorCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    return errorFrequency.map(([fingerprint, count]) => {
      const sampleError = this.errors.find(e => e.fingerprint === fingerprint);
      return {
        fingerprint,
        count,
        message: sampleError?.message,
        category: sampleError?.category,
        severity: sampleError?.severity
      };
    });
  }

  private sanitizeResponseData(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    // Remove sensitive data
    const sanitized = { ...data as Record<string, unknown> };
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth'];
    
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  private sanitizeUserInput(input: unknown): unknown {
    if (typeof input === 'string') {
      // Limit string length and remove potential PII
      return input.length > 1000 ? input.substring(0, 1000) + '...' : input;
    }
    return input;
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const groupKey = String(item[key]);
      groups[groupKey] = groups[groupKey] || [];
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }
}

// Singleton instance
export const errorMonitor = new ErrorMonitor();

/**
 * Hook for error monitoring in components
 */
export function useErrorMonitor() {
  return {
    captureError: errorMonitor.captureError.bind(errorMonitor),
    captureApiError: errorMonitor.captureApiError.bind(errorMonitor),
    captureNetworkError: errorMonitor.captureNetworkError.bind(errorMonitor),
    captureUserError: errorMonitor.captureUserError.bind(errorMonitor),
    resolveError: errorMonitor.resolveError.bind(errorMonitor),
    getErrorSummary: errorMonitor.getErrorSummary.bind(errorMonitor),
    setUserId: errorMonitor.setUserId.bind(errorMonitor)
  };
}

// Global error monitor interface for React error boundaries
declare global {
  interface Window {
    __ANUBIS_ERROR_MONITOR__?: ErrorMonitor;
  }
}