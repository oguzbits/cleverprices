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

## Strategy Selection Matrix

| Strategy               | When to Use                                   | Performance                      |
| :--------------------- | :-------------------------------------------- | :------------------------------- |
| **Sequential**         | Low volume (1-5 items), simple scripts        | ❌ Slow (O(N) latency)           |
| **Parallel Batches**   | Metadata updates, per-entity logic            | ✅ Fast (O(1) latency)           |
| **Flat Bulk**          | High-volume data (History, Logs, 1,000+ rows) | 🚀 Very Fast (Zero congestion)   |
| **Parallel Flat Bulk** | Extreme data (50,000+ rows)                   | 🔥 Ultra Fast (Latency-Critical) |

## Practical Limits

- **Keepa Batching**: Always fetch data from Keepa in batches of **50-100 ASINs** (API limit).
- **DB Parallelism**: For the database, processing **50 products in parallel** is the "sweet spot" for performance without saturating the local machine's connection pool.

---

_Last updated: 2026-01-19 by Antigravity_
