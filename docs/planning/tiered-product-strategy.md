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
