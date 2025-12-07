# RealPriceData - Project Context

## Project Overview

**RealPriceData** is a price comparison platform focused on the **"Price per Unit"** metric. Unlike traditional price trackers that focus on the total price, this project aims to help users find the best value by calculating and sorting products based on their unit price (e.g., $ per TB for hard drives, $ per load for detergent).

## Country-Specific Routing

- All main pages are prefixed with `/[country]` (e.g., `/us`, `/de`)
- The homepage for each country is `/[country]` (e.g., `/us`)
- The category browser is at `/[country]/categories` (e.g., `/us/categories`)
- Product pages follow: `/[country]/[parent]/[category]` (e.g., `/us/electronics/hard-drives`)
- Users can switch countries via the navbar dropdown, which updates the URL
- Country preference is saved to localStorage for persistence
- Automatic country detection from browser locale on first visit

## Technology Stack

- **Framework**: [Next.js 16+](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (based on Radix UI)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Package Manager**: `npm`

## Architecture & File Structure

- **`src/app`**: Contains the App Router pages.
  - `page.tsx`: Root homepage (redirects to country)
  - `[country]/page.tsx`: Country-specific homepage
  - `[country]/categories/page.tsx`: Category browser for that country
  - `[country]/[parent]/page.tsx`: Parent category page (e.g., Electronics)
  - `[country]/[parent]/[category]/page.tsx`: Product listing page with filters and sorting
- **`src/components/ui`**: Reusable UI components from shadcn/ui (Button, Card, Sheet, etc.)
- **`src/components`**: Feature components (Navbar, Footer, SearchModal, etc.)
- **`src/lib`**: Utility functions and configuration
  - `categories.ts`: Category definitions and helper functions
  - `countries.ts`: Country configuration and detection logic
  - `analytics.ts`: Analytics tracking utilities
  - `amazon-api.ts`: Mock implementation of Amazon Product Advertising API
- **`src/hooks`**: Custom React hooks
  - `use-country.ts`: Country management and URL synchronization
  - `use-product-filters.ts`: Filter state management with nuqs
- **`src/providers`**: Context providers (NuqsProvider, ThemeProvider)

## Key Features

1.  **Unified Product Listing**: A single dynamic page (`categories/[slug]`) handles product listings.
2.  **Advanced Filtering**:
    - **Desktop**: Sticky sidebar with collapsible sections (Accordion).
    - **Mobile**: Slide-out Sheet with the same filter capabilities.
    - **Filters**: Condition (New/Used), Capacity, Technology, Form Factor.
3.  **Price Analysis**:
    - Automatic calculation of "Price/Unit" (e.g., Price/TB).
    - Sorting by Price/Unit to highlight best value.
4.  **Global Reach**: Visualizes supported countries (Amazon marketplaces) using a 3D Globe component.

## Design System

- **Theme**: Dark mode default.
- **Aesthetic**: Premium, modern, "glassmorphism" effects (backdrop-blur), vibrant accent colors (primary purple/blue), and clean typography.
- **Responsiveness**: Mobile-first approach. Complex tables hide less critical columns on smaller screens.

## Data Model

Currently uses a **Mock API** (`MockAmazonAPI`) that simulates the structure of the official Amazon PA-API 5.0.

- **Product Fields**: ASIN, Title, Price, Image, URL, Category, Capacity, Warranty, Form Factor, Technology, Condition.
- **Affiliate Integration**: Ready for Amazon Associates integration (affiliate links).

## Product Categories

All categories must follow the **"Price per Unit"** principle. Products should be consumables or capacity-based items where unit pricing provides meaningful value comparison.

### Valid Category Examples

- **Storage**: Hard Drives, SSDs, MicroSD Cards, USB Drives (Price per TB/GB)
- **Food**: Protein Powder, Coffee, Rice & Pasta, Snacks (Price per kg/lb/oz)
- **Household**: Laundry Detergent, Paper Products, Trash Bags, Dishwasher Tabs (Price per load/count/sheet)
- **Power**: Batteries (Price per count)

### Invalid Categories

- ❌ Monitors, Processors, Graphics Cards (single-unit electronics)
- ❌ Laptops, Phones, Tablets (indivisible products)
- ❌ Furniture, Appliances (no unit metric)

## Coding Conventions

### Components

- **Always use functional components** with TypeScript interfaces
- **Props**: Define explicit interfaces for all component props
- **Event handlers**: Use arrow functions inline or define as `const`
- **Exports**: Use default exports for pages, named exports for components

### Styling

- **Tailwind-first**: Use Tailwind utility classes for all styling
- **No custom CSS**: Avoid creating separate CSS files unless absolutely necessary
- **Responsive**: Mobile-first approach, use `sm:`, `md:`, `lg:` breakpoints
- **Dark mode**: Default theme is dark, use `dark:` variants where needed
- **shadcn/ui**: Prefer shadcn/ui components over building custom ones

### State Management

- **URL state**: Use `nuqs` for filter state (shareable, bookmarkable)
- **Local state**: Use `useState` for component-level UI state only
- **Country state**: Managed by `useCountry()` hook with localStorage persistence
- **Filter state**: Managed by `useProductFilters()` hook (nuqs-based)

### Performance

- **Images**: Always use `next/image` with proper width/height
- **Lazy loading**: Use dynamic imports for heavy components
- **Memoization**: Use `useMemo` for expensive calculations (e.g., filtered products)

### File Organization

- **Pages**: `src/app/[route]/page.tsx`
- **Components**: `src/components/ui/` for shadcn, `src/components/` for custom
- **Utilities**: `src/lib/` for helpers and API mocks
- **Types**: Define TypeScript interfaces inline or in adjacent `.types.ts` files

## Development Guidelines

### Adding a New Category

1. Add the category to `src/app/page.tsx` (homepage) with appropriate icon
2. Ensure the category has a valid "price per unit" metric
3. Create or update mock data in `src/lib/amazon-api.ts`
4. Update `src/app/categories/page.tsx` to include the new category
5. Test the category page at `/categories/[slug]`

### Adding a New Filter

1. Add state variable to the page component
2. Create the filter UI in the `FilterList` component
3. Update the filter logic in the component (usually a `.filter()` call)
4. Ensure both desktop and mobile views work (same `FilterPanel` component)

### UI/UX Principles

- **Premium feel**: Use glassmorphism, subtle shadows, and smooth animations
- **Consistency**: Reuse shadcn/ui components for uniform appearance
- **Accessibility**: Ensure proper ARIA labels, keyboard navigation
- **Performance**: Keep initial load fast, defer non-critical resources

## Common Patterns

### Filter Pattern (with nuqs)

```tsx
import { useProductFilters } from "@/hooks/use-product-filters";

const { filters, toggleArrayFilter, setSearch, clearAllFilters } =
  useProductFilters();

// Filters are automatically synced with URL
// filters.condition - string[] | null
// filters.search - string
// filters.minCapacity - number | null

// Toggle a filter value
toggleArrayFilter("condition", "New");

// Set search
setSearch("samsung");

// Clear all
clearAllFilters();
```

### Sorting Pattern

```tsx
const [sortConfig, setSortConfig] = useState({
  key: "pricePerTB",
  direction: "asc",
});
const sortedData = useMemo(() => {
  return [...data].sort((a, b) => {
    if (sortConfig.direction === "asc")
      return a[sortConfig.key] - b[sortConfig.key];
    return b[sortConfig.key] - a[sortConfig.key];
  });
}, [data, sortConfig]);
```

## Future Roadmap

- [ ] Replace mock data with real Amazon PA-API integration
- [ ] Implement user authentication for price alerts
- [ ] Add price history charts for individual products
- [ ] Implement URL-based filter state for sharing
- [ ] Add more product categories (pet supplies, office supplies)
- [ ] Multi-country currency conversion
