---
title: Relational Query Builder
impact: HIGH
impactDescription: Cleaner queries with automatic joins
tags: query, rqb, relations
---

## Relational Query Builder

Use `db.query` for queries that involve relations.

**Example:**

```typescript
const product = await db.query.products.findFirst({
  where: eq(products.slug, slug),
  with: {
    prices: true,
    priceHistory: {
      orderBy: (history, { asc }) => [asc(history.recordedAt)],
    },
  },
});
```

**Advantages:**

- Automatic JOINs based on defined relations.
- Type-safe nested objects.
- Cleaner code than manual joins.

**Available methods:**

- `db.query.{table}.findFirst()` - Single record.
- `db.query.{table}.findMany()` - Multiple records.
