# CleverPrices

Price comparison platform focused on the **Price per Unit** metric. Optimized for the German hardware market with extreme performance and SEO efficiency.

## Quick Start

### Installation

```bash
# Install dependencies
bun install

# Run development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Maintenance & Automation

CleverPrices is powered by an automated **Maintenance Engine** (GitHub Actions) that ensures data is always fresh:

- **Hourly Updates**: Every hour on the hour (`0 * * * *`), the maintenance workflow runs.
- **Price Updates**: Uses **Dynamic Scaling** (300-1000 items) based on token budget. Captures the "Daily Low" for long-term charts.
- **Product Enrichment**: Multi-source engine (Icecat, eBay, Intel) back-fills high-quality technical specs. Uses **Smart Sinking** to maintain variant accuracy across ASIN families.
- **Cache Warming**: Automatically triggers a `warm-cache` script after updates to ensure 100ms response times for users.
- **Persistent Local DB**: All maintenance scripts connect directly to the local SQLite database mounted as a Docker volume.

To run maintenance tasks manually:

```bash
# Update prices (Hourly batch)
bun run update-prices

# Push local data to production (Safe Hot-Swap)
bun run db:push-prod

# Sync production data to local for debugging
bun run db:pull-prod

# Warm the Next.js cache manually
bun run warm-cache

# Local Worker (Optional/Debug)
bun run worker:run
```

---

## 🏎️ Database & Algorithm Performance

CleverPrices uses a highly optimized data layer to ensure sub-100ms response times on dedicated self-hosted infrastructure:

- **O(1) Data Lookups** - Core detail pages and metadata now use pure indexed lookups. Identity repair is deferred to high-complexity UI states (Variant Picker/Hub), ensuring <50ms DB time for the main render.
- **Request-Level Deduplication** - Uses `react.cache` to deduplicate product resolution between metadata generation and page rendering, cutting effective database load by 50% for every SEO crawler hit.
- **Efficient Indexing** - Custom SQL indexes on `sales_rank`, `created_at`, `country`, and `productId` ensure instantaneous sorting and filtering.
- **Map-Based Joins (O(N))** - Replaced O(N²) nested loops in identity systems with hash-map based consensus logic, reducing algorithmic complexity from quadratic to linear.
- **Parallel Flat Bulk** - Collapses thousands of individual history updates into parallelized waves. This maximizes bandwidth while staying under LibSQL's 32k parameter limit, reducing sync time from minutes to seconds.
- **SQLite Resilience** - Implements a `withRetry` logic with exponential backoff and `PRAGMA busy_timeout = 5000` to handle concurrent write locks gracefully.
- **FTS5 Full-Text Search** - Uses SQLite's native virtual tables for ultra-fast product prefix matching.
- **Atomic Migrations** - Dedicated `db:migrate` scripts ensure schema consistency.

---

## ⚡ Built for Speed (Self-Hosted)

CleverPrices is architected for maximum performance and efficiency, running on **Hetzner Cloud (Dokploy)**:

- **Zero Cold Starts** - Unlike Serverless (Vercel/Netlify), the application runs in a persistent Docker container. The database connection stays warm, and response times are consistently fast (50-100ms).
- **Embedded Database (NVMe)** - The SQLite database (`lite.db`) is mounted directly from the server's NVMe SSD into the container. This eliminates network latency entirely for read operations.
- **Server Components & Caching** - Category grids and cards are 100% Server Components. This reduced client-side JavaScript by ~80% and allows for aggressive caching.
- **Tiered ISR (Revalidation)** - Distinct revalidation cycles for different data (e.g., 6h for Products, 11h for Categories, 24h for Static pages) balance data freshness with compute efficiency.
- **Native CSS Carousels** - No heavy JS libraries for sliders. Uses native browser `scroll-snap` for smooth 60fps scrolling with zero initial delay.
- **Amazon CDN Offloading** - Uses a custom Image Loader to request exact-sized images and custom quality levels directly from Amazon. Zero server-side resizing costs or latency.

---

## Key Features

- **German Market Focus** - Optimized for DE hardware pricing with support for unit price analysis (e.g., € per TB).
- **SEO & Redirects** - Automatic redirects for legacy country URLs (US, UK, CA, FR, ES, IT).
- **High Performance Caching** - Utilizes Next.js 16 "use cache" directive and Cache Components for extreme speed.
- **Image Optimization** - Custom URL-based transformation (Size & Quality).
- **React Compiler** - Fully optimized with React 19 Compiler for minimal re-renders.
- **URL-Based Filter State** - Shareable, bookmarkable filtered views using [nuqs](https://nuqs.47ng.com/).
- **Modern MDX Blog** - Content-driven blog system using MDX with frontmatter support.

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (landing)/         # Homepage (Root)
│   ├── [categorySlug]/    # Dynamic Category routes
│   ├── p/[slug]/          # Dynamic Product routes
│   ├── blog/              # MDX Blog system
│   ├── api/               # API routes
│   └── layout.tsx         # Global root layout
│
├── components/            # React components
│   ├── category/         # Idealo-style grids, cards, filters
│   ├── landing/          # Homepage specific sections
│   ├── layout/           # Navbar, Footer
│   └── ui/               # Primary UI components
│
├── lib/                   # Utilities and configuration
│   ├── categories.ts     # Category definitions and unit logic
│   ├── server/           # Server-only logic (caching, scoring)
│   └── countries.ts      # Legacy country config & redirects
│
└── db/                    # Database schema and client (Local SQLite)
```

---

## URL Structure

```
/                # Homepage
/hard-drives     # Category views
/p/[slug]        # Product details
/blog/[slug]     # Blog posts
```

---

## Documentation

- **[PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)** - Key features, architecture, and edge cases.
- **[WORKER.md](docs/WORKER.md)** - Maintainance, price updates, and cloud sync.
- **[image-optimization.md](docs/image-optimization.md)** - Custom Amazon CDN optimization strategy.

---

## Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Cache Components)
- **Engine**: [React 19](https://react.dev/) (React Compiler enabled)
- **Database**: [SQLite](https://sqlite.org/) (Local-first persistence)
- **Data Source**: [Keepa API](https://keepa.com/) (Amazon price data)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Package Manager**: [Bun](https://bun.sh/)

---

## About this repository

This project powers **cleverprices.com** and is published as a professional portfolio project. The source code is NOT licensed for commercial use or redistribution.
