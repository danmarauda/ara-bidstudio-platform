/**
 * API Response Utilities for anubis.chat
 * Based on latest AI SDK patterns and August 2025 best practices
 */

import { nanoid } from 'nanoid';
import { NextResponse } from 'next/server';
import {
  type APIError,
  APIErrorCode,
  type APIResponse,
  type PaginatedResponse,
} from '../types/api';

// =============================================================================
// Response Builders
// =============================================================================

export function createAPIResponse<T>(
  data: T,
  options?: {
    requestId?: string;
    metadata?: Record<string, unknown>;
  }
): APIResponse<T> {
  return {
    success: true,
    data,
    metadata: {
      requestId: options?.requestId ?? nanoid(12),
      timestamp: Date.now(),
      version: '1.0',
      ...options?.metadata,
    },
  };
}

export function createErrorResponse(
  code: APIErrorCode,
  message: string,
  options?: {
    details?: Record<string, unknown>;
    requestId?: string;
    status?: number;
  }
): NextResponse {
  const error: APIError = {
    code,
    message,
    details: options?.details,
    timestamp: Date.now(),
    requestId: options?.requestId ?? nanoid(12),
  };

  const response: APIResponse<never> = {
    success: false,
    error,
  };

  return NextResponse.json(response, {
    status: options?.status ?? getStatusFromErrorCode(code),
    headers: {
      'X-Request-ID': error.requestId,
      'Content-Type': 'application/json',
    },
  });
}

export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    cursor?: string;
    nextCursor?: string;
    hasMore: boolean;
    total?: number;
    limit: number;
  },
  options?: {
    requestId?: string;
    metadata?: Record<string, unknown>;
  }
): PaginatedResponse<T> {
  return {
    success: true,
    data,
    pagination,
    metadata: {
      requestId: options?.requestId ?? nanoid(12),
      timestamp: Date.now(),
      version: '1.0',
      ...options?.metadata,
    },
  };
}

// =============================================================================
// Status Code Mapping
// =============================================================================

function getStatusFromErrorCode(code: APIErrorCode): number {
  const statusMap: Record<APIErrorCode, number> = {
    // Authentication errors
    [APIErrorCode.UNAUTHORIZED]: 401,
    [APIErrorCode.FORBIDDEN]: 403,
    [APIErrorCode.INVALID_TOKEN]: 401,
    [APIErrorCode.TOKEN_EXPIRED]: 401,
    [APIErrorCode.INVALID_SIGNATURE]: 401,

    // Validation errors
    [APIErrorCode.VALIDATION_ERROR]: 422,
    [APIErrorCode.INVALID_REQUEST]: 400,
    [APIErrorCode.MISSING_PARAMETERS]: 400,

    // Resource errors
    [APIErrorCode.RESOURCE_NOT_FOUND]: 404,
    [APIErrorCode.RESOURCE_CONFLICT]: 409,
    [APIErrorCode.RESOURCE_LIMIT_EXCEEDED]: 429,

    // Rate limiting
    [APIErrorCode.RATE_LIMIT_EXCEEDED]: 429,
    [APIErrorCode.QUOTA_EXCEEDED]: 429,

    // AI/Model errors
    [APIErrorCode.MODEL_UNAVAILABLE]: 503,
    [APIErrorCode.CONTEXT_TOO_LONG]: 413,
    [APIErrorCode.UNSAFE_CONTENT]: 400,

    // Server errors
    [APIErrorCode.INTERNAL_ERROR]: 500,
    [APIErrorCode.SERVICE_UNAVAILABLE]: 503,
    [APIErrorCode.TIMEOUT]: 504,
  };

  return statusMap[code] ?? 500;
}

// =============================================================================
// Success Response Helpers
// =============================================================================

export function successResponse<T>(data: T, requestId?: string): NextResponse {
  return NextResponse.json(createAPIResponse(data, { requestId }));
}

export function createdResponse<T>(data: T, requestId?: string): NextResponse {
  return NextResponse.json(createAPIResponse(data, { requestId }), {
    status: 201,
  });
}

export function noContentResponse(requestId?: string): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'X-Request-ID': requestId ?? nanoid(12),
    },
  });
}

