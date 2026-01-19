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

### 2. Flat Bulk Processing (Ultimate for High-Volume Data)

For operations involving thousands of rows (like price history), flatten the operations to minimize the total number of HTTP requests:

1.  **Collect all metadata** (updates/deletes) for the entire batch into one array.
2.  **Collect all large data points** (e.g., thousands of history rows) into a second array.
3.  **Execute exactly two calls**:
    - One `db.batch()` for metadata/cleanup.
    - One `db.insert().values()` for the bulk data.

```typescript
// ✅ FLAT BULK (Fastest for 10,000+ rows)
const metadataQueries = [];
const allHistory = [];

for (const product of products) {
  metadataQueries.push(db.delete(priceHistory).where(...));
  allHistory.push(...product.history);
}

// Exactly two round-trips for the entire batch of 50 products
await db.batch(metadataQueries);
await db.insert(priceHistory).values(allHistory);
```

## Strategy Selection Matrix

| Strategy             | When to Use                                   | Performance                  |
| :------------------- | :-------------------------------------------- | :--------------------------- |
| **Sequential**       | Low volume (1-5 items), simple scripts        | ❌ Slow (O(N) latency)       |
| **Parallel Batches** | Metadata updates, per-entity logic            | ✅ Fast (O(1) latency)       |
| **Flat Bulk**        | High-volume data (History, Logs, 1,000+ rows) | 🚀 Fastest (Zero congestion) |

## Practical Limits

- **Keepa Batching**: Always fetch data from Keepa in batches of **50-100 ASINs** (API limit).
- **DB Parallelism**: For the database, processing **50 products in parallel** is the "sweet spot" for performance without saturating the local machine's connection pool.

---

_Last updated: 2026-01-19 by Antigravity_
