/**
 * MCP (Model Context Protocol) Server Manager for ANUBIS Chat
 *
 * This module provides dynamic MCP server connection management per agent,
 * server lifecycle management, configuration validation, and health monitoring.
 *
 * Features:
 * - Dynamic MCP server connections based on agent configuration
 * - Server lifecycle management (connect, disconnect, reconnect)
 * - Configuration validation and error handling
 * - Health checks and monitoring
 * - Tool registration from MCP servers
 * - Integration with existing tool registry system
 */

import { v } from 'convex/values';
import { api, internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import { action, mutation, query } from './_generated/server';
import type { ToolExecutionContext, ToolExecutionResult } from './toolRegistry';
import { createModuleLogger } from './utils/logger';

// Create logger instance for this module
const logger = createModuleLogger('mcpServerManager');

// =============================================================================
// MCP Server Types and Interfaces
// =============================================================================

/**
 * MCP Server connection states
 */
export type McpServerStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'disabled'
  | 'reconnecting';

/**
 * MCP Server configuration from agent definition
 */
export interface McpServerConfig {
  name: string;
  enabled: boolean;
  config?: Record<string, string | number | boolean>;
}

/**
 * Complete MCP Server connection information
 */
export interface McpServerConnection {
  serverId: string;
  name: string;
  status: McpServerStatus;
  config: McpServerConfig;
  tools: string[];
  lastConnected?: number;
  errorMessage?: string;
  healthScore: number; // 0-100
  responseTimeMs?: number;
  capabilities?: string[];
}

/**
 * MCP Server health check result
 */
export interface McpServerHealthCheck {
  serverId: string;
  status: McpServerStatus;
  responseTime: number;
  error?: string;
  timestamp: number;
}

/**
 * Tool definition from MCP server
 */
export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  serverId: string;
  category?: string;
}

/**
 * Agent-specific MCP server manager
 */
export interface AgentMcpContext {
  agentId: Id<'agents'>;
  userId: string;
  connections: Map<string, McpServerConnection>;
  tools: Map<string, McpToolDefinition>;
  lastUpdated: number;
}

// =============================================================================
// MCP Server Manager Class
// =============================================================================

/**
 * Main MCP Server Manager class
 *
 * Handles server connections, tool discovery, and lifecycle management
 * for each agent's MCP server configuration.
 */
export class McpServerManager {
  private agentContexts = new Map<string, AgentMcpContext>();
  private serverRegistry = new Map<string, McpServerConnection>();
  private healthCheckInterval?: NodeJS.Timeout;

  constructor() {
    // Start health monitoring
    this.startHealthMonitoring();
    logger.info('MCP Server Manager initialized');
  }

  /**
   * Initialize MCP servers for an agent
   */
  async initializeAgentServers(
    agentId: Id<'agents'>,
    userId: string,
    mcpServers: McpServerConfig[]
  ): Promise<AgentMcpContext> {
    const contextKey = `${agentId}_${userId}`;

    logger.info('Initializing MCP servers for agent', {
      agentId,
      userId,
      serverCount: mcpServers.length,
    });

    // Create agent context
    const context: AgentMcpContext = {
      agentId,
      userId,
      connections: new Map(),
      tools: new Map(),
      lastUpdated: Date.now(),
    };

    // Connect to each enabled server
    for (const serverConfig of mcpServers) {
      if (serverConfig.enabled) {
        try {
          const connection = await this.connectServer(serverConfig, userId);
          context.connections.set(serverConfig.name, connection);

          // Discover tools from this server
          const tools = await this.discoverServerTools(connection);
          for (const tool of tools) {
            context.tools.set(tool.name, tool);
          }

          logger.debug('Server connected successfully', {
            serverName: serverConfig.name,
            toolCount: tools.length,
          });
        } catch (error) {
          logger.error('Failed to connect server', error, {
            serverName: serverConfig.name,
            agentId,
          });

          // Create failed connection entry
          const failedConnection: McpServerConnection = {
            serverId: this.generateServerId(serverConfig.name, userId),
            name: serverConfig.name,
            status: 'error',
            config: serverConfig,
            tools: [],
            errorMessage:
              error instanceof Error ? error.message : 'Connection failed',
            healthScore: 0,
          };
          context.connections.set(serverConfig.name, failedConnection);
        }
      } else {
        // Create disabled connection entry
        const disabledConnection: McpServerConnection = {
          serverId: this.generateServerId(serverConfig.name, userId),
          name: serverConfig.name,
          status: 'disabled',
          config: serverConfig,
          tools: [],
          healthScore: 0,
        };
        context.connections.set(serverConfig.name, disabledConnection);
      }
    }

    this.agentContexts.set(contextKey, context);
    return context;
  }

