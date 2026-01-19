# CleverPrices Agent Guidelines

This file contains project-specific rules for AI code generation. These rules are **mandatory** and must be followed for all code changes.

---

## 🚫 Banned Patterns

These patterns are **CRITICAL VIOLATIONS** and must never be used:

### Database Operations

| Pattern                                 | Why It's Banned                            | Use Instead                             |
| --------------------------------------- | ------------------------------------------ | --------------------------------------- |
| `OFFSET` pagination on large tables     | Causes $O(N^2)$ read costs                 | Keyset pagination (`WHERE id > lastId`) |
| `SELECT *`                              | Transfers unnecessary data, wastes reads   | Select explicit columns                 |
| `db.delete(table)` without `--force`    | Accidental data loss                       | Require `--force` CLI flag              |
| Unbounded `Promise.all(array.map(...))` | Can spawn thousands of concurrent requests | Bounded parallelism (max 5-10)          |

### Script Safety

| Pattern                           | Why It's Banned                 | Use Instead                     |
| --------------------------------- | ------------------------------- | ------------------------------- |
| Destructive ops without `--force` | Accidental deletions            | Require explicit `--force` flag |
| No `--dry-run` support            | Can't preview impact            | Always implement `--dry-run`    |
| Blind upserts                     | Wastes writes on unchanged data | Value-based diffing first       |

---

## ✅ Required Patterns

### 1. Keyset Pagination (Seek Method)

Always use for iterating over large datasets:

```typescript
let lastId = 0;
while (true) {
  const batch = await db
    .select()
    .from(table)
    .where(gt(table.id, lastId))
    .orderBy(asc(table.id))
    .limit(1000);
  if (batch.length === 0) break;
  lastId = batch[batch.length - 1].id;
}
```

### 2. Bounded Parallelism

Limit concurrent operations to prevent resource exhaustion:

```typescript
const CONCURRENCY = 5;
for (let i = 0; i < batches.length; i += CONCURRENCY) {
  const wave = batches.slice(i, i + CONCURRENCY);
  await Promise.all(wave.map(processBatch));
}
```

### 3. Value-Based Diffing

Only write if data has changed:

```typescript
const current = await db.select().from(prices).where(eq(prices.id, id));
if (newPrice !== current.price) {
  await db.update(prices).set({ price: newPrice });
}
```

### 4. CLI Safety Flags

All data-modifying scripts must support:

```typescript
const isDryRun = process.argv.includes("--dry-run");
const isForce = process.argv.includes("--force");

if (!isForce && !isDryRun) {
  console.error("❌ Destructive operation requires --force.");
  process.exit(1);
}
```

---

## 📚 Reference Documentation

- **Database Economics:** See `docs/TURSO_OPTIMIZATION.md`
- **Maintenance Engine:** See `docs/WORKER.md`
- **Drizzle Patterns:** See `.agent/skills/drizzle-orm/SKILL.md`

---

## 🔒 Resource Limits

| Resource         | Free Tier Limit | Safety Threshold                        |
| ---------------- | --------------- | --------------------------------------- |
| Turso Writes     | 10M rows/month  | Abort if > 500K in single run           |
| Turso Reads      | 1B rows/month   | Use keyset pagination                   |
| Keepa Tokens     | ~1,000/hour     | Reserve 100 for enrichment              |
| Vercel Execution | 60s (Hobby)     | Set `timeout-minutes: 10` in GH Actions |
