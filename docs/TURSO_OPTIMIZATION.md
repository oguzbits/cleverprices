# Turso & Database Optimization Guide

This document outlines the optimization strategy for high-volume database operations using Turso (libSQL) in this project, specifically addressing the "Network Latency vs. Payload Size" trade-off.

## The Problem: The Latency/Throughput Trap

When performing thousands of operations (e.g., updating prices for 7,000+ products), developers often fall into two traps:

1.  **Sequential Round-Trips (Latency Bottleneck)**: Sending queries one by one (`await db.update(...)`). Even with a fast 50ms round-trip, 1,000 updates take 50 seconds. This is what caused our initial scripts to take 2-4 minutes.
2.  **Giant Batches (Payload Bottleneck)**: Bundling 1,000 products into a single `db.batch([])` call. This creates a massive HTTP request with thousands of SQL statements. Turso may time out, reject the request size, or hang while processing. This caused the "3-minute hang" in our enrichment script.

## The Solution: Bounded Parallel Batches

The most performant pattern for Turso is to use **Parallelism at the Product/Entity level**.

### Implementation Pattern

Instead of one giant batch or sequential awaits, we group operations for a single entity into a batch and execute multiple entity-batches in parallel.

```typescript
// ❌ SEQUENTIAL (Slow: 1 round-trip per product)
for (const item of items) {
  await db.update(...);
}

// ❌ MEGA BATCH (Unreliable: Too many statements in one HTTP call)
const allQueries = items.flatMap(item => [...]);
await db.batch(allQueries);

// ✅ BOUNDED PARALLELISM (Fastest & Most Reliable)
await Promise.all(
  items.map(async (item) => {
    const productQueries = [
      db.update(products).set(...).where(...),
      db.delete(history).where(...),
      db.insert(history).values(...),
    ];

    // Each product gets its own small batch HTTP request
    // fired in parallel.
    if (productQueries.length > 0) {
      await db.batch(productQueries);
    }
  })
);
```

### Why this works:

1.  **Network Efficiency**: `Promise.all` fires all requests simultaneously. Total network wait time ≈ 1 round-trip (e.g., 50ms) rather than (Items \* 50ms).
2.  **Stability**: Each HTTP request only contains 3-10 SQL statements. This is well within Turso's safety limits and will never time out.
3.  **Concurrency**: Turso/libSQL handles many incoming HTTP connections efficiently.

## Practical Limits

- **Keepa Batching**: Always fetch data from Keepa in batches of **50-100 ASINs** (API limit).
- **DB Parallelism**: For the database, processing **50 products in parallel** is the "sweet spot" for performance without saturating the local machine's connection pool.

---

_Last updated: 2026-01-19 by Antigravity_
