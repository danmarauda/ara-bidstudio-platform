/**
 * Environment Configuration for anubis.chat
 * Centralized environment variable management with validation
 */

import { z } from 'zod';
import { createModuleLogger } from './utils/logger';

// =============================================================================
// Helpers
// =============================================================================

const TRAILING_SLASH_REGEX = /\/+$/;
function stripTrailingSlash(value: string): string {
  return value.replace(TRAILING_SLASH_REGEX, '');
}

const log = createModuleLogger('env');

// Define the schema for environment variables
const envSchema = z.object({
  // Application
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3001'),

  // OpenAI Configuration
  OPENAI_API_KEY: z.string().startsWith('sk-').optional(),
  OPENAI_ORG_ID: z.string().startsWith('org-').optional(),

  // OpenRouter Configuration (primary provider)
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_SITE_URL: z.string().url().optional(),
  OPENROUTER_APP_NAME: z.string().optional(),

  // Convex Backend
  CONVEX_DEPLOYMENT: z.string().optional(),
  CONVEX_URL: z
    .string()
    .url()
    .optional()
    .transform((val) => (val ? stripTrailingSlash(val) : val)),
  NEXT_PUBLIC_CONVEX_URL: z
    .string()
    .url()
    .optional()
    .transform((val) => (val ? stripTrailingSlash(val) : val)),

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

  // Legacy JWT and Authentication (Deprecated)
  JWT_SECRET: z.string().min(32).optional(),
  JWT_EXPIRES_IN: z.string().default('24h'),

  // CORS and Security
  ALLOWED_ORIGINS: z.string().default('http://localhost:3001'),
  CORS_CREDENTIALS: z
    .string()
    .default('true')
    .transform((val) => val === 'true'),

  // Rate Limiting
  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .default('100')
    .transform((val) => Number.parseInt(val, 10)),
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .default('900000')
    .transform((val) => Number.parseInt(val, 10)),

  // Database
  STORAGE_TYPE: z.enum(['convex', 'supabase', 'memory']).default('convex'),

  // External Services (Optional)
  QDRANT_URL: z.string().url().optional(),
  QDRANT_API_KEY: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),

  // Solana Payment Configuration
  NEXT_PUBLIC_SOLANA_NETWORK: z
    .enum(['mainnet-beta', 'testnet', 'devnet', 'localhost'])
    .default('devnet'),
  NEXT_PUBLIC_SOLANA_RPC_URL: z
    .string()
    .url()
    .default('https://api.devnet.solana.com'),
  NEXT_PUBLIC_APP_DOMAIN: z.string().default('abubis.chat'),
  NEXT_PUBLIC_SOLANA_PAYMENT_ADDRESS: z
    .string()
    .min(32, 'Invalid Solana address')
    .optional(),
  NEXT_PUBLIC_PAYMENT_WEBHOOK_URL: z.string().url().optional(),

  // Subscription Pricing
  NEXT_PUBLIC_SUBSCRIPTION_PRO_PRICE_SOL: z
    .string()
    .default('0.05')
    .transform((val) => Number.parseFloat(val)),
  NEXT_PUBLIC_SUBSCRIPTION_PRO_PLUS_PRICE_SOL: z
    .string()
    .default('0.1')
    .transform((val) => Number.parseFloat(val)),
  NEXT_PUBLIC_SUBSCRIPTION_PRO_PRICE_USD: z
    .string()
    .default('12')
    .transform((val) => Number.parseInt(val, 10)),
  NEXT_PUBLIC_SUBSCRIPTION_PRO_PLUS_PRICE_USD: z
    .string()
    .default('25')
    .transform((val) => Number.parseInt(val, 10)),

  // Payment Processing
  NEXT_PUBLIC_PAYMENT_TIMEOUT_MS: z
    .string()
    .default('300000')
    .transform((val) => Number.parseInt(val, 10)),
  NEXT_PUBLIC_SOLANA_COMMITMENT: z
    .enum(['processed', 'confirmed', 'finalized'])
    .default('confirmed'),

  // Development
  DEBUG: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

// Parse and validate environment variables
function parseEnv() {
  const env = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_ORG_ID: process.env.OPENAI_ORG_ID,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENROUTER_SITE_URL: process.env.OPENROUTER_SITE_URL,
    OPENROUTER_APP_NAME: process.env.OPENROUTER_APP_NAME,
    CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT,
    CONVEX_URL: process.env.CONVEX_URL,
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,

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

    // Legacy JWT (Deprecated)
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    CORS_CREDENTIALS: process.env.CORS_CREDENTIALS,
    RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
    STORAGE_TYPE: process.env.STORAGE_TYPE,
    QDRANT_URL: process.env.QDRANT_URL,
    QDRANT_API_KEY: process.env.QDRANT_API_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SOLANA_NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK,
    NEXT_PUBLIC_SOLANA_RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
    NEXT_PUBLIC_APP_DOMAIN: process.env.NEXT_PUBLIC_APP_DOMAIN,
    NEXT_PUBLIC_SOLANA_PAYMENT_ADDRESS:
      process.env.NEXT_PUBLIC_SOLANA_PAYMENT_ADDRESS,
    NEXT_PUBLIC_PAYMENT_WEBHOOK_URL:
      process.env.NEXT_PUBLIC_PAYMENT_WEBHOOK_URL,
    NEXT_PUBLIC_SUBSCRIPTION_PRO_PRICE_SOL:
      process.env.NEXT_PUBLIC_SUBSCRIPTION_PRO_PRICE_SOL,
    NEXT_PUBLIC_SUBSCRIPTION_PRO_PLUS_PRICE_SOL:
      process.env.NEXT_PUBLIC_SUBSCRIPTION_PRO_PLUS_PRICE_SOL,
    NEXT_PUBLIC_SUBSCRIPTION_PRO_PRICE_USD:
      process.env.NEXT_PUBLIC_SUBSCRIPTION_PRO_PRICE_USD,
    NEXT_PUBLIC_SUBSCRIPTION_PRO_PLUS_PRICE_USD:
      process.env.NEXT_PUBLIC_SUBSCRIPTION_PRO_PLUS_PRICE_USD,
    NEXT_PUBLIC_PAYMENT_TIMEOUT_MS: process.env.NEXT_PUBLIC_PAYMENT_TIMEOUT_MS,
    NEXT_PUBLIC_SOLANA_COMMITMENT: process.env.NEXT_PUBLIC_SOLANA_COMMITMENT,
    DEBUG: process.env.DEBUG,
    LOG_LEVEL: process.env.LOG_LEVEL,
  };

  try {
    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(
        (err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`
      );
      throw new Error(
        `Environment validation failed:\n${missingVars.join('\n')}\n\nPlease check your .env.local file.`
      );
    }
    throw error;
  }
}

// Export validated environment variables
export const env = parseEnv();

// Type-safe environment access
export type Env = z.infer<typeof envSchema>;

// Runtime environment checks
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// OpenAI configuration
export const openaiConfig = {
  apiKey: env.OPENAI_API_KEY,
  organization: env.OPENAI_ORG_ID,
  enabled: !!env.OPENAI_API_KEY,
};

// OpenRouter configuration
export const openrouterConfig = {
  apiKey: env.OPENROUTER_API_KEY,
  siteUrl: env.OPENROUTER_SITE_URL,
  appName: env.OPENROUTER_APP_NAME,
  enabled: !!env.OPENROUTER_API_KEY,
};

// Convex configuration
export const convexConfig = {
  deployment: env.CONVEX_DEPLOYMENT,
  url: env.CONVEX_URL,
  publicUrl: env.NEXT_PUBLIC_CONVEX_URL,
  enabled: !!(env.CONVEX_URL || env.NEXT_PUBLIC_CONVEX_URL),
};

// Convex Auth configuration
export const convexAuthConfig = {
  jwtPrivateKey: env.JWT_PRIVATE_KEY,
  jwks: env.JWKS,
  siteUrl: env.SITE_URL,
  logLevel: env.AUTH_LOG_LEVEL,
  enabled: !!(env.JWT_PRIVATE_KEY && env.JWKS),
};

// OAuth providers configuration
export const oauthConfig = {
  github: {
    id: env.AUTH_GITHUB_ID,
    secret: env.AUTH_GITHUB_SECRET,
    enabled: !!(env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET),
  },
  google: {
    id: env.AUTH_GOOGLE_ID,
    secret: env.AUTH_GOOGLE_SECRET,
    enabled: !!(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET),
  },
  apple: {
    id: env.AUTH_APPLE_ID,
    secret: env.AUTH_APPLE_SECRET,
    enabled: !!(env.AUTH_APPLE_ID && env.AUTH_APPLE_SECRET),
  },
};

// Email provider configuration
export const emailConfig = {
  resend: {
    apiKey: env.AUTH_RESEND_KEY,
    enabled: !!env.AUTH_RESEND_KEY,
  },
};

// Legacy JWT configuration (Deprecated - use convexAuthConfig above)
export const jwtConfig = {
  secret: env.JWT_SECRET,
  expiresIn: env.JWT_EXPIRES_IN,
};

// CORS configuration
export const corsConfig = {
  origins: env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()),
  credentials: env.CORS_CREDENTIALS,
};

// Rate limiting configuration
export const rateLimitConfig = {
  maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
};

// Storage configuration
export const storageConfig = {
  type: env.STORAGE_TYPE,
};

// Solana configuration
export const solanaConfig = {
  network: env.NEXT_PUBLIC_SOLANA_NETWORK,
  rpcUrl: env.NEXT_PUBLIC_SOLANA_RPC_URL,
  appDomain: env.NEXT_PUBLIC_APP_DOMAIN,
  paymentAddress: env.NEXT_PUBLIC_SOLANA_PAYMENT_ADDRESS,
  commitment: env.NEXT_PUBLIC_SOLANA_COMMITMENT,
  enabled: !!env.NEXT_PUBLIC_SOLANA_PAYMENT_ADDRESS,
};

// Subscription pricing configuration
export const subscriptionConfig = {
  pro: {
    priceSOL: env.NEXT_PUBLIC_SUBSCRIPTION_PRO_PRICE_SOL,
    priceUSD: env.NEXT_PUBLIC_SUBSCRIPTION_PRO_PRICE_USD,
  },
  proPLus: {
    priceSOL: env.NEXT_PUBLIC_SUBSCRIPTION_PRO_PLUS_PRICE_SOL,
    priceUSD: env.NEXT_PUBLIC_SUBSCRIPTION_PRO_PLUS_PRICE_USD,
  },
};

// Payment processing configuration
export const paymentConfig = {
  webhookUrl: env.NEXT_PUBLIC_PAYMENT_WEBHOOK_URL,
  timeoutMs: env.NEXT_PUBLIC_PAYMENT_TIMEOUT_MS,
  solana: solanaConfig,
  subscription: subscriptionConfig,
};

// External services configuration
export const externalServices = {
  qdrant: {
    url: env.QDRANT_URL,
    apiKey: env.QDRANT_API_KEY,
    enabled: !!(env.QDRANT_URL && env.QDRANT_API_KEY),
  },
  supabase: {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
    enabled: !!(env.SUPABASE_URL && env.SUPABASE_ANON_KEY),
  },
};

// Development configuration
export const devConfig = {
  debug: env.DEBUG,
  logLevel: env.LOG_LEVEL,
  isDevelopment,
  isProduction,
  isTest,
};

// Validation helpers
export function requireEnv(key: keyof Env): string {
  const value = env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value as string;
}

export function getEnv(
  key: keyof Env,
  defaultValue?: string
): string | undefined {
  return (env[key] as string) || defaultValue;
}

// Environment validation on import (fail fast)
if (isProduction) {
  // Server-side critical variables (JWT_SECRET is validated in server modules that use it)
  // Client-side required production variables
  const requiredProdVars: string[] = [
    // Add any required client-side production variables here
  ];

  for (const varName of requiredProdVars) {
    if (!env[varName as keyof Env]) {
      throw new Error(
        `Required production environment variable ${varName} is not set`
      );
    }
  }

  // Warn about missing optional but recommended variables
  const recommendedVars = [
    { name: 'OPENAI_API_KEY', purpose: 'AI functionality' },
    { name: 'CONVEX_URL', purpose: 'Backend database' },
    { name: 'JWT_SECRET', purpose: 'Authentication (server-side)' },
  ] as const;

  for (const { name, purpose } of recommendedVars) {
    if (!env[name as keyof Env]) {
      log.warn('Environment variable not set', { name, purpose });
    }
  }

  // Special validation for JWT_SECRET (warning only in client context)
  if (typeof window === 'undefined' && !env.JWT_SECRET) {
    // We're in a server context without JWT_SECRET
    log.warn('JWT_SECRET not configured - authentication will not work');
  }
}