  /**
   * Connect to a specific MCP server
   */
  private async connectServer(
    config: McpServerConfig,
    userId: string
  ): Promise<McpServerConnection> {
    const serverId = this.generateServerId(config.name, userId);
    const startTime = Date.now();

    logger.info('Connecting to MCP server', {
      serverName: config.name,
      serverId,
      userId,
    });

    try {
      // Validate server configuration
      this.validateServerConfig(config);

      // Create connection based on server type
      const connection = await this.establishConnection(
        config,
        serverId,
        userId
      );

      const responseTime = Date.now() - startTime;
      connection.responseTimeMs = responseTime;
      connection.healthScore = this.calculateHealthScore(connection);
      connection.lastConnected = Date.now();

      // Register connection in global registry
      this.serverRegistry.set(serverId, connection);

      logger.info('MCP server connected successfully', {
        serverName: config.name,
        serverId,
        responseTime: `${responseTime}ms`,
        healthScore: connection.healthScore,
      });

      return connection;
    } catch (error) {
      logger.error('MCP server connection failed', error, {
        serverName: config.name,
        serverId,
      });

      const failedConnection: McpServerConnection = {
        serverId,
        name: config.name,
        status: 'error',
        config,
        tools: [],
        errorMessage:
          error instanceof Error ? error.message : 'Connection failed',
        healthScore: 0,
        responseTimeMs: Date.now() - startTime,
      };

      this.serverRegistry.set(serverId, failedConnection);
      return failedConnection;
    }
  }

  /**
   * Establish connection to MCP server based on configuration
   */
  private async establishConnection(
    config: McpServerConfig,
    serverId: string,
    userId: string
  ): Promise<McpServerConnection> {
    // Mock connection establishment for now
    // In a real implementation, this would connect to actual MCP servers
    // like Context7, Sequential, etc.

    const connectionMap: Record<string, Partial<McpServerConnection>> = {
      context7: {
        tools: ['resolve-library-id', 'get-library-docs'],
        capabilities: ['documentation', 'library-lookup', 'best-practices'],
      },
      sequential: {
        tools: [
          'sequential-thinking',
          'complex-analysis',
          'multi-step-reasoning',
        ],
        capabilities: ['analysis', 'reasoning', 'problem-solving'],
      },
      filesystem: {
        tools: ['read-file', 'write-file', 'list-directory'],
        capabilities: ['file-operations', 'directory-navigation'],
      },
      playwright: {
        tools: ['navigate', 'screenshot', 'click', 'fill', 'evaluate'],
        capabilities: ['browser-automation', 'testing', 'web-interaction'],
      },
      grep: {
        tools: ['search-github', 'code-search'],
        capabilities: ['code-search', 'pattern-matching'],
      },
      puppeteer: {
        tools: ['navigate', 'screenshot', 'click', 'fill', 'evaluate'],
        capabilities: ['browser-automation', 'web-scraping'],
      },
    };

    const serverDefaults = connectionMap[config.name] || {
      tools: [],
      capabilities: [],
    };

    const connection: McpServerConnection = {
      serverId,
      name: config.name,
      status: 'connected',
      config,
      tools: Array.isArray(serverDefaults.tools) ? serverDefaults.tools : [],
      capabilities: (serverDefaults.capabilities as string[]) || [],
      healthScore: 100,
      lastConnected: Date.now(),
    };

    return connection;
  }

