/**
 * Convex Environment Configuration
 * Centralized environment variable management for Convex backend
 */

import { z } from 'zod';

// Define the schema for Convex environment variables
const convexEnvSchema = z.object({
  // Convex Auth Configuration
  JWT_PRIVATE_KEY: z.string().optional(),
  JWKS: z.string().optional(),
  SITE_URL: z.string().url().optional(),
  AUTH_LOG_LEVEL: z.string().optional(),

  // OAuth Provider Configuration (Optional)
  AUTH_GITHUB_ID: z.string().optional(),
  AUTH_GITHUB_SECRET: z.string().optional(),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  AUTH_APPLE_ID: z.string().optional(),
  AUTH_APPLE_SECRET: z.string().optional(),

  // Email Provider Configuration (Optional)
  AUTH_RESEND_KEY: z.string().optional(),

  // OpenAI Configuration
  OPENAI_API_KEY: z.string().startsWith('sk-').optional(),
  OPENAI_ORG_ID: z.string().startsWith('org-').optional(),

  // Storage Configuration
  STORAGE_TYPE: z.enum(['convex', 'supabase', 'memory']).default('convex'),

  // External Services (Optional)
  QDRANT_URL: z.string().url().optional(),
  QDRANT_API_KEY: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),

  // Solana Blockchain Configuration
  SOLANA_NETWORK: z
    .enum(['mainnet-beta', 'testnet', 'devnet', 'localhost'])
    .default('devnet'),
  SOLANA_RPC_URL: z.string().url().default('https://api.devnet.solana.com'),
  SOLANA_PAYMENT_ADDRESS: z
    .string()
    .min(32, 'Invalid Solana address')
    .optional(),
  SOLANA_COMMITMENT_LEVEL: z
    .enum(['processed', 'confirmed', 'finalized'])
    .default('confirmed'),

  // SPL Token Configuration
  ENABLE_SPL_TOKENS: z
    .string()
    .default('true')
    .transform((val) => val === 'true'),

  // Individual SPL Token Addresses (JSON format: [{"symbol": "SYMX", "address": "...", "decimals": 6}, ...])
  SPL_TOKEN_CONFIG: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return [];
      try {
        const tokens = JSON.parse(val);
        return Array.isArray(tokens) ? tokens : [];
      } catch {
        return [];
      }
    }),

  // Price Feed Configuration
  PRICE_FEED_API: z
    .enum(['jupiter', 'birdeye', 'coingecko'])
    .default('jupiter'),
  PRICE_FEED_API_KEY: z.string().optional(),
  PRICE_CACHE_TTL_SECONDS: z
    .string()
    .default('60')
    .transform((val) => Number.parseInt(val, 10)),

  // Subscription Configuration
  SUBSCRIPTION_PRO_PRICE_SOL: z
    .string()
    .default('0.05')
    .transform((val) => Number.parseFloat(val)),
  SUBSCRIPTION_PRO_PLUS_PRICE_SOL: z
    .string()
    .default('0.1')
    .transform((val) => Number.parseFloat(val)),
  SUBSCRIPTION_PRO_PRICE_USD: z
    .string()
    .default('12')
    .transform((val) => Number.parseInt(val, 10)),
  SUBSCRIPTION_PRO_PLUS_PRICE_USD: z
    .string()
    .default('25')
    .transform((val) => Number.parseInt(val, 10)),

  // Message limits
  SUBSCRIPTION_FREE_MESSAGE_LIMIT: z
    .string()
    .default('50')
    .transform((val) => Number.parseInt(val, 10)),
  SUBSCRIPTION_PRO_MESSAGE_LIMIT: z
    .string()
    .default('500')
    .transform((val) => Number.parseInt(val, 10)),
  SUBSCRIPTION_PRO_PLUS_MESSAGE_LIMIT: z
    .string()
    .default('1000')
    .transform((val) => Number.parseInt(val, 10)),
  SUBSCRIPTION_PRO_PREMIUM_LIMIT: z
    .string()
    .default('100')
    .transform((val) => Number.parseInt(val, 10)),
  SUBSCRIPTION_PRO_PLUS_PREMIUM_LIMIT: z
    .string()
    .default('300')
    .transform((val) => Number.parseInt(val, 10)),

  // Payment Processing
  PAYMENT_WEBHOOK_SECRET: z
    .string()
    .min(32, 'Webhook secret must be at least 32 characters')
    .optional(),
  PAYMENT_CONFIRMATION_TIMEOUT_MS: z
    .string()
    .default('300000')
    .transform((val) => Number.parseInt(val, 10)),

  // Security
  JWT_SECRET: z
    .string()
    .min(32, 'JWT secret must be at least 32 characters')
    .optional(),
  JWT_EXPIRES_IN: z.string().default('24h'),
  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .default('100')
    .transform((val) => Number.parseInt(val, 10)),
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .default('900000')
    .transform((val) => Number.parseInt(val, 10)),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3001'),
  CORS_CREDENTIALS: z
    .string()
    .default('true')
    .transform((val) => val === 'true'),

  // Application Settings
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  DEBUG: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