export function paginatedResponse<T>(
  data: T[],
  pagination: {
    cursor?: string;
    nextCursor?: string;
    hasMore: boolean;
    total?: number;
    limit: number;
  },
  requestId?: string
): NextResponse {
  return NextResponse.json(
    createPaginatedResponse(data, pagination, { requestId })
  );
}

// =============================================================================
// Error Response Helpers
// =============================================================================

export function unauthorizedResponse(
  message = 'Unauthorized',
  requestId?: string
): NextResponse {
  return createErrorResponse(APIErrorCode.UNAUTHORIZED, message, { requestId });
}

export function forbiddenResponse(
  message = 'Forbidden',
  requestId?: string
): NextResponse {
  return createErrorResponse(APIErrorCode.FORBIDDEN, message, { requestId });
}

export function notFoundResponse(
  message = 'Resource not found',
  requestId?: string
): NextResponse {
  return createErrorResponse(APIErrorCode.RESOURCE_NOT_FOUND, message, {
    requestId,
  });
}

export function validationErrorResponse(
  message = 'Validation error',
  details?: Record<string, unknown>,
  requestId?: string
): NextResponse {
  return createErrorResponse(APIErrorCode.VALIDATION_ERROR, message, {
    details,
    requestId,
  });
}

export function rateLimitResponse(
  message = 'Rate limit exceeded',
  retryAfter?: number,
  requestId?: string
): NextResponse {
  const response = createErrorResponse(
    APIErrorCode.RATE_LIMIT_EXCEEDED,
    message,
    {
      requestId,
      details: { retryAfter },
    }
  );

  if (retryAfter) {
    response.headers.set('Retry-After', retryAfter.toString());
  }

  return response;
}

export function internalErrorResponse(
  message = 'Internal server error',
  requestId?: string
): NextResponse {
  return createErrorResponse(APIErrorCode.INTERNAL_ERROR, message, {
    requestId,
  });
}

export function serviceUnavailableResponse(
  message = 'Service temporarily unavailable',
  requestId?: string
): NextResponse {
  return createErrorResponse(APIErrorCode.SERVICE_UNAVAILABLE, message, {
    requestId,
  });
}

// =============================================================================
// AI-Specific Error Responses
// =============================================================================

export function modelUnavailableResponse(
  model: string,
  requestId?: string
): NextResponse {
  return createErrorResponse(
    APIErrorCode.MODEL_UNAVAILABLE,
    `AI model '${model}' is currently unavailable`,
    { requestId, details: { model } }
  );
}

export function contextTooLongResponse(
  maxTokens: number,
  actualTokens: number,
  requestId?: string
): NextResponse {
  return createErrorResponse(
    APIErrorCode.CONTEXT_TOO_LONG,
    'Context exceeds maximum token limit',
    {
      requestId,
      details: { maxTokens, actualTokens },
    }
  );
}

export function unsafeContentResponse(
  reason: string,
  requestId?: string
): NextResponse {
  return createErrorResponse(
    APIErrorCode.UNSAFE_CONTENT,
    `Content violates safety guidelines: ${reason}`,
    { requestId, details: { reason } }
  );
}

// =============================================================================
// Response Headers
// =============================================================================

/**
 * @deprecated Use addSecurityHeaders from @/lib/utils/cors instead
 * This function is kept for backward compatibility
 */
export function addSecurityHeaders(
  response: NextResponse | Response,
  requestOrigin?: string | null
): NextResponse {
  // Convert Response to NextResponse if needed
  const nextResponse =
    response instanceof NextResponse
      ? response
      : new NextResponse(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });

  // Import CORS utility dynamically to avoid circular dependency
  const { addSecurityHeaders: add } = require('@/lib/utils/cors') as {
    addSecurityHeaders: (
      res: NextResponse,
      origin?: string | null
    ) => NextResponse;
  };
  return add(nextResponse, requestOrigin);
}

export function addRateLimitHeaders(
  response: NextResponse | Response,
  limit: number,
  remaining: number,
  reset: number
): NextResponse {
  // Convert Response to NextResponse if needed
  const nextResponse =
    response instanceof NextResponse
      ? response
      : new NextResponse(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });

  nextResponse.headers.set('X-RateLimit-Limit', limit.toString());
  nextResponse.headers.set('X-RateLimit-Remaining', remaining.toString());
  nextResponse.headers.set('X-RateLimit-Reset', reset.toString());

  return nextResponse;
}
