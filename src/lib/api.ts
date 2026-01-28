// API URL helper for local development vs production
// In local dev, D1 APIs can point to production while auth stays local

import { createClient } from '@/lib/supabase/client';

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
 * Check if we're making a cross-origin API request.
 */
export function isCrossOriginApi(): boolean {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  return !!apiUrl && typeof window !== 'undefined' && !window.location.origin.includes(apiUrl.replace('https://', '').replace('http://', ''));
}

/**
 * Get auth headers for cross-origin API requests.
 * Returns the Supabase access token in Authorization header.
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  if (!isCrossOriginApi()) {
    return {};
  }

  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
      return {
        'Authorization': `Bearer ${session.access_token}`,
      };
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
  }

  return {};
}

/**
 * Fetch wrapper that handles cross-origin auth.
 * Use this for D1/R2 API calls.
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = getApiUrl(path);
  const authHeaders = await getAuthHeaders();

  const headers = new Headers(options.headers);
  Object.entries(authHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Routes that depend on Cloudflare D1/R2 bindings.
 * These should use apiFetch() for local development.
 */
export const D1_ROUTES = [
  '/api/world',
  '/api/upload',
] as const;
