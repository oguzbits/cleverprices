# 🤖 CleverPrices Maintenance Engine

CleverPrices uses a cloud-native **Maintenance Engine** powered by **GitHub Actions**. This replaces the legacy local worker model and ensures 24/7 price freshness and database reliability.

---

## ⚡ How it Works

The maintenance engine runs on a recurring schedule and performs three critical phases:

### Phase 1: Price Updates (`0 * * * *`)

Every hour, the `daily-maintenance.yml` workflow triggers `scripts/update-prices.ts`.

- **Batch Size**: 500 products per run.
- **Priority**: Stale-first (products that haven't been updated in 11+ hours).
- **Target**: Updates the `currentPrice`, `lowestPrice`, and `highestPrice` in the Turso Cloud database.

### Phase 2: Product Enrichment

Immediately following the price updates, `scripts/enrich-products.ts` runs.

- **Batch Size**: 100 products per run.
- **Data**: Fetches 90-day averages, sales ranks, and long-term price history.
- **Resilience**: This step uses `continue-on-error: true` so that minor Keepa API issues don't block the next phase.

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
