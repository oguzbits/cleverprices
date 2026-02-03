---
name: drizzle-orm
description: >
  Drizzle ORM patterns for SQLite with Turso/LibSQL.
  TRIGGERS: Any database query, schema change, or data sync operation.
  CRITICAL: This project uses Turso with strict read/write quotas.
version: "2.0.0"
---

# Drizzle ORM Best Practices

## Quick Reference

### 🚫 BANNED (Never Use)

| Pattern                              | Why                               | Use Instead                              |
| ------------------------------------ | --------------------------------- | ---------------------------------------- |
| `SELECT *` / `.findMany()`           | Wastes reads on heavy JSON fields | `liteProductColumns`, `litePriceColumns` |
| `OFFSET` pagination                  | O(N²) read costs                  | Keyset pagination                        |
| Unbounded `Promise.all()`            | Resource exhaustion               | Bounded parallelism (max 5-10)           |
| `db.delete(table)` without `--force` | Accidental data loss              | CLI safety flag                          |
| Writes without diffing               | Wastes write quota                | Value-based diffing                      |

### ✅ REQUIRED

| Pattern                 | When                       | Example                                     |
| ----------------------- | -------------------------- | ------------------------------------------- |
| **Lite Columns**        | List views, search results | [Rule](rules/query-lite-columns.md)         |
| **Keyset Pagination**   | Large table iteration      | [Rule](rules/patterns-keyset-pagination.md) |
| **Bounded Parallelism** | Batch operations           | [Rule](rules/patterns-batch.md)             |
| **Value Diffing**       | Before any write           | [Rule](rules/patterns-resource-safety.md)   |
| **O(1) Data Lookups**   | Single product pages       | [Rule](rules/patterns-product-identity.md)  |

---

## Rules Index

### Schema Definition

- [Basic Table](rules/schema-basic-table.md)
- [Indexes](rules/schema-indexes.md) - CRITICAL for performance
- [Relations](rules/schema-relations.md)

### Query Optimization

- [Select Columns](rules/query-select-columns.md) - CRITICAL
- [Lite Columns](rules/query-lite-columns.md) - Project-specific optimization
- [Relational Query Builder](rules/query-rqb.md)
- [Filters](rules/query-filters.md)
- [Aggregations](rules/query-aggregations.md)

### Common Patterns

- [Upsert](rules/patterns-upsert.md)
- [Batch Inserts](rules/patterns-batch.md)
- [Turso Latency](rules/patterns-turso-latency.md)
- [Transactions](rules/patterns-transactions.md)
- [Resource Safety](rules/patterns-resource-safety.md) - CRITICAL

### Configuration

- [Migrations](rules/config-migrations.md)

---

## Examples

See `examples/` for real code from this codebase:

- `examples/lite-columns.ts` - liteProductColumns/litePriceColumns
- `examples/keyset-pagination.ts` - Efficient large table iteration
- `examples/bounded-parallelism.ts` - Safe batch processing
- `examples/value-diffing.ts` - Only write when data changes

---

## Performance Tuning (Production)

### PRAGMA Settings

For bundled SQLite files, configure these in `src/db/index.ts`:

```typescript
client.execute("PRAGMA cache_size = -20000"); // 20MB cache
client.execute("PRAGMA mmap_size = 20000000"); // Memory-map for speed
client.execute("PRAGMA busy_timeout = 5000"); // Prevent lock errors
```

### Index Design Principles

1.  **Index filter columns**: `WHERE category = ?` → index on `category`.
2.  **Index sort columns**: `ORDER BY salesRank` → index on `salesRank`.
3.  **Use composite indexes for common patterns**: `(category, salesRank)` for "Popular in Category".
4.  **Avoid over-indexing**: Each index increases DB size and slows writes.

### Prepared Statements (Advanced)

For hot paths (e.g., search), use Drizzle's prepared statements:

```typescript
const searchStmt = db
  .select()
  .from(products)
  .where(eq(products.category, sql.placeholder("cat")))
  .prepare();

// Usage:
const results = await searchStmt.execute({ cat: "ssd" });
```

This avoids regenerating the SQL string on every call, saving ~5-10ms of CPU time.

---

## Price History Compression

Price history is stored as a GZIP-compressed BLOB to reduce database size by ~73%.

### Schema

```typescript
// In src/db/schema.ts
historyJson: blob("history_json", { mode: "buffer" }),
```

### Helper Module

Use the centralized utilities in `src/lib/history-compression.ts`:

```typescript
import {
  compressHistory,
  parseHistoryBlob,
  pruneHistory,
} from "@/lib/history-compression";

// Reading (handles both legacy TEXT and compressed BLOB)
const historyObj = parseHistoryBlob(priceRecord.historyJson);

// Writing
historyObj[todayStr] = priceInCents;
historyObj = pruneHistory(historyObj, 365); // Keep max 365 days
const compressed = compressHistory(JSON.stringify(historyObj));
// Save `compressed` to the database
```

### Rules

1.  **Always use `parseHistoryBlob()`** to read - it handles both legacy TEXT and compressed BLOB formats.
2.  **Always use `compressHistory()`** to write - never store raw JSON text.
3.  **Always use `pruneHistory()`** before writing - enforces the 365-day limit.
4.  **Format**: Prices are stored in **cents** as integers: `{"2025-01-22": 89900}` (= 899.00€).
