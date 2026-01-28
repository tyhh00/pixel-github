// API URL helper for local development vs production
// In local dev, D1 APIs can point to production while auth stays local

/**
 * Get the base URL for D1/R2 dependent API routes.
 * - In production: uses relative URLs (same origin)
 * - In local dev: can be configured to hit production APIs via NEXT_PUBLIC_API_URL
 */
export function getApiUrl(path: string): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // If API URL is set (local dev pointing to prod), use it for D1/R2 routes
  if (apiUrl) {
    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${apiUrl}${normalizedPath}`;
  }

  // Otherwise use relative URL (production or local with wrangler)
  return path;
}

/**
 * Routes that depend on Cloudflare D1/R2 bindings.
 * These should use getApiUrl() for local development.
 */
export const D1_ROUTES = [
  '/api/world',
  '/api/upload',
] as const;
