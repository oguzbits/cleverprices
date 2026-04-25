---
title: Index Definition
impact: CRITICAL
impactDescription: Essential for query performance
tags: schema, index, performance
---

## Index Definition

Add indexes for columns used in WHERE, ORDER BY, or JOIN clauses.

**Syntax:**

```typescript
import { index, uniqueIndex, sqliteTable } from "drizzle-orm/sqlite-core";

export const products = sqliteTable(
  "products",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    category: text("category").notNull(),
    slug: text("slug").notNull().unique(),
    salesRank: integer("sales_rank"),
  },
  (table) => [
    index("idx_products_category").on(table.category),
    index("idx_products_sales_rank").on(table.salesRank),
    uniqueIndex("idx_products_slug").on(table.slug),
  ],
);
```

**Rules:**

- Always index foreign keys (`productId`).
- Index columns used in filters (`WHERE category = ?`).
- Use composite indexes for multi-column queries.
