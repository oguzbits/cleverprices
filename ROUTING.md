# Routing & URL Structure

Complete guide to RealPriceData's country-based, hierarchical URL structure.

## URL Pattern

```
/{country}/{parent}/{category}
```

### Examples

```
/us/electronics/hard-drives
/de/groceries/protein-powder
/uk/home/laundry-detergent
```

---

## URL Hierarchy

```
realpricedata.com
│
├── / (Homepage - redirects to country)
│
├── /[country] (Country Homepage)
│   ├── /us
│   ├── /de
│   └── /uk
│
├── /[country]/categories (Category Browser)
│   ├── /us/categories
│   ├── /de/categories
│   └── /uk/categories
│
├── /[country]/[parent] (Parent Category)
│   ├── /us/electronics
│   ├── /us/groceries
│   └── /us/home
│
└── /[country]/[parent]/[category] (Product Listing)
    ├── /us/electronics/hard-drives
    ├── /us/groceries/protein-powder
    └── /us/home/laundry-detergent
```

---

## Category Structure

### Parent Categories (3 groups)

- **Electronics** - Digital storage and tech accessories
- **Groceries** - Food items and beverages
- **Home** - Home cleaning and maintenance products

### Child Categories (12 products)

**Electronics:**

- Hard Drives & SSDs
- USB Drives
- MicroSD Cards
- Batteries

**Groceries:**

- Coffee
- Protein Powder
- Rice & Pasta
- Snacks

**Home:**

- Laundry Detergent
- Paper Products
- Trash Bags
- Dishwasher Tabs
- Diapers

---

## Country Detection

### How It Works

```
User visits site
↓
Check URL for country code (/us, /de, etc.)
↓
If found: Use URL country
If not: Check localStorage
↓
If found: Use saved preference
If not: Detect from browser (navigator.language)
↓
Save preference to localStorage
↓
Display content for that country
```

### Supported Countries

| Country        | Code | Currency | Locale | Status         |
| -------------- | ---- | -------- | ------ | -------------- |
| United States  | `us` | USD      | en-US  | ✅ Live        |
| United Kingdom | `uk` | GBP      | en-GB  | 🔜 Coming Soon |
| Canada         | `ca` | CAD      | en-CA  | 🔜 Coming Soon |
| Germany        | `de` | EUR      | de-DE  | 🔜 Coming Soon |
| Spain          | `es` | EUR      | es-ES  | 🔜 Coming Soon |
| Italy          | `it` | EUR      | it-IT  | 🔜 Coming Soon |
| France         | `fr` | EUR      | fr-FR  | 🔜 Coming Soon |
| Australia      | `au` | AUD      | en-AU  | 🔜 Coming Soon |
| Sweden         | `se` | SEK      | sv-SE  | 🔜 Coming Soon |
| Ireland        | `ie` | EUR      | en-IE  | 🔜 Coming Soon |
| India          | `in` | INR      | en-IN  | 🔜 Coming Soon |

---

## File Structure

```
src/
├── app/
│   ├── [country]/
│   │   ├── page.tsx                    # Country homepage
│   │   ├── categories/
│   │   │   └── page.tsx                # Category browser
│   │   └── [parent]/
│   │       ├── page.tsx                # Parent category page
│   │       └── [category]/
│   │           └── page.tsx            # Product listing page
│   ├── page.tsx                        # Root homepage
│   └── sitemap.ts                      # Auto-generated sitemap
│
├── lib/
│   ├── categories.ts                   # Category configuration
│   └── countries.ts                    # Country configuration
│
├── hooks/
│   └── use-country.ts                  # Country management hook
│
└── components/
    ├── breadcrumbs.tsx                 # Breadcrumb component
    └── country-selector.tsx            # Country dropdown
```

---

## Usage

### Get Current Country

