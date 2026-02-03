# 🤖 CleverPrices Maintenance Engine

CleverPrices uses a **Local Maintenance Engine** powered by **Dokploy Cron Jobs**. This ensures 24/7 price freshness and database reliability directly on the production server.

---

## ⚡ How it Works

The maintenance engine runs on a recurring schedule (defined in Dokploy) and performs three critical phases:

### Phase 1: Price Updates

The worker triggers `scripts/automation/keepa-worker.ts`.

- **Dynamic Scaling**: Automatically adjusts batch size based on available Keepa tokens.
- **Priority**: Stale-first (products that haven't been updated in 11+ hours).
- **Write Economy (Smart Updates)**: Uses **Value-Based Diffing**—it fetches current prices and only performs a write if the price, sales rank, or metadata has actually changed.
- **Target**: Updates the `currentPrice`, `priceAvg30`, and `priceAvg90` in the local SQLite database.

### Phase 2: Product Enrichment

Immediately following the price updates, metadata enrichment runs.

- **Dynamic Scaling**: Uses remaining tokens to fetch rich metadata.
- **History Seeding**: Fetches the full historical curve from Keepa and back-fills the `price_history` table.
- **Safety Protocol**: Prevents accidental double-writing of historical data.
- **Manual Chunking**: History insertions are manually chunked (3,000 rows/chunk) to stay within `SQLITE_MAX_VARIABLE_NUMBER` limits.

### Phase 3: Cache Warming

Once the database is updated, the engine triggers cache warming.

- **Purpose**: Next.js "use cache" layers (Cache Components) are crawled so users always experience sub-100ms load times.

---

## 📊 Monitoring

### Dokploy Logs

You can monitor the health of the engine in the **Dokploy** interface under Server Tasks.

- **Success**: ✅ All products updated, cache warmed.
- **Failure**: ❌ Critical error (e.g., Keepa API key expired).

---

## 🛠 Manual Operation

You can run these components manually via Dokploy or SSH.

### Run Local Update

```bash
# Full worker cycle (Prices + Enrichment + Cache)
bun /app/scripts/automation/keepa-worker.ts de
```

---

## 🛡️ Resilience Features

1. **Stale Priority**: The system calculates staleness and updates the oldest products first.
2. **Performance PRAGMAs**: The database is memory-mapped (256MB) for near-instant reads and writes.
3. **Database Retries**: Every DB operation uses `withRetry` logic with a 5000ms `busy_timeout`.
