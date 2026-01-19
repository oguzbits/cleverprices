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

## Strategy Selection Matrix

| Strategy               | When to Use                                   | Read Cost (per sync)           | Performance                      |
| :--------------------- | :-------------------------------------------- | :----------------------------- | :------------------------------- |
| **Sequential**         | Low volume (1-5 items), simple scripts        | Low                            | ❌ Slow (O(N) latency)           |
| **Parallel Batches**   | Metadata updates, per-entity logic            | Low                            | ✅ Fast (O(1) latency)           |
| **OFFSET Pagination**  | **NEVER ON LARGE DATA**                       | 💀 **CATASTROPHIC** ($O(N^2)$) | ❌ Extremely Slow                |
| **Keyset Pagination**  | Scraping, Pulsing, Syncing Entire Tables      | ✅ Optimal ($O(N)$)            | 🚀 Fast & Scalable               |
| **Flat Bulk**          | High-volume data (History, Logs, 1,000+ rows) | Low                            | 🚀 Very Fast (Zero congestion)   |
| **Parallel Flat Bulk** | Extreme data (50,000+ rows)                   | Low                            | 🔥 Ultra Fast (Latency-Critical) |
| **Search FastPath**    | High-traffic live search                      | 🔥 **ZERO** (In-Memory/Cache)  | ⚡ Instant                       |

## Practical Limits

- **Keepa Batching**: Always fetch data from Keepa in batches of **50-100 ASINs** (API limit).
- **DB Parallelism**: For the database, processing **50 products in parallel** is the "sweet spot" for performance without saturating the local machine's connection pool.

---

_Last updated: 2026-01-19 by Antigravity_
