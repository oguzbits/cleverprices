# Drizzle ORM Best Practices

**Version 1.0.0**  
Prowler Cloud / CleverPrices  
January 2026

> **Note:**  
> This document is for agents and LLMs to follow when working with Drizzle ORM.

---

## Abstract

Best practices for Drizzle ORM with SQLite. Contains 11 rules across 4 categories: Schema Definition (tables, indexes, relations), Query Optimization (select columns, RQB, filters), Common Patterns (upsert, batch, transactions), and Configuration (migrations).

---

## Table of Contents

1. [Schema Definition](#1-schema-definition)
   - 1.1 [Basic Table Definition](#11-basic-table-definition)
   - 1.2 [Index Definition](#12-index-definition)
   - 1.3 [Defining Relations](#13-defining-relations)
2. [Query Optimization](#2-query-optimization)
   - 2.1 [Select Specific Columns](#21-select-specific-columns)
   - 2.2 [Relational Query Builder](#22-relational-query-builder)
   - 2.3 [Using Filters](#23-using-filters)
   - 2.4 [Aggregations](#24-aggregations)
3. [Common Patterns](#3-common-patterns)
   - 3.1 [Upsert Pattern](#31-upsert-pattern)
   - 3.2 [Batch Inserts](#32-batch-inserts)
   - 3.3 [Transactions](#33-transactions)
4. [Configuration](#4-configuration)
   - 4.1 [Migration Commands](#41-migration-commands)

---

## 1. Schema Definition

### 1.1 Basic Table Definition

**Impact: HIGH**

```typescript
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  asin: text("asin").notNull().unique(),
  title: text("title").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});
```

### 1.2 Index Definition

**Impact: CRITICAL**

```typescript
export const products = sqliteTable(
  "products",
  {
    /* columns */
  },
  (table) => [
    index("idx_products_category").on(table.category),
    uniqueIndex("idx_products_slug").on(table.slug),
  ],
);
```

### 1.3 Defining Relations

**Impact: HIGH**

```typescript
export const productsRelations = relations(products, ({ many }) => ({
  prices: many(prices),
  priceHistory: many(priceHistory),
}));
```

---

## 2. Query Optimization

### 2.1 Select Specific Columns

**Impact: CRITICAL**

```typescript
// Incorrect
await db.select().from(products);

// Correct
await db.select({ id: products.id, title: products.title }).from(products);
```

### 2.2 Relational Query Builder

**Impact: HIGH**

```typescript
const product = await db.query.products.findFirst({
  where: eq(products.slug, slug),
  with: {
    prices: true,
    priceHistory: { orderBy: (h, { asc }) => [asc(h.recordedAt)] },
  },
});
```

### 2.3 Using Filters

**Impact: MEDIUM**

```typescript
import { eq, gt, and, inArray } from "drizzle-orm";

.where(and(
  eq(products.category, "ram"),
  gt(products.price, 50)
))
```

### 2.4 Aggregations

**Impact: MEDIUM**

```typescript
const [{ total }] = await db.select({ total: count() }).from(products);
```

---

## 3. Common Patterns

### 3.1 Upsert Pattern

**Impact: HIGH**

```typescript
await db.insert(prices).values({ ... })
  .onConflictDoUpdate({
    target: [prices.productId, prices.country],
    set: { amazonPrice: sql`excluded.amazon_price` },
  });
```

### 3.2 Batch Inserts

**Impact: HIGH**

```typescript
await db.insert(products).values([
  { title: "A", category: "ram" },
  { title: "B", category: "ssd" },
]);
```

### 3.3 Transactions

**Impact: MEDIUM**

```typescript
await db.transaction(async (tx) => {
  const [product] = await tx.insert(products).values({ ... }).returning();
  await tx.insert(prices).values({ productId: product.id, ... });
});
```

---

## 4. Configuration

### 4.1 Migration Commands

**Impact: HIGH**

```bash
npx drizzle-kit generate  # Generate migration files
npx drizzle-kit push      # Push schema directly (dev)
npx drizzle-kit migrate   # Run migrations (prod)
```

---

## References

- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [Relational Query Builder](https://orm.drizzle.team/docs/rqb)
- [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview)
