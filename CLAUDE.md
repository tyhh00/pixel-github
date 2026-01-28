# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A 2D pixel art environment for exploring GitHub profiles, built with Next.js 16, Phaser 3, and deployed to Cloudflare Pages.

**Production URL**: https://pixel-github.pages.dev

## Tech Stack

- **Frontend**: Next.js 16, React 19, Phaser 3, Zustand, Tailwind CSS, Framer Motion
- **Backend**: Cloudflare Workers (via @opennextjs/cloudflare)
- **Database**: Cloudflare D1 (SQLite at edge)
- **Storage**: Cloudflare R2 (object storage)
- **Auth**: Supabase SSR with GitHub OAuth

## Commands

```bash
npm run dev          # Local development server
npm run build        # Build for Cloudflare (runs @opennextjs/cloudflare)
npm run typecheck    # TypeScript check (runs automatically before build)
npm run lint         # ESLint

# D1 migrations
wrangler d1 execute pixel-github-db --remote --file=migrations/0001_initial_schema.sql
```

## Critical Development Rules

### 1. Edge Runtime Required

All server-side pages and API routes MUST export edge runtime:

```typescript
export const runtime = 'edge';
```

Add to: `src/app/**/page.tsx` (server components), `src/app/api/**/route.ts` (API routes)

Client components ('use client') do NOT need this.

### 2. Cloudflare Bindings Access

Use `getCloudflareContext()` from `@opennextjs/cloudflare` - NOT `globalThis.env`:

```typescript
import { getCloudflareContext } from "@opennextjs/cloudflare";

const { env } = getCloudflareContext();
// env.DB (D1), env.R2_BUCKET (R2)
```

The wrapper `getCloudflareEnv()` in `src/lib/cloudflare/context.ts` provides type-safe access.

### 3. Wrangler Configuration

`wrangler.toml` MUST include `pages_build_output_dir` for bindings to auto-configure:

```toml
pages_build_output_dir = ".open-next"
```

Without this, Cloudflare Pages ignores the D1/R2 bindings in wrangler.toml.

### 4. Next.js Config

`next.config.ts` must initialize OpenNext for local dev:

```typescript
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
```

### 5. Type Definitions

- Cloudflare types (D1, R2): `src/lib/cloudflare/context.ts`
- Theme types: `src/config/themes.ts`
- Editor types: `src/types/editor.ts`

### 6. Local Development with D1/R2

D1 bindings aren't available in local Next.js dev. Set `NEXT_PUBLIC_API_URL` to point to production:

```bash
# .env
NEXT_PUBLIC_API_URL=https://pixel-github.pages.dev
```

Use `getApiUrl()` from `src/lib/api.ts` for D1-dependent API calls.

## Architecture

### Phaser Game Integration

- `src/game/` - Phaser scenes and game logic
- `src/components/Game/` - React wrapper for Phaser canvas
- Game state managed via Zustand stores in `src/store/`

### World Editor

- `src/components/Editor/` - Tile-based world editor components
- `src/app/[username]/editor/` - Editor page (authenticated users only)
- World configs saved to D1 via `/api/world/save`

### Auth Flow

- Supabase handles GitHub OAuth
- `src/lib/supabase/client.ts` - Browser client
- `src/lib/supabase/server.ts` - Server client with cookie/header auth
- `src/lib/cors.ts` - CORS helpers for cross-origin API requests

### API Routes

All in `src/app/api/`:
- `/api/auth/callback` - OAuth callback
- `/api/world/[username]` - Get world config
- `/api/world/save` - Save world config (authenticated)
- `/api/upload` - R2 file uploads

## Documentation

See `docs/` for detailed setup guides:
- `docs/cloudflare-pages-setup.md` - D1, R2, binding configuration
- `docs/supabase-auth-cors.md` - Auth and CORS patterns

**Important**: Any technical findings or updates to infrastructure planning should be documented in the appropriate file under `docs/`.
