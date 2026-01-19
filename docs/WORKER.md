# 🤖 CleverPrices Maintenance Engine

CleverPrices uses a cloud-native **Maintenance Engine** powered by **GitHub Actions**. This replaces the legacy local worker model and ensures 24/7 price freshness and database reliability.

---

## ⚡ How it Works

The maintenance engine runs on a recurring schedule and performs three critical phases:

### Phase 1: Price Updates (`0 * * * *`)

Every hour, the `daily-maintenance.yml` workflow triggers `scripts/update-prices.ts`.

- **Dynamic Scaling**: Automatically adjusts batch size (300-1000) based on available Keepa tokens.
- **Priority**: Stale-first (products that haven't been updated in 11+ hours).
- **Write Economy (Smart Updates)**: Uses **Value-Based Diffing**—it fetches current cloud prices and only performs a Turso write if the price, sales rank, or metadata has actually changed. This reduces row-write consumption by up to 90% for relatively stable products.
- **Daily Minimums**: Implements "Idealo-style" tracking—instead of multiple points per day, it records only the absolute lowest price detected each day to the `price_history` table.
- **Target**: Updates the `currentPrice`, `priceAvg30`, and `priceAvg90` in the database.

### Phase 2: Product Enrichment

Immediately following the price updates, `scripts/enrich-products.ts` runs.

- **Dynamic Scaling**: Uses remaining tokens (up to 500 products) to fetch rich metadata.
- **History Seeding**: Fetches the full historical curve from Keepa and back-fills the `price_history` table.
- **Safety Protocol**: Requires the `--force` flag to overwrite existing history for a product, preventing accidental double-writing of historical data.
- **Parallelized Sync Phase**: Implements the "Parallel Flat Bulk" strategy—all data is fetched in parallel, and database commits are performed in a parallelized sync phase with bounded concurrency. This maximizes throughput while avoiding connection timeouts.
- **Manual Chunking**: History insertions are manually chunked (3,000 rows/chunk) to stay within `SQLITE_MAX_VARIABLE_NUMBER` limits.
- **Resilience**: This step uses `continue-on-error: true` so that minor Keepa API issues don't block the Next.js cache warming.

### Phase 3: Cache Warming

Once the database is updated, the engine triggers `scripts/warm-cache.ts`.

- **Purpose**: Next.js "use cache" layers (Cache Components) can be slow on the first hit. This script crawls the most important listing pages so users always experience sub-100ms load times.

---

## 📊 Monitoring

### GitHub Actions tab

You can monitor the health of the engine in the **GitHub Actions** tab of your repository.

- **Success**: ✅ All 500 products updated, cache warmed.
- **Partial**: ⚠️ Prices updated, but enrichment or cache warming skipped.
- **Failure**: ❌ Critical error (e.g., Turso/Keepa API key expired).

### Token Management

The engine is tuned to stay well within the Keepa API "Token Bucket":

- Each hour consumes roughly **1/24th** of your daily token allowance.
- Circuit breakers are in place to stop the batch if tokens drop below **10**.

---

## 🛠 Manual Operation

While automated, you can run these components manually if you need to force a refresh.

### Run Local Update

Requires `TURSO_DATABASE_URL` and `KEEPA_API_KEY` in your `.env.local`.

```bash
# Full hourly batch (Prices + Enrichment + Cache)
bun run update-prices

# Pull latest Cloud data to Local
bun run db:pull

# Just Enrichment
bun run scripts/enrich-products.ts

# Just Cache Warming
bun run warm-cache
```

### Apply Schema Changes

To update the Turso Cloud database schema (Drizzle):

```bash
# Push schema to Turso
bun run db:migrate:cloud
```

---

## 🛡️ Resilience Features

1. **Stale Priority**: The system calculates staleness and updates the oldest products first.
2. **Explicit Cache Warming**: Controlled via `WARM_CACHE=true` env variable to prevent redundant warming during local development.
3. **Database Retries**: Every DB operation uses `withRetry` logic with a 5000ms `busy_timeout` to handle Turso connection spikes.
