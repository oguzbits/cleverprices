---
title: Aggregations
impact: MEDIUM
impactDescription: COUNT, AVG, MIN, MAX patterns
tags: query, aggregation, sql
---

## Aggregations

Use Drizzle's SQL functions for aggregations.

**Examples:**

```typescript
import { count, avg, min, max, sum } from "drizzle-orm";

// Count
const [{ total }] = await db.select({ total: count() }).from(products);

// Average
const [{ avgPrice }] = await db
  .select({ avgPrice: avg(prices.amazonPrice) })
  .from(prices);

// Min/Max
const [{ minPrice, maxPrice }] = await db
  .select({
    minPrice: min(prices.amazonPrice),
    maxPrice: max(prices.amazonPrice),
  })
  .from(prices);

// With grouping
const categoryCounts = await db
  .select({
    category: products.category,
    count: count(),
  })
  .from(products)
  .groupBy(products.category);
```
