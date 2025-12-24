# Vercel Analytics Integration

Comprehensive guide for tracking user behavior and optimizing SEO with Vercel Analytics.

## Quick Start

### Installation

```bash
bun add @vercel/analytics
```

### Setup

Add to `/src/app/layout.tsx`:

```tsx
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          <NuqsProvider>
            {children}
            <SpeedInsights />
            <Analytics />
          </NuqsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

## What It Tracks

### Automatic Tracking

- **Page Views** - Every page visit
- **Unique Visitors** - Distinct users (anonymized)
- **Referrers** - Where traffic comes from
- **Geographic Location** - Country/region of visitors
- **Device Types** - Desktop, mobile, tablet
- **Browser Types** - Chrome, Safari, Firefox, etc.
- **Top Pages** - Most visited pages
- **Traffic Sources** - Organic, direct, social, referral

### Custom Events

Track specific user interactions:

```tsx
import { track } from "@vercel/analytics";

// Track product views
track("product_view", {
  category: "hard-drives",
  country: "us",
});

// Track filter usage
track("filter_applied", {
  filter: "condition",
  value: "new",
});

// Track affiliate link clicks
track("affiliate_click", {
  product: "Samsung 990 PRO",
  price: 189.99,
});
```

---

## SEO-Focused Tracking

### Implementation

Create a tracking utility at `/src/lib/analytics.ts`:

```tsx
import { track } from "@vercel/analytics";

