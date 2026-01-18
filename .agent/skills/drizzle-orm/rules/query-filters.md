---
title: Using Filters
impact: MEDIUM
impactDescription: Type-safe WHERE clauses
tags: query, filters, where
---

## Using Filters

Use Drizzle operators for type-safe filtering.

**Basic operators:**

```typescript
import { eq, ne, gt, gte, lt, lte, like, inArray, isNull } from "drizzle-orm";

// Equality
.where(eq(products.category, "ram"))

// Greater than
.where(gt(products.price, 100))

// IN clause
.where(inArray(prices.productId, [1, 2, 3]))

// LIKE
.where(like(products.title, "%Samsung%"))

// IS NULL
.where(isNull(products.brand))
```

**Combining filters:**

```typescript
import { and, or } from "drizzle-orm";

.where(
  and(
    eq(products.category, "ram"),
    gt(products.price, 50)
  )
)
```
