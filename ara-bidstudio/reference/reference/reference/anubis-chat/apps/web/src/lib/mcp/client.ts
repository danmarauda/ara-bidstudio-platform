/**
 * MCP Client Integration
 * Provides integration with Model Context Protocol servers for tool calling
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
// We'll store MCP tool definitions, not AI SDK tools
import type {
  CallToolResult,
  ListToolsResult,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { MCPTransportConfig as MCPTransportConfigType } from '@/lib/types/mcp';
import { MCPTransportType } from '@/lib/types/mcp';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('mcp-client');

// Re-export the transport config from types/mcp.ts for backwards compatibility
export type MCPTransportConfig = MCPTransportConfigType;

// MCP Tool Definition with proper typing
export interface MCPTool<TInput = Record<string, unknown>, TOutput = unknown> {
  name: string;
  description: string;
  schema: z.ZodSchema<TInput>;
  execute: (input: TInput) => Promise<TOutput>;
}

// MCP Server Configuration
export interface MCPServerConfig {
  name: string;
  transport: MCPTransportConfig;
  description?: string;
  toolSchemas?: Record<string, z.ZodObject<z.ZodRawShape>>;
}

// MCP Client Manager
export class MCPClientManager {
  private clients: Map<string, Client> = new Map();
  private transports: Map<string, Transport> = new Map();
  private tools: Map<string, Record<string, MCPTool>> = new Map();

  /**
   * Initialize an MCP client with the specified configuration
   */
  async initializeClient(config: MCPServerConfig): Promise<void> {
    const transport = await this.createTransport(config.transport);

    const client = new Client(
      {
        name: config.name,
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    await client.connect(transport);

    this.clients.set(config.name, client);
    this.transports.set(config.name, transport);

    // Initialize tools from the server
    await this.initializeTools(config.name, config.toolSchemas);
  }

  /**
   * Create transport based on configuration
   */
  private async createTransport(
    config: MCPTransportConfig
  ): Promise<Transport> {
    switch (config.type) {
      case MCPTransportType.STDIO:
        if (!config.command) {
          throw new Error('Command is required for stdio transport');
        }
        return new StdioClientTransport({
          command: config.command,
          args: config.args || [],
          env: config.env,
        });

      case MCPTransportType.SSE:
        if (!config.url) {
          throw new Error('URL is required for SSE transport');
        }
        return new SSEClientTransport(new URL(config.url));

      case MCPTransportType.HTTP:
        if (!config.url) {
          throw new Error('URL is required for HTTP transport');
        }
        return new StreamableHTTPClientTransport(new URL(config.url), {
          sessionId: config.sessionId,
        });

      default:
        throw new Error(`Unsupported transport type: ${config.type}`);
    }
  }

  /**
   * Initialize tools from MCP server
   */
  private async initializeTools(
    serverName: string,
    toolSchemas?: Record<string, z.ZodObject<z.ZodRawShape>>
  ): Promise<void> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Client ${serverName} not found`);
    }

    const serverTools = (await client.listTools()) as ListToolsResult;
    const tools: Record<string, MCPTool> = {};

    for (const serverTool of serverTools.tools) {
      const schema = toolSchemas?.[serverTool.name];

      // Store MCP tool definition with schema if provided
      tools[serverTool.name] = {
        name: serverTool.name,
        description: serverTool.description || '',
        schema: schema || z.record(z.string(), z.unknown()),
        execute: async (input: Record<string, unknown>) => {
          const result = (await client.callTool({
            name: serverTool.name,
            arguments: input,
          })) as CallToolResult;
          return result.content;
        },
      };
    }

    this.tools.set(serverName, tools);
  }

  /**
   * Get all tools from a specific server
   */
  getServerTools(serverName: string): Record<string, MCPTool> | undefined {
    return this.tools.get(serverName);
  }

  /**
   * Get all tools from all servers
   */
  getAllTools(): Record<string, MCPTool> {
    const allTools: Record<string, MCPTool> = {};

    for (const [serverName, serverTools] of this.tools) {
      for (const [toolName, tool] of Object.entries(serverTools)) {
        // Prefix tool name with server name to avoid conflicts
        allTools[`${serverName}_${toolName}`] = tool;
      }
    }

    return allTools;
  }

  /**
   * Call a tool on a specific server
   */
  async callTool(
    serverName: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Client ${serverName} not found`);
    }

    const result = (await client.callTool({
      name: toolName,
      arguments: args,
    })) as CallToolResult;
    return result.content;
  }

  /**
   * List available prompts from a server
   */
  async listPrompts(serverName: string): Promise<
    Array<{
      name: string;
      description?: string;
      arguments?: Array<{
        name: string;
        description?: string;
        required?: boolean;
      }>;
    }>
  > {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Client ${serverName} not found`);
    }

    const prompts = await client.listPrompts();
    return prompts.prompts;
  }

  /**
   * Get a prompt from a server
   */
  async getPrompt(
    serverName: string,
    promptName: string,
    args?: Record<string, string>
  ): Promise<string> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Client ${serverName} not found`);
    }

    const prompt = await client.getPrompt({
      name: promptName,
      arguments: args,
    });

    if (prompt.messages.length > 0) {
      return prompt.messages.map((m) => m.content).join('\n');
    }

    return '';
  }

  /**
   * List available resources from a server
   */
  async listResources(serverName: string): Promise<
    Array<{
      uri: string;
      name?: string;
      description?: string;
      mimeType?: string;
    }>
  > {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Client ${serverName} not found`);
    }

    const resources = await client.listResources();
    return resources.resources;
  }

  /**
   * Read a resource from a server
   */
  async readResource(
    serverName: string,
    uri: string
  ): Promise<
    Array<{ uri: string; mimeType?: string; text?: string; blob?: string }>
  > {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Client ${serverName} not found`);
    }

    const resource = await client.readResource({ uri });
    return resource.contents;
  }

  /**
   * Get list of connected server names
   */
  getConnectedServers(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * Check if a server is connected
   */
  isServerConnected(serverName: string): boolean {
    return this.clients.has(serverName);
  }

  /**
   * Close a client connection
   */
  async closeClient(serverName: string): Promise<void> {
    const client = this.clients.get(serverName);
    const transport = this.transports.get(serverName);

    if (client) {
      await client.close();
      this.clients.delete(serverName);
    }

    if (transport) {
      await transport.close();
      this.transports.delete(serverName);
    }

    this.tools.delete(serverName);
  }

  /**
   * Close all client connections
   */
  async closeAll(): Promise<void> {
    const closePromises: Promise<void>[] = [];

    for (const serverName of this.clients.keys()) {
      closePromises.push(this.closeClient(serverName));
    }

    await Promise.all(closePromises);
  }
}

