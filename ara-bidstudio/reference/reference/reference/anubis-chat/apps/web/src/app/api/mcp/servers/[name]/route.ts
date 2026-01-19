/**
 * MCP Server Individual Management API
 * Handles operations on specific MCP servers
 */

import { type NextRequest, NextResponse } from 'next/server';
import { mcpManager } from '@/lib/mcp/client';
import { type AuthenticatedRequest, withAuth } from '@/lib/middleware/auth';
import { aiRateLimit } from '@/lib/middleware/rate-limit';
import {
  addSecurityHeaders,
  successResponse,
  validationErrorResponse,
} from '@/lib/utils/apiResponse';
import { createModuleLogger } from '@/lib/utils/logger';

// =============================================================================
// Logger
// =============================================================================

const log = createModuleLogger('api/mcp/servers');

// =============================================================================
// Route Handlers
// =============================================================================

/**
 * DELETE /api/mcp/servers/[name] - Close an MCP server connection
 */
export function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  return aiRateLimit(request, (req) => {
    return withAuth(req, async (_authReq: AuthenticatedRequest) => {
      const { name: serverName } = await params;

      try {
        if (!serverName) {
          return validationErrorResponse('Server name is required', {});
        }

        // Close the server
        await mcpManager.closeClient(serverName);

        log.info('MCP server closed', {
          serverName,
          operation: 'close_server',
        });

        const response = successResponse({
          message: `Server ${serverName} closed successfully`,
        });

        return addSecurityHeaders(response);
      } catch (error) {
        log.error('Failed to close MCP server', {
          error,
          serverName,
          operation: 'close_server',
        });
        const response = NextResponse.json(
          { error: 'Failed to close MCP server' },
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
