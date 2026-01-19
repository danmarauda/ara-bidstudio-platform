/**
 * MCP Server Management API
 * Handles MCP server initialization and status
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DEFAULT_MCP_SERVERS, mcpManager } from '@/lib/mcp/client';
import {
  ensureMCPServersInitialized,
  isMCPInitialized,
} from '@/lib/mcp/initialize';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { aiRateLimit } from '@/lib/middleware/rate-limit';
import { MCPTransportType } from '@/lib/types/mcp';
import {
  addSecurityHeaders,
  createdResponse,
  successResponse,
  validationErrorResponse,
} from '@/lib/utils/apiResponse';
import { createModuleLogger } from '@/lib/utils/logger';

const log = createModuleLogger('mcp-servers-api');

// =============================================================================
// Request Validation
// =============================================================================

const toolPropertySchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.object({
      type: z.enum([
        'string',
        'number',
        'integer',
        'boolean',
        'array',
        'object',
        'null',
      ]),
      description: z.string().optional(),
      enum: z
        .array(z.union([z.string(), z.number(), z.boolean(), z.null()]))
        .optional(),
      default: z
        .union([z.string(), z.number(), z.boolean(), z.null()])
        .optional(),
      minimum: z.number().optional(),
      maximum: z.number().optional(),
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      pattern: z.string().optional(),
      format: z.string().optional(),
      items: z.lazy(() => toolPropertySchema).optional(),
      properties: z
        .record(
          z.string(),
          z.lazy(() => toolPropertySchema)
        )
        .optional(),
      required: z.array(z.string()).optional(),
      additionalProperties: z.boolean().optional(),
    }),
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
  ])
);

const toolSchemaSchema = z.object({
  type: z.enum(['object', 'array', 'string', 'number', 'boolean', 'null']),
  properties: z.record(z.string(), toolPropertySchema).optional(),
  items: toolPropertySchema.optional(),
  required: z.array(z.string()).optional(),
  additionalProperties: z.boolean().optional(),
  description: z.string().optional(),
  default: z.unknown().optional(),
});

const initServerSchema = z.object({
  name: z.string().min(1),
  transport: z.object({
    type: z.enum([
      MCPTransportType.STDIO,
      MCPTransportType.SSE,
      MCPTransportType.HTTP,
      MCPTransportType.WEBSOCKET,
    ]),
    command: z.string().optional(),
    args: z.array(z.string()).optional(),
    url: z.string().optional(),
    headers: z.record(z.string(), z.string()).optional(),
    sessionId: z.string().optional(),
    env: z.record(z.string(), z.string()).optional(),
    timeout: z.number().optional(),
  }),
  description: z.string().optional(),
  toolSchemas: z.record(z.string(), toolSchemaSchema).optional(),
  enabled: z.boolean().optional(),
  autoConnect: z.boolean().optional(),
  priority: z.number().optional(),
});

// =============================================================================
// Route Handlers
// =============================================================================

/**
 * GET /api/mcp/servers - Get MCP server status and available tools
 */
export function GET(request: NextRequest) {
  return aiRateLimit(request, (req) => {
    return withAuth(req, async (_authReq: AuthenticatedRequest) => {
      try {
        // Ensure MCP servers are initialized
        await ensureMCPServersInitialized();

        // Get all available tools from all servers
        const allTools = mcpManager.getAllTools();
        const toolNames = Object.keys(allTools);

        // Get server status
        const servers = DEFAULT_MCP_SERVERS.map((server) => ({
          name: server.name,
          description: server.description,
          transport: server.transport.type,
          tools: Object.keys(mcpManager.getServerTools(server.name) || {}),
        }));

        const response = successResponse({
          initialized: isMCPInitialized(),
          servers,
          totalTools: toolNames.length,
          availableTools: toolNames,
        });

        return addSecurityHeaders(response);
      } catch (error) {
        log.error('Get MCP servers error', {
          error: error instanceof Error ? error.message : String(error),
        });
        const response = NextResponse.json(
          { error: 'Failed to get MCP server status' },
          { status: 500 }
        );
        return addSecurityHeaders(response);
      }
    });
  });
}

/**
 * POST /api/mcp/servers - Initialize a new MCP server
 */
export function POST(request: NextRequest) {
  return aiRateLimit(request, (req) => {
    return withAuth(req, async (_authReq: AuthenticatedRequest) => {
      try {
        const body = await req.json();
        const validation = initServerSchema.safeParse(body);

        if (!validation.success) {
          return validationErrorResponse(
            'Invalid server configuration',
            validation.error.flatten().fieldErrors
          );
        }

        const serverConfig = validation.data;

        // Initialize the server (toolSchemas need to be omitted as they're JSON Schema format)
        // The MCP client expects Zod schemas, but API receives JSON schemas
        const { toolSchemas: _toolSchemas, ...configForClient } = serverConfig;
        await mcpManager.initializeClient(configForClient);

        // Get the tools from the newly initialized server
        const tools = mcpManager.getServerTools(serverConfig.name);
        const toolNames = tools ? Object.keys(tools) : [];

        log.info('MCP server initialized successfully', {
          serverName: serverConfig.name,
          toolCount: toolNames.length,
        });

        const response = createdResponse({
          name: serverConfig.name,
          description: serverConfig.description,
          transport: serverConfig.transport.type,
          tools: toolNames,
        });

        return addSecurityHeaders(response);
      } catch (error) {
        log.error('Initialize MCP server error', {
          error: error instanceof Error ? error.message : String(error),
        });
        const response = NextResponse.json(
          { error: 'Failed to initialize MCP server' },
          { status: 500 }
        );
        return addSecurityHeaders(response);
      }
    });
  });
}

export function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return addSecurityHeaders(response);
}
