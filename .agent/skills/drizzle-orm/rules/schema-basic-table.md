---
title: Basic Table Definition
impact: HIGH
impactDescription: Foundation for all Drizzle schemas
tags: schema, table, sqlite
---

## Basic Table Definition

Use `sqliteTable` to define tables with typed columns.

**Example:**

```typescript
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  asin: text("asin").notNull().unique(),
  title: text("title").notNull(),
  price: real("price"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});
```

**Key patterns:**

- Use `integer("id").primaryKey({ autoIncrement: true })` for auto-increment.
- Use `mode: "timestamp"` for Date handling.
- Use `sql` template for default expressions.
