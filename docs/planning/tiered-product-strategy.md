# Product Tiering Strategy

To maintain a professional, high-quality database on a limit of 20 Keepa tokens/minute (28,800/day), we use a dynamic tiering system. This ensures that high-traffic categories (like GPUs) have massive depth, while niche categories (like Microwaves) remain clean and cost-effective.

## Tier A: High Velocity (Target: 800 - 1000 products)

_High traffic, weekly model updates, deep buyer interest._

- smartphones
- gpu
- cpu
- tvs
- notebooks
- headphones
- monitors
- systemkameras
- tablets
- hard-drives
- ssds
- ram

## Tier B: Technical Staples (Target: 300 - 500 products)

_Consistent interest, technical choice is key._

- motherboards
- speakers
- routers
- espressomaschinen
- waschmaschinen
- kuehlschraenke
- power-supplies
- pc-cases
- keyboards
- mice
- smartwatches
- game-controllers
- soundbars
- drones

## Tier C: Niche & Slow (Target: 50 - 150 products)

_Occasional purchases, top 100 brands cover most use cases._

- cpu-coolers
- webcams
- microphones
- nas
- network-switches
- network-cards
- ups
- backoefen
- kochfelder
- mikrowellen
- dunstabzugshauben
- power-tools (akkuschrauber, bohrmaschinen, etc.)
- All other categories not listed above

## Operational Logic

1. **Daily Updates:** EVERY product (approx. 20k total) is updated every 24 hours to comply with Amazon ToS and maintain clean charts.
2. **Discovery Growth:** The worker rotates categories, adding new bestsellers until the Tiered Cap is reached.
3. **Quality Shield:** All items must still pass the `isQualityProduct` filter (no accessories).

## Migration & Indexing (Active Phase)

> [!IMPORTANT]
> **Current Status (March 2026): Tactical Flooding Phase**
> Due to a Google Search Console (GSC) indexing stall where old URLs persisted for >30 days, we have temporarily widened our sitemap filters.

### 1. The "Flood then Prune" Strategy

- **Current (The Flood):** We are including `scavenged` products and `generic` slugs in the sitemap. This expands our footprint from ~1,900 to ~7,000 URLs to force Googlebot to discover the new German URL structure.
- **Target (The Prune):** Once GSC impressions successfully shift to the new slugs, we will revert to the strict "Tiered" filter to protect crawl budget and favor high-authority pages.

### 2. Authority Transfer (301 vs 307)

- **Rule:** All alias/legacy redirects MUST use `permanentRedirect` (301).
- **Why:** `307 (Temporary)` prevents Google from transferring the "SEO juice" and indexing the new URL in place of the old one. We use 301s to finalize the migration.

### 3. Sitemap Maintenance

- The sitemap is generated via `force-dynamic` to avoid empty build-time snapshots.
- Check `/sitemap.xml` after any major schema change to ensure URL parity with the production database.
