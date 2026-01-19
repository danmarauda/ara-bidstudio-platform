import { type NextRequest, NextResponse } from 'next/server';

// Define admin-only routes
const ADMIN_ROUTES = ['/admin', '/memories'];

// Define protected routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/chat',
  '/agents',
  '/workflows',
  '/mcp',
  '/account',
  '/settings',
  '/subscription',
  '/wallet',
  ...ADMIN_ROUTES,
];

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries periodically
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetTime < now) {
        rateLimitMap.delete(key);
      }
    }
  }, 60000); // Clean every minute
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const response = NextResponse.next();
  
  // Skip middleware for static assets
  if (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname.includes('/public/')
  ) {
    return response;
  }

  // Security Headers
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.fontshare.com https://vercel.live https://*.vercel-analytics.com;
    style-src 'self' 'unsafe-inline' https://api.fontshare.com;
    font-src 'self' data: https://api.fontshare.com;
    img-src 'self' data: blob: https: http:;
    media-src 'self' blob:;
    connect-src 'self' wss://*.convex.cloud https://*.convex.cloud https://api.openai.com https://api.anthropic.com https://api.google.com https://openrouter.ai https://*.vercel-analytics.com ws://localhost:* http://localhost:*;
    frame-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // HSTS (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Basic Rate Limiting for API routes
  if (pathname.startsWith('/api')) {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const rateLimitKey = `${ip}:${pathname}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = 60; // 60 requests per minute
    
    const current = rateLimitMap.get(rateLimitKey);
    
    if (!current) {
      rateLimitMap.set(rateLimitKey, {
        count: 1,
        resetTime: now + windowMs,
      });
    } else {
      if (current.resetTime < now) {
        // Reset window
        rateLimitMap.set(rateLimitKey, {
          count: 1,
          resetTime: now + windowMs,
        });
      } else {
        current.count++;
        
        if (current.count > maxRequests) {
          // Rate limit exceeded
          return new NextResponse('Too Many Requests', {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil((current.resetTime - now) / 1000)),
              'X-RateLimit-Limit': String(maxRequests),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(current.resetTime).toISOString(),
            },
          });
        }
        
        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', String(maxRequests));
        response.headers.set('X-RateLimit-Remaining', String(maxRequests - current.count));
        response.headers.set('X-RateLimit-Reset', new Date(current.resetTime).toISOString());
      }
    }
  }

  // Add request ID for tracing
  response.headers.set('X-Request-Id', crypto.randomUUID());

  // Check if the current route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the current route is admin-only
  const _isAdminRoute = ADMIN_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // If it's not a protected route, return with security headers
  if (!isProtectedRoute) {
    return response;
  }

  // For admin routes, we'll let the client-side AdminGuard handle the authorization
  // since we need to check the Convex database for admin status
  // The middleware just ensures the route is accessible for further processing

  // For now, we'll rely on client-side guards for admin authorization
  // In a production app, you might want to add server-side admin checking here
  // using a server-side authentication system or API route

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$|.*\\.webp$|sw\\.js|manifest\\.json).*)',
  ],
};
