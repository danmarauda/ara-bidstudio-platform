import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { auth } from './auth';
import {
  generateUploadUrl as files_generateUploadUrl,
  registerUpload as files_registerUpload,
  serveStorage as files_serveStorage,
} from './files';
import { verifyPaymentTransaction } from './paymentVerification';
import { streamChat } from './streaming';
import { processSubscriptionPayment } from './subscriptionPayment';

const http = httpRouter();

// Add Convex Auth HTTP routes (required for authentication)
auth.addHttpRoutes(http);

// Configure allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://www.anubis.chat',
  'https://anubis.chat',
  'https://anubis-chat-web.vercel.app',
  process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : null,
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
].filter(Boolean) as string[];

// CORS handler for preflight requests
const corsHandler = httpAction(async (_ctx, request) => {
  const origin = request.headers.get('origin');
  const requestMethod = request.headers.get('Access-Control-Request-Method');
  const requestHeaders = request.headers.get('Access-Control-Request-Headers');

  // Validate origin
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);
  const allowedOrigin = isAllowed ? origin : ALLOWED_ORIGINS[0];

  // Validate preflight headers are present
  if (!(origin && requestMethod && requestHeaders)) {
    return new Response(null, { status: 400 });
  }

  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    },
  });
});

// Chat streaming endpoint with CORS support
http.route({
  path: '/stream-chat',
  method: 'OPTIONS',
  handler: corsHandler,
});

http.route({
  path: '/stream-chat',
  method: 'POST',
  handler: streamChat,
});

// File upload URL generation
http.route({
  path: '/generateUploadUrl',
  method: 'OPTIONS',
  handler: corsHandler,
});
http.route({
  path: '/generateUploadUrl',
  method: 'POST',
  handler: files_generateUploadUrl,
});

// Serve storage
http.route({
  path: '/serveStorage',
  method: 'GET',
  handler: files_serveStorage,
});

// Register uploaded file metadata
http.route({
  path: '/registerUpload',
  method: 'OPTIONS',
  handler: corsHandler,
});
http.route({
  path: '/registerUpload',
  method: 'POST',
  handler: files_registerUpload,
});

// Payment verification endpoint with CORS support
http.route({
  path: '/verify-payment',
  method: 'OPTIONS',
  handler: corsHandler,
});

http.route({
  path: '/verify-payment',
  method: 'POST',
  handler: verifyPaymentTransaction,
});

// Subscription payment endpoint with CORS support
http.route({
  path: '/subscription-payment',
  method: 'OPTIONS',
  handler: corsHandler,
});

http.route({
  path: '/subscription-payment',
  method: 'POST',
  handler: processSubscriptionPayment,
});

// Note: WebSocket streaming is now handled through Convex's native real-time subscriptions
// Use the streaming.subscribeToStream query for WebSocket connections

export default http;
