---
title: Defining Relations
impact: HIGH
impactDescription: Enable Relational Query Builder
tags: schema, relations, rqb
---

## Defining Relations

Define relations to use Drizzle's Relational Query Builder.

**Example:**

```typescript
import { relations } from "drizzle-orm";

export const productsRelations = relations(products, ({ many }) => ({
  prices: many(prices),
  priceHistory: many(priceHistory),
}));

export const pricesRelations = relations(prices, ({ one }) => ({
  product: one(products, {
    fields: [prices.productId],
    references: [products.id],
  }),
}));
```

**Key points:**

- Use `one()` for belongs-to relationships.
- Use `many()` for has-many relationships.
- Relations are defined separately from the table schema.
