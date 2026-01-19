/**
 * Tool Registry Helper Functions
 *
 * Utility functions for managing and using the tool registry system
 */

import {
  getAvailableCapabilities,
  globalToolRegistry,
  validateAgentCapabilities,
} from './toolRegistry';

// =============================================================================
// Registry Management Helpers
// =============================================================================

/**
 * Get all available tool capabilities with their metadata
 */
export function listAvailableTools() {
  return getAvailableCapabilities().map(({ capability, metadata }) => ({
    capability,
    name: metadata.name,
    description: metadata.description,
    category: metadata.category,
    version: metadata.version,
    tags: metadata.tags || [],
  }));
}

/**
 * Get tools grouped by category
 */
export function getToolsByCategory() {
  const tools = listAvailableTools();
  const grouped: Record<string, typeof tools> = {};

  for (const tool of tools) {
    if (!grouped[tool.category]) {
      grouped[tool.category] = [];
    }
    grouped[tool.category].push(tool);
  }

  return grouped;
}

/**
 * Validate and filter agent capabilities
 */
export function processAgentCapabilities(capabilities: string[]) {
  const { valid, invalid } = validateAgentCapabilities(capabilities);

  return {
    validCapabilities: valid,
    invalidCapabilities: invalid,
    hasInvalidCapabilities: invalid.length > 0,
    toolsAvailable: valid.length,
    recommendedCapabilities:
      valid.length === 0
        ? ['webSearch', 'calculator', 'summarizeText'] // Default safe capabilities
        : valid,
  };
}

/**
 * Get capability recommendations based on agent type
 */
export function getRecommendedCapabilities(agentType: string) {
  const recommendations: Record<string, string[]> = {
    general: [
      'webSearch',
      'calculator',
      'createDocument',
      'generateCode',
      'summarizeText',
    ],
    trading: ['webSearch', 'calculator', 'summarizeText'],
    defi: ['webSearch', 'calculator', 'summarizeText'],
    nft: ['webSearch', 'createDocument', 'summarizeText'],
    dao: ['webSearch', 'createDocument', 'summarizeText'],
    portfolio: ['webSearch', 'calculator', 'summarizeText'],
    custom: ['webSearch', 'summarizeText'], // Minimal safe set
  };

  return recommendations[agentType] || recommendations.custom;
}

// =============================================================================
// Tool Execution Helpers
// =============================================================================

/**
 * Check if a tool is available for execution
 */
export function isToolAvailable(capability: string): boolean {
  return globalToolRegistry.hasCapability(capability);
}

/**
 * Get tool metadata for a capability
 */
export function getToolInfo(capability: string) {
  const metadata = globalToolRegistry.getToolMetadata(capability);
  if (!metadata) {
    return null;
  }

  return {
    name: metadata.name,
    description: metadata.description,
    category: metadata.category,
    version: metadata.version,
    tags: metadata.tags || [],
  };
}

/**
 * Batch validate multiple capabilities
 */
export function validateCapabilities(capabilities: string[]) {
  const results = capabilities.map((capability) => ({
    capability,
    available: isToolAvailable(capability),
    info: getToolInfo(capability),
  }));

  return {
    results,
    allValid: results.every((r) => r.available),
    validCount: results.filter((r) => r.available).length,
    invalidCount: results.filter((r) => !r.available).length,
  };
}

// =============================================================================
// Agent Integration Helpers
// =============================================================================

/**
 * Prepare tools for an agent based on its capabilities
 */
export function prepareAgentTools(capabilities: string[]) {
  const processed = processAgentCapabilities(capabilities);
  const toolsData = globalToolRegistry.getToolsForCapabilities(
    processed.validCapabilities
  );
  const aiTools = globalToolRegistry.getAIToolsForCapabilities(
    processed.validCapabilities
  );

  return {
    capabilities: processed.validCapabilities,
    invalidCapabilities: processed.invalidCapabilities,
    toolsCount: toolsData.length,
    aiTools,
    toolMetadata: toolsData.map((tool) => ({
      name: tool.metadata.name,
      description: tool.metadata.description,
      category: tool.metadata.category,
    })),
  };
}

/**
 * Get capability diff between two capability arrays
 */
export function getCapabilityDiff(
  oldCapabilities: string[],
  newCapabilities: string[]
) {
  const added = newCapabilities.filter((cap) => !oldCapabilities.includes(cap));
  const removed = oldCapabilities.filter(
    (cap) => !newCapabilities.includes(cap)
  );
  const unchanged = oldCapabilities.filter((cap) =>
    newCapabilities.includes(cap)
  );

  return {
    added,
    removed,
    unchanged,
    hasChanges: added.length > 0 || removed.length > 0,
    addedCount: added.length,
    removedCount: removed.length,
    unchangedCount: unchanged.length,
  };
}

// =============================================================================
// Default Exports
// =============================================================================

export default {
  listAvailableTools,
  getToolsByCategory,
  processAgentCapabilities,
  getRecommendedCapabilities,
  isToolAvailable,
  getToolInfo,
  validateCapabilities,
  prepareAgentTools,
  getCapabilityDiff,
};
