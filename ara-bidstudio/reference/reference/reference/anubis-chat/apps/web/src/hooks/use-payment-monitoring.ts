'use client';

import { api } from '@convex/_generated/api';
import { useQuery } from 'convex/react';
import { useCallback } from 'react';
import { createModuleLogger } from '@/lib/utils/logger';

const _log = createModuleLogger('payment-monitoring');

export interface PaymentMetrics {
  timeframe: '1h' | '24h' | '7d' | '30d';
  metrics: {
    totalEvents: number;
    successfulPayments: number;
    failedPayments: number;
    timeouts: number;
    retries: number;
    blockchainErrors: number;
    rpcErrors: number;
    successRate: number;
    avgProcessingTime: number;
    errorDistribution: Record<string, number>;
  };
  health: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    lastError: any | null;
  };
}

export interface PaymentAlert {
  id: string;
  eventType: string;
  severity: 'warning' | 'error' | 'critical';
  timestamp: number;
  message: string;
  metadata: any;
}

export interface PaymentSystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  timestamp: number;
  metrics: {
    last24h: {
      totalEvents: number;
      successfulPayments: number;
      failedPayments: number;
      successRate: number;
      criticalErrors: number;
      errors: number;
      warnings: number;
    };
    lastHour: {
      totalEvents: number;
      avgProcessingTime: number;
      p95ProcessingTime: number;
    };
  };
  alerts: Array<{
    eventType: string;
    severity: string;
    timestamp: number;
    message: string;
  }>;
}

export function usePaymentMonitoring() {
  // Get payment metrics
  const getMetrics = useCallback(
    (timeframe: '1h' | '24h' | '7d' | '30d' = '24h') => {
      return useQuery(api.monitoring.getPaymentMetrics, { timeframe });
    },
    []
  );

  // Get payment alerts
  const getAlerts = useCallback(
    (severity: 'warning' | 'error' | 'critical' = 'warning', limit = 20) => {
      return useQuery(api.monitoring.getPaymentAlerts, { severity, limit });
    },
    []
  );

  // Get system health
  const getSystemHealth = useCallback(() => {
    return useQuery(api.monitoring.checkPaymentSystemHealth, {});
  }, []);

  // Get performance data
  const getPerformance = useCallback(
    (timeframe: '1h' | '24h' | '7d' = '24h') => {
      return useQuery(api.monitoring.getPaymentPerformance, { timeframe });
    },
    []
  );

  // Helper function to format metrics for display
  const formatMetrics = useCallback(
    (metrics: PaymentMetrics | undefined): string => {
      if (!metrics) {
        return 'Loading...';
      }

      const { successRate, avgProcessingTime, ...data } = metrics.metrics;
      return `Success Rate: ${successRate}% | Avg Time: ${avgProcessingTime}ms | Total: ${data.totalEvents}`;
    },
    []
  );

  // Helper function to get health color
  const getHealthColor = useCallback((status: string): string => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }, []);

  // Helper function to format processing time
  const formatProcessingTime = useCallback((timeMs: number): string => {
    if (timeMs < 1000) {
      return `${timeMs}ms`;
    }
    if (timeMs < 60_000) {
      return `${(timeMs / 1000).toFixed(1)}s`;
    }
    return `${(timeMs / 60_000).toFixed(1)}m`;
  }, []);

  // Helper function to get error severity badge
  const getSeverityBadge = useCallback(
    (severity: string): { color: string; label: string } => {
      switch (severity) {
        case 'info':
          return { color: 'bg-blue-100 text-blue-800', label: 'Info' };
        case 'warning':
          return { color: 'bg-yellow-100 text-yellow-800', label: 'Warning' };
        case 'error':
          return { color: 'bg-red-100 text-red-800', label: 'Error' };
        case 'critical':
          return { color: 'bg-red-200 text-red-900', label: 'Critical' };
        default:
          return { color: 'bg-gray-100 text-gray-800', label: 'Unknown' };
      }
    },
    []
  );

  return {
    getMetrics,
    getAlerts,
    getSystemHealth,
    getPerformance,
    formatMetrics,
    getHealthColor,
    formatProcessingTime,
    getSeverityBadge,
  };
}

// Hook for real-time payment monitoring (for admin dashboard)
export function usePaymentAdminMonitoring() {
  const metrics24h = useQuery(api.monitoring.getPaymentMetrics, {
    timeframe: '24h',
  });
  const systemHealth = useQuery(api.monitoring.checkPaymentSystemHealth, {});
  const recentAlerts = useQuery(api.monitoring.getPaymentAlerts, {
    severity: 'error',
    limit: 5,
  });
  const performance = useQuery(api.monitoring.getPaymentPerformance, {
    timeframe: '24h',
  });

  const isHealthy = systemHealth?.status === 'healthy';
  const hasRecentErrors = (recentAlerts?.length || 0) > 0;
  const successRate = metrics24h?.metrics.successRate || 0;

  // Overall system status
  const overallStatus = useCallback(() => {
    if (!systemHealth) {
      return 'loading';
    }
    if (systemHealth.status === 'critical') {
      return 'critical';
    }
    if (systemHealth.status === 'warning' || hasRecentErrors) {
      return 'warning';
    }
    if (successRate >= 95) {
      return 'healthy';
    }
    return 'warning';
  }, [systemHealth, hasRecentErrors, successRate]);

  return {
    metrics: metrics24h,
    health: systemHealth,
    alerts: recentAlerts,
    performance,
    isHealthy,
    hasRecentErrors,
    successRate,
    overallStatus: overallStatus(),
  };
}
