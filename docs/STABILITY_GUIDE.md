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

## 6. Two-Tier Autonomous Architecture (The Ultimate Setup)

For maximum autonomy and performance, the project uses a tiered data flow that separates "Freshness" from "Availability."

### Tier 1: Hourly Cloud Update (`price-updater.yml`)

- **Action**: A GitHub Action runs every hour, fetching Keepa prices and writing to the **Turso Cloud** (Source of Truth).
- **Goal**: Keep the master database up-to-date with 100% hands-free automation.

### Tier 2: Production Lite-Sync (`lite-db-sync.yml`)

- **Action**: A GitHub Action runs twice a day. It pulls data from Turso Cloud, generates a fresh `cleverprices-lite.db`, and **uploads it to Vercel Blob**.
- **Deployment**: Vercel's scheduled deployment (Cron Jobs) triggers a build, which downloads the DB from Blob during `prebuild`.
- **Goal**: Keep the Git repo clean (no binary commits) while still bundling fresh data into each deployment.

### Quota Economics

- **Writes**: Hourly writes to Turso Cloud (within 10M free tier).
- **Reads**: Production users read from the bundled local file ($0).
- **Sync Reads**: Only the 2x daily GitHub Runner sync consumes "reads" (~14k reads/sync).
- **Blob Storage**: Free tier (100GB egress/month).

---

## 7. Data Tiering: Static vs. Volatile

For maximum efficiency, we separate data based on its "change frequency":

- **Static Tier (Lite DB Bundle)**: Store high-weight, low-frequency data here (Titles, Brand IDs, Categories, Descriptions). This stays in the repository.
- **Volatile Tier (Turso Cloud)**: Store high-frequency data here (Current Price, Buy Box Status, Last Updated). This is updated by the worker.

---

## 8. The Cold Start Performance Trap (Vitals vs. Freshness)

While the Autonomous Hybrid model is powerful, it introduces a critical risk for **Serverless Cold Starts**. If your Cloud DB has a large delta (e.g., 7,000 modified prices) and the sync occurs during a cold start, the user may face a multi-second delay.

### The Risk

- **TTFB/LCP Impact**: Every second spent syncing is a second the user sees a loading state or a blank screen. This can severely degrade **Core Web Vitals**.

### The Mitigation Strategy: The 500ms Rule

To protect the user experience and SEO rankings, never allow the database sync to block the UI for more than 500ms.

1. **Safety Cutoff (Race Pattern)**:
   Implement a `Promise.race` in the `dbReady` logic. If `client.sync()` does not resolve within 500ms, resolve the promise anyway and fall back to the bundled `lite.db` data.
2. **"Weekly Fresh" Discipline**:
   Run `bun run deploy` at least once a week. This "bakes" the prices into the repository's `lite.db`, ensuring that even on a sync timeout, the user is seeing data that is "Close enough" for a listing page.

3. **Background Syncing**:
   Perform the sync in the background so that _subsequent_ requests in that same Lambda instance benefit from the fresh data, even if the first user triggered the fallback.

**Verdict**: UX and SEO (LCP) are the priority. It is better to show a "1-day old" price instantly than a "1-minute old" price after a 3-second delay.

---

## 9. SQLite Performance Tuning

For maximum query speed on the bundled Lite DB, CleverPrices uses several optimization strategies.

### 9.1 PRAGMA Settings

These are configured in `src/db/index.ts`:

| PRAGMA         | Value           | Benefit                                   |
| :------------- | :-------------- | :---------------------------------------- |
| `cache_size`   | `-20000` (20MB) | Fits entire 11MB DB in RAM                |
| `mmap_size`    | `20000000`      | Memory-maps the file for OS-level caching |
| `busy_timeout` | `5000`          | Prevents lock errors on concurrent access |

### 9.2 Index Strategy

Indexes are defined in `src/db/schema.ts`. Key principles:

- **Filter columns get indexes**: `category`, `brand`, `technology`.
- **Sort columns get indexes**: `salesRank`, `rating`, `normalizedCapacity`.
- **Composite indexes for common queries**: `(category, salesRank)` for "Popular in Category".

### 9.3 When to Add an Index

Add an index if:

1. A column is used in a `WHERE` clause or `ORDER BY`.
2. The column has high cardinality (many unique values).
3. The query runs frequently (e.g., on every page load).

**Avoid over-indexing**: Each index increases write time and database size. Only index what you query.
