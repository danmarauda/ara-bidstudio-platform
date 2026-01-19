/**
 * MCP Server Initialization
 * Handles initialization of MCP servers on API startup
 */

import { createModuleLogger } from '../utils/logger';
import { initializeDefaultMCPServers } from './client';

const log = createModuleLogger('mcp-initialize');

let initialized = false;

/**
 * Initialize MCP servers if not already initialized
 */
export async function ensureMCPServersInitialized(): Promise<void> {
  if (initialized) {
    return;
  }

  try {
    log.info('Initializing MCP servers');
    await initializeDefaultMCPServers();
    initialized = true;
    log.info('MCP servers initialized successfully');
  } catch (error) {
    log.error('Failed to initialize MCP servers', {
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't throw - allow API to continue without MCP
    // MCP features will be unavailable but the API will still work
  }
}

/**
 * Get initialization status
 */
export function isMCPInitialized(): boolean {
  return initialized;
}

/**
 * Reset initialization (useful for testing)
 */
export function resetMCPInitialization(): void {
  initialized = false;
}
