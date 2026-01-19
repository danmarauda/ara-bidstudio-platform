/**
 * Production Monitoring and Logging System
 * Comprehensive monitoring for Solana payment processing
 */

import { v } from 'convex/values';
import { internalMutation, query } from './_generated/server';

// Event types for monitoring
export const PaymentEventType = v.union(
  v.literal('payment_initiated'),
  v.literal('payment_processing'),
  v.literal('payment_verified'),
  v.literal('payment_failed'),
  v.literal('payment_timeout'),
  v.literal('payment_retry'),
  v.literal('wallet_connected'),
  v.literal('wallet_disconnected'),
  v.literal('verification_started'),
  v.literal('verification_completed'),
  v.literal('verification_failed'),
  v.literal('blockchain_error'),
  v.literal('rpc_error')
);

// Monitoring event interface
export const MonitoringEvent = v.object({
  eventType: PaymentEventType,
  timestamp: v.number(),
  userId: v.optional(v.id('users')),
  sessionId: v.optional(v.string()),
  metadata: v.object({
    txSignature: v.optional(v.string()),
    tier: v.optional(v.union(v.literal('pro'), v.literal('pro_plus'))),
    amount: v.optional(v.number()),
    walletAddress: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    errorCode: v.optional(v.string()),
    retryAttempt: v.optional(v.number()),
    processingTime: v.optional(v.number()),
    network: v.optional(v.string()),
    rpcEndpoint: v.optional(v.string()),
    paymentId: v.optional(v.string()),
    isUpgrade: v.optional(v.boolean()),
    isProrated: v.optional(v.boolean()),
    previousTier: v.optional(
      v.union(v.literal('free'), v.literal('pro'), v.literal('pro_plus'))
    ),
  }),
  severity: v.union(
    v.literal('info'),
    v.literal('warning'),
    v.literal('error'),
    v.literal('critical')
  ),
});

// Log monitoring event (internal mutation for use from HTTP actions)
export const logPaymentEvent = internalMutation({
  args: MonitoringEvent,
  handler: async (ctx, args) => {
    // Store the event in monitoring table
    await ctx.db.insert('paymentEvents', {
      ...args,
      createdAt: Date.now(),
    });

    // For critical events, also log to console for immediate visibility
    if (args.severity === 'critical' || args.severity === 'error') {
      // Intentionally no console usage per lint policy; hook for external logging can be added here.
    }

    return args;
  },
});