export const trackSEO = {
  /**
   * Track category views
   * Shows which categories are most popular
   */
  categoryView: (category: string, country: string) => {
    track("category_view", {
      category,
      country,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Track product views
   * Shows which products generate most interest
   */
  productView: (product: string, category: string, country: string) => {
    track("product_view", {
      product,
      category,
      country,
    });
  },

  /**
   * Track affiliate clicks (most important conversion metric!)
   * Shows ROI of your SEO efforts
   */
  affiliateClick: (params: {
    productName: string;
    category: string;
    country: string;
    price: number;
    pricePerUnit?: number;
    position?: number; // Position in list
  }) => {
    track("affiliate_click", {
      product: params.productName,
      category: params.category,
      country: params.country,
      price: params.price,
      price_per_unit: params.pricePerUnit,
      list_position: params.position,
    });
  },

  /**
   * Track filter usage
   * Shows user intent and helps with content optimization
   */
  filterApplied: (
    filter: string,
    value: string | string[],
    category: string,
  ) => {
    track("filter_applied", {
      filter,
      value: Array.isArray(value) ? value.join(",") : value,
      category,
    });
  },

  /**
   * Track sorting
   * Shows how users prioritize products
   */
  sortChanged: (sortBy: string, order: "asc" | "desc", category: string) => {
    track("sort_changed", {
      sort_by: sortBy,
      order,
      category,
    });
  },

  /**
   * Track country switches
   * Shows geographic interest and internationalization needs
   */
  countryChanged: (from: string, to: string) => {
    track("country_changed", {
      from,
      to,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Track search (if implemented)
   * Shows missing keywords and content gaps
   */
  searchPerformed: (query: string, resultsCount: number, category?: string) => {
    track("search_performed", {
      query: query.toLowerCase(),
      results: resultsCount,
      category: category || "all",
    });
  },

  /**
   * Track theme changes
   * Shows preference for dark/light mode
   */
  themeChanged: (theme: "light" | "dark" | "system") => {
    track("theme_changed", { theme });
  },
};
```

### Usage in Components

```tsx
import { trackSEO } from "@/lib/analytics";

export function ProductCard({ product, category, country }: Props) {
  const handleAffiliateClick = () => {
    trackSEO.affiliateClick({
      productName: product.name,
      category,
      country,
      price: product.price,
      pricePerUnit: product.pricePerTB,
      position: product.index,
    });
  };

  return (
    <a
      href={product.affiliateUrl}
      onClick={handleAffiliateClick}
      target="_blank"
      rel="noopener noreferrer"
    >
      {/* Product content */}
    </a>
  );
}
```

---

## SEO Optimization Strategies

### 1. Content Performance Analysis

**What Analytics shows:**

```
📊 Top Pages:
├── /us/electronics/hard-drives → 2,345 views
├── /de/electronics/batteries → 1,234 views
├── /in/groceries/pet-food → 987 views
└── /us/electronics/ssds → 456 views
```

**SEO Actions:**

#### ✅ Optimize successful pages

- Create similar pages (e.g., `/us/electronics/nvme-drives`)
- Add internal links from high-traffic pages
- Expand content (FAQ, comparison tables)
- Optimize for long-tail keywords

#### ⚠️ Improve weak pages

- Review meta title and description
- Add structured data (Schema.org)
- Improve internal linking
- Create backlinks from high-traffic pages

---

### 2. Geographic SEO Strategy

**Analytics shows:**

```
🌍 Traffic by Country:
├── 🇺🇸 USA: 45% (4,500 visitors)
├── 🇩🇪 Germany: 20% (2,000 visitors)
├── 🇮🇳 India: 15% (1,500 visitors)
└── 🇬🇧 UK: 10% (1,000 visitors)
```

**SEO Actions:**

#### Optimize hreflang tags

```tsx
// In your layout.tsx or sitemap
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
  hreflang="en-in"
  href="https://realpricedata.com/in/electronics/hard-drives"
/>
<link
  rel="alternate"
  hreflang="x-default"
  href="https://realpricedata.com/us/electronics/hard-drives"
/>
```

#### Localized keywords

- Research local search terms
- Optimize meta descriptions in local language
- Create localized FAQ pages
- Prominently display local currencies and units

---

### 3. Referrer Analysis for Backlink Strategy

**Analytics shows:**

```
🔗 Top Referrers:
├── Google Organic: 40% (4,000 visits)
├── Direct: 30% (3,000 visits)
├── reddit.com/r/buildapc: 15% (1,500 visits)
├── twitter.com: 10% (1,000 visits)
└── techforum.de: 5% (500 visits)
```

**SEO Actions:**

- Be active in successful communities
- Create content relevant to those audiences
- Find similar communities
- Optimize for featured snippets
- Create FAQ pages for common queries

---

### 4. Mobile vs. Desktop SEO

**Analytics shows:**

```
📱 Device Breakdown:
├── Desktop: 60% (6,000 visits)
├── Mobile: 35% (3,500 visits)
└── Tablet: 5% (500 visits)
```

**SEO Actions:**

#### Mobile-first indexing (if mobile > 50%)

- Prioritize mobile Core Web Vitals
- Test mobile usability in Google Search Console
- Optimize touch targets (min. 48x48px)
- Reduce mobile load times

#### Desktop optimization (if desktop dominates)

- Use larger data visualizations
- Optimize for desktop screen sizes
- Add advanced filter options

---

### 5. Custom Events for SEO Insights

**Track user behavior:**

```tsx
// Category views
trackSEO.categoryView("hard-drives", "us");

// Filter usage (shows user intent)
trackSEO.filterApplied("condition", "new", "hard-drives");

// Sort changes
trackSEO.sortChanged("pricePerTB", "asc", "hard-drives");

// Affiliate clicks (conversion!)
trackSEO.affiliateClick({
  productName: "Samsung 990 PRO",
  category: "hard-drives",
  country: "us",
  price: 189.99,
  pricePerUnit: 0.095,
});

// Country switches
trackSEO.countryChanged("us", "de");
```

**SEO Insights:**

```markdown
If many "filter_applied" events for "condition: new":
→ Create dedicated landing page "/new-hard-drives"
→ Optimize for keyword "new hard drives best price"

If many "search_performed" for "nvme ssd":
→ Create dedicated NVMe category
→ Shows unfulfilled user intent

If many "country_changed" from US → DE:
→ German version is in demand
→ Invest more in German SEO
```

---

## Performance Impact

| Metric       | Impact            |
| ------------ | ----------------- |
| Bundle Size  | +1.5 KB gzipped   |
| Initial Load | 0ms (async)       |
| Runtime CPU  | <0.1% (idle time) |
| Network      | 1 request/page    |
| Memory       | <100 KB           |

**Combined with Speed Insights:**

- Total bundle: ~3 KB
- Total impact: **Negligible** ✅

---

## Privacy & Compliance

### Privacy-Friendly Features

✅ **No cookies** - Fully cookie-free tracking  
✅ **No PII** - No personal identifiable information  
✅ **GDPR compliant** - Privacy by design  
✅ **CCPA compliant** - California privacy law  
✅ **Anonymous** - User IDs are hashed  
✅ **Transparent** - Users can opt-out

### How It Works

- Uses browser fingerprinting (non-invasive)
- Hashes visitor IDs for anonymity
- No cross-site tracking
- No third-party cookies
- Data stored on Vercel infrastructure

---

## Pricing

### Free Tier (Current)

- **100,000 events per month**
- All core features
- Real-time analytics
- Geographic breakdown
- Device breakdown
- Referrer tracking

### Pro Tier (If Needed)

- 1M+ events per month
- Advanced filtering
- Custom retention
- API access

**For most sites, free tier is sufficient!**

---

## Viewing Analytics

### On Vercel Dashboard

1. Deploy to Vercel
2. Go to your project dashboard
3. Click "Analytics" tab
4. View real-time data

### Available Views

- **Overview** - Traffic summary
- **Top Pages** - Most visited pages
- **Referrers** - Traffic sources
- **Countries** - Geographic distribution
- **Devices** - Desktop vs Mobile
- **Browsers** - Browser breakdown

---

## Weekly SEO Routine

### Every Monday

1. Open Vercel Analytics Dashboard
2. Check top 10 pages from last week
3. Identify pages with traffic decline
4. Review new referrer sources
5. Analyze geographic distribution

### Every Month

1. Compare traffic trends (MoM)
2. Identify seasonal patterns
3. Optimize weak pages
4. Create content for new trends
5. Review conversion rates

---

## Integration with Google Search Console

### Combine Both Tools

**Vercel Analytics shows:**

- What users do on your site

**Google Search Console shows:**

- How users find your site

**Together:**

- Complete SEO picture

### Workflow

1. **GSC**: Find keywords with high impressions, low clicks
2. **Analytics**: Check if these pages have high bounce rate
3. **Optimize**: Improve content + meta description
4. **Track**: Monitor improvement in both tools

---

## Key Performance Indicators

### Traffic Metrics

- Unique Visitors (growth)
- Page Views per Visitor (engagement)
- Top Pages (content performance)
- Traffic Sources (acquisition)

### SEO Metrics

- Organic Search % (SEO success)
- Geographic Distribution (internationalization)
- Device Breakdown (mobile optimization)
- Referrer Diversity (backlink success)

### Conversion Metrics

- Affiliate Click Rate (monetization)
- Pages per Session (engagement)
- Return Visitors (loyalty)
- Conversion by Source (ROI)

---

## Development vs Production

### Development (localhost)

- Analytics is **disabled** in development
- No data collected locally
- Zero overhead during development

### Production (Vercel)

- Automatically enabled when deployed
- Starts collecting data immediately
- Visible in Vercel dashboard within minutes

---

## Advanced Features

### Debug Mode

```tsx
<Analytics debug={true} />
```

### Before Send Hook

Filter or modify events before sending:

```tsx
<Analytics
  beforeSend={(event) => {
    // Filter out certain events
    if (event.url.includes("/admin")) return null;
    return event;
  }}
/>
```

---

## Resources

- [Vercel Analytics Docs](https://vercel.com/docs/analytics)
- [Custom Events Guide](https://vercel.com/docs/analytics/custom-events)
- [Privacy Policy](https://vercel.com/docs/analytics/privacy-policy)
- [Google Search Console](https://search.google.com/search-console)
- [Schema.org for Products](https://schema.org/Product)

## Project Files

- **Analytics Utility**: [analytics.ts](file:///Users/oguz/Desktop/Dev/realpricedata/src/lib/analytics.ts)
- **Layout Integration**: [layout.tsx](file:///Users/oguz/Desktop/Dev/realpricedata/src/app/layout.tsx)

---

## Summary

✅ **Installed**: `@vercel/analytics@1.6.1`  
✅ **Configured**: Added to root layout  
✅ **Performance**: Negligible impact (~1.5 KB)  
✅ **Privacy**: Cookie-free, GDPR compliant  
✅ **Free Tier**: 100k events/month  
✅ **Ready**: Will start tracking on Vercel deployment

**Important**: Analytics is only the first step. The real SEO magic happens when you **actively use** the data to improve your site! 🎯
