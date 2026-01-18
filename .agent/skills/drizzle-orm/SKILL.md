---
name: drizzle-orm
description: |
  Best practices for Drizzle ORM with SQLite (Turso/LibSQL).
  Includes schema definition, optimized queries, and relationship handling.
  Use when: defining schemas, writing complex queries, or managing migrations.
user-invocable: true
---

# Drizzle ORM Best Practices (SQLite/Turso)

## Schema Definition

Define your schema in `src/db/schema.ts` (or split files).

### Basic Table

```typescript
import { sqliteTable, text, integer, int } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
});
```

### Indexes

Always add indexes for columns you query often (filters, sorts, joins).

```typescript
import { index } from "drizzle-orm/sqlite-core";

export const products = sqliteTable(
  "products",
  {
    // ... columns
  },
  (table) => ({
    categoryIdx: index("category_idx").on(table.categoryId),
    priceIdx: index("price_idx").on(table.price),
  }),
);
```

## Query Optimization

### 1. Avoid `select *`

Only select the fields you need to reduce data transfer and memory usage.

```typescript
// ❌ Bad
const allUsers = await db.select().from(users);

// ✅ Good
const usernames = await db
  .select({
    id: users.id,
    name: users.name,
  })
  .from(users);
```

### 2. Using `with` (Relations)

Drizzle's Query Builders (RQB) are often more efficient and readable than manual joins for hierarchical data.

```typescript
const result = await db.query.users.findMany({
  with: {
    posts: {
      limit: 5,
      with: {
        comments: true,
      },
    },
  },
});
```

### 3. Filters

Use Drizzle's logical operators.

```typescript
import { and, eq, gte, like } from "drizzle-orm";

const activeAdults = await db
  .select()
  .from(users)
  .where(and(eq(users.isActive, true), gte(users.age, 18)));
```

### 4. Aggregations

Use raw SQL for efficient aggregations.

```typescript
import { sql } from "drizzle-orm";

const stats = await db
  .select({
    count: sql<number>`count(*)`,
    avgPrice: sql<number>`avg(${products.price})`,
  })
  .from(products);
```

## Migrations

1. **Generate**: `drizzle-kit generate` (creates SQL file)
2. **Push**: `drizzle-kit push` (applies directly - good for prototyping)
3. **Migrate**: `drizzle-kit migrate` (applies generated SQL - good for prod)

**Config (`drizzle.config.ts`)**:

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  driver: "turso", // or 'libsql'
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
});
```

## Common Patterns

### Upsert (SQLite)

SQLite supports `ON CONFLICT`.

```typescript
await db
  .insert(users)
  .values(newUser)
  .onConflictDoUpdate({
    target: users.email,
    set: { name: newUser.name, updatedAt: new Date() },
  });
```

### Batch Inserts

Always batch large inserts to reduce round-trips.

```typescript
const batchSize = 100;
for (let i = 0; i < largeData.length; i += batchSize) {
  await db.insert(products).values(largeData.slice(i, i + batchSize));
}
```

### Transactions

Ensure data integrity with transactions.

```typescript
await db.transaction(async (tx) => {
  const [user] = await tx.insert(users).values(data).returning();
  await tx.insert(profiles).values({ userId: user.id });
});
```

## Best Practices Checklist

- [ ] **Type definitions**: Export inferred types (`typeof users.$inferSelect`) for app-wide use.
- [ ] **ENV Variables**: Never hardcode credentials.
- [ ] **Prep Statements**: `db.prepare()` can speed up repeated queries (check driver support).
- [ ] **Logging**: Enable logger in dev `drizzle(client, { logger: true })` to debug queries.
