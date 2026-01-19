# Turso Latency & Batch Optimization

When working with Turso (remote libSQL), network latency is the primary performance killer. You must balance the number of HTTP requests against the payload size.

## The Rule

Do not use sequential awaits in loops, and do not create massive batch payloads that exceed Turso HTTP limits. Instead, use **Bounded Parallel Batches**.

## Bad Pattern: Sequential Await

Each `await` is a separate HTTP round-trip (50ms+). 100 products = 5 seconds.

```typescript
for (const product of products) {
  await db.update(products).set(...).where(eq(products.id, product.id));
}
```

## Bad Pattern: Huge Single Batch

A giant payload can time out or be rejected.

```typescript
const allQueries = products.flatMap((p) => [q1, q2, q3, q4, q5]); // 1000+ statements
await db.batch(allQueries); // High risk of timeout/failure
```

## Good Pattern: Bounded Parallel Batches

Fire multiple small batches in parallel. This occupies the network pipeline without overwhelming the server.

```typescript
await Promise.all(
  products.map(async (product) => {
    const batch = [
      db.update(products).set(...).where(...),
      db.insert(history).values(...),
    ];
    await db.batch(batch); // Small HTTP request, fired in parallel
  })
);
```

## Best Practices

1. **Parallel limit**: If processing thousands, use a chunking mechanism to limit parallel requests to ~50 at a time to avoid local socket exhaustion.
2. **Entity Consistency**: Keep all related queries for a single entity (Product + Prices + History) within the same `db.batch()` call to ensure they succeed or fail together as a unit.
