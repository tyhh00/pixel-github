# Documentation

Technical documentation for the Pixel GitHub project.

## Contents

- [Cloudflare Pages Setup](./cloudflare-pages-setup.md) - D1, R2, and @opennextjs/cloudflare configuration
- [Supabase Auth with CORS](./supabase-auth-cors.md) - Authentication and cross-origin request handling

## Quick Reference

### Critical Configuration

1. **wrangler.toml must include `pages_build_output_dir`**:
   ```toml
   pages_build_output_dir = ".open-next"
   ```

2. **next.config.ts must initialize OpenNext**:
   ```typescript
   import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
   initOpenNextCloudflareForDev();
   ```

3. **All server-side routes need edge runtime**:
   ```typescript
   export const runtime = 'edge';
   ```

4. **Use getCloudflareContext() for bindings**:
   ```typescript
   import { getCloudflareContext } from "@opennextjs/cloudflare";
   const { env } = getCloudflareContext();
   ```

### Common Commands

```bash
# Type check
npm run typecheck

# Local development
npm run dev

# Build for Cloudflare
npx @opennextjs/cloudflare

# Deploy
wrangler pages deploy .open-next

# D1 migrations
wrangler d1 execute pixel-github-db --remote --file=migrations/0001_initial_schema.sql
```
