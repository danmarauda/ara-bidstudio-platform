/**
 * Real MCP Integration for ANUBIS Chat
 * 
 * This module replaces the mock MCP infrastructure with real MCP server
 * connections using the @modelcontextprotocol/sdk.
 */

import { v } from 'convex/values';
import type { Id } from '../../_generated/dataModel';
import { action, query } from '../../_generated/server';
import type { ToolExecutionContext, ToolExecutionResult } from '../../toolRegistry';
import { createModuleLogger } from '../../utils/logger';
import { globalMcpClient, type McpToolExecution } from './mcpClient';
import type { McpServerConfig } from '../agents/anubisAgent';

const logger = createModuleLogger('realMcpIntegration');

// =============================================================================
// Real MCP Integration Functions
// =============================================================================

/**
 * Initialize MCP servers for an agent with real connections
 */
export const initializeAgentMcpServers = action({
  args: {
    agentId: v.id('agents'),
    userId: v.string(),
    mcpServers: v.array(v.object({
      name: v.string(),
      enabled: v.boolean(),
      config: v.optional(v.any()),
    })),
  },
  handler: async (ctx, args) => {
    try {
      logger.info('Initializing real MCP servers for agent', {
        agentId: args.agentId,
        userId: args.userId,
        serverCount: args.mcpServers.length,
      });

      const initResults = [];
      
      // Initialize each enabled MCP server
      for (const serverConfig of args.mcpServers) {
        if (serverConfig.enabled) {
          try {
            // Connect to the MCP server
            const serverId = `${serverConfig.name}-${args.userId}`;
            await globalMcpClient.connectServer('websearch-mcp'); // Use our registered server ID
            
            const status = globalMcpClient.getServerStatus('websearch-mcp');
            
            initResults.push({
              name: serverConfig.name,
              serverId,
              connected: status?.connected || false,
              toolCount: status?.tools.length || 0,
              error: status?.error,
            });

            logger.info('MCP server initialized', {
              serverName: serverConfig.name,
              connected: status?.connected,
              toolCount: status?.tools.length,
            });

          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Connection failed';
            
            initResults.push({
              name: serverConfig.name,
              serverId: `${serverConfig.name}-${args.userId}`,
              connected: false,
              toolCount: 0,
              error: errorMessage,
            });

            logger.error('Failed to initialize MCP server', error, {
              serverName: serverConfig.name,
            });
          }
        }
      }

      const connectedCount = initResults.filter(r => r.connected).length;
      const totalToolCount = initResults.reduce((sum, r) => sum + r.toolCount, 0);

      logger.info('MCP server initialization completed', {
        agentId: args.agentId,
        totalServers: args.mcpServers.length,
        connectedServers: connectedCount,
        totalTools: totalToolCount,
      });

      return {
        success: true,
        results: initResults,
        summary: {
          totalServers: args.mcpServers.length,
          connectedServers: connectedCount,
          totalTools: totalToolCount,
        },
      };

    } catch (error) {
      logger.error('Failed to initialize MCP servers', error, {
        agentId: args.agentId,
        userId: args.userId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Initialization failed',
        results: [],
        summary: {
          totalServers: 0,
          connectedServers: 0,
          totalTools: 0,
        },
      };
    }
  },
});

/**
 * Execute tool through real MCP server
 */
export const executeRealMcpTool = action({
  args: {
    toolName: v.string(),
    input: v.any(),
    agentId: v.id('agents'),
    userId: v.string(),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<ToolExecutionResult> => {
    const startTime = Date.now();

    try {
      logger.info('Executing real MCP tool', {
        toolName: args.toolName,
        agentId: args.agentId,
        userId: args.userId,
      });

      // Map tool names to MCP server execution
      const mcpExecution: McpToolExecution = {
        toolName: mapToolNameToMcp(args.toolName),
        arguments: args.input,
      };

      // Execute through the real MCP client
      const result = await globalMcpClient.executeTool('websearch-mcp', mcpExecution);
      
      const executionTime = Date.now() - startTime;

      if (result.success) {
        logger.info('Real MCP tool executed successfully', {
          toolName: args.toolName,
          executionTime,
        });

        return {
          success: true,
          data: result.content as Record<string, string | number | boolean | null>,
          executionTime,
        };
      } else {
        logger.warn('Real MCP tool execution failed', {
          toolName: args.toolName,
          error: result.error,
          executionTime,
        });

        return {
          success: false,
          error: result.error || 'MCP tool execution failed',
          executionTime,
        };
      }

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Tool execution failed';

      logger.error('Real MCP tool execution error', error, {
        toolName: args.toolName,
        agentId: args.agentId,
        executionTime,
      });

      return {
        success: false,
        error: errorMessage,
        executionTime,
      };
    }
  },
});

/**
 * Get available MCP tools for an agent
 */
export const getAgentMcpTools = query({
  args: {
    agentId: v.id('agents'),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Get all available tools from connected MCP servers
      const allTools = globalMcpClient.getAllTools();
      
      // Transform to our expected format
      return allTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        serverId: tool.serverId,
        inputSchema: tool.inputSchema,
      }));

    } catch (error) {
      logger.error('Failed to get MCP tools', error, {
        agentId: args.agentId,
        userId: args.userId,
      });
      
      return [];
    }
  },
});

