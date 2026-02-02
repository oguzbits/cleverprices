# Turso & Database Optimization Guide

This document outlines the optimization strategy for high-volume database operations using Turso (libSQL) in this project, specifically addressing the "Network Latency vs. Payload Size" trade-off.

## The Problem: The Latency/Throughput Trap

When performing thousands of operations (e.g., updating prices for 7,000+ products), developers often fall into three traps:

1.  **Sequential Round-Trips (Latency Bottleneck)**: Sending queries one by one (`await db.update(...)`). Even with a fast 50ms round-trip, 1,000 updates take 50 seconds.
2.  **Giant Batches (Payload Bottleneck)**: Bundling 1,000 products into a single `db.batch([])` call. This creates a massive HTTP request that Turso may time out or reject.
3.  **Parallel Congestion**: Firing 100+ parallel heavy batches at once. While parallel, the sheer volume of concurrent heavy transactions saturates the DB engine or network pipeline, leading to hangs.

## The Solution: Strategy Tiers

### 1. Bounded Parallel Batches (Best for Metadata)

Group operations for a single entity into a batch and execute multiple entity-batches in parallel using `Promise.all`.

```typescript
// ✅ BOUNDED PARALLELISM (Fast & Reliable for Metadata)
await Promise.all(
  items.map(async (item) => {
    const productQueries = [
      db.update(products).set(...).where(...),
      db.insert(prices).values(...),
    ];
    if (productQueries.length > 0) {
      await db.batch(productQueries);
    }
  })
);
```

### 2. Parallelized Flat Bulk (Evolution for Ultra-High Volume)

For operations involving massive row counts (like 50,000+ price history points), a single sequential sync phase becomes a latency bottleneck. We evolve the "Flat Bulk" strategy into a parallelized one:

1.  **Collect all operations** into in-memory arrays.
2.  **Parallel Metadata Batches**: Execute multiple `db.batch()` calls in parallel for updates/deletes.
3.  **Parallel Data Chunks**: Insert bulk data using `Promise.all` with bounded concurrency (e.g., 5-10 parallel requests).
4.  **Optimized Payload**: Use larger chunks (e.g., 3,000 records) to stay under LibSQL's 32k parameter limit while minimizing round-trips.

```typescript
// ✅ PARALLELIZED FLAT BULK (Fastest for 50,000+ rows)
const metadataChunks = chunk(allMetadataQueries, 500);
const historyChunks = chunk(globalHistoryInsertions, 3000);

// Execute metadata in parallel
await Promise.all(metadataChunks.map((c) => db.batch(c)));

// Execute history in parallel waves (bounded concurrency)
for (let i = 0; i < historyChunks.length; i += 5) {
  const wave = historyChunks.slice(i, i + 5);
  await Promise.all(wave.map((c) => db.insert(priceHistory).values(c)));
}
```

## Read Economics: Avoiding the Read Spike

LibSQL/Turso counts every row touched as a "read." Inefficient pagination can cause your usage to explode exponentially.

### 🚫 The Trap: `OFFSET` Pagination ($O(N^2)$ reads)

When you use `LIMIT 500 OFFSET 900,000`, the database must read and discard 900,000 rows just to give you the 500 you want. If you loop through a table of 1 Million rows using this method, you will perform **~500 Billion reads**.

### ✅ The Solution: Keyset Pagination (Seek Method)

Always use a unique, indexed key (like `id` or `recorded_at`) to "seek" the next batch.

```typescript
// ✅ SEEK METHOD (Cheap & Scalable)
let lastId = 0;
while (true) {
  const batch = await db
    .select()
    .from(table)
    .where(gt(table.id, lastId))
    .orderBy(asc(table.id))
    .limit(limit);

  if (batch.length === 0) break;

  lastId = batch[batch.length - 1].id;
  // ... process batch
}
```

## High-Frequency Search Optimization

Search is the most frequent user action. Without optimization, every character typed could cost 2 DB reads. We mitigate this with three layers:

### 1. The "Fast Path" (Memory-First)

We maintain a static `TOP_BRANDS` map (30+ brands like Apple, Samsung). If the query matches exactly, we generate category suggestions in-memory.

- **Cost Savings**: **-1 Read** per stroke for common brands.

### 2. Implementation-Level Caching (`unstable_cache`)

We wrap the search action in `unstable_cache` with a 1-hour TTL. Results are shared across all users (not just per-session).

