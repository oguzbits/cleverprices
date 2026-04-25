---
title: Upsert Pattern
impact: HIGH
impactDescription: Insert or update in one query
tags: patterns, upsert, conflict
---

## Upsert Pattern

Use `onConflictDoUpdate` for upsert operations.

**Example:**

```typescript
await db
  .insert(prices)
  .values({
    productId: product.id,
    country: "de",
    amazonPrice: 99.99,
    currency: "EUR",
    source: "keepa",
  })
  .onConflictDoUpdate({
    target: [prices.productId, prices.country],
    set: {
      amazonPrice: sql`excluded.amazon_price`,
      lastUpdated: new Date(),
    },
  });
```

**Key points:**

- `target` specifies the unique constraint columns.
- `set` defines what to update on conflict.
- Use `sql\`excluded.column_name\`` to reference the incoming value.
