# Landing Page Architecture & Update Mechanism

## Overview

The landing page (`/`) is designed to be **dynamic, self-updating, and high-performance**. It moves away from static manual curation and relies entirely on data-driven algorithms to surface products from the database.

## Data Sections

The page features three main dynamic sections, each powered by optimized DB queries:

1.  **Top Offer ("Aktuelle Deals für dich")**
    - **Source**: `getBestDeals()`
    - **Logic**: Finds products where the _current price_ is significantly lower than the _30/90-day average price_.
    - **Goal**: Automatically surface price drops.

2.  **Bestseller ("Volume Kings")**
    - **Source**: `getDiverseMostPopular()`
    - **Logic**: Uses a SQL Window Function to fetch the Top 15 products **from every single category**.
    - **Goal**: Ensure a diverse mix of trending products (not just SSDs).

3.  **Hero Section ("Revenue Kings")**
    - **Source**: `getDiverseMostPopular()`
    - **Logic**: Filters diverse candidates for high price (>200€) + high sales velocity.
    - **Goal**: Highlight premium flagship gear (iPhones, GPUs, Consoles).

## Caching & Performance

We use a multi-layered caching strategy to ensure sub-second loads:

1.  **Database Layer**: Indexes on `sales_rank`, `review_count`, and `category`.
2.  **Logic Layer**: `getCachedLocalizedCategoryProducts` (pre-scores and localizes for 11h).
3.  **Static Generation**: Revalidated every 11 hours via `PRICE_REVALIDATE_SECONDS`.
4.  **Browser Layer**: Smart prefetching on hover via `PrefetchLink`.

## Update Mechanism

1.  **Worker**: Updates local DB prices every 15 minutes.
2.  **Cloud Sync**: Deploys updates to Turso every 12 hours.
3.  **Vercel Revalidation**: Triggered automatically every 11 hours.

## Manual Force Update

If you need to update the landing page _immediately_:

```bash
# Redeploy on Vercel to clear the global CDN cache
# OR run db:deploy to push local changes to cloud
```
