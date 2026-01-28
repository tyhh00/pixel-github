// CORS helper for cross-origin API requests (local dev hitting production)

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://pixel-github.pages.dev',
];

export function getCorsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('origin') || '';

  // Check if origin is allowed
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

export function corsResponse(request: Request): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

export function jsonWithCors(
  request: Request,
  data: unknown,
  init?: ResponseInit
): Response {
  const headers = new Headers(init?.headers);
  const corsHeaders = getCorsHeaders(request);

  Object.entries(corsHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
  headers.set('Content-Type', 'application/json');

  return new Response(JSON.stringify(data), {
    ...init,
    headers,
  });
}
