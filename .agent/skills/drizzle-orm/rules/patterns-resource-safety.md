# Resource Safe Operations

Implement guardrails to protect cloud database quotas and prevent data loss.

## Guardrail 1: Mandatory Safety Flags

All scripts that perform destructive operations (deletions, full refreshes, or local DB overrides) MUST require a `--force` flag to execute.

```typescript
const isForce = process.argv.includes("--force");
const isDryRun = process.argv.includes("--dry-run");

if (!isForce && !isDryRun) {
  console.error("❌ ERROR: Destructive operation requires --force.");
  process.exit(1);
}

// Only execute deletion if forced
if (isForce && !isDryRun) {
  await db.delete(table);
}
```

## Guardrail 2: Value-Based Diffing (Write Economy)

Before updating a record, fetch the existing state and only perform the write if the specific values have changed. This is critical for high-frequency syncs (like price updates).

```typescript
const [current] = await db.select().from(prices).where(eq(prices.id, id));

const hasChanged =
  newData.price !== current.price || newData.status !== current.status;

if (hasChanged) {
  await db
    .update(prices)
    .set({ ...newData, lastUpdated: new Date() })
    .where(eq(prices.id, id));
} else {
  // Optional: only update timestamp to move it in the stale queue
  await db
    .update(prices)
    .set({ lastUpdated: new Date() })
    .where(eq(prices.id, id));
}
```

## Guardrail 3: Horizontal Cutoffs

Provide flags to limit the depth of data operations during testing or migration.

- `--limit=100`: Process only a small batch of products.
- `--history-days=30`: Only sync the last 30 days of data instead of full history.

## Guardrail 4: Point-in-Time Recovery (PITR)

For massive accidental deletions, use PITR instead of manual re-uploads. PITR is a metadata operation that doesn't consume row-write quotas.

```bash
turso db create DB_NAME --from-db SRC_DB --timestamp TIMESTAMP_IN_UTC
```

---

## ⚠️ CRITICAL: Banned Patterns

The following patterns are **NEVER** allowed in this project:

| Pattern                          | Violation            | Alternative                    |
| -------------------------------- | -------------------- | ------------------------------ |
| `OFFSET` pagination              | $O(N^2)$ reads       | Keyset/Seek pagination         |
| `SELECT *`                       | Wastes reads         | Explicit column selection      |
| Unbounded `Promise.all`          | Resource exhaustion  | Bounded parallelism (max 5-10) |
| `db.delete(table)` without guard | Accidental data loss | Require `--force` flag         |
| Writes without diffing           | Wastes write quota   | Value-based diffing            |

See the root [AGENTS.md](file:///Users/oguz/Desktop/Dev/cleverprices/AGENTS.md) for the canonical rules.
