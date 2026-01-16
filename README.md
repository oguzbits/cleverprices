# CleverPrices

Price comparison platform focused on the **Price per Unit** metric. Find the best value by comparing products based on their unit price (e.g., $ per TB for hard drives, $ per load for detergent).

## Quick Start

### Installation

```bash
# Install dependencies
bun install

# Run development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Maintenance

```bash
# Linting
bun run lint

# Formatting
bun run format
```

### Build for Production

```bash
# Full build and start
bun run build
bun run start
```

---

## Key Features

- **Country-Specific Routing** - Automatic country detection with 7 supported markets (US, UK, CA, DE, ES, IT, FR)
- **High Performance Caching** - Utilizes Next.js 16 "use cache" directive and Cache Components for extreme speed
- **React Compiler** - Fully optimized with React 19 Compiler for minimal re-renders
- **URL-Based Filter State** - Shareable, bookmarkable filtered views using [nuqs](https://nuqs.47ng.com/)
- **Analytics & SEO** - Vercel Analytics tracking, hierarchical URLs, breadcrumbs, and structured data
- **Modern MDX Blog** - Content-driven blog system using MDX with frontmatter support
- **Type-Safe** - Full TypeScript support throughout the stack

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (en)/              # English-specific static routes (FAQ, specialized pages)
│   ├── (de)/              # German-specific static routes (Legal pages)
│   ├── (localized)/       # Dynamic country-based routes [country]
│   │   └── [country]/     # Marketplace specific views
│   ├── layout.tsx         # Global root layout
│   └── sitemap.ts         # Auto-generated multi-country sitemap
│
├── components/            # React components
│   ├── layout/           # Navbar, Footer, PageLayout
│   ├── ui/               # shadcn/ui components
│   └── ...               # Feature components (ProductTable, FilterPanel)
│
├── lib/                   # Utilities and configuration
│   ├── categories.ts     # Category definitions and unit logic
│   ├── countries.ts      # Country/Marketplace configuration
│   └── analytics.ts      # Analytics tracking & SEO methods
│
├── hooks/                 # Custom React hooks
│   ├── use-country.ts    # Country management
│   └── use-product-filters.ts  # Filter state management
│
└── providers/             # Context providers
    └── nuqs-provider.tsx # URL state management
```

---

## Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Cache Components)
- **Engine**: [React 19](https://react.dev/) (React Compiler enabled)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI)
- **Database**: [Turso](https://turso.tech/) (SQLite at the edge)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Data Source**: [Keepa API](https://keepa.com/) (Amazon price data)
- **Content**: [MDX](https://mdxjs.com/) with remark-gfm and frontmatter
- **State Management**: [nuqs](https://nuqs.47ng.com/) (URL-based sync)
- **Analytics**: [Vercel Analytics](https://vercel.com/analytics)
- **Package Manager**: [Bun](https://bun.sh/)

---

## URL Structure

```
/{country}/{parent}/{category}   # Category views
/{country}/blog/{slug}           # Localized blog posts
/faq                             # General FAQ
```

See [ROUTING.md](ROUTING.md) for complete details on the localization strategy.

---

## Documentation

- **[PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)** - Key features, architecture, and edge cases.
- **[NUQS.md](NUQS.md)** - URL state management with nuqs

---

## Development

### Adding a New Category

Edit `src/lib/categories.ts`:

```typescript
export const allCategories: Record<string, Category> = {
  "your-category": {
    name: "Your Category",
    slug: "your-category",
    description: "Description",
    icon: YourIcon,
    parent: "electronics", // or "groceries" or "home"
    unitType: "TB",
    metaTitle: "SEO Title",
    metaDescription: "SEO Description",
  },
};
```

The route automatically works at: `/{country}/{parent}/your-category`

---

### Keepa Integration

The project uses a script-based worker to manage product data, ensuring API limits are respected and data is consistently synchronized.

1.  **Initial Import**:
    - `bun run scripts/import-from-csv.ts`
    - Parses Keepa export CSVs to add high-quality products to the database.

2.  **Maintenance Worker**:
    - `bun run worker:run -c`
    - Runs continuously in the background.
    - **Price Updates**: Every 15 mins.
    - **Cloud Sync**: Every 12 hours (Local -> Turso).
    - **Smart Scheduling**: Auto-sleeps and persists state to `logs/worker-state.json`.

See **[docs/WORKER.md](docs/WORKER.md)** for the complete guide.

---

## Deployment

Deploy to [Vercel](https://vercel.com):

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Analytics and Speed Insights automatically activate on Vercel deployment.

---

## License

Private project – see the [LICENSE](LICENSE) file for details.

---

## About this repository

This project powers **cleverprices.com** and is published publicly as a professional portfolio project.

The source code is available for:

- Code review
- Architectural evaluation
- Learning and discussion

The source code is **not licensed** for:

- Commercial use
- Redistribution
- Deployment
- Derivative works
