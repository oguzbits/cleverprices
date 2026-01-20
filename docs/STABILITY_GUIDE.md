# Production Stability & Deployment Guide

This document captures "hard-won" lessons learned while scaling CleverPrices to production on Vercel with a bundled SQLite database.

## 1. SQLite on Vercel (Read-Only Filesystem)

Vercel's execution environment is strictly read-only (except for `/tmp`). This has major implications for SQLite:

### The `WAL` Mode Trap

By default, modern SQLite uses **WAL (Write-Ahead Logging)** mode. This mode requires creating two sidecar files (`-wal` and `-shm`) next to the `.db` file upon opening.

- **Symptom**: Search fails with "500 Internal Server Error" or "Read-Only Filesystem" errors in Vercel logs.
- **Solution**: The bundled database must be forced into `DELETE` journal mode during the build step.
- **Fix**: In `scripts/prepare-deploy.sh`, we use:
  ```bash
  sqlite3 data/cleverprices-lite.db "PRAGMA journal_mode = DELETE;"
  ```

### Manual Verification

On Vercel, always verify the database header and presence via a diagnostic route if issues arise:

```typescript
const stats = fs.statSync(dbPath);
const fd = fs.openSync(dbPath, "r");
// ... check first 16 bytes for "SQLite format 3"
```

---

## 2. Next.js 16/19 Cache Invariants

The project uses experimental performance flags like `cacheComponents`. These are extremely powerful but sensitive.

### Dynamic Route Conflicts

Using `export const dynamic = "force-dynamic";` in API routes can conflict with advanced caching strategies in newer Next.js versions.

- **Rule**: Avoid `force-dynamic` unless absolutely necessary. For diagnostics, use a unique query parameter (e.g., `?cb=timestamp`) to bypass Edge caches instead.

---

## 3. Resilient Search Architecture

Search is the most critical user-facing feature. It must fail gracefully.

### FTS with Fallback

Full-Text Search (FTS5) is excellent for performance but can be brittle if the virtual table is empty or the index isn't rebuilt.

- **Best Practice**: Always wrap FTS queries in a `try/catch` and provide a basic `LIKE` search fallback.
- **Result**: Even if FTS fails, the system returns results (albeit slower), preventing a total service outage.

---

## 4. Cache Versioning

The `unstable_cache` function is key-based. When the logic inside the cached function changes, the cache key **must** be bumped.

- **Pattern**: `["search-results-v4"]` -> Increment the version number whenever `searchProducts` or the weighting logic is adjusted.

---

## 5. Deployment Verification Workflow

Never assume a "git push" fixed a production error without verification.

1.  **Force-Ping**: Create a tiny API route `api/force-ping` that returns a hardcoded string or the current commit SHA.
2.  **Verify Headers**: Use `curl -I` to check `x-vercel-cache` and ensure you aren't seeing a stale Edge response.
3.  **Clean Up**: Always remove diagnostic routes before finalizing the task to maintain security.