  /**
   * Validate server configuration
   */
  private validateServerConfig(config: McpServerConfig): void {
    if (!config.name || typeof config.name !== 'string') {
      throw new Error('Server name is required and must be a string');
    }

    if (typeof config.enabled !== 'boolean') {
      throw new Error('Server enabled flag must be a boolean');
    }

    if (config.config && typeof config.config !== 'object') {
      throw new Error('Server config must be an object if provided');
    }

    // Validate known server types
    const knownServers = [
      'context7',
      'sequential',
      'filesystem',
      'playwright',
      'grep',
      'puppeteer',
    ];
    if (!knownServers.includes(config.name)) {
      logger.warn('Unknown MCP server type', { serverName: config.name });
    }
  }

  /**
   * Discover available tools from a connected server
   */
  private async discoverServerTools(
    connection: McpServerConnection
  ): Promise<McpToolDefinition[]> {
    const tools: McpToolDefinition[] = [];

    // Convert server tools to tool definitions
    for (const toolName of connection.tools) {
      const toolDef: McpToolDefinition = {
        name: toolName,
        description: this.getToolDescription(toolName, connection.name),
        inputSchema: this.getToolInputSchema(toolName, connection.name),
        serverId: connection.serverId,
        category: this.getToolCategory(toolName, connection.name),
      };
      tools.push(toolDef);
    }

    logger.debug('Discovered tools from server', {
      serverName: connection.name,
      toolCount: tools.length,
    });

    return tools;
  }

  /**
   * Get tool description based on server and tool name
   */
  private getToolDescription(toolName: string, serverName: string): string {
    const descriptions: Record<string, Record<string, string>> = {
      context7: {
        'resolve-library-id':
          'Resolve a package/library name to Context7-compatible ID',
        'get-library-docs': 'Fetch up-to-date documentation for a library',
      },
      sequential: {
        'sequential-thinking':
          'Multi-step problem solving with structured analysis',
        'complex-analysis':
          'Deep architectural analysis with cross-module dependencies',
        'multi-step-reasoning': 'Systematic reasoning for complex problems',
      },
      filesystem: {
        'read-file': 'Read file contents from the filesystem',
        'write-file': 'Write content to a file',
        'list-directory': 'List files and directories',
      },
      playwright: {
        navigate: 'Navigate to a URL in browser',
        screenshot: 'Take screenshot of page or element',
        click: 'Click an element on the page',
        fill: 'Fill out an input field',
        evaluate: 'Execute JavaScript in browser',
      },
      grep: {
        'search-github': 'Search for code patterns in GitHub repositories',
        'code-search': 'Search for code patterns with regex support',
      },
    };

    return (
      descriptions[serverName]?.[toolName] ||
      `${toolName} tool from ${serverName} server`
    );
  }

  /**
   * Get tool input schema based on server and tool name
   */
  private getToolInputSchema(
    toolName: string,
    serverName: string
  ): Record<string, unknown> {
    // Return basic schemas for common tools
    const schemas: Record<string, Record<string, unknown>> = {
      context7: {
        'resolve-library-id': { libraryName: 'string' },
        'get-library-docs': {
          context7CompatibleLibraryID: 'string',
          tokens: 'number',
          topic: 'string',
        },
      },
      sequential: {
        'sequential-thinking': {
          thought: 'string',
          nextThoughtNeeded: 'boolean',
        },
        'complex-analysis': { problem: 'string', depth: 'number' },
      },
      filesystem: {
        'read-file': { file_path: 'string' },
        'write-file': { file_path: 'string', content: 'string' },
        'list-directory': { path: 'string' },
      },
      playwright: {
        navigate: { url: 'string' },
        screenshot: { name: 'string', selector: 'string' },
        click: { selector: 'string' },
        fill: { selector: 'string', value: 'string' },
      },
    };

    const schema = schemas[serverName]?.[toolName] as
      | Record<string, unknown>
      | undefined;
    return schema || { input: 'string' };
  }