- **Cost Savings**: **0 Rows Read** for any repeated queries (e.g., "iphone", "rtx", "ssd").

### 3. Intent-Based Query Skipping

For multi-word queries (e.g., "Samsung S24 Ultra"), the user is looking for a product, not browsing categories. We automatically skip the brand-category mapping query.

- **Cost Savings**: **-1 Read** per stroke for specific product searches.

## Write Economics: Minimizing Rows Written

Every write to Turso costs resources and counts against your monthly quota. We use three strategies to minimize these costs:

### 1. Value-Based Diffing

Never write if the data hasn't changed. Before performing an `UPDATE` or `UPSERT`, fetch the current state and compare the values.

```typescript
// ✅ SMART UPDATE (Minimal writes)
const current = await db.select(...).from(prices).where(...);

if (newPrice !== current.price || statusChanged) {
  await db.update(prices).set({ price: newPrice, lastUpdated: new Date() }).where(...);
} else if (isStale(current.lastUpdated)) {
  // Only update the timestamp if price is same but record is old (>24h)
  await db.update(prices).set({ lastUpdated: new Date() }).where(...);
}
```

### 2. History Suppression

Price history can generate millions of rows. We only record a new history point if:

1.  The price has actually changed from the last known value.
2.  The new price is significantly lower (new "daily low").

### 3. Smart Seed Skipping

When performing massive migrations (like `deploy-data.ts`), we check the cloud's `history_seeded` status first. If a product is already seeded, we skip the 300+ history inserts for that specific item.

---

## Resource Safety Guardrails

To prevent accidental resource exhaustion or data loss, all management scripts follow the "Safe CLI" protocol:

1.  **Mandatory `--dry-run`**: Every script must support a dry-run mode that logs expected changes without executing them.
2.  **Explicit `--force`**: Destructive operations (Full Syncs, Deletions, Local Overwrites) require a `--force` flag.
3.  **Horizontal Cutoffs**: Use `--history-days=X` or `--limit=Y` to test with small batches before committing to a multi-million-row sync.

---

## Strategy Selection Matrix

| Strategy                | When to Use                              | Read Cost                      | Write Cost     | Performance                      |
| :---------------------- | :--------------------------------------- | :----------------------------- | :------------- | :------------------------------- |
| **Sequential**          | Low volume (1-5 items), simple scripts   | Low                            | Low            | ❌ Slow (O(N) latency)           |
| **Parallel Batches**    | Metadata updates, per-entity logic       | Low                            | Medium         | ✅ Fast (O(1) latency)           |
| **OFFSET Pagination**   | **NEVER ON LARGE DATA**                  | 💀 **CATASTROPHIC** ($O(N^2)$) | Low            | ❌ Extremely Slow                |
| **Keyset Pagination**   | Scraping, Pulsing, Syncing Entire Tables | ✅ Optimal ($O(N)$)            | Low            | 🚀 Fast & Scalable               |
| **Value-Based Diffing** | Daily price/sync updates                 | Low (+1 read)                  | 🔥 **MINIMAL** | 🚀 Fast & Safe                   |
| **Parallel Flat Bulk**  | Extreme data (50,000+ rows)              | Low                            | High           | 🔥 Ultra Fast (Latency-Critical) |
| **PITR Recovery**       | Restoring accidental deletions           | 🔥 **ZERO**                    | 🔥 **ZERO**    | ⚡ Instant                       |

---

## Lite DB Optimization

For Production, we use a "Lite" database that strips unused data:

| What is Stripped                     | Typical Savings |
| :----------------------------------- | --------------: |
| `raw_data` (Keepa JSON blobs)        |            ~70% |
| `features` (product bullet points)   |             ~8% |
| `description` (product descriptions) |             ~4% |
| `price_history` (full table)         |             ~2% |

**Result:** Lite DB is typically **~88% smaller** than the Master DB.

These columns are stripped because:

- `features` and `description` are only needed on single product pages (which use the Master DB or fetch live).
- `raw_data` is for debugging only.
- `price_history` is not served in production (charts use computed averages).

**Command:** `bun run db:lite`

---

_Last updated: 2026-01-20 by Antigravity_

- **Lite DB Optimization**: Stripping `features` and `description` columns reduces Lite DB to 11MB.
- **Keepa Batching**: Always fetch data from Keepa in batches of **50-100 ASINs** (API limit).
  _Last updated: 2026-01-19 by Antigravity_
