# BestPrices.today - Project Context

## Project Overview

**BestPrices.today** is a price comparison platform focused on the **"Price per Unit"** metric. Unlike traditional price trackers that focus on the total price, this project aims to help users find the best value by calculating and sorting products based on their unit price (e.g., $ per TB for hard drives, $ per load for detergent).

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
  - `page.tsx`: Homepage with hero section, categories, and stats.
  - `categories/page.tsx`: List of all product categories.
  - `categories/[slug]/page.tsx`: The main product listing page. Contains the product table, sidebar filters, and sorting logic.
- **`src/components/ui`**: Reusable UI components from shadcn/ui (Button, Card, Sheet, etc.).
- **`src/lib`**: Utility functions and mock API definitions.
  - `amazon-api.ts`: Mock implementation of the Amazon Product Advertising API (PA-API).

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

- **Local state**: Use `useState` for component-level state
- **Filtering/Sorting**: Keep state in the page component, pass down as props
- **Future**: Plan to migrate to URL search params for shareable state

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

### Filter Pattern

```tsx
const [selectedItems, setSelectedItems] = useState<string[]>([]);
const toggleFilter = (setter: Function, value: string) => {
  setter((prev: string[]) =>
    prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
  );
};
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
