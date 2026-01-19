import { type NextRequest, NextResponse } from 'next/server';

// API route for payment verification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward the request to Convex HTTP action
    const convexUrl =
      process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json(
        { success: false, error: 'Convex URL not configured' },
        { status: 500 }
      );
    }

    // Convert WebSocket URL to HTTP URL for Convex HTTP actions
    // wss://subdomain.convex.cloud -> https://subdomain.convex.site
    const httpUrl = convexUrl
      .replace('wss://', 'https://')
      .replace('.convex.cloud', '.convex.site');

    // Convex HTTP actions are accessed at the deployment URL with the path defined in http.ts
    const httpActionUrl = `${httpUrl}/verify-payment`;

    const response = await fetch(httpActionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const _text = await response.text();
      return NextResponse.json(
        {
          success: false,
          error: `Payment verification service error: ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json(result, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Debug endpoint to verify route is working
export function GET() {
  return NextResponse.json({
    message: 'Payment verification API is running',
    convexUrl:
      process.env.NEXT_PUBLIC_CONVEX_URL ||
      process.env.CONVEX_URL ||
      'Not configured',
  });
}
