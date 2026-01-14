# Project Features Analysis

## Core Architecture

- **Framework**: Next.js 16 (App Router) with React 19 Compiler.
- **Styling**: Tailwind CSS 4 with `shadcn/ui` components.
- **State**: URL-based state management via `nuqs`.
- **Database**: Turso (SQLite) with Drizzle ORM.
- **Data Source**: Keepa API (Primary) for automated price tracking.
- **Performance**: Uses Next.js 16 `cacheComponents` ("use cache") and `experimental.optimizePackageImports`.

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

### 3. Server Components

- **DEFAULT**: All components are Server Components by default.
- **CONSTRAINT**: Only add `"use client"` if using `useState`, `useEffect`, or event handlers. Do NOT add it "just in case".

### 4. Operational Rules (AI & User)

- **NO IMAGE GENERATION**: Do NOT generate any images for this project using DALL-E or any other image generation tool. The user will provide all necessary images manually.
- **Placeholder Images**: Do not overwrite existing images with placeholders unless explicitly instructed.

## Implementation Details

### 1. Data & Database Architecture

- **Database**: SQLite (Turso) hosted at the edge.
- **Schema**:
  - `products`: Core product data (ASIN, GTIN, MPN, specs, timestamps).
  - `prices`: Current prices per country (Amazon, New, Used).
  - `price_history`: Historical price points for charts.
- **Sync Strategy**:
  - **Worker**: `bun run worker` (Keepa API) - Locally hosted on Mac, runs continuously with auto-restart.
  - **Cloud Sync**: `bun run db:deploy` (Turso) - Pushes local SQLite state to production cloud.
  - **Automation**: Managed via local `crontab` (4 AM/PM syncs, 3 AM backups).
  - **Reference**: See `docs/WORKER.md` for full operational details.
  - **Token Management**: 20 tokens/min bucket logic; managed by `TokenTracker`.

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

- **Type**: Client-side modal with keyboard shortcuts (`Cmd+K`).
- **Behavior**: Real-time filtering of categories and products.

### 5. Blog System

- **Format**: MDX files with frontmatter.
- **Location**: `src/app/blog/[slug]`.

### 6. Analytics & SEO

- **Analytics**: Vercel Analytics and Speed Insights.
- **SEO**:
  - Automated `sitemap.xml`.
  - Proper `robots.txt`.
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
- **Interactive**: Search/Filters use `nuqs` (Client Side) for URL state.
- **Nuqs**: When adding filters, use `useQueryState` from `nuqs`. Do NOT use standard `useState` for things that should be shareable.

## Documentation Protocol (CRITICAL)

1.  **Single Source of Truth**: Keep `PROJECT_CONTEXT.md` and `README.md` updated as the primary reference.
2.  **Update on Change**: If you add a feature, library, API, or change architecture, you MUST update `PROJECT_CONTEXT.md` in the _same turn_.
3.  **Planning Sync**: Keep `.planning` documents (like `MULTI_SOURCE_STRATEGY.md`) in sync with implementation.
4.  **No "Stale" Context**: Do not rely on conversation history alone; check docs first. Updated docs = Finished Task.
