/**
 * MCP Client Factory
 * Creates and manages MCP (Model Context Protocol) clients for different servers
 */

import type { Tool } from 'ai';
import { experimental_createMCPClient, tool } from 'ai';
import { z } from 'zod';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('mcp-client-factory');

// MCP Server Configuration
export interface MCPServerConfig {
  name: string;
  enabled: boolean;
  config?: Record<string, any>;
  transportType?: 'sse' | 'stdio' | 'custom';
  url?: string;
}

// MCP Client instance
interface MCPClient {
  client: Awaited<ReturnType<typeof experimental_createMCPClient>>;
  tools: Record<string, Tool>;
  name: string;
}

/**
 * Factory for creating MCP clients based on server configuration
 */
export class MCPClientFactory {
  private static clients = new Map<string, MCPClient>();

  /**
   * Get or create an MCP client for the specified server
   */
  static async getClient(server: MCPServerConfig): Promise<MCPClient | null> {
    if (!server.enabled) {
      return null;
    }

    // Check if client already exists
    const cacheKey = `${server.name}-${JSON.stringify(server.config)}`;
    if (MCPClientFactory.clients.has(cacheKey)) {
      return MCPClientFactory.clients.get(cacheKey)!;
    }

    try {
      // Create new client based on server type
      const client = await MCPClientFactory.createClient(server);

      if (client) {
        MCPClientFactory.clients.set(cacheKey, client);
        log.info(`Created MCP client for ${server.name}`);
      }

      return client;
    } catch (error) {
      log.error(`Failed to create MCP client for ${server.name}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Create an MCP client based on server configuration
   */
  private static async createClient(
    server: MCPServerConfig
  ): Promise<MCPClient | null> {
    switch (server.name) {
      case 'context7':
        return await MCPClientFactory.createContext7Client(server);
      case 'solana':
        return await MCPClientFactory.createSolanaClient(server);
      default:
        log.warn(`Unknown MCP server: ${server.name}`);
        return null;
    }
  }

  /**
   * Create Context7 MCP client for library documentation
   */
  private static async createContext7Client(
    _server: MCPServerConfig
  ): Promise<MCPClient | null> {
    const context7Url =
      process.env.NEXT_PUBLIC_CONTEXT7_MCP_URL ||
      'https://mcp.context7.com/mcp';

    try {
      log.info(`Connecting to Context7 MCP server at ${context7Url}`);

      const client = await experimental_createMCPClient({
        transport: {
          type: 'sse',
          url: context7Url,
          headers: {
            'Content-Type': 'application/json',
          },
        },
        name: 'context7-client',
      });

      // Get available tools from the server
      const tools = await client.tools();

      log.info(
        `Context7 MCP connected successfully. Available tools: ${Object.keys(tools).join(', ')}`
      );

      return {
        client,
        tools,
        name: 'context7',
      };
    } catch (error) {
      log.error('Failed to connect to Context7 MCP server', {
        error: error instanceof Error ? error.message : String(error),
        url: context7Url,
      });

      // Return fallback tools if MCP server connection fails
      return MCPClientFactory.createContext7FallbackTools();
    }
  }

  /**
   * Create fallback Context7 tools when MCP server is unavailable
   */
  private static createContext7FallbackTools(): MCPClient {
    const fallbackTools: Record<string, Tool> = {
      'resolve-library-id': tool({
        description:
          'Resolve a library name to a Context7-compatible library ID',
        inputSchema: z.object({
          libraryName: z.string().describe('Library name to search for'),
        }),
        execute: async ({ libraryName }) => {
          log.warn(
            `Context7 MCP unavailable, using fallback for: ${libraryName}`
          );
          return {
            error: 'Context7 MCP server is currently unavailable',
            libraryName,
            suggestion:
              "Try searching directly at https://www.npmjs.com/ or the library's official documentation",
          };
        },
      }) as Tool,
      'get-library-docs': tool({
        description: 'Get documentation for a library using its Context7 ID',
        inputSchema: z.object({
          context7CompatibleLibraryID: z
            .string()
            .describe('Context7-compatible library ID in format /org/project'),
          tokens: z
            .number()
            .optional()
            .default(10_000)
            .describe('Maximum tokens to return'),
          topic: z.string().optional().describe('Specific topic to focus on'),
        }),
        execute: async ({ context7CompatibleLibraryID, tokens, topic }) => {
          log.warn(
            `Context7 MCP unavailable, using fallback for: ${context7CompatibleLibraryID}`
          );
          return {
            error: 'Context7 MCP server is currently unavailable',
            libraryId: context7CompatibleLibraryID,
            topic,
            suggestion:
              "Visit the library's official documentation or GitHub repository",
          };
        },
      }) as Tool,
    };

    return {
      client: null as any, // No actual client in fallback mode
      tools: fallbackTools,
      name: 'context7',
    };
  }

  /**
   * Create Solana MCP client for blockchain development assistance
   * Note: Solana MCP is accessed via remote MCP at https://mcp.solana.com/mcp
   */
  private static async createSolanaClient(
    _server: MCPServerConfig
  ): Promise<MCPClient | null> {
    const solanaUrl =
      process.env.NEXT_PUBLIC_SOLANA_MCP_URL || 'https://mcp.solana.com/mcp';

    try {
      log.info(`Connecting to Solana remote MCP server at ${solanaUrl}`);

      // For Solana, we use the remote MCP endpoint directly via SSE
      const client = await experimental_createMCPClient({
        transport: {
          type: 'sse',
          url: solanaUrl,
          headers: {
            'Content-Type': 'application/json',
          },
        },
        name: 'solana-client',
      });

      // Get available tools from the server
      const tools = await client.tools();

      log.info(
        `Solana MCP connected successfully. Available tools: ${Object.keys(tools).join(', ')}`
      );

      return {
        client,
        tools,
        name: 'solana',
      };
    } catch (error) {
      log.error('Failed to connect to Solana MCP server', {
        error: error instanceof Error ? error.message : String(error),
        url: solanaUrl,
      });

      // Return fallback tools if MCP server connection fails
      return MCPClientFactory.createSolanaFallbackTools();
    }
  }

  /**
   * Create fallback Solana tools when MCP server is unavailable
   * These match the tools provided by the actual Solana MCP server
   */
  private static createSolanaFallbackTools(): MCPClient {
    const fallbackTools: Record<string, Tool> = {
      Solana_Expert__Ask_For_Help: tool({
        description:
          'Ask the Solana expert for help with any Solana-related question (how-to, concepts, APIs, SDKs, errors)',
        inputSchema: z.object({
          question: z
            .string()
            .describe(
              'A Solana related question with as much context as possible'
            ),
        }),
        execute: async ({ question }) => {
          log.warn(`Solana MCP unavailable, using fallback for: ${question}`);
          return {
            error:
              'Solana MCP server is currently unavailable. Please try again later.',
            question,
            suggestion:
              'You can visit https://solana.com/docs for documentation',
          };
        },
      }) as Tool,
      Solana_Documentation_Search: tool({
        description:
          'Search the Solana documentation corpus for relevant information',
        inputSchema: z.object({
          query: z.string().describe('Search query for Solana documentation'),
        }),
        execute: async ({ query }) => {
          log.warn(`Solana MCP unavailable, using fallback for: ${query}`);
          return {
            error:
              'Solana MCP server is currently unavailable. Please try again later.',
            query,
            suggestion: 'You can search at https://solana.com/docs',
          };
        },
      }) as Tool,
      Ask_Solana_Anchor_Framework_Expert: tool({
        description:
          'Ask questions specific to the Anchor Framework, including its APIs, SDKs, and error handling',
        inputSchema: z.object({
          question: z.string().describe('Question about the Anchor Framework'),
        }),
        execute: async ({ question }) => {
          log.warn(`Solana MCP unavailable, using fallback for: ${question}`);
          return {
            error:
              'Solana MCP server is currently unavailable. Please try again later.',
            question,
            suggestion:
              'You can visit https://www.anchor-lang.com/ for Anchor documentation',
          };
        },
      }) as Tool,
    };

    return {
      client: null as any, // No actual client in fallback mode
      tools: fallbackTools,
      name: 'solana',
    };
  }

  /**
   * Get all tools from multiple MCP servers
   */
  static async getToolsForServers(
    servers: MCPServerConfig[]
  ): Promise<Record<string, Tool>> {
    const allTools: Record<string, Tool> = {};

    for (const server of servers) {
      if (!server.enabled) {
        continue;
      }

      const mcpClient = await MCPClientFactory.getClient(server);
      if (mcpClient?.tools) {
        // Prefix tool names with server name to avoid conflicts
        for (const [toolName, tool] of Object.entries(mcpClient.tools)) {
          const prefixedName = `${server.name}_${toolName}`;
          allTools[prefixedName] = tool;
        }
      }
    }

    return allTools;
  }

  /**
   * Execute a tool from an MCP server
   */
  static async executeTool(
    serverName: string,
    toolName: string,
    parameters: any
  ): Promise<any> {
    const client = Array.from(MCPClientFactory.clients.values()).find(
      (c) => c.name === serverName
    );

    if (!client) {
      throw new Error(`MCP client ${serverName} not found`);
    }

    // Remove server prefix from tool name if present
    const cleanToolName = toolName.startsWith(`${serverName}_`)
      ? toolName.substring(serverName.length + 1)
      : toolName;

    try {
      // If this is a fallback tool (no client), execute it directly
      if (!client.client && client.tools[cleanToolName]) {
        const tool = client.tools[cleanToolName];
        if ('execute' in tool && typeof tool.execute === 'function') {
          return await tool.execute(parameters, {} as any);
        }
      }

      // Otherwise, execute the tool using the MCP client
      if (client.client) {
        const result = await (client.client as any).request({
          method: 'tools/call',
          params: {
            name: cleanToolName,
            arguments: parameters,
          },
        });
        return result;
      }

      throw new Error(`Tool ${cleanToolName} not executable on ${serverName}`);
    } catch (error) {
      log.error(
        `Failed to execute MCP tool ${cleanToolName} on ${serverName}`,
        {
          error: error instanceof Error ? error.message : String(error),
          parameters,
        }
      );
      throw error;
    }
  }

  /**
   * Close all MCP clients
   */
  static async closeAll(): Promise<void> {
    for (const [key, client] of MCPClientFactory.clients.entries()) {
      try {
        if (client.client) {
          await client.client.close();
        }
        MCPClientFactory.clients.delete(key);
        log.info(`Closed MCP client: ${client.name}`);
      } catch (error) {
        log.error(`Failed to close MCP client: ${client.name}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Close a specific MCP client
   */
  static async closeClient(serverName: string): Promise<void> {
    const clientsToClose = Array.from(
      MCPClientFactory.clients.entries()
    ).filter(([_, client]) => client.name === serverName);

    for (const [key, client] of clientsToClose) {
      try {
        if (client.client) {
          await client.client.close();
        }
        MCPClientFactory.clients.delete(key);
        log.info(`Closed MCP client: ${client.name}`);
      } catch (error) {
        log.error(`Failed to close MCP client: ${client.name}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }
}