```tsx
import { useCountry } from "@/hooks/use-country";

function MyComponent() {
  const { country, currentCountry, changeCountry } = useCountry();

  // country: 'us'
  // currentCountry: { code: 'us', name: 'United States', currency: 'USD', ... }
  // changeCountry('de') - switches to Germany
}
```

### Generate Category URLs

```tsx
import { getCategoryPath } from "@/lib/categories";

// With country
const url = getCategoryPath("hard-drives", "us");
// Returns: /us/electronics/hard-drives

// Without country (uses default)
const url2 = getCategoryPath("hard-drives");
// Returns: /electronics/hard-drives
```

### Create Links

```tsx
import { getCategoryPath } from "@/lib/categories";
import Link from "next/link";

<Link href={getCategoryPath("hard-drives", "us")}>Hard Drives</Link>;
```

### Add Breadcrumbs

```tsx
import {
  Breadcrumbs,
  BreadcrumbStructuredData,
} from "@/components/breadcrumbs";
import { getBreadcrumbs, getCategoryPath } from "@/lib/categories";

const breadcrumbItems = [
  { name: "Home", href: "/" },
  { name: "Categories", href: `/${country}/categories` },
  ...getBreadcrumbs(categorySlug).map((cat) => ({
    name: cat.name,
    href: getCategoryPath(cat.slug, country),
  })),
];

<>
  <BreadcrumbStructuredData items={breadcrumbItems} />
  <Breadcrumbs items={breadcrumbItems} />
</>;
```

### Add Country Selector

```tsx
import { CountrySelector } from "@/components/country-selector";

<CountrySelector />;
```

---

## Adding New Categories

Edit `/src/lib/categories.ts`:

```typescript
export const allCategories: Record<string, Category> = {
  // ... existing categories

  "your-new-category": {
    name: "Your New Category",
    slug: "your-new-category",
    description: "Description here",
    icon: YourIcon,
    parent: "electronics", // or "groceries" or "home"
    unitType: "TB", // e.g., "TB", "kg", "count", "load"
    metaTitle: "SEO Title",
    metaDescription: "SEO Description",
  },
};
```

The route automatically works at: `/{country}/{parent}/your-new-category`

---

## URL Examples

### Basic URLs

| Page Type       | URL                           | Description             |
| --------------- | ----------------------------- | ----------------------- |
| Homepage        | `/`                           | Main landing page       |
| Country Home    | `/us`                         | US homepage             |
| Category Hub    | `/us/categories`              | All categories overview |
| Parent Category | `/us/electronics`             | Electronics overview    |
| Product Listing | `/us/electronics/hard-drives` | Hard drive products     |

### With Filters (Query Parameters)

```
/us/electronics/hard-drives?condition=New&technology=SSD&sortBy=pricePerTB&sortOrder=asc
```

### User Journey Example

```
1. User lands on homepage
   URL: /

2. System detects country (US)
   URL: /us

3. Clicks "Browse Categories"
   URL: /us/categories

4. Clicks "Electronics" section
   URL: /us/electronics

5. Clicks "Hard Drives & SSDs"
   URL: /us/electronics/hard-drives

6. Applies filters (condition=new, sort by price/TB)
   URL: /us/electronics/hard-drives?condition=New&sortBy=pricePerTB&sortOrder=asc
```

---

## SEO Optimization

### Breadcrumb Example

```
Home > United States > Electronics > Hard Drives & SSDs
  /         /us        /electronics    /hard-drives
```

### Hreflang Tags

Add to your layout or sitemap:

```tsx
<link
  rel="alternate"
  hreflang="en-us"
  href="https://realpricedata.com/us/electronics/hard-drives"
/>
<link
  rel="alternate"
  hreflang="de-de"
  href="https://realpricedata.com/de/electronics/hard-drives"
/>
<link
  rel="alternate"
  hreflang="en-gb"
  href="https://realpricedata.com/uk/electronics/hard-drives"
/>
<link
  rel="alternate"
  hreflang="x-default"
  href="https://realpricedata.com/us/electronics/hard-drives"
/>
```

