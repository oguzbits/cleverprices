# Project Features Analysis

## 🤖 AGENT PROTOCOL (MANDATORY)

Before writing any code or answering architecture questions, you MUST:

1.  **Read this file (`PROJECT_CONTEXT.md`)** completely.
2.  **Search `docs/`** for relevant feature guides (e.g., `architecture/STABILITY_GUIDE.md`).
3.  **Check `.agent/skills/`** for technical patterns (e.g., `modern-seo`, `drizzle-orm`) using `list_dir`.
4.  **Query MCPs**: Use `mcp_context7` or `mcp_dokploy` for library/platform specifics if unsure.

---

## Core Architecture

- **Framework**: Next.js 16 (App Router) with React 19 Compiler.
- **Styling**: Tailwind CSS 4 with `shadcn/ui` components.
- **State**: URL-based state management via native Next.js hooks.
- [x] **Database**: Local SQLite with Drizzle ORM.
- [x] **Price Consistency**: Strict Tiered TTL Policy (Pages: 20m, Data: 5m). See **[CACHE_POLICY.md](architecture/CACHE_POLICY.md)**.
- [x] **Data Source**: Keepa API (Primary) for automated price tracking.
- [x] **Performance**: Fully memory-mapped DB (256MB) + Next.js `cacheComponents` + **O(1) Detail Fetching** + **Request-Level Deduplication**.

## 🚨 STRICT TECH CONSTRAINTS (DO NOT VIOLATE)

### 1. React 19 Compiler

- **FORBIDDEN**: `useMemo`, `useCallback`, `React.memo`.
- **REASON**: The compiler handles memoization automatically. Using them adds overhead and noise.
- **EXCEPTION**: Only if strictly necessary for referential equality in context providers (rare).

### 2. Next.js 16 Pattern Overrides

- **FORBIDDEN**: `middleware.ts` for routing/rewrites.
- **REQUIRED**: Use `proxy.ts` (or strict server-side logic) for routing/rewrites where applicable.
- **FORBIDDEN**: `getStaticProps`, `getServerSideProps`.
- **REQUIRED**: App Router usage ONLY (`page.tsx`, `layout.tsx`, `generateStaticParams`).
- **REQUIRED**: Use `react.cache()` for request-level deduplication of shared data fetching logic (e.g., `resolveProductFromRoute`).

### 3. Server Components

- **DEFAULT**: All components are Server Components by default.
- **CONSTRAINT**: Only add `"use client"` if using `useState`, `useEffect`, or event handlers. Do NOT add it "just in case".

### 4. Operational Rules (AI & User)

- **NO IMAGE GENERATION**: Do NOT generate any images for this project using DALL-E or any other image generation tool. The user will provide all necessary images manually.
- **Placeholder Images**: Do not overwrite existing images with placeholders unless explicitly instructed.

## Implementation Details

### 1. Data & Database Architecture

- **Database**: SQLite hosted locally on the server via Dokploy Persistent Volumes.
- **Schema**:
  - `products`: Core product data (ASIN, GTIN, MPN, clean specs, timestamps).
  - `prices`: Current prices per country (Amazon, New, Used).
  - `price_history`: Historical price points for charts.
- **Enrichment Buckets (Products table)**:
  - `official_specifications`: Validated technical data from Icecat/eBay/Intel.
  - `ebay_raw_data`: Full raw JSON snapshots from eBay API for future "mass remapping" and data analysis.
  - `keepa_features`: Raw Amazon description bullets.
- **Sync Strategy**:
  - **Automated Engine**: GitHub Action (`daily-maintenance.yml`) runs **hourly**.
  - **Price Refresh**: Batches of 500 products (stale-first) per hour.
  - **Multi-Source Enrichment**:
    - **Icecat**: Primary authority for technical sheets.
    - **eBay Browse API**: Secondary authority; uses GTIN and smart keyword matching. (Raw eBay results are stored as snapshots).
    - **Smart Sinking**: Invariant specs (Brand, Model, CPU Family) are automatically propagated from "Lead" variants to all siblings via `scripts/enrichment/smart-variant-syncer.ts`.
  - **Bulk Data Safety**: Implements manual chunking for large inserts to stay within SQLite parameter limits.
  - **Cache Warming**: Automated warm-up of Next.js "use cache" layers after every sync.
  - **Dokploy Persistence**: Uses a Docker volume mount at `/app/data` for the database.
- **O(1) Data Path**: Product detail pages use indexed lookups by Numeric ID. Consensus/Identity repair is deferred to the variant picker UI only.

### 1.1 Data Ingestion (Import Logic)

- **Source**: CSV exports from Keepa (Sales Rank < 30k, filtered).
- **Categorization Logic**: The `script/import-from-csv.ts` script uses a strict priority system to clean Amazon's messy data:
  1.  **Pre-Flight**: Global title overrides (e.g. Soundbars, SSD Cases, Cables) to fix common errors.
  2.  **Subcategory**: Exact match on Amazon's `Categories: Sub` field (Highest confidence).
  3.  **Type**: Maps Amazon's `Type` field (e.g. `VIDEO_GAME_CONSOLE`) to internal slugs.
  4.  **Tree**: Parsed `Categories: Tree` path with context-aware logic (e.g. distinguishing Internal HDDs from SSDs).
  5.  **Title Fallback**: Last resort simple regex for obvious products.
- **Validation**: Run `bun run scripts/validate-categories.ts` to audit the database for cross-category pollution.

### 2. Localization & Routing

- **Primary Market**: Germany (`de`).
- **Structure**:
  - `(de)`: German-specific static pages (Impressum, Datenschutz).
  - `[country]`: Dynamic routing for other supported markets (future).
  - **Routes**:
    - `/`: Homepage (Germany default).
    - `/p/[slug]`: Product detail page.
    - `/[categorySlug]`: Category browsing.