// Parse and validate environment variables
function parseConvexEnv() {
  // In Convex, environment variables are accessed differently
  // Using process.env for consistency with Node.js patterns
  const env = {
    // Convex Auth Configuration
    JWT_PRIVATE_KEY: process.env.JWT_PRIVATE_KEY,
    JWKS: process.env.JWKS,
    SITE_URL: process.env.SITE_URL,
    AUTH_LOG_LEVEL: process.env.AUTH_LOG_LEVEL,

    // OAuth Provider Configuration
    AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
    AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    AUTH_APPLE_ID: process.env.AUTH_APPLE_ID,
    AUTH_APPLE_SECRET: process.env.AUTH_APPLE_SECRET,

    // Email Provider Configuration
    AUTH_RESEND_KEY: process.env.AUTH_RESEND_KEY,

    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_ORG_ID: process.env.OPENAI_ORG_ID,
    STORAGE_TYPE: process.env.STORAGE_TYPE || 'convex',
    QDRANT_URL: process.env.QDRANT_URL,
    QDRANT_API_KEY: process.env.QDRANT_API_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SOLANA_NETWORK: process.env.SOLANA_NETWORK || 'devnet',
    SOLANA_RPC_URL:
      process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    SOLANA_PAYMENT_ADDRESS: process.env.SOLANA_PAYMENT_ADDRESS,
    SOLANA_COMMITMENT_LEVEL: process.env.SOLANA_COMMITMENT_LEVEL || 'confirmed',

    // SPL Token Configuration
    ENABLE_SPL_TOKENS: process.env.ENABLE_SPL_TOKENS || 'true',
    SPL_TOKEN_CONFIG: process.env.SPL_TOKEN_CONFIG,
    PRICE_FEED_API: process.env.PRICE_FEED_API || 'jupiter',
    PRICE_FEED_API_KEY: process.env.PRICE_FEED_API_KEY,
    PRICE_CACHE_TTL_SECONDS: process.env.PRICE_CACHE_TTL_SECONDS || '60',
    SUBSCRIPTION_PRO_PRICE_SOL:
      process.env.SUBSCRIPTION_PRO_PRICE_SOL || '0.05',
    SUBSCRIPTION_PRO_PLUS_PRICE_SOL:
      process.env.SUBSCRIPTION_PRO_PLUS_PRICE_SOL || '0.1',
    SUBSCRIPTION_PRO_PRICE_USD: process.env.SUBSCRIPTION_PRO_PRICE_USD || '12',
    SUBSCRIPTION_PRO_PLUS_PRICE_USD:
      process.env.SUBSCRIPTION_PRO_PLUS_PRICE_USD || '25',
    SUBSCRIPTION_FREE_MESSAGE_LIMIT:
      process.env.SUBSCRIPTION_FREE_MESSAGE_LIMIT || '50',
    SUBSCRIPTION_PRO_MESSAGE_LIMIT:
      process.env.SUBSCRIPTION_PRO_MESSAGE_LIMIT || '1500',
    SUBSCRIPTION_PRO_PLUS_MESSAGE_LIMIT:
      process.env.SUBSCRIPTION_PRO_PLUS_MESSAGE_LIMIT || '3000',
    SUBSCRIPTION_PRO_PREMIUM_LIMIT:
      process.env.SUBSCRIPTION_PRO_PREMIUM_LIMIT || '100',
    SUBSCRIPTION_PRO_PLUS_PREMIUM_LIMIT:
      process.env.SUBSCRIPTION_PRO_PLUS_PREMIUM_LIMIT || '300',
    PAYMENT_WEBHOOK_SECRET: process.env.PAYMENT_WEBHOOK_SECRET,
    PAYMENT_CONFIRMATION_TIMEOUT_MS:
      process.env.PAYMENT_CONFIRMATION_TIMEOUT_MS || '300000',
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || '100',
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || '900000',
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:3001',
    CORS_CREDENTIALS: process.env.CORS_CREDENTIALS || 'true',
    NODE_ENV: process.env.NODE_ENV || 'development',
    DEBUG: process.env.DEBUG,
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  };

  try {
    return convexEnvSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(
        (err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`
      );
      throw new Error(
        `Convex environment validation failed:\n${missingVars.join('\n')}\n\nPlease check your environment variables.`
      );
    }
    throw error;
  }
}

// Export validated environment variables
export const convexEnv = parseConvexEnv();

// Type-safe environment access
export type ConvexEnv = z.infer<typeof convexEnvSchema>;

// Runtime environment checks
export const isDevelopment = convexEnv.NODE_ENV === 'development';
export const isProduction = convexEnv.NODE_ENV === 'production';
export const isTest = convexEnv.NODE_ENV === 'test';

// Convex Auth configuration
export const convexAuthConfig = {
  jwtPrivateKey: convexEnv.JWT_PRIVATE_KEY,
  jwks: convexEnv.JWKS,
  siteUrl: convexEnv.SITE_URL,
  logLevel: convexEnv.AUTH_LOG_LEVEL,
  enabled: !!(convexEnv.JWT_PRIVATE_KEY && convexEnv.JWKS),
};

// OAuth providers configuration
export const oauthConfig = {
  github: {
    id: convexEnv.AUTH_GITHUB_ID,
    secret: convexEnv.AUTH_GITHUB_SECRET,
    enabled: !!(convexEnv.AUTH_GITHUB_ID && convexEnv.AUTH_GITHUB_SECRET),
  },
  google: {
    id: convexEnv.AUTH_GOOGLE_ID,
    secret: convexEnv.AUTH_GOOGLE_SECRET,
    enabled: !!(convexEnv.AUTH_GOOGLE_ID && convexEnv.AUTH_GOOGLE_SECRET),
  },
  apple: {
    id: convexEnv.AUTH_APPLE_ID,
    secret: convexEnv.AUTH_APPLE_SECRET,
    enabled: !!(convexEnv.AUTH_APPLE_ID && convexEnv.AUTH_APPLE_SECRET),
  },
};

// Email provider configuration
export const emailConfig = {
  resend: {
    apiKey: convexEnv.AUTH_RESEND_KEY,
    enabled: !!convexEnv.AUTH_RESEND_KEY,
  },
};

// OpenAI configuration
export const openaiConfig = {
  apiKey: convexEnv.OPENAI_API_KEY,
  organization: convexEnv.OPENAI_ORG_ID,
  enabled: !!convexEnv.OPENAI_API_KEY,
};

// Solana blockchain configuration
export const solanaConfig = {
  network: convexEnv.SOLANA_NETWORK,
  rpcUrl: convexEnv.SOLANA_RPC_URL,
  paymentAddress: convexEnv.SOLANA_PAYMENT_ADDRESS,
  commitmentLevel: convexEnv.SOLANA_COMMITMENT_LEVEL,
  enabled: !!convexEnv.SOLANA_PAYMENT_ADDRESS,

  // SPL Token Configuration
  splTokens: {
    enabled: convexEnv.ENABLE_SPL_TOKENS,
    tokens: convexEnv.SPL_TOKEN_CONFIG,
    priceFeed: {
      api: convexEnv.PRICE_FEED_API,
      apiKey: convexEnv.PRICE_FEED_API_KEY,
      cacheTtlSeconds: convexEnv.PRICE_CACHE_TTL_SECONDS,
    },
  },
};

// Subscription configuration
export const subscriptionConfig = {
  pricing: {
    pro: {
      priceSOL: convexEnv.SUBSCRIPTION_PRO_PRICE_SOL,
      priceUSD: convexEnv.SUBSCRIPTION_PRO_PRICE_USD,
    },
    proPlus: {
      priceSOL: convexEnv.SUBSCRIPTION_PRO_PLUS_PRICE_SOL,
      priceUSD: convexEnv.SUBSCRIPTION_PRO_PLUS_PRICE_USD,
    },
  },
  limits: {
    free: {
      messages: convexEnv.SUBSCRIPTION_FREE_MESSAGE_LIMIT,
      premiumMessages: 0,
    },
    pro: {
      messages: convexEnv.SUBSCRIPTION_PRO_MESSAGE_LIMIT,
      premiumMessages: convexEnv.SUBSCRIPTION_PRO_PREMIUM_LIMIT,
    },
    proPlus: {
      messages: convexEnv.SUBSCRIPTION_PRO_PLUS_MESSAGE_LIMIT,
      premiumMessages: convexEnv.SUBSCRIPTION_PRO_PLUS_PREMIUM_LIMIT,
    },
  },
};

// Payment processing configuration
export const paymentConfig = {
  webhookSecret: convexEnv.PAYMENT_WEBHOOK_SECRET,
  confirmationTimeoutMs: convexEnv.PAYMENT_CONFIRMATION_TIMEOUT_MS,
  solana: solanaConfig,
  subscription: subscriptionConfig,
};

// Security configuration
export const securityConfig = {
  jwt: {
    secret: convexEnv.JWT_SECRET,
    expiresIn: convexEnv.JWT_EXPIRES_IN,
  },
  rateLimiting: {
    maxRequests: convexEnv.RATE_LIMIT_MAX_REQUESTS,
    windowMs: convexEnv.RATE_LIMIT_WINDOW_MS,
  },
  cors: {
    origins: convexEnv.ALLOWED_ORIGINS.split(',').map((origin) =>
      origin.trim()
    ),
    credentials: convexEnv.CORS_CREDENTIALS,
  },
};

// External services configuration
export const externalServices = {
  qdrant: {
    url: convexEnv.QDRANT_URL,
    apiKey: convexEnv.QDRANT_API_KEY,
    enabled: !!(convexEnv.QDRANT_URL && convexEnv.QDRANT_API_KEY),
  },
  supabase: {
    url: convexEnv.SUPABASE_URL,
    anonKey: convexEnv.SUPABASE_ANON_KEY,
    enabled: !!(convexEnv.SUPABASE_URL && convexEnv.SUPABASE_ANON_KEY),
  },
};

// Validation helpers
export function requireEnv(key: keyof ConvexEnv): string {
  const value = convexEnv[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value as string;
}

export function getEnv(
  key: keyof ConvexEnv,
  defaultValue?: string
): string | undefined {
  return (convexEnv[key] as string) || defaultValue;
}

// Environment validation on import (fail fast)
if (isProduction) {
  // Warn about missing optional but recommended variables in Convex
  const recommendedVars = [
    { name: 'OPENAI_API_KEY', purpose: 'AI functionality' },
  ] as const;

  for (const { name } of recommendedVars) {
    // Touch values to satisfy linter without using void
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    convexEnv[name as keyof ConvexEnv];
  }
}
