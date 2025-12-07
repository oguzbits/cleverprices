# RealPriceData

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

### Build for Production

```bash
bun run build
bun run start
```

---

## Key Features

- **Country-Specific Routing** - Automatic country detection with 11 supported markets
- **URL-Based Filter State** - Shareable, bookmarkable filtered views using [nuqs](https://nuqs.47ng.com/)
- **Analytics Tracking** - Comprehensive user behavior tracking with Vercel Analytics
- **SEO Optimized** - Hierarchical URLs, breadcrumbs, structured data
- **Type-Safe** - Full TypeScript support throughout
- **Modern Stack** - Next.js 16, React 19, Tailwind CSS 4

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── [country]/         # Country-specific routes
│   ├── layout.tsx         # Root layout
│   └── sitemap.ts         # Auto-generated sitemap
│
├── components/            # React components
│   ├── layout/           # Navbar, Footer
│   ├── ui/               # shadcn/ui components
│   └── ...               # Feature components
│
├── lib/                   # Utilities and configuration
│   ├── categories.ts     # Category definitions
│   ├── countries.ts      # Country configuration
│   └── analytics.ts      # Analytics tracking
│
├── hooks/                 # Custom React hooks
│   ├── use-country.ts    # Country management
│   └── use-product-filters.ts  # Filter state (nuqs)
│
└── providers/             # Context providers
    └── nuqs-provider.tsx # URL state management
```

---

## Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: [nuqs](https://nuqs.47ng.com/) (URL-based)
- **Analytics**: [Vercel Analytics](https://vercel.com/analytics)
- **Package Manager**: [Bun](https://bun.sh/)

---

## URL Structure

```
/{country}/{parent}/{category}

Examples:
/us/electronics/hard-drives
/de/groceries/protein-powder
/uk/home/laundry-detergent
```

See [ROUTING.md](ROUTING.md) for complete details.

---

## Documentation

- **[PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)** - Project overview, architecture, and coding conventions
- **[ROUTING.md](ROUTING.md)** - URL structure and country-based routing
- **[NUQS.md](NUQS.md)** - URL state management with nuqs
- **[ANALYTICS.md](ANALYTICS.md)** - Analytics tracking and SEO optimization
- **[SPEED_INSIGHTS_SETUP.md](SPEED_INSIGHTS_SETUP.md)** - Performance monitoring
- **[HERO_DEMO_LOCALIZATION.md](HERO_DEMO_LOCALIZATION.md)** - Hero demo table localization
- **[COMMUNITY_FEATURES_PLAN.md](COMMUNITY_FEATURES_PLAN.md)** - Future feature planning

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

### Adding Analytics Tracking

```tsx
import { trackSEO } from "@/lib/analytics";

// Track category view
trackSEO.categoryView("hard-drives", "us");

// Track affiliate click
trackSEO.affiliateClick({
  productName: "Samsung 990 PRO",
  category: "hard-drives",
  country: "us",
  price: 189.99,
});
```

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

Private project.

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [nuqs Documentation](https://nuqs.47ng.com/)
- [Vercel Analytics Documentation](https://vercel.com/docs/analytics)
