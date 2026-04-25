# Keyset Pagination

**CRITICAL:** Never use `OFFSET` for large tables. It causes O(N²) read costs.

## The Problem

With `OFFSET`, the database must read and discard all rows before the offset:

- `OFFSET 1000` → Read 1000 rows, discard them, return next batch
- `OFFSET 900000` → Read 900,000 rows, discard them, return next batch

For a 1 million row table, this results in ~500 billion row reads.

## The Solution

Use a unique, indexed key (like `id`) to "seek" the next batch:

```typescript
let lastId = 0;
const limit = 1000;

while (true) {
  const batch = await db
    .select()
    .from(table)
    .where(gt(table.id, lastId))
    .orderBy(asc(table.id))
    .limit(limit);

  if (batch.length === 0) break;

  lastId = batch[batch.length - 1].id;
  // Process batch...
}
```

## When to Apply

- Syncing entire tables (`pull-data.ts`, `deploy-data.ts`)
- Processing large datasets (price history)
- Any loop over 1,000+ rows

## See Also

- [Examples: keyset-pagination.ts](../examples/keyset-pagination.ts)
