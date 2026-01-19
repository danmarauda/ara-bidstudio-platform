import { MCPClient } from '@mastra/mcp';
import { MCPServer } from '@mastra/mcp';

// MCP Client for external tool integration
export const mcpClient = new MCPClient({
  id: 'araps-platform-mcp-client',
  servers: {
    // GitHub integration for repository analysis
    github: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: {
        GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN,
      },
    },

    // File system access for local development
    filesystem: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
    },

    // Web browsing capabilities
    brave: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-brave-search'],
      env: {
        BRAVE_API_KEY: process.env.BRAVE_API_KEY,
      },
    },

    // SQLite database access
    sqlite: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-sqlite', '--db-path', './data/analytics.db'],
    },
  },
});

// MCP Server to expose our agents and tools
export const mcpServer = new MCPServer({
  id: 'araps-platform-mcp-server',
  name: 'ARAPS Platform Server',
  version: '1.0.0',
  agents: {}, // Will be populated with our agents
  tools: {}, // Will be populated with our tools
  workflows: {}, // Will be populated with our workflows
});
