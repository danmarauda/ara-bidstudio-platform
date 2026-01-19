/**
 * Logger Utility
 * High-performance logging system with browser/server compatibility
 */

import type { Logger } from 'pino';
import pino from 'pino';

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';
const _isTest = process.env.NODE_ENV === 'test';
const isBrowser = typeof window !== 'undefined';

// Pino configuration
const getLogLevel = (): string => {
  if (isDevelopment) {
    return 'debug';
  }
  if (isProduction) {
    return 'info';
  }
  return 'warn';
};

const pinoConfig: pino.LoggerOptions = {
  name: 'anubis-chat',
  level: getLogLevel(),
  base: {
    service: 'anubis-chat',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  },
  // Pino's default timestamp is faster than custom formatting
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    // Add severity for Google Cloud Logging compatibility
    level: (_label, number) => {
      const severityMap = {
        10: 'DEBUG', // trace
        20: 'DEBUG', // debug
        30: 'INFO', // info
        40: 'WARNING', // warn
        50: 'ERROR', // error
        60: 'CRITICAL', // fatal
      } as const;
      return {
        severity: severityMap[number as keyof typeof severityMap] || 'INFO',
        level: number,
      };
    },
  },
  // Redact sensitive information
  redact: {
    paths: [
      'password',
      'secret',
      'token',
      'key',
      'authorization',
      'cookie',
      'session',
      'privateKey',
      'apiKey',
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.secret',
      '*.token',
      '*.key',
      '*.authorization',
    ],
    censor: '[REDACTED]',
  },
  // Browser configuration - use console instead of transports
  browser: {
    serialize: true,
    write: isDevelopment
      ? {
          debug: (_o: object) => {
            // Silent in development
          },
          info: (_o: object) => {
            // Silent in development
          },
          warn: (_o: object) => {
            // Silent in development
          },
          error: (_o: object) => {
            // Silent in development
          },
          fatal: (_o: object) => {
            // Silent in development
          },
          trace: (_o: object) => {
            // Silent in development
          },
        }
      : {
          debug: () => {
            // Silent in production
          },
          info: () => {
            // Silent in production
          },
          warn: (_o: object) => {
            // Silent in production
          },
          error: (_o: object) => {
            // Silent in production
          },
          fatal: (_o: object) => {
            // Silent in production
          },
          trace: () => {
            // Silent in production
          },
        },
  },
};

// Create logger without transport for browser compatibility
// Transports with workers don't work well with Next.js/Turbopack
const logger: Logger =
  isBrowser || isDevelopment
    ? pino(pinoConfig)
    : pino(pinoConfig, pino.destination({ sync: false }));

// Export logger interface with enhanced methods
export type LogMeta = Record<string, unknown>;

export interface AppLogger {
  fatal(message: string, meta?: LogMeta): void;
  error(message: string, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  info(message: string, meta?: LogMeta): void;
  debug(message: string, meta?: LogMeta): void;
  trace(message: string, meta?: LogMeta): void;
  apiRequest(event: string, meta?: LogMeta): void;
  dbOperation(event: string, meta?: LogMeta): void;
  auth(message: string, walletAddress?: string, meta?: LogMeta): void;
}

// Enhanced logger wrapper with additional functionality
class EnhancedLogger implements AppLogger {
  private pino: Logger;

  constructor(pinoLogger: Logger) {
    this.pino = pinoLogger;
  }

  fatal(message: string, meta?: LogMeta): void {
    if (meta) {
      this.pino.fatal(meta, message);
    } else {
      this.pino.fatal(message);
    }
  }

  error(message: string, meta?: LogMeta): void {
    if (meta) {
      this.pino.error(meta, message);
    } else {
      this.pino.error(message);
    }
  }

  warn(message: string, meta?: LogMeta): void {
    if (meta) {
      this.pino.warn(meta, message);
    } else {
      this.pino.warn(message);
    }
  }

  info(message: string, meta?: LogMeta): void {
    if (meta) {
      this.pino.info(meta, message);
    } else {
      this.pino.info(message);
    }
  }

  debug(message: string, meta?: LogMeta): void {
    if (meta) {
      this.pino.debug(meta, message);
    } else {
      this.pino.debug(message);
    }
  }

  trace(message: string, meta?: LogMeta): void {
    if (meta) {
      this.pino.trace(meta, message);
    } else {
      this.pino.trace(message);
    }
  }

  apiRequest(event: string, meta?: LogMeta): void {
    this.pino.info(
      {
        logType: 'api_request',
        event,
        ...(meta || {}),
      },
      event
    );
  }

  dbOperation(event: string, meta?: LogMeta): void {
    this.pino.debug(
      {
        logType: 'db_operation',
        event,
        ...(meta || {}),
      },
      event
    );
  }

  auth(message: string, walletAddress?: string, meta?: LogMeta): void {
    this.pino.info(
      {
        logType: 'auth',
        walletAddress,
        ...(meta || {}),
      },
      message
    );
  }
}

// Create enhanced logger instance
const appLogger = new EnhancedLogger(logger);

// Helper function to create module-specific loggers
export function createModuleLogger(module: string): AppLogger {
  const childLogger = logger.child({ module });
  return new EnhancedLogger(childLogger);
}

// Export default logger
export default appLogger;

// Intentionally do not re-export imported modules to satisfy style rules

// Usage examples:
// import logger from '@/lib/utils/logger';
// logger.info('Application started');
// logger.error('An error occurred', { error, userId: '123' });
//
// Module-specific logger:
// const log = createModuleLogger('auth');
// log.debug('User authentication attempt', { username });
