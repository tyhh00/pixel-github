# Cloudflare Pages Setup with D1, R2, and Next.js

This document covers the setup and configuration for deploying a Next.js application to Cloudflare Pages with D1 database and R2 storage bindings.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Adapter**: `@opennextjs/cloudflare` - transforms Next.js output for Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite at edge)
- **Storage**: Cloudflare R2 (S3-compatible object storage)
- **Auth**: Supabase SSR with GitHub OAuth

## Prerequisites

```bash
npm install @opennextjs/cloudflare
npm install wrangler --save-dev
```

## Wrangler Configuration

The key to automatic binding configuration is `pages_build_output_dir`. Without this, Cloudflare Pages ignores your `wrangler.toml` and you must configure bindings manually in the dashboard.

### wrangler.toml

```toml
#:schema node_modules/wrangler/config-schema.json
name = "your-app-name"
pages_build_output_dir = ".open-next"  # CRITICAL: Required for Pages to use this config
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

# D1 Database
[[d1_databases]]
binding = "DB"
database_name = "your-db-name"
database_id = "your-database-id"  # Get this after running: wrangler d1 create your-db-name

# R2 Bucket
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "your-bucket-name"

# Environment variables (non-sensitive only)
[vars]
NEXT_PUBLIC_APP_URL = "https://your-app.pages.dev"
```

### Why `pages_build_output_dir` is Required

- Cloudflare Pages needs to know where the build output is located
- For `@opennextjs/cloudflare`, this is always `.open-next`
- Without this field, Pages treats `wrangler.toml` as a Workers config and ignores it
- This enables automatic binding provisioning from your config file

## Next.js Configuration

### next.config.ts

```typescript
import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Required for local development with Cloudflare bindings
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  // your config
};

export default nextConfig;
```

### Edge Runtime

All server-side code must use edge runtime for Cloudflare Pages:

```typescript
// In API routes and server components
export const runtime = 'edge';
```

## Accessing Cloudflare Bindings

### The Correct Way (with @opennextjs/cloudflare)

```typescript
import { getCloudflareContext } from "@opennextjs/cloudflare";

// In API routes or server components
export async function GET(request: Request) {
  const { env } = getCloudflareContext();

  // Access D1
  const result = await env.DB.prepare("SELECT * FROM users").all();

  // Access R2
  const object = await env.R2_BUCKET.get("file-key");

  return Response.json(result);
}
```

### Common Mistake: Using globalThis.env

```typescript
// WRONG - This doesn't work with @opennextjs/cloudflare
const env = (globalThis as any).env;  // Will be undefined!

// CORRECT - Use getCloudflareContext
import { getCloudflareContext } from "@opennextjs/cloudflare";
const { env } = getCloudflareContext();
```

### Type-Safe Wrapper

Create a helper for type-safe binding access:

```typescript
// src/lib/cloudflare/context.ts
import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

export interface R2Bucket {
  put(key: string, value: ReadableStream | ArrayBuffer | string, options?: R2PutOptions): Promise<R2Object | null>;
  get(key: string): Promise<R2ObjectBody | null>;
  delete(key: string): Promise<void>;
  list(options?: R2ListOptions): Promise<R2Objects>;
}

export interface AppCloudflareEnv {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  [key: string]: unknown;
}

export function getCloudflareEnv(): AppCloudflareEnv | null {
  try {
    const ctx = getCloudflareContext();
    const env = ctx.env as unknown as AppCloudflareEnv;

    if (env?.DB && env?.R2_BUCKET) {
      return env;
    }
    return null;
  } catch {
    return null;
  }
}
```

## Creating Resources

### D1 Database

```bash
# Create database
wrangler d1 create your-db-name

# Run migrations (remote)
wrangler d1 execute your-db-name --remote --file=migrations/0001_initial_schema.sql

# Run migrations (local)
wrangler d1 execute your-db-name --local --file=migrations/0001_initial_schema.sql
```

### R2 Bucket

```bash
# Create bucket
wrangler r2 bucket create your-bucket-name

# For public access, configure in Cloudflare dashboard or use a custom domain
```

## Local Development

### Option 1: Point to Production APIs

For D1/R2 dependent routes, point to production during local dev:

```bash
# .env
NEXT_PUBLIC_API_URL=https://your-app.pages.dev
```

```typescript
// src/lib/api.ts
export function getApiUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  return `${baseUrl}${path}`;
}
```

### Option 2: Remote Bindings (Recommended)

Use remote bindings to connect to real Cloudflare resources locally:

```toml
# wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "your-db-name"
database_id = "your-database-id"
remote = true  # Connect to remote D1 during local dev
```

Then run:
```bash
npx @opennextjs/cloudflare dev
```

## Deployment

### Via Git Integration (Recommended)

1. Connect your GitHub repo to Cloudflare Pages
2. Set build command: `npx @opennextjs/cloudflare`
3. Set build output directory: `.open-next`
4. Bindings are automatically configured from `wrangler.toml`

### Via Wrangler CLI

```bash
# Build
npx @opennextjs/cloudflare

# Deploy
wrangler pages deploy .open-next
```

## Environment Variables

### In wrangler.toml (Non-Sensitive)

```toml
[vars]
NEXT_PUBLIC_APP_URL = "https://your-app.pages.dev"
```

### In Cloudflare Dashboard (Sensitive)

Set these in Pages > Settings > Environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Any other secrets

## Troubleshooting

### 503 Service Unavailable on API Routes

**Cause**: Bindings not available - `getCloudflareEnv()` returns null

**Solutions**:
1. Ensure `pages_build_output_dir = ".open-next"` is in `wrangler.toml`
2. Use `getCloudflareContext()` from `@opennextjs/cloudflare`, not `globalThis.env`
3. Verify bindings are configured in Cloudflare dashboard or `wrangler.toml`

### "getCloudflareContext called without initOpenNextCloudflareForDev"

**Cause**: Missing initialization in `next.config.ts`

**Solution**: Add to `next.config.ts`:
```typescript
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
```

### D1 Binding Not Found in Production

**Cause**: `wrangler.toml` not being used for Pages configuration

**Solution**: Add `pages_build_output_dir = ".open-next"` to `wrangler.toml`

## References

- [OpenNext Cloudflare Documentation](https://opennext.js.org/cloudflare)
- [Cloudflare Pages Functions Bindings](https://developers.cloudflare.com/pages/functions/bindings/)
- [Wrangler Configuration for Pages](https://developers.cloudflare.com/pages/functions/wrangler-configuration/)
- [D1 Documentation](https://developers.cloudflare.com/d1/)
- [R2 Documentation](https://developers.cloudflare.com/r2/)
