---
description: Deploy the application to production securely using Dokploy
---

# 🚀 Deploy to Production

This workflow ensures all checks pass before pushing changes, which are then automatically deployed to the Hetzner VPS via Dokploy (linked to the GitHub repository).

1. **Type Check**
   Ensure no TypeScript errors exist.
   // turbo

   ```bash
   bun run check || tsc --noEmit
   ```

2. **Linting**
   Check for code style issues.
   // turbo

   ```bash
   bun run lint
   ```

3. **Build Verification**
   Ensure the app builds locally to catch React Server/Client component errors early.
   **CRITICAL (Next.js 16)**: If you see `Uncached data was accessed outside of <Suspense>`, ensure all `async` components or components accessing `searchParams`/`connection()` are wrapped in a `<Suspense>` boundary. Never remove the root `Suspense` safety net in `layout.tsx`.
   // turbo

   ```bash
   BUILD_PHASE=1 bun run build
   ```

4. **Database Push (if schema changes exist)**
   Ensure your local DB is up to date and migrations are verified. The production database is handled by Dokploy via shared volumes.
   // turbo

   ```bash
   bun run db:push
   ```

5. **Deploy Data to Production** (Optional)
   If you need to ship local SQLite data (`cleverprices.db`) to the Dokploy server manually.
   _Warning_: This overwrites production data.

   ```bash
   bun run db:DANGEROUS-overwrite-prod --force
   ```

6. **Global Identity Synchronization**
   If you have modified product identity logic (especially RAM, CPUs, or slug generation in `src/lib/utils/product-identity.ts`), you **MUST** bump the cache version in both `src/lib/server/cached-products.ts` and `src/lib/server/category-products.ts` before pushing. This flushes the stale DB-sourced slugs and title caches.

   ```bash
   # Find current vXX and increment it globally
   # e.g. v58 -> v59
   ```

7. **Git Push for Dokploy**
   Pushing to the `main` branch will automatically trigger a Dokploy deployment from the GitHub repository source.

   ```bash
   git push origin main
   ```

8. **Proactive Cache Warming**
   After the deployment is live, trigger a site-wide warm cycle to ensure instant load times and immediate price consistency across all pages.
   ```bash
   bun run warm-cache --lite
   ```
