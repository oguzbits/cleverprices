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
   // turbo

   ```bash
   bun run build
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

6. **Git Push for Dokploy**
   Pushing to the `main` branch will automatically trigger a Dokploy deployment from the GitHub repository source.

   ```bash
   git push origin main
   ```

7. **Proactive Cache Warming**
   After the deployment is live, trigger a site-wide warm cycle to ensure instant load times and immediate price consistency across all pages.
   ```bash
   bun run warm-cache --lite
   ```
