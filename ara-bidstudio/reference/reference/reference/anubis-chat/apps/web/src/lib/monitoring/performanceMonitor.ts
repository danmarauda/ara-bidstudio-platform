/**
 * Production performance monitoring and metrics collection
 * Tracks key performance indicators and user experience metrics
 */

import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('monitoring/performanceMonitor');

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  context?: Record<string, unknown>;
}

interface UserInteractionMetric {
  action: string;
  component: string;
  duration: number;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

interface ApiCallMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: number;
  error?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private interactions: UserInteractionMetric[] = [];
  private apiCalls: ApiCallMetric[] = [];
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeWebVitals();
    this.initializePerformanceObserver();
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public setUserId(userId: string) {
    this.userId = userId;
  }

  /**
   * Initialize Web Vitals monitoring
   */
  private initializeWebVitals() {
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    this.observeMetric('CLS', () => {
      // Cumulative Layout Shift
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            this.recordMetric('CLS', (entry as any).value);
          }
        }
      }).observe({ entryTypes: ['layout-shift'] });
    });

    this.observeMetric('FCP', () => {
      // First Contentful Paint
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.recordMetric('FCP', entry.startTime);
          }
        }
      }).observe({ entryTypes: ['paint'] });
    });

    this.observeMetric('LCP', () => {
      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('LCP', entry.startTime);
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });
    });
  }

  /**
   * Initialize Performance Observer for custom metrics
   */
  private initializePerformanceObserver() {
    if (typeof window === 'undefined') return;

    // Monitor navigation timing
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      this.recordMetric('Page Load Time', navigation.loadEventEnd - navigation.fetchStart);
      this.recordMetric('DOM Content Loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
      this.recordMetric('Time to Interactive', navigation.loadEventEnd - navigation.fetchStart);
    });
  }

  private observeMetric(name: string, observer: () => void) {
    try {
      observer();
    } catch (error) {
      log.warn(`Failed to observe ${name} metric`, { error });
    }
  }

  /**
   * Record a performance metric
   */
  public recordMetric(name: string, value: number, context?: Record<string, unknown>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      context
    };

    this.metrics.push(metric);
    
    // Log important metrics
    if (this.shouldLogMetric(name, value)) {
      log.info(`Performance metric: ${name}`, { value, context });
    }

    // Send to analytics if configured
    this.sendToAnalytics('performance', metric);
  }

  /**
   * Record user interaction timing
   */
  public recordInteraction(action: string, component: string, startTime: number) {
    const duration = Date.now() - startTime;
    
    const interaction: UserInteractionMetric = {
      action,
      component,
      duration,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId
    };

    this.interactions.push(interaction);

    // Log slow interactions
    if (duration > 100) {
      log.warn(`Slow interaction: ${component}.${action}`, { duration });
    }

    this.sendToAnalytics('interaction', interaction);
  }

  /**
   * Record API call performance
   */
  public recordApiCall(
    endpoint: string, 
    method: string, 
    statusCode: number, 
    startTime: number, 
    error?: string
  ) {
    const duration = Date.now() - startTime;
    
    const apiCall: ApiCallMetric = {
      endpoint,
      method,
      statusCode,
      duration,
      timestamp: Date.now(),
      error
    };

    this.apiCalls.push(apiCall);

    // Log slow or failed API calls
    if (duration > 1000 || statusCode >= 400) {
      log.warn(`API call performance issue`, { 
        endpoint, 
        method, 
        statusCode, 
        duration, 
        error 
      });
    }

    this.sendToAnalytics('api', apiCall);
  }

  /**
   * Monitor streaming message performance
   */
  public recordStreamingMetrics(messageId: string, metrics: {
    timeToFirstToken?: number;
    totalStreamTime?: number;
    tokenCount?: number;
    wordsPerSecond?: number;
  }) {
    Object.entries(metrics).forEach(([key, value]) => {
      if (value !== undefined) {
        this.recordMetric(`Streaming.${key}`, value, { messageId });
      }
    });
  }

  /**
   * Get performance summary
   */
  public getPerformanceSummary() {
    return {
      metrics: this.getMetricsSummary(),
      interactions: this.getInteractionsSummary(),
      apiCalls: this.getApiCallsSummary(),
      sessionId: this.sessionId,
      userId: this.userId
    };
  }

  private getMetricsSummary() {
    const grouped = this.groupBy(this.metrics, 'name');
    const summary: Record<string, { avg: number; min: number; max: number; count: number }> = {};

    Object.entries(grouped).forEach(([name, metrics]) => {
      const values = metrics.map(m => m.value);
      summary[name] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      };
    });

    return summary;
  }

  private getInteractionsSummary() {
    const recentInteractions = this.interactions.filter(
      i => Date.now() - i.timestamp < 5 * 60 * 1000 // Last 5 minutes
    );

    return {
      total: this.interactions.length,
      recent: recentInteractions.length,
      avgDuration: recentInteractions.reduce((sum, i) => sum + i.duration, 0) / recentInteractions.length || 0
    };
  }

  private getApiCallsSummary() {
    const recentCalls = this.apiCalls.filter(
      call => Date.now() - call.timestamp < 5 * 60 * 1000 // Last 5 minutes
    );

    return {
      total: this.apiCalls.length,
      recent: recentCalls.length,
      avgDuration: recentCalls.reduce((sum, call) => sum + call.duration, 0) / recentCalls.length || 0,
      errorRate: recentCalls.filter(call => call.statusCode >= 400).length / recentCalls.length || 0
    };
  }

  private shouldLogMetric(name: string, value: number): boolean {
    const thresholds: Record<string, number> = {
      'CLS': 0.1,
      'FCP': 3000,
      'LCP': 4000,
      'Page Load Time': 5000,
      'Time to Interactive': 5000
    };

    return thresholds[name] ? value > thresholds[name] : false;
  }

  private sendToAnalytics(type: string, data: unknown) {
    // In production, send to your analytics service
    // For now, we'll just log important events
    if (process.env.NODE_ENV === 'production') {
      // Example: analytics.track(type, data);
      console.log(`Analytics: ${type}`, data);
    }
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
export const performanceMonitor = new PerformanceMonitor();

/**
 * Hook for monitoring component performance
 */
export function usePerformanceMonitor() {
  return {
    recordMetric: performanceMonitor.recordMetric.bind(performanceMonitor),
    recordInteraction: performanceMonitor.recordInteraction.bind(performanceMonitor),
    recordApiCall: performanceMonitor.recordApiCall.bind(performanceMonitor),
    recordStreamingMetrics: performanceMonitor.recordStreamingMetrics.bind(performanceMonitor),
    getPerformanceSummary: performanceMonitor.getPerformanceSummary.bind(performanceMonitor),
    setUserId: performanceMonitor.setUserId.bind(performanceMonitor)
  };
}