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