// Singleton instance
export const mcpManager = new MCPClientManager();

// Default MCP server configurations
export const DEFAULT_MCP_SERVERS: MCPServerConfig[] = [
  {
    name: 'context7',
    transport: {
      type: MCPTransportType.HTTP,
      url: process.env.CONTEXT7_MCP_URL || 'https://mcp.context7.com/mcp',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.CONTEXT7_API_KEY && {
          Authorization: `Bearer ${process.env.CONTEXT7_API_KEY}`,
        }),
      },
      timeout: 30_000, // 30 second timeout
    },
    description:
      'Access to library documentation, code examples, and best practices',
    toolSchemas: {
      resolve_library_id: z.object({
        libraryName: z
          .string()
          .describe(
            'Library name to search for and retrieve a Context7-compatible library ID'
          ),
      }),
      get_library_docs: z.object({
        context7CompatibleLibraryID: z
          .string()
          .describe(
            'Exact Context7-compatible library ID (e.g., /mongodb/docs, /vercel/next.js)'
          ),
        tokens: z
          .number()
          .optional()
          .describe(
            'Maximum number of tokens of documentation to retrieve (default: 10000)'
          ),
        topic: z
          .string()
          .optional()
          .describe('Topic to focus documentation on (e.g., hooks, routing)'),
      }),
    },
  },
  {
    name: 'solana',
    transport: {
      type: MCPTransportType.HTTP,
      url: process.env.SOLANA_MCP_URL || 'https://mcp.solana.com/mcp',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30_000, // 30 second timeout
    },
    description:
      'Solana developer assistant with documentation search and Anchor framework expertise',
    toolSchemas: {
      Solana_Expert__Ask_For_Help: z.object({
        question: z
          .string()
          .describe(
            'A Solana related question (how-to, concepts, APIs, SDKs, errors). Provide as much context about the problem as needed.'
          ),
      }),
      Solana_Documentation_Search: z.object({
        query: z
          .string()
          .describe(
            'A search query that will be matched against a corpus of Solana documentation using RAG'
          ),
      }),
      Ask_Solana_Anchor_Framework_Expert: z.object({
        question: z
          .string()
          .describe(
            'Any question about the Anchor Framework (how-to, concepts, APIs, SDKs, errors)'
          ),
      }),
    },
  },
];

// Helper function to initialize default servers
export async function initializeDefaultMCPServers(): Promise<void> {
  for (const server of DEFAULT_MCP_SERVERS) {
    try {
      await mcpManager.initializeClient(server);
      log.info('MCP server initialized successfully', {
        serverName: server.name,
      });
    } catch (error) {
      log.error('Failed to initialize MCP server', {
        serverName: server.name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