  /**
   * Get tool category based on server and tool name
   */
  private getToolCategory(toolName: string, serverName: string): string {
    const categories: Record<string, string> = {
      context7: 'documentation',
      sequential: 'analysis',
      filesystem: 'utility',
      playwright: 'automation',
      grep: 'search',
      puppeteer: 'automation',
    };

    return categories[serverName] || 'utility';
  }

  /**
   * Calculate health score for a server connection
   */
  private calculateHealthScore(connection: McpServerConnection): number {
    let score = 100;

    // Penalize for connection issues
    if (connection.status === 'error') score = 0;
    if (connection.status === 'disconnected') score = 0;
    if (connection.status === 'disabled') score = 0;
    if (connection.status === 'connecting') score = 50;
    if (connection.status === 'reconnecting') score = 25;

    // Penalize for slow response times
    if (connection.responseTimeMs) {
      if (connection.responseTimeMs > 5000) score -= 30;
      else if (connection.responseTimeMs > 2000) score -= 15;
      else if (connection.responseTimeMs > 1000) score -= 5;
    }

    // Penalize for errors
    if (connection.errorMessage) score -= 20;

    // Bonus for having tools available
    if (connection.tools.length > 0) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate unique server ID
   */
  private generateServerId(serverName: string, userId: string): string {
    return `mcp_${serverName}_${userId}_${Date.now()}`;
  }

  /**
   * Disconnect from a specific server
   */
  async disconnectServer(serverId: string): Promise<void> {
    const connection = this.serverRegistry.get(serverId);
    if (!connection) {
      logger.warn('Attempted to disconnect unknown server', { serverId });
      return;
    }

    logger.info('Disconnecting from MCP server', {
      serverName: connection.name,
      serverId,
    });

    try {
      // Update connection status
      connection.status = 'disconnected';
      connection.healthScore = 0;

      // Remove from registry
      this.serverRegistry.delete(serverId);

      // Remove from agent contexts
      for (const [contextKey, context] of this.agentContexts.entries()) {
        for (const [serverName, conn] of context.connections.entries()) {
          if (conn.serverId === serverId) {
            context.connections.delete(serverName);

            // Remove tools from this server
            for (const [toolName, tool] of context.tools.entries()) {
              if (tool.serverId === serverId) {
                context.tools.delete(toolName);
              }
            }
            break;
          }
        }
      }

      logger.info('MCP server disconnected successfully', {
        serverName: connection.name,
        serverId,
      });
    } catch (error) {
      logger.error('Error disconnecting MCP server', error, {
        serverName: connection.name,
        serverId,
      });
    }
  }

  /**
   * Reconnect to a server
   */
  async reconnectServer(
    serverId: string,
    userId?: string
  ): Promise<McpServerConnection> {
    const connection = this.serverRegistry.get(serverId);
    if (!connection) {
      throw new Error(`Server ${serverId} not found`);
    }

    // Try to find userId from existing agent contexts if not provided
    if (!userId) {
      for (const [contextKey, context] of this.agentContexts.entries()) {
        for (const conn of context.connections.values()) {
          if (conn.serverId === serverId) {
            userId = context.userId;
            break;
          }
        }
        if (userId) break;
      }
    }

    if (!userId) {
      throw new Error('Unable to determine userId for server reconnection');
    }

    logger.info('Reconnecting to MCP server', {
      serverName: connection.name,
      serverId,
      userId,
    });

    connection.status = 'reconnecting';

    try {
      // Re-establish connection
      const newConnection = await this.establishConnection(
        connection.config,
        serverId,
        userId
      );

      // Update existing connection
      Object.assign(connection, newConnection);
      connection.lastConnected = Date.now();

      logger.info('MCP server reconnected successfully', {
        serverName: connection.name,
        serverId,
      });

      return connection;
    } catch (error) {
      connection.status = 'error';
      connection.errorMessage =
        error instanceof Error ? error.message : 'Reconnection failed';
      connection.healthScore = 0;

      logger.error('MCP server reconnection failed', error, {
        serverName: connection.name,
        serverId,
      });

      throw error;
    }
  }

  /**
   * Perform health check on a server
   */
  async performHealthCheck(serverId: string): Promise<McpServerHealthCheck> {
    const startTime = Date.now();
    const connection = this.serverRegistry.get(serverId);

    if (!connection) {
      return {
        serverId,
        status: 'disconnected',
        responseTime: 0,
        error: 'Server not found',
        timestamp: Date.now(),
      };
    }

    try {
      // Perform basic connectivity check
      // In a real implementation, this would ping the actual server
      const responseTime = Date.now() - startTime;

      const healthCheck: McpServerHealthCheck = {
        serverId,
        status: connection.status,
        responseTime,
        timestamp: Date.now(),
      };

      // Update connection health
      connection.responseTimeMs = responseTime;
      connection.healthScore = this.calculateHealthScore(connection);

      return healthCheck;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        serverId,
        status: 'error',
        responseTime,
        error: error instanceof Error ? error.message : 'Health check failed',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Get tools available for an agent from MCP servers
   */
  getToolsForAgent(agentId: Id<'agents'>, userId: string): McpToolDefinition[] {
    const contextKey = `${agentId}_${userId}`;
    const context = this.agentContexts.get(contextKey);

    if (!context) {
      return [];
    }

    return Array.from(context.tools.values()).filter((tool) => {
      const connection = this.serverRegistry.get(tool.serverId);
      return connection && connection.status === 'connected';
    });
  }

  /**
   * Execute tool through MCP server
   */
  async executeToolThroughMcp(
    toolName: string,
    input: any,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    try {
      // Find the tool and its server
      let targetTool: McpToolDefinition | undefined;
      let targetConnection: McpServerConnection | undefined;

      for (const agentContext of this.agentContexts.values()) {
        const tool = agentContext.tools.get(toolName);
        if (tool) {
          targetTool = tool;
          targetConnection = this.serverRegistry.get(tool.serverId);
          break;
        }
      }

      if (!(targetTool && targetConnection)) {
        return {
          success: false,
          error: `MCP tool '${toolName}' not found or server not available`,
          executionTime: Date.now() - startTime,
        };
      }

      if (targetConnection.status !== 'connected') {
        return {
          success: false,
          error: `MCP server '${targetConnection.name}' is not connected (status: ${targetConnection.status})`,
          executionTime: Date.now() - startTime,
        };
      }

      // Route to appropriate MCP server implementation
      const result = await this.routeToolExecution(
        targetConnection,
        targetTool,
        input,
        context
      );

      return {
        ...result,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'MCP tool execution failed',
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Route tool execution to appropriate MCP server
   */
  private async routeToolExecution(
    connection: McpServerConnection,
    tool: McpToolDefinition,
    input: any,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    // Route to different MCP server implementations
    switch (connection.name) {
      case 'context7':
        return this.executeContext7Tool(tool.name, input, context);
      case 'sequential':
        return this.executeSequentialTool(tool.name, input, context);
      case 'filesystem':
        return this.executeFilesystemTool(tool.name, input, context);
      case 'playwright':
        return this.executePlaywrightTool(tool.name, input, context);
      case 'grep':
        return this.executeGrepTool(tool.name, input, context);
      default:
        return {
          success: false,
          error: `No implementation available for MCP server: ${connection.name}`,
        };
    }
  }

  /**
   * Execute Context7 MCP server tools
   */
  private async executeContext7Tool(
    toolName: string,
    input: any,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    try {
      // This would integrate with actual Context7 MCP server
      // For now, return mock results
      switch (toolName) {
        case 'resolve-library-id':
          return {
            success: true,
            data: {
              libraryId: `/example/${input.libraryName}`,
              resolved: true,
            },
          };
        case 'get-library-docs':
          return {
            success: true,
            data: {
              documentation: `Documentation for ${input.context7CompatibleLibraryID}`,
              tokens: input.tokens || 1000,
            },
          };
        default:
          return {
            success: false,
            error: `Unknown Context7 tool: ${toolName}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Context7 tool execution failed',
      };
    }
  }

  /**
   * Execute Sequential MCP server tools
   */
  private async executeSequentialTool(
    toolName: string,
    input: any,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    try {
      switch (toolName) {
        case 'sequential-thinking':
          return {
            success: true,
            data: {
              thought: input.thought,
              nextStep: input.nextThoughtNeeded ? 'continue' : 'complete',
            },
          };
        default:
          return {
            success: false,
            error: `Unknown Sequential tool: ${toolName}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Sequential tool execution failed',
      };
    }
  }

  /**
   * Execute Filesystem MCP server tools
   */
  private async executeFilesystemTool(
    toolName: string,
    input: any,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    // This would integrate with actual filesystem MCP server
    return {
      success: false,
      error: 'Filesystem MCP server not implemented yet',
    };
  }

  /**
   * Execute Playwright MCP server tools
   */
  private async executePlaywrightTool(
    toolName: string,
    input: any,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    // This would integrate with actual Playwright MCP server
    return {
      success: false,
      error: 'Playwright MCP server not implemented yet',
    };
  }

  /**
   * Execute Grep MCP server tools
   */
  private async executeGrepTool(
    toolName: string,
    input: any,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    // This would integrate with actual Grep MCP server
    return {
      success: false,
      error: 'Grep MCP server not implemented yet',
    };
  }

  /**
   * Start health monitoring for all servers
   */
  private startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      const serverIds = Array.from(this.serverRegistry.keys());

      logger.debug('Performing health checks', {
        serverCount: serverIds.length,
      });

      for (const serverId of serverIds) {
        try {
          await this.performHealthCheck(serverId);
        } catch (error) {
          logger.warn('Health check failed for server', {
            serverId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }, 30_000); // Check every 30 seconds
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  /**
   * Get agent context
   */
  getAgentContext(
    agentId: Id<'agents'>,
    userId: string
  ): AgentMcpContext | undefined {
    const contextKey = `${agentId}_${userId}`;
    return this.agentContexts.get(contextKey);
  }

  /**
   * Get all server connections for debugging
   */
  getAllConnections(): Map<string, McpServerConnection> {
    return new Map(this.serverRegistry);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopHealthMonitoring();
    this.agentContexts.clear();
    this.serverRegistry.clear();
    logger.info('MCP Server Manager destroyed');
  }
}

// =============================================================================
// Global MCP Server Manager Instance
// =============================================================================

export const globalMcpServerManager = new McpServerManager();

// =============================================================================
// Convex Database Functions
// =============================================================================

/**
 * Initialize MCP servers for an agent
 */
export const initializeAgentMcpServers = action({
  args: {
    agentId: v.id('agents'),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Get agent configuration
      const agent = await ctx.runQuery(api.agents.getById, {
        id: args.agentId,
      });
      if (!agent) {
        throw new Error('Agent not found');
      }

      // Initialize MCP servers from agent configuration
      const mcpServers = agent.mcpServers || [];
      const agentContext = await globalMcpServerManager.initializeAgentServers(
        args.agentId,
        args.userId,
        mcpServers
      );

      // Store server configurations in database for persistence
      for (const [
        serverName,
        connection,
      ] of agentContext.connections.entries()) {
        if (connection.status !== 'disabled') {
          await ctx.runMutation(api.mcpServers.upsertServer, {
            userId: args.userId,
            serverId: connection.serverId,
            name: serverName,
            description: `MCP server for ${serverName}`,
            url: `mcp://${serverName}`,
            enabled: connection.status === 'connected',
            tools: connection.tools,
            status:
              connection.status === 'reconnecting'
                ? 'connecting'
                : connection.status,
            lastConnected: connection.lastConnected,
            errorMessage: connection.errorMessage,
          });
        }
      }

      return {
        success: true,
        serverCount: agentContext.connections.size,
        toolCount: agentContext.tools.size,
        connectedServers: Array.from(agentContext.connections.values())
          .filter((c) => c.status === 'connected')
          .map((c) => c.name),
      };
    } catch (error) {
      logger.error('Failed to initialize agent MCP servers', error, {
        agentId: args.agentId,
        userId: args.userId,
      });
      throw error;
    }
  },
});

/**
 * Get MCP tools available for an agent
 */
export const getAgentMcpTools = query({
  args: {
    agentId: v.id('agents'),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const tools = globalMcpServerManager.getToolsForAgent(
      args.agentId,
      args.userId
    );
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      category: tool.category,
      serverId: tool.serverId,
    }));
  },
});

/**
 * Execute MCP tool
 */
export const executeMcpTool = action({
  args: {
    toolName: v.string(),
    input: v.any(),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const executionContext: ToolExecutionContext = {
        ctx,
        sessionId: args.sessionId,
      };

      const result = await globalMcpServerManager.executeToolThroughMcp(
        args.toolName,
        args.input,
        executionContext
      );

      // Log tool execution for monitoring
      if (result.success) {
        logger.info('MCP tool executed successfully', {
          toolName: args.toolName,
          executionTime: result.executionTime,
        });
      } else {
        logger.warn('MCP tool execution failed', {
          toolName: args.toolName,
          error: result.error,
          executionTime: result.executionTime,
        });
      }

      return result;
    } catch (error) {
      logger.error('MCP tool execution error', error, {
        toolName: args.toolName,
      });
      throw error;
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
    const agentContext = globalMcpServerManager.getAgentContext(
      args.agentId,
      args.userId
    );
    if (!agentContext) {
      return { servers: [], totalHealth: 0 };
    }

    const servers = Array.from(agentContext.connections.values()).map(
      (connection) => ({
        name: connection.name,
        status: connection.status,
        healthScore: connection.healthScore,
        responseTimeMs: connection.responseTimeMs,
        lastConnected: connection.lastConnected,
        errorMessage: connection.errorMessage,
        toolCount: connection.tools.length,
      })
    );

    const totalHealth =
      servers.reduce((sum, server) => sum + server.healthScore, 0) /
      Math.max(servers.length, 1);

    return {
      servers,
      totalHealth: Math.round(totalHealth),
      connectedCount: servers.filter((s) => s.status === 'connected').length,
      totalCount: servers.length,
    };
  },
});

/**
 * Reconnect to MCP server
 */
export const reconnectMcpServer = action({
  args: {
    serverId: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const connection = await globalMcpServerManager.reconnectServer(
        args.serverId,
        args.userId
      );

      // Update database record
      await ctx.runMutation(api.mcpServers.updateServerStatus, {
        serverId: args.serverId,
        status:
          connection.status === 'reconnecting'
            ? 'connecting'
            : connection.status,
        lastConnected: connection.lastConnected,
        errorMessage: connection.errorMessage,
      });

      return {
        success: true,
        serverName: connection.name,
        status: connection.status,
        healthScore: connection.healthScore,
      };
    } catch (error) {
      logger.error('Failed to reconnect MCP server', error, {
        serverId: args.serverId,
      });
      throw error;
    }
  },
});

// =============================================================================
// Integration Functions for Existing Systems
// =============================================================================

/**
 * Check if a tool should be routed through MCP servers
 */
export function shouldUseMcpTool(
  toolName: string,
  agentId: Id<'agents'>,
  userId: string
): boolean {
  const agentContext = globalMcpServerManager.getAgentContext(agentId, userId);
  if (!agentContext) {
    return false;
  }

  const tool = agentContext.tools.get(toolName);
  if (!tool) {
    return false;
  }

  const connection = globalMcpServerManager
    .getAllConnections()
    .get(tool.serverId);
  return connection ? connection.status === 'connected' : false;
}

/**
 * Get enhanced tool capabilities including MCP tools
 */
export function getEnhancedAgentCapabilities(
  agentId: Id<'agents'>,
  userId: string,
  baseCapabilities: string[]
): string[] {
  const mcpTools = globalMcpServerManager.getToolsForAgent(agentId, userId);
  const mcpCapabilities = mcpTools.map((tool) => `mcp_${tool.name}`);

  return [...baseCapabilities, ...mcpCapabilities];
}

export default globalMcpServerManager;