/**
 * Get MCP server health status
 */
export const getMcpServerHealth = query({
  args: {
    agentId: v.id('agents'),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const status = globalMcpClient.getServerStatus('websearch-mcp');
      
      if (!status) {
        return {
          servers: [],
          totalHealth: 0,
          connectedCount: 0,
          totalCount: 0,
        };
      }

      const serverInfo = {
        name: 'websearch',
        connected: status.connected,
        toolCount: status.tools.length,
        lastConnected: status.lastConnected,
        error: status.error,
        healthScore: status.connected ? 100 : 0,
      };

      return {
        servers: [serverInfo],
        totalHealth: serverInfo.healthScore,
        connectedCount: status.connected ? 1 : 0,
        totalCount: 1,
      };

    } catch (error) {
      logger.error('Failed to get MCP server health', error, {
        agentId: args.agentId,
        userId: args.userId,
      });

      return {
        servers: [],
        totalHealth: 0,
        connectedCount: 0,
        totalCount: 0,
      };
    }
  },
});

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Map our tool names to MCP tool names
 */
function mapToolNameToMcp(toolName: string): string {
  const toolMap: Record<string, string> = {
    'webSearch': 'web_search',
    'search': 'web_search',
    // Add more mappings as we integrate additional MCP servers
  };

  return toolMap[toolName] || toolName;
}

/**
 * Check if a tool should be routed through MCP
 */
export function shouldRouteThroughRealMcp(
  toolName: string,
  mcpServers?: McpServerConfig[]
): boolean {
  if (!mcpServers || mcpServers.length === 0) {
    return false;
  }

  // Check if webSearch tool should use MCP
  if (toolName === 'webSearch' || toolName === 'search') {
    const webSearchServer = mcpServers.find(s => s.name === 'websearch');
    return webSearchServer?.enabled || false;
  }

  return false;
}

/**
 * Get enhanced capabilities including real MCP tools
 */
export function getEnhancedCapabilitiesWithRealMcp(
  baseCapabilities: string[],
  mcpServers?: McpServerConfig[]
): string[] {
  if (!mcpServers || mcpServers.length === 0) {
    return baseCapabilities;
  }

  const mcpCapabilities: string[] = [];

  for (const serverConfig of mcpServers) {
    if (serverConfig.enabled) {
      switch (serverConfig.name) {
        case 'websearch':
          mcpCapabilities.push('enhanced-web-search', 'real-time-search');
          break;
        // Add more server capabilities as we integrate them
      }
    }
  }

  return [...baseCapabilities, ...mcpCapabilities];
}

export default {
  initializeAgentMcpServers,
  executeRealMcpTool,
  getAgentMcpTools,
  getMcpServerHealth,
  shouldRouteThroughRealMcp,
  getEnhancedCapabilitiesWithRealMcp,
};