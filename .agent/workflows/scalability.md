---
description: Ensure the platform can handle increasing load and traffic
---

# 📈 Scalability Audits

This workflow focuses on ensuring the local SQLite database, Redis caching layer, and Next.js architecture scale properly.

## 1. Database Query Analysis

Drizzle ORM interactions with SQLite should be optimized.

- **Rule:** Check if queries in `src/lib/server/` or `src/db/` use the most efficient filtering.
- **Rule (Join Limit):** No query should exceed **3 joins**. Use the Hydration Pattern for entities requiring more data.
- **Rule:** Ensure we only select necessary columns, avoiding `select *` when joining multiple heavy tables (like Prices and Products).

## 2. Dynamic-on-Demand (DoD) Static Generation

CleverPrices relies on building lightweight placeholders during `next build` and generating actual products dynamically via ISR / SSR using Redis cache.

- **Verification:** Ensure `generateStaticParams` returns empty arrays or placeholders so we don't hit the DB during Docker builds.
- Check `CACHE_POLICY.md` if modifications to caching are made.

## 3. Redis Cache Inspection

Verify that the `redis-cache.ts` layer is effectively wrapping expensive queries.

- **Action:** If adding a new costly feature, ensure it is wrapped in the Redis helper to leverage high-speed delivery.
- Redis handles the memory-first read layer, avoiding direct SQLite hits.

## 4. Background Workers (Dokploy)

Ensure background task separation is maintained.

- Our updates and scraping run in a separate `worker` queue managed via `bun run worker:run` to avoid blocking the user-facing web requests.
- **Worker Breather**: Updates use the "Lazy Write" pattern (150ms batch delay) to prevent I/O saturation.
- **Circuit Breaker**: Queries use a 3-attempt circuit breaker to fail fast if the worker locks the DB for too long.
- Validate that the worker's cron jobs do not overlap destructively.
