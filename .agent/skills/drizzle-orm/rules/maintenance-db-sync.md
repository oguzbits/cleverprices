---
name: maintenance-db-sync
description: Safe database synchronization practices for SQLite/Drizzle.
---

# Database Synchronization & Maintenance

When syncing the production SQLite database locally or deploying a local fix to production, follow these safety precautions to prevent file corruption.

## 1. Local Pull Precautions (Remote -> Local)

The most common cause of "malformed database" errors when pulling via `scp` is local file locking.

### Critical Rule: STOP EVERYTHING LOCAL

- **STOP** `bun dev` (Next.js server).
- **STOP** `drizzle-kit studio`.
- **CRITICAL**: Delete any local `-wal` or `-shm` files in your `data/` directory before performing the pull.

### Atomic Snapshots (Remote)

Always use `VACUUM INTO` on the server to create a hot backup. This ensures you pull a consistent snapshot without needing to stop the production container.

```bash
# Example from pull-data.ts
docker exec -t cleverprices sqlite3 /app/data/cleverprices.db "VACUUM INTO '/app/data/snapshot.db';"
```

### Integrity Verification

After pulling, always run:

```bash
sqlite3 data/cleverprices.db "PRAGMA integrity_check;"
```

## 2. Production Deploy Precautions (Local -> Remote)

When pushing a fixed database to production (e.g., via `deploy-data.ts`), ensure an atomic swap.

### Atomic Swap Strategy

1. **Upload** the new DB file with a `.new` extension.
2. **Stop** the production container.
3. **Atomic Move**: `mv cleverprices.db.new cleverprices.db`.
4. **Cleanup**: Delete any existing `cleverprices.db-wal` or `cleverprices.db-shm` on the server.
5. **Start** the production container.

## 3. Environment Safeguards

Always require a high-friction environment variable for destructive sync operations.

```typescript
if (
  process.env.DANGEROUSLY_FORCE_DB_PUSH !==
  "I_UNDERSTAND_THIS_WIPES_PRODUCTION_DATA"
) {
  throw new Error("Safety check failed");
}
```
