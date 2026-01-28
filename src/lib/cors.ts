// CORS helper for cross-origin API requests (local dev hitting production)

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://pixel-github.pages.dev',
];

export function getCorsHeaders(request: Request): HeadersInit | null {
  const origin = request.headers.get('origin') || '';

  // Only allow whitelisted origins
  if (!ALLOWED_ORIGINS.includes(origin)) {
    return null;
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

export function corsResponse(request: Request): Response {
  const corsHeaders = getCorsHeaders(request);

  // Reject disallowed origins
  if (!corsHeaders) {
    return new Response('Forbidden', { status: 403 });
  }

  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export function jsonWithCors(
  request: Request,
  data: unknown,
  init?: ResponseInit
): Response {
  const headers = new Headers(init?.headers);
  const corsHeaders = getCorsHeaders(request);

  // Add CORS headers only for allowed origins
  if (corsHeaders) {
    Object.entries(corsHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }
  headers.set('Content-Type', 'application/json');

  return new Response(JSON.stringify(data), {
    ...init,
    headers,
  });
}
