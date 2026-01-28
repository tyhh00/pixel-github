# Supabase Auth with CORS for Cloudflare Pages

This document covers setting up Supabase authentication with proper CORS handling for a Next.js app deployed to Cloudflare Pages.

## Overview

When your frontend and API are on the same domain (e.g., `pixel-github.pages.dev`), CORS is straightforward. However, during local development (`localhost:3000`) calling production APIs, or when using cross-origin requests, proper CORS configuration is essential.

## Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a project
2. Note your project URL and anon key

### 2. Configure GitHub OAuth

In Supabase Dashboard > Authentication > Providers > GitHub:

1. Enable GitHub provider
2. Create a GitHub OAuth App at https://github.com/settings/developers
   - **Homepage URL**: `https://your-app.pages.dev`
   - **Authorization callback URL**: `https://your-supabase-project.supabase.co/auth/v1/callback`
3. Copy Client ID and Client Secret to Supabase

### 3. Configure Redirect URLs

In Supabase Dashboard > Authentication > URL Configuration:

Add all valid redirect URLs:
```
https://your-app.pages.dev/api/auth/callback
http://localhost:3000/api/auth/callback
```

## Client-Side Auth Setup

### Supabase Client (Browser)

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Auth Hook

```typescript
// src/hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGitHub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, loading, signInWithGitHub, signOut };
}
```

## Server-Side Auth

### Supabase Server Client

```typescript
// src/lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

### Getting User from Request (API Routes)

For API routes that need to support both cookie-based auth and Authorization header:

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';

export async function getCurrentUserFromRequest(request: Request) {
  // Try Authorization header first (for cross-origin requests)
  const authHeader = request.headers.get('Authorization');

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) {
      return extractUserInfo(user);
    }
  }

  // Fall back to cookies
  const cookieHeader = request.headers.get('cookie') || '';
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => parseCookies(cookieHeader),
        setAll: () => {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  return user ? extractUserInfo(user) : null;
}

function parseCookies(cookieHeader: string) {
  return cookieHeader.split(';').map(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    return { name, value: rest.join('=') };
  }).filter(c => c.name);
}

function extractUserInfo(user: User) {
  return {
    id: user.id,
    email: user.email,
    githubUsername: user.user_metadata?.user_name,
    githubId: user.user_metadata?.provider_id,
    avatarUrl: user.user_metadata?.avatar_url,
  };
}
```

## CORS Configuration

### CORS Helper

```typescript
// src/lib/cors.ts
const ALLOWED_ORIGINS = [
  'https://your-app.pages.dev',
  'http://localhost:3000',
  'http://localhost:3001',
];

export function getCorsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('origin');
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
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
  return Response.json(data, {
    ...init,
    headers: {
      ...init?.headers,
      ...getCorsHeaders(request),
    },
  });
}
```

### API Route with CORS

```typescript
// src/app/api/example/route.ts
import { corsResponse, jsonWithCors } from '@/lib/cors';
import { getCurrentUserFromRequest } from '@/lib/supabase/server';

export const runtime = 'edge';

// Handle CORS preflight
export async function OPTIONS(request: Request) {
  return corsResponse(request);
}

export async function GET(request: Request) {
  const user = await getCurrentUserFromRequest(request);

  if (!user) {
    return jsonWithCors(request, { error: 'Unauthorized' }, { status: 401 });
  }

  return jsonWithCors(request, { user });
}

export async function POST(request: Request) {
  const user = await getCurrentUserFromRequest(request);

  if (!user) {
    return jsonWithCors(request, { error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  // ... handle request

  return jsonWithCors(request, { success: true });
}
```

## Client-Side API Calls

### API Helper with Auth

```typescript
// src/lib/api.ts
import { createClient } from '@/lib/supabase/client';

export function getApiUrl(path: string): string {
  // Use production API in local dev if NEXT_PUBLIC_API_URL is set
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  return `${baseUrl}${path}`;
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth token for cross-origin requests
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return fetch(getApiUrl(path), {
    ...options,
    headers,
    credentials: 'include', // Include cookies for same-origin
  });
}
```

### Usage

```typescript
// Save data
const response = await apiFetch('/api/world/save', {
  method: 'POST',
  body: JSON.stringify({ data: 'value' }),
});

if (!response.ok) {
  throw new Error('Save failed');
}

const result = await response.json();
```

## OAuth Callback Route

```typescript
// src/app/api/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return to home on error
  return NextResponse.redirect(`${origin}/`);
}
```

## Environment Variables

### Local Development (.env)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Point to production for D1/R2 dependent APIs during local dev
NEXT_PUBLIC_API_URL=https://your-app.pages.dev
```

### Production (Cloudflare Dashboard)

Set in Pages > Settings > Environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL=https://your-app.pages.dev`

## Troubleshooting

### CORS Errors in Local Development

**Cause**: Local dev (`localhost:3000`) calling production API without proper CORS

**Solutions**:
1. Add `http://localhost:3000` to `ALLOWED_ORIGINS` in your CORS helper
2. Ensure all API routes handle `OPTIONS` preflight requests
3. Include `Authorization` header in `Access-Control-Allow-Headers`

### "Unauthorized" Despite Being Logged In

**Cause**: Cross-origin requests don't send cookies automatically

**Solutions**:
1. Use `credentials: 'include'` in fetch requests
2. Send the access token via `Authorization: Bearer <token>` header
3. Ensure `Access-Control-Allow-Credentials: true` in CORS headers

### OAuth Redirect Mismatch

**Cause**: Redirect URL not configured in Supabase

**Solution**: Add all environments to Supabase Dashboard > Authentication > URL Configuration:
```
https://your-app.pages.dev/api/auth/callback
http://localhost:3000/api/auth/callback
```

### Session Not Persisting

**Cause**: Cookies not being set correctly in edge runtime

**Solution**: Ensure cookie options include:
```typescript
{
  path: '/',
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
}
```

## References

- [Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase SSR Package](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [CORS on Cloudflare Workers](https://developers.cloudflare.com/workers/examples/cors-header-proxy/)
