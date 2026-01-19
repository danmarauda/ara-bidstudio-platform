/**
 * Agent Manager
 * Handles agent loading, caching, and optimization
 */

import type { Doc, Id } from '../../_generated/dataModel';
import {
  type AgentConfig,
  ANUBIS_OPTIMIZED_PROMPT,
  anubisAgent,
} from './anubisAgent';

// Agent cache to avoid reloading on every message
const agentCache = new Map<string, Doc<'agents'>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string, number>();

/**
 * Get agent configuration with caching
 */
export async function getAgentConfig(
  ctx: any,
  agentId: Id<'agents'> | undefined
): Promise<Doc<'agents'> | null> {
  if (!agentId) return null;

  const cacheKey = agentId.toString();
  const cached = agentCache.get(cacheKey);
  const timestamp = cacheTimestamps.get(cacheKey);

  // Return cached agent if still valid
  if (cached && timestamp && Date.now() - timestamp < CACHE_TTL) {
    return cached;
  }

  // Fetch agent from database
  const agent = await ctx.db.get(agentId);
  if (!agent) return null;

  // Apply optimizations for known agents
  const optimizedAgent = optimizeAgent(agent);

  // Cache the agent
  agentCache.set(cacheKey, optimizedAgent);
  cacheTimestamps.set(cacheKey, Date.now());

  return optimizedAgent;
}

/**
 * Optimize agent prompts for token efficiency
 */
function optimizeAgent(agent: Doc<'agents'>): Doc<'agents'> {
  // Special handling for Anubis agent
  if (agent.name === 'Anubis' && !agent.systemPrompt.includes('IDENTITY:')) {
    return {
      ...agent,
      systemPrompt: ANUBIS_OPTIMIZED_PROMPT,
      maxTokens: Math.min(agent.maxTokens || 4000, 2000), // Cap at 2000 tokens
    };
  }

  // Generic optimization for other agents
  if (agent.systemPrompt.length > 1000) {
    return {
      ...agent,
      systemPrompt: compressPrompt(agent.systemPrompt),
      maxTokens: Math.min(agent.maxTokens || 4000, 2500),
    };
  }

  return agent;
}

/**
 * Compress long prompts while maintaining key information
 */
function compressPrompt(prompt: string): string {
  // Remove excessive whitespace and formatting
  let compressed = prompt
    .replace(/\n{3,}/g, '\n\n') // Multiple newlines to double
    .replace(/#{2,}\s*/g, '') // Remove markdown headers
    .replace(/\*{2,}/g, '') // Remove bold formatting
    .replace(/\s{2,}/g, ' ') // Multiple spaces to single
    .trim();

  // Remove redundant phrases
  const redundantPhrases = [
    /you are an? /gi,
    /you should /gi,
    /you must /gi,
    /make sure to /gi,
    /it is important to /gi,
    /always remember to /gi,
    /never forget to /gi,
  ];

  redundantPhrases.forEach((phrase) => {
    compressed = compressed.replace(phrase, '');
  });

  // Shorten common instructions
  const replacements: [RegExp, string][] = [
    [/artificial intelligence assistant/gi, 'AI'],
    [/provide helpful responses/gi, 'be helpful'],
    [/maintain a professional tone/gi, 'be professional'],
    [/should be concise/gi, 'be concise'],
    [/should be clear/gi, 'be clear'],
  ];

  replacements.forEach(([pattern, replacement]) => {
    compressed = compressed.replace(pattern, replacement);
  });

  return compressed;
}

/**
 * Clear agent cache (call when agents are updated)
 */
export function clearAgentCache(agentId?: Id<'agents'>) {
  if (agentId) {
    agentCache.delete(agentId.toString());
    cacheTimestamps.delete(agentId.toString());
  } else {
    agentCache.clear();
    cacheTimestamps.clear();
  }
}

/**
 * Get default agents configuration
 */
export function getDefaultAgents(): AgentConfig[] {
  return [anubisAgent];
}

/**
 * Token optimization settings
 */
export const TOKEN_OPTIMIZATION = {
  // Maximum tokens for different message types
  MAX_SYSTEM_PROMPT_TOKENS: 200,
  MAX_USER_MESSAGE_TOKENS: 1000,
  MAX_ASSISTANT_RESPONSE_TOKENS: 2000,

  // Context window management
  MAX_CONTEXT_MESSAGES: 10, // Reduced from unlimited
  MAX_CONTEXT_TOKENS: 4000,

  // Optimization flags
  COMPRESS_SYSTEM_PROMPTS: true,
  REMOVE_REDUNDANT_CONTEXT: true,
  USE_SUMMARY_FOR_OLD_MESSAGES: true,

  // Cached input optimization
  ENABLE_PROMPT_CACHING: true,
  CACHE_TTL_MS: 30 * 60 * 1000, // 30 minutes
  CACHE_HIT_DISCOUNT: 0.9, // 90% discount on cached tokens
};

/**
 * Prompt cache for reducing token costs
 */
const promptCache = new Map<
  string,
  { prompt: string; timestamp: number; hits: number }
>();

/**
 * Get or cache a prompt for reuse
 */
export function getCachedPrompt(
  key: string,
  generator: () => string
): { prompt: string; cached: boolean } {
  if (!TOKEN_OPTIMIZATION.ENABLE_PROMPT_CACHING) {
    return { prompt: generator(), cached: false };
  }

  const cached = promptCache.get(key);
  const now = Date.now();

  if (cached && now - cached.timestamp < TOKEN_OPTIMIZATION.CACHE_TTL_MS) {
    // Cache hit - update hit count
    promptCache.set(key, { ...cached, hits: cached.hits + 1 });
    return { prompt: cached.prompt, cached: true };
  }

  // Cache miss - generate and cache
  const prompt = generator();
  promptCache.set(key, { prompt, timestamp: now, hits: 0 });
  return { prompt, cached: false };
}

/**
 * Token usage tracking
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cachedTokens: number;
  estimatedCost: number;
  model: string;
  timestamp: number;
}

/**
 * Estimate token count (rough approximation)
 * More accurate than simple character count
 */
export function estimateTokens(text: string): number {
  // Average tokens per character varies by content type
  // Code: ~3.5 chars/token
  // English: ~4 chars/token
  // Complex text: ~3 chars/token

  const hasCode = /```|function|const|let|var|if|for|while/.test(text);
  const charsPerToken = hasCode ? 3.5 : 4;

  return Math.ceil(text.length / charsPerToken);
}

/**
 * Truncate message to token limit
 */
export function truncateToTokenLimit(text: string, maxTokens: number): string {
  const estimatedTokens = estimateTokens(text);

  if (estimatedTokens <= maxTokens) {
    return text;
  }

  // Calculate approximate character limit
  const charLimit = maxTokens * 4;
  const truncated = text.substring(0, charLimit);

  // Try to end at a sentence boundary
  const lastPeriod = truncated.lastIndexOf('.');
  const lastQuestion = truncated.lastIndexOf('?');
  const lastExclamation = truncated.lastIndexOf('!');

  const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation);

  if (lastSentenceEnd > charLimit * 0.8) {
    return truncated.substring(0, lastSentenceEnd + 1);
  }

  return truncated + '...';
}

export type { AgentConfig } from './anubisAgent';
