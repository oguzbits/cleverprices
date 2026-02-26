# Cache & Freshness Policy (Single Source of Truth)

## 🎯 Objective

To ensure **Absolute Price Consistency** across all pages of CleverPrices. A product must NEVER show a different price on a Category page than it does on a Product Detail Page (PDP).

## 🛡️ The "Golden Rule"

> [!IMPORTANT]
> **Inner Cache (Data) must always be fresher than Outer Cache (Pages).**
> If you change a TTL for a page, you MUST ensure the underlying data layer is synchronized or faster.

## 🕒 TTL Configuration (Standardized)

All cache profiles are defined in [next.config.ts](../../next.config.ts).

| Profile    | Layer       | Revalidate  | Stale | Expire | Use Case                       |
| ---------- | ----------- | ----------- | ----- | ------ | ------------------------------ |
| `prices`   | **Data**    | 5m (300s)   | 300s  | 4h     | Mid-level cached price data    |
| `category` | **Page**    | 20m (1200s) | 1200s | 1d     | `/[categorySlug]` pages        |
| `product`  | **Page**    | 20m (1200s) | 1200s | 1d     | `/p/[slug]` pages              |
| `dynamic`  | **Overlay** | 20m (1200s) | 1200s | 1h     | Search results, filtered views |
| `static`   | **Meta**    | 24h         | 24h   | 30d    | Sitemaps, categories list      |

## 🛠️ Implementation Guardrails

### 1. Price Consistency Check

Whenever modifying a page component:

- Ensure it uses `cacheLife("category")` or `cacheLife("product")`.
- Verify that sub-data fetching (via `live-data.ts`) uses `cacheLife("prices")`.

### 2. Synchronization Window & Shared Cache

The stability window is set to **1200 seconds (20 minutes)**. This is intentionally synchronized with the **Keepa Worker cycle**.

> [!IMPORTANT]
> **Shared Cache Stability**: We have completely removed per-user/bot cache logic. The server MUST NOT use `headers()`, `cookies()`, or `isBot()` in the top-level rendering tree of cached pages. This ensures the warmer and human visitors share the exact same RSC entry in Redis, effectively eliminating database load during crawls.

### 3. Absolute Freshness

The 20-minute `stale` window ensures that after the warmer fetches a page, that version remains perfectly static and high-speed for the duration of that price cycle. The database is shielded by the cache, not by "Bot Shields".

## 🏗️ Static Generation Strategy

### Warm-Static Architecture

CleverPrices uses a **"Warm-Static"** model for PDPs and Category pages.

- **Build Phase**: The database is intentionally **excluded** from the Docker build context (via `.dockerignore`) to favor thin, portable images. `generateStaticParams` returns placeholders.
- **Warming Phase**: After every deployment or price update (Keepa Worker), we trigger the `warm-cache` script.
- **Runtime**:
  1. The page is proactively rendered in the background by the warmer.
  2. It is frozen into the **Cache Life Layer** (20 minutes).
  3. Real users (and Google) always hit **Static Cache** with < 40ms TTFB.
  4. The cache key is **URL-pure**, ensuring total sharing between automation and humans.

This strategy combines the speed of SSG with the freshness of a dynamic app, without the long build times.
