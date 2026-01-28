# Pixel GitHub - Claude Code Instructions

## Project Overview
A 2D pixel art environment for exploring GitHub profiles, built with Next.js 16, Phaser 3, and deployed to Cloudflare Pages.

## Tech Stack
- **Frontend**: Next.js 16, React 19, Phaser 3, Zustand, Tailwind CSS, Framer Motion
- **Backend**: Cloudflare Workers (via @cloudflare/next-on-pages)
- **Database**: Cloudflare D1 (SQLite at edge)
- **Storage**: Cloudflare R2 (object storage)
- **Auth**: Supabase SSR with GitHub OAuth

## Critical Development Rules

### 1. Always Use Edge Runtime for Cloudflare Pages
All server-side pages and API routes MUST export edge runtime for Cloudflare Pages deployment:

```typescript
export const runtime = 'edge';
```

Add this export to:
- All files in `src/app/**/page.tsx` (server components)
- All files in `src/app/api/**/route.ts` (API routes)

Client components ('use client') do NOT need this export.

### 2. Always Check TypeScript Before Committing
Run TypeScript check after making changes:

```bash
npm run typecheck
```

This runs automatically before build via the `prebuild` script, but always verify locally first.

### 3. Type Definitions
- All Cloudflare types (D1, R2) are defined in `src/lib/cloudflare/context.ts`
- Import types from there, don't redefine them in other files
- Theme types are in `src/config/themes.ts`
- Editor types are in `src/types/editor.ts`

### 4. Environment Variables
- Local dev: `.env` and `.dev.vars`
- Production: Set in Cloudflare Pages dashboard
- Never commit `.env`, `.env.local`, or `.dev.vars` files
- Reference `.env.example` for required variables

### 5. Database Migrations
D1 migrations are in `migrations/` folder. Run with:

```bash
wrangler d1 execute pixel-github-db --remote --file=migrations/0001_initial_schema.sql
```

## Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── [username]/         # Dynamic profile pages
│   │   ├── page.tsx        # Profile view (needs edge runtime)
│   │   └── editor/         # World editor (needs edge runtime)
│   └── api/                # API routes (all need edge runtime)
├── components/
│   ├── Editor/             # World editor components
│   ├── Game/               # Phaser game components
│   └── UI/                 # Shared UI components
├── config/                 # Theme and game configuration
├── game/                   # Phaser scenes and game logic
├── lib/
│   ├── cloudflare/         # D1 and R2 helpers
│   └── supabase/           # Auth helpers
├── services/               # External API services (GitHub)
├── store/                  # Zustand stores
└── types/                  # TypeScript type definitions
```

## Common Tasks

### Adding a New API Route
1. Create route file in `src/app/api/[route]/route.ts`
2. Add `export const runtime = 'edge';` at the top
3. Run `npm run typecheck` to verify

### Adding a New Page
1. Create page file in `src/app/[path]/page.tsx`
2. Add `export const runtime = 'edge';` if it's a server component
3. Run `npm run typecheck` to verify

### Modifying Cloudflare Bindings
1. Update types in `src/lib/cloudflare/context.ts`
2. Update `wrangler.toml` with new bindings
3. Run `npm run typecheck` to verify all usages are correct