// Get payment monitoring metrics
export const getPaymentMetrics = query({
  args: {
    timeframe: v.optional(
      v.union(
        v.literal('1h'),
        v.literal('24h'),
        v.literal('7d'),
        v.literal('30d')
      )
    ),
    eventType: v.optional(PaymentEventType),
  },
  handler: async (ctx, args) => {
    const timeframe = args.timeframe || '24h';
    const now = Date.now();

    // Calculate time range
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };

    const startTime = now - timeRanges[timeframe];

    // Query events in time range
    let dbQuery = ctx.db
      .query('paymentEvents')
      .withIndex('by_timestamp')
      .filter((q) => q.gte(q.field('timestamp'), startTime));

    if (args.eventType) {
      dbQuery = dbQuery.filter((q) =>
        q.eq(q.field('eventType'), args.eventType)
      );
    }

    const events = await dbQuery.collect();

    // Calculate metrics
    const totalEvents = events.length;
    const successfulPayments = events.filter(
      (e) => e.eventType === 'payment_verified'
    ).length;
    const failedPayments = events.filter(
      (e) => e.eventType === 'payment_failed'
    ).length;
    const timeouts = events.filter(
      (e) => e.eventType === 'payment_timeout'
    ).length;
    const retries = events.filter(
      (e) => e.eventType === 'payment_retry'
    ).length;
    const blockchainErrors = events.filter(
      (e) => e.eventType === 'blockchain_error'
    ).length;
    const rpcErrors = events.filter((e) => e.eventType === 'rpc_error').length;

    // Calculate success rate
    const totalPaymentAttempts = successfulPayments + failedPayments;
    const successRate =
      totalPaymentAttempts > 0
        ? (successfulPayments / totalPaymentAttempts) * 100
        : 0;

    // Calculate average processing time
    const processedEvents = events.filter((e) => e.metadata.processingTime);
    const avgProcessingTime =
      processedEvents.length > 0
        ? processedEvents.reduce(
            (sum, e) => sum + (e.metadata.processingTime || 0),
            0
          ) / processedEvents.length
        : 0;

    // Error distribution
    const errorTypes = events
      .filter((e) => e.severity === 'error' || e.severity === 'critical')
      .reduce(
        (acc, e) => {
          const errorCode = e.metadata.errorCode || 'unknown';
          acc[errorCode] = (acc[errorCode] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (successRate <= 80) {
      status = 'critical';
    } else if (successRate <= 95) {
      status = 'warning';
    }

    return {
      timeframe,
      metrics: {
        totalEvents,
        successfulPayments,
        failedPayments,
        timeouts,
        retries,
        blockchainErrors,
        rpcErrors,
        successRate: Math.round(successRate * 100) / 100,
        avgProcessingTime: Math.round(avgProcessingTime),
        errorDistribution: errorTypes,
      },
      health: {
        status,
        uptime: successRate,
        lastError:
          events
            .filter((e) => e.severity === 'error')
            .sort((a, b) => b.timestamp - a.timestamp)[0] || null,
      },
    };
  },
});

// Get payment system alerts
export const getPaymentAlerts = query({
  args: {
    severity: v.optional(
      v.union(v.literal('warning'), v.literal('error'), v.literal('critical'))
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const severity = args.severity || 'warning';
    const limit = args.limit || 50;

    const alerts = await ctx.db
      .query('paymentEvents')
      .withIndex('by_severity_timestamp')
      .filter((q) => q.gte(q.field('severity'), severity))
      .order('desc')
      .take(limit);

    return alerts.map((alert) => ({
      id: alert._id,
      eventType: alert.eventType,
      severity: alert.severity,
      timestamp: alert.timestamp,
      message: alert.metadata.errorMessage || 'No message',
      metadata: alert.metadata,
    }));
  },
});

// Payment performance analytics
export const getPaymentPerformance = query({
  args: {
    timeframe: v.optional(
      v.union(v.literal('1h'), v.literal('24h'), v.literal('7d'))
    ),
  },
  handler: async (ctx, args) => {
    const timeframe = args.timeframe || '24h';
    const now = Date.now();

    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
    };

    const startTime = now - timeRanges[timeframe];

    const events = await ctx.db
      .query('paymentEvents')
      .withIndex('by_timestamp')
      .filter((q) => q.gte(q.field('timestamp'), startTime))
      .collect();

    // Group events by hour for trending
    const hourlyBuckets: Record<
      string,
      {
        successful: number;
        failed: number;
        avgProcessingTime: number;
        processedTimes: number[];
      }
    > = {};

    for (const event of events) {
      const hour = new Date(event.timestamp).toISOString().slice(0, 13); // YYYY-MM-DDTHH

      if (!hourlyBuckets[hour]) {
        hourlyBuckets[hour] = {
          successful: 0,
          failed: 0,
          avgProcessingTime: 0,
          processedTimes: [],
        };
      }

      if (event.eventType === 'payment_verified') {
        hourlyBuckets[hour].successful++;
        if (event.metadata.processingTime) {
          hourlyBuckets[hour].processedTimes.push(
            event.metadata.processingTime
          );
        }
      } else if (event.eventType === 'payment_failed') {
        hourlyBuckets[hour].failed++;
      }
    }

    // Calculate averages
    for (const hour of Object.keys(hourlyBuckets)) {
      const bucket = hourlyBuckets[hour];
      if (bucket.processedTimes.length > 0) {
        bucket.avgProcessingTime =
          bucket.processedTimes.reduce((a, b) => a + b, 0) /
          bucket.processedTimes.length;
      }
    }

    const hourlyEntries = Object.entries(hourlyBuckets)
      .map(([hour, data]) => ({
        hour,
        successful: data.successful,
        failed: data.failed,
        successRate:
          data.successful + data.failed > 0
            ? (data.successful / (data.successful + data.failed)) * 100
            : 0,
        avgProcessingTime: Math.round(data.avgProcessingTime),
      }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    return {
      timeframe,
      hourlyData: hourlyEntries,
    };
  },
});

// Check payment system health
export const checkPaymentSystemHealth = query({
  args: {},
  handler: async (ctx, _args) => {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    const last1h = now - 60 * 60 * 1000;

    // Get recent events
    const recentEvents = await ctx.db
      .query('paymentEvents')
      .withIndex('by_timestamp')
      .filter((q) => q.gte(q.field('timestamp'), last24h))
      .collect();

    const lastHourEvents = recentEvents.filter((e) => e.timestamp >= last1h);

    // Calculate health metrics
    const criticalErrors = recentEvents.filter(
      (e) => e.severity === 'critical'
    ).length;
    const errors = recentEvents.filter((e) => e.severity === 'error').length;
    const warnings = recentEvents.filter(
      (e) => e.severity === 'warning'
    ).length;

    const successfulPayments = recentEvents.filter(
      (e) => e.eventType === 'payment_verified'
    ).length;
    const failedPayments = recentEvents.filter(
      (e) => e.eventType === 'payment_failed'
    ).length;
    const totalPayments = successfulPayments + failedPayments;

    const successRate =
      totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 100;

    // Recent processing times
    const recentProcessingTimes = lastHourEvents
      .filter((e) => e.metadata.processingTime)
      .map((e) => e.metadata.processingTime ?? 0)
      .sort((a, b) => a - b);

    const p95ProcessingTime =
      recentProcessingTimes.length > 0
        ? recentProcessingTimes[Math.floor(recentProcessingTimes.length * 0.95)]
        : 0;

    // Determine overall health status
    let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalErrors > 0 || successRate < 80) {
      healthStatus = 'critical';
    } else if (errors > 5 || successRate < 95 || p95ProcessingTime > 30_000) {
      healthStatus = 'warning';
    }

    return {
      status: healthStatus,
      timestamp: now,
      metrics: {
        last24h: {
          totalEvents: recentEvents.length,
          successfulPayments,
          failedPayments,
          successRate: Math.round(successRate * 100) / 100,
          criticalErrors,
          errors,
          warnings,
        },
        lastHour: {
          totalEvents: lastHourEvents.length,
          avgProcessingTime:
            recentProcessingTimes.length > 0
              ? Math.round(
                  recentProcessingTimes.reduce((a, b) => a + b, 0) /
                    recentProcessingTimes.length
                )
              : 0,
          p95ProcessingTime: Math.round(p95ProcessingTime),
        },
      },
      alerts: recentEvents
        .filter((e) => e.severity === 'critical' || e.severity === 'error')
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10)
        .map((e) => ({
          eventType: e.eventType,
          severity: e.severity,
          timestamp: e.timestamp,
          message: e.metadata.errorMessage || 'No message',
        })),
    };
  },
});
