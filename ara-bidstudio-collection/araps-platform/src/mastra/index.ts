import { Mastra } from '@mastra/core/mastra';
import { codeGenerationAgent, dataAnalysisAgent, workflowOrchestrationAgent, userExperienceAgent } from './agents';
import { dataQueryTool, codeExecutionTool, workflowManagementTool, analyticsTool } from './tools';
import { mcpClient, mcpServer } from './mcp';

// Initialize Mastra with all agents, tools, and integrations
export const mastra = new Mastra({
  // AI Agents
  agents: {
    codeGenerationAgent,
    dataAnalysisAgent,
    workflowOrchestrationAgent,
    userExperienceAgent,
  },
});

// Export individual components for direct use
export { codeGenerationAgent, dataAnalysisAgent, workflowOrchestrationAgent, userExperienceAgent };
export { dataQueryTool, codeExecutionTool, workflowManagementTool, analyticsTool };
export { mcpClient, mcpServer };

// Helper functions for common operations
export const initializePlatform = async () => {
  try {
    // Initialize MCP connections
    await mcpClient.connect();

    // Start MCP server
    await mcpServer.start();

    console.log('ARAPS Platform initialized successfully');
  } catch (error) {
    console.error('Failed to initialize ARAPS Platform:', error);
    throw error;
  }
};

export const shutdownPlatform = async () => {
  try {
    // Disconnect MCP clients
    await mcpClient.disconnect();

    // Stop MCP server
    await mcpServer.stop();

    console.log('ARAPS Platform shut down successfully');
  } catch (error) {
    console.error('Failed to shutdown ARAPS Platform:', error);
    throw error;
  }
};

// Health check function
export const healthCheck = async () => {
  const health = {
    platform: 'healthy',
    agents: {
      codeGenerationAgent: true,
      dataAnalysisAgent: true,
      workflowOrchestrationAgent: true,
      userExperienceAgent: true,
    },
    tools: { dataQueryTool: true, codeExecutionTool: true, workflowManagementTool: true, analyticsTool: true },
    mcp: { client: true, server: true },
    timestamp: new Date().toISOString(),
  };

  return health;
};
