# CleverPrices

Price comparison platform for the German hardware market. Optimized for extreme performance, SEO efficiency, and real-time data accuracy.

## 🚀 Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Pure SSR Strategy)
- **Core**: React 19 (React Compiler enabled)
- **Data Architecture**: Local-first LibSQL (SQLite) persistent store with a **Redis memory layer** for near-instant (sub-40ms) delivery.
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) with semantic tokens (**No hex colors**, **no var()**).
- **Automation**: Bun-powered worker engine for price tracking, data enrichment, and cache warming.
- **Deployment**: Self-hosted on Hetzner Cloud via Dokploy (Docker Swarm).

## 🏎️ Performance Strategy (The "Pure SSR" Commandments)

CleverPrices is architected for sub-100ms response times and zero navigation flashes:

- **Pure SSR**: All data fetching for core routes (PDP, Search, Home) is performed using blocking `await` in the top-level Page segment. `Suspense` and `loading.tsx` are forbidden in dynamic segments to prevent white flashes.
- **Cache Isolation**: Utilizes Next.js 16 `"use cache"` and `cacheLife` directives, strictly isolated in `src/lib/server/cached-*.ts` files.
- **Memory-First Delivery**: Redis serves as the high-speed read layer, ensuring near-instant delivery of cached product and category data.
- **Batching & TTFB**: Uses `mergeLivePricesSelective` to resolve multiple product IDs in a single wave, minimizing DB roundtrips.
- **Local-First Data**: SQLite is the persistent store. In production, the database is mounted directly from the server's NVMe SSD into the container, eliminating network latency.
- **O(1) Lookups**: Core detail pages and metadata use pure indexed lookups. custom SQL indexes on `sales_rank`, `created_at`, and `productId` ensure instantaneous sorting.

## 🛠️ Maintenance & Automation

CleverPrices is powered by an automated Maintenance Engine that ensures data freshness:

- **Update Frequency**: Automated price tracking every 20 minutes.
- **Phase 1**: Price updates using Keepa (Smart diffing).
- **Phase 2**: Multi-source enrichment (eBay, Icecat, SIF firewall).
- **Phase 3**: Proactive **Cache Warming** of the Next.js layer.

### Core Commands

```bash
# Install dependencies
bun install

# Run development server
bun dev

# Update prices (Hourly batch)
bun run update-prices

# Warm the Next.js cache manually
bun run warm-cache

# Sync production data to local for debugging
bun run db:pull-prod
```

## 🕸️ Graphify Knowledge Graph

This project utilizes [Graphify](https://github.com/oguzbits/graphify) for architecture navigation and codebase intelligence.

- The graph report is available at `graphify-out/GRAPH_REPORT.md`.
- After modifying code, rebuild the graph:
  ```bash
  $(cat graphify-out/.graphify_python) -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"
  ```

## 📂 Project Structure

```
src/
├── app/                    # Next.js App Router (Pure SSR)
├── components/            # Focused components (Primitives vs Features)
├── db/                    # Drizzle ORM + SQLite Schema
├── lib/
│   ├── actions/          # Server Actions
│   ├── data-sources/     # eBay, Keepa, etc.
│   ├── server/           # Cached data orchestrators (Cached-*.ts)
│   └── utils/            # Domain logic (Product Identity, Formatting)
└── scripts/               # Automation & Maintenance scripts
```

## 📝 Documentation

- **[PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md)** - Key features, architecture, and edge cases.
- **[DOKPLOY_SETUP.md](docs/ops/DOKPLOY_SETUP.md)** - Infrastructure and deployment guide.
- **[DATA_INTEGRITY.md](docs/architecture/DATA_INTEGRITY.md)** - SIF Firewall and Health Scoring.
- **[WORKER.md](docs/ops/WORKER.md)** - Maintenance and background job details.

---

## About this repository

This project powers **cleverprices.com** and is published as a professional portfolio project. The source code is NOT licensed for commercial use or redistribution.
