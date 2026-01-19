/**
 * Agent Data Conversion Utilities
 * Shared utilities for converting between Convex documents and API format
 */

import type { Doc } from '@convex/_generated/dataModel';
import type { Agent } from '@/lib/types/agentic';

/**
 * Validate and sanitize optional numeric fields
 * @param value - Value to validate
 * @param defaultValue - Default value if invalid
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Valid number or default
 */
function validateOptionalNumber(
  value: number | undefined,
  defaultValue: number,
  min = 0,
  max: number = Number.MAX_SAFE_INTEGER
): number {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (typeof value !== 'number' || Number.isNaN(value)) {
    return defaultValue;
  }

  return Math.max(min, Math.min(max, value));
}

/**
 * Validate and sanitize optional string fields
 * @param value - Value to validate
 * @param defaultValue - Default value if invalid
 * @returns Valid string or default
 */
function validateOptionalString(
  value: string | undefined,
  defaultValue = ''
): string {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (typeof value !== 'string') {
    return defaultValue;
  }

  return value.trim();
}

/**
 * Validate and sanitize optional array fields
 * @param value - Value to validate
 * @param defaultValue - Default value if invalid
 * @returns Valid array or default
 */
function validateOptionalArray<T>(
  value: T[] | undefined,
  defaultValue: T[] = []
): T[] {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (!Array.isArray(value)) {
    return defaultValue;
  }

  return value;
}

/**
 * Convert Convex agent document to API format with enhanced validation
 * @param convexAgent - Raw agent document from Convex database
 * @returns Formatted agent for API responses
 * @throws Error if required fields are missing or invalid
 */
export function convexAgentToApiFormat(convexAgent: Doc<'agents'>): Agent {
  // Validate required fields
  if (!convexAgent._id) {
    throw new Error('Agent ID is required');
  }

  if (!validateOptionalString(convexAgent.name)) {
    throw new Error('Agent name is required and cannot be empty');
  }

  return {
    id: convexAgent._id,
    name: validateOptionalString(convexAgent.name),
    description: validateOptionalString(convexAgent.description),
    systemPrompt: validateOptionalString(convexAgent.systemPrompt),
    temperature: validateOptionalNumber(convexAgent.temperature, 0.7, 0, 2),
    maxTokens: validateOptionalNumber(convexAgent.maxTokens, 4096, 1, 32_768),
    tools: validateOptionalArray(convexAgent.capabilities), // Map capabilities to tools
    maxSteps: 10, // Default value since not in schema
    walletAddress: validateOptionalString(convexAgent.createdBy) || '', // Map createdBy to walletAddress
    createdAt: convexAgent.createdAt || Date.now(),
    updatedAt: convexAgent.updatedAt || Date.now(),
  };
}

/**
 * Convert multiple Convex agent documents to API format
 * @param convexAgents - Array of raw agent documents from Convex database
 * @returns Array of formatted agents for API responses
 */
export function convexAgentsToApiFormat(
  convexAgents: Doc<'agents'>[]
): Agent[] {
  return convexAgents.map(convexAgentToApiFormat);
}