- **Canonical**: `cleverprices.com` (Germany).

### 3. Category System (`src/lib/categories.ts`)

- **Structure**: Flat object `allCategories` with `parent` pointers for hierarchy.
- **Data**: Includes slugs, icons, unit types (TB, GB, W), and SEO metadata.
- **Components**:
  - `CategoryNav`: Main navigation bar.
  - `FilterPanel`: Dynamic filters based on category type.

### 4. Search Functionality (`SearchModal.tsx`)

- **Type**: Ultra-fast, minimalist live search using TanStack Query and Server Actions.
- **Engine**: SQLite FTS5 for product search + `TOP_BRANDS` Fast Path for categories.
- **Optimizations**:
  - **Fast Path**: Hardcoded mapping for 30+ top brands (Samsung, Apple, ASUS, etc.) to skip DB reads for common category browsing.
  - **Server-Side Caching**: Uses Next.js `unstable_cache` (1-hour TTL) to share search results across users, making repeated searches free.
  - **Smart Read Management**: Skips dynamic brand mapping for multi-word queries; prioritizes indexed category lookups.
  - **Strict Limits**: Hard-capped at 10 results (desktop) and 6 results (mobile) to ensure O(1) rendering time and no scrolling.
- **UI Design**: Text-only, high-hierarchy layout (bold titles + light breadcrumbs). No icons or prices to minimize visual noise and payload size.
- **State**: Debounced input (300ms) with client-side caching (60s).

### 5. Blog System

- **Format**: MDX files with frontmatter.
- **Location**: `src/app/blog/[slug]`.

### 6. Analytics & SEO

- **Analytics**: Web Analytics (Cookieless).
  - **Sitemap Indexing & Migration (Active Phase)**:
    - **Current Goal**: Fix GSC "Stale URL" issues (urls from 30+ days ago).
    - **Strategy**: **Tactical Flooding**. Temporarily include `scavenged` products and `generic` slugs in the sitemap to force Googlebot to discover the new structure.
    - **Redirect Policy**: All legacy/alias redirects MUST use `permanentRedirect` (301) to transfer authority.
    - **Status**: ~7,000 URLs in sitemap (Expanded from ~1,900).
  - JSON-LD structured data for products.
  - German-optimized metadata.

## Critical Edge Cases

1.  **Product Sync Limitations**:
    - Keepa API has a strict daily token limit (28,800 tokens).
    - **Mitigation**: `TokenTracker` prevents overage; sync runs chronologically.

2.  **Affiliate Compliance**:
    - Prices must be labeled with "Stand: [Date]" (updated daily).
    - Affiliate links use `rel="nofollow sponsored"`.
    - Star ratings must match Amazon's data.

3.  **Route Ambiguity**:
    - Top-level categories (e.g., `/electronics`) share namespace with top-level pages.
    - **Handling**: `generateStaticParams` ensures collisions are detected at build time.

## Safe Extension Guide (How to not break things)

### Adding a New Category

1.  **Edit `src/lib/categories.ts`**:
    - Add entry to `allCategories`.
    - **Critical**: Ensure `unitType` is consistent with parent if applicable.
    - **Route**: No new file needed. `[categorySlug]` handles it automatically.

### Modifying Data Sync

1.  **Edit `src/lib/keepa/sync-service.ts`**:
    - To add new fields: Update `upsertProductFromKeepa` AND Drizzle schema.
    - **Migration**: Run `bun run db:push` after schema changes.

### UI/Component Updates

- **Server vs Client**: Product pages are cached Server Components.
- **Interactive**: Search/Filters use native `useSearchParams` and `useRouter` for URL state.
- **URL State**: When adding filters, use the `useFilters` hook from `src/lib/hooks/use-filters.ts`. Do NOT use standard `useState` for things that should be shareable.

## Scalability & Algorithmic Guarantees

The system is architected to scale to millions of products and hundreds of variants per family without degrading performance:

### 1. Database Scaling (Product Volume)

- **O(log N) Lookups**: All product resolution (ID-based and Slug-based) uses B-Tree indexes. Fetching a product from 10,000 rows takes the same ~1ms as fetching from 1,000,000 rows.
- **Memory-Mapped I/O**: The SQLite database is memory-mapped (PRAGMA mmap_size), effectively serving common lookups from RAM.

### 2. Variant Scaling (Family Density)

- **Quadratic to Linear ($O(N)$)**: Identity consensus logic now runs in linear time. Adding a new color or size variant to an iPhone family only adds a single iteration to the processing loop, rather than re-calculating the entire family tree for every item.
- **Constant Time ($O(1)$) Direct Path**: Metadata and SEO routes skip the variant family logic entirely. This ensures that even "Monster Families" (e.g., cables with 500 length/color combinations) generate metadata in <10ms.

### 3. Request Deduplication

- **React Cache Boundary**: Shared resolution logic is wrapped in `react.cache`. If 10 components on a page need product data, the database is queried exactly **once**.

## Documentation Protocol (CRITICAL)

1.  **Single Source of Truth**: Keep `PROJECT_CONTEXT.md` and `README.md` updated as the primary reference.
2.  **Update on Change**: If you add a feature, library, API, or change architecture, you MUST update `PROJECT_CONTEXT.md` in the _same turn_.
3.  **Planning Sync**: Keep `.planning` documents (like `MULTI_SOURCE_STRATEGY.md`) in sync with implementation.
4.  **No "Stale" Context**: Do not rely on conversation history alone; check docs first. Updated docs = Finished Task.
