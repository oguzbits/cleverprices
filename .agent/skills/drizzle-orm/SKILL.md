---
name: drizzle-orm
description: >
  Best practices for Drizzle ORM with SQLite (Turso/LibSQL).
  Includes schema definition, optimized queries, and relationship handling.
  Use when: defining schemas, writing complex queries, or managing migrations.
---

# Drizzle ORM Best Practices

Comprehensive guide with 11 rules across 4 categories.

## Quick Reference

### Schema Definition

- **Basic Table**: sqliteTable patterns ([Rule](rules/schema-basic-table.md))
- **Indexes**: CRITICAL for performance ([Rule](rules/schema-indexes.md))
- **Relations**: Enable RQB ([Rule](rules/schema-relations.md))

### Query Optimization

- **Select Columns**: CRITICAL - avoid SELECT \* ([Rule](rules/query-select-columns.md))
- **Relational Query Builder**: Cleaner joins ([Rule](rules/query-rqb.md))
- **Filters**: Type-safe WHERE ([Rule](rules/query-filters.md))
- **Aggregations**: COUNT, AVG, MIN/MAX ([Rule](rules/query-aggregations.md))

### Common Patterns

- **Upsert**: ON CONFLICT DO UPDATE ([Rule](rules/patterns-upsert.md))
- **Batch Inserts**: Bulk data ([Rule](rules/patterns-batch.md))
- **Turso Latency**: Parallel batch optimization ([Rule](rules/patterns-turso-latency.md))
- **Transactions**: Atomic operations ([Rule](rules/patterns-transactions.md))
- **Resource Safety**: Protection & Economy ([Rule](rules/patterns-resource-safety.md))

### Configuration

- **Migrations**: drizzle-kit workflow ([Rule](rules/config-migrations.md))

## Full Compiled Document

For the complete guide with all rules expanded: `AGENTS.md`