### URL Best Practices

✅ **Good URLs:**

- `/us/electronics/hard-drives`
- `/de/groceries/protein-powder`
- `/uk/home/laundry-detergent`

❌ **Avoid:**

- `/categories/storage` (old pattern, no country)
- `/cat/hdd` (too short, not descriptive)
- `/us/electronics/hard-drives/new/4tb` (filters in path, use query params)

---

## Design Decisions

### Why This Structure?

1. **Country-first** - Clear geographic targeting for SEO
2. **Two-level hierarchy** - Simple but scalable (parent → category)
3. **Query params for filters** - Prevents duplicate content
4. **Centralized config** - Single source of truth in `categories.ts`
5. **Type-safe** - Full TypeScript support catches errors at compile time

### Future Extensibility

Easy to add third level if needed:

```
Current:  /us/electronics/hard-drives
Future:   /us/electronics/hard-drives/external
          /us/electronics/hard-drives/internal
```

Or product detail pages:

```
/us/electronics/hard-drives/samsung-990-pro-2tb
```

---

## Performance Impact

**Minimal** - approximately 0-10ms:

- ✅ Client-side detection (no server calls)
- ✅ localStorage is instant
- ✅ No IP lookup needed
- ✅ Runs only on mount

---

## Helper Functions

### From `/src/lib/categories.ts`

- `getCategoryPath(slug, country?)` - Get full URL for a category
- `getBreadcrumbs(slug)` - Get breadcrumb trail
- `getCategoryHierarchy()` - Get organized category tree
- `getParentCategory(slug)` - Get parent of a category
- `getChildCategories(parentSlug)` - Get children of a parent
- `getCategoryBySlug(slug)` - Get category by slug

### From `/src/lib/countries.ts`

- `getUserCountry()` - Get user's country (from localStorage or browser)
- `saveCountryPreference(code)` - Save country to localStorage
- `isValidCountryCode(code)` - Validate country code
- `getCountryByCode(code)` - Get country object by code

---

## Sitemap

The sitemap automatically includes:

- All country homepages (priority: 1.0)
- All category hubs (priority: 0.9)
- All parent categories (priority: 0.8)
- All child categories (priority: 0.9)
- Static pages (priority: 0.8)

View at: `https://realpricedata.com/sitemap.xml`

---

## Testing

```bash
# Build the project
npm run build

# Start production server
npm run start

# Test URLs:
http://localhost:3000/us
http://localhost:3000/us/categories
http://localhost:3000/us/electronics
http://localhost:3000/us/electronics/hard-drives
http://localhost:3000/de/groceries/protein-powder
```

---

## Key Features

- ✅ **SEO-optimized** - Hierarchical, keyword-rich URLs
- ✅ **User-friendly** - Clear, descriptive paths
- ✅ **Country-aware** - Automatic detection and persistence
- ✅ **Extensible** - Easy to add categories and countries
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Automatic sitemap** - No manual updates
- ✅ **Breadcrumb support** - Built-in with structured data
- ✅ **Future-proof** - Designed for growth

---

## Project Files

- **Category Config**: [categories.ts](file:///Users/oguz/Desktop/Dev/realpricedata/src/lib/categories.ts)
- **Country Config**: [countries.ts](file:///Users/oguz/Desktop/Dev/realpricedata/src/lib/countries.ts)
- **Country Hook**: [use-country.ts](file:///Users/oguz/Desktop/Dev/realpricedata/src/hooks/use-country.ts)
- **Breadcrumbs**: [breadcrumbs.tsx](file:///Users/oguz/Desktop/Dev/realpricedata/src/components/breadcrumbs.tsx)
- **Country Selector**: [country-selector.tsx](file:///Users/oguz/Desktop/Dev/realpricedata/src/components/country-selector.tsx)
- **Sitemap**: [sitemap.ts](file:///Users/oguz/Desktop/Dev/realpricedata/src/app/sitemap.ts)
