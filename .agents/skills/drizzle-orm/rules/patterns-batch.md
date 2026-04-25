---
title: Batch Inserts
impact: HIGH
impactDescription: Efficient bulk data insertion
tags: patterns, batch, insert
---

## Batch Inserts

Insert multiple rows in a single query.

**Correct:**

```typescript
await db.insert(products).values([
  { title: "Product A", category: "ram" },
  { title: "Product B", category: "ssd" },
  { title: "Product C", category: "hdd" },
]);
```

**For very large batches, chunk them:**

```typescript
const BATCH_SIZE = 100;
const items = [...]; // Large array

for (let i = 0; i < items.length; i += BATCH_SIZE) {
  const batch = items.slice(i, i + BATCH_SIZE);
  await db.insert(products).values(batch);
}
```

**Note:** SQLite has a limit on compound statements per query.
