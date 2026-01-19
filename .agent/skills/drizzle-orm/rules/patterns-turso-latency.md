# Turso Latency & Batch Optimization

When working with Turso (remote libSQL), network latency and transaction congestion are the primary performance killers. You must balance the number of HTTP requests against the payload size and concurrency.

## The Rule

Use **Bounded Parallel Batches** for metadata updates and **Flat Bulk Processing** for high-volume data points (like history/logs).

## ❌ Bad Pattern: Sequential Await

Each `await` is a separate HTTP round-trip (50ms+).

```typescript
for (const product of products) {
  await db.update(products).set(...).where(...);
}
```

## ❌ Bad Pattern: Parallel Congestion

Fining too many heavy requests at once can saturate the engine.

```typescript
await Promise.all(
  products.map(async (p) => {
    await db.insert(history).values(p.history); // 50 parallel requests of 500 rows each
  }),
);
```

## ✅ Good Pattern: Bounded Parallel Batches

Fires multiple small batches in parallel. Best for metadata and per-entity logic.

```typescript
await Promise.all(
  products.map(async (product) => {
    const batch = [db.update(products).set(...), db.insert(prices).values(...)];
    await db.batch(batch);
  })
);
```

## ✅ Best Pattern: Flat Bulk Processing

Flatten operations to exactly two round-trips: one for metadata/cleanup and one for bulk data. Best for 1,000+ rows.

```typescript
const metadata = [];
const data = [];
for (const p of products) {
  metadata.push(db.delete(priceHistory).where(...));
  data.push(...p.history);
}
await db.batch(metadata);
await db.insert(priceHistory).values(data);
```

## Practical Limits

1. **ASIN Batching**: Fetch data from APIs in batches of 50-100.
2. **DB Parallelism**: Process ~50 parallel entity batches at most.
3. **Flat Bulk**: Use for any data where the row count exceeds 500 per Request.
