---
title: Select Specific Columns
impact: CRITICAL
impactDescription: Avoid SELECT *, reduce data transfer
tags: query, select, performance
---

## Select Specific Columns

Never use `select()` without arguments. Always specify columns.

**Incorrect (selects all columns):**

```typescript
const products = await db.select().from(products);
```

**Correct (selects specific columns):**

```typescript
const products = await db
  .select({
    id: products.id,
    title: products.title,
    slug: products.slug,
  })
  .from(products);
```

**Pattern for reuse:**

```typescript
export const liteProductColumns = {
  id: products.id,
  title: products.title,
  slug: products.slug,
  // Exclude heavy fields: rawData, description, features
};

const products = await db.select(liteProductColumns).from(products);
```
