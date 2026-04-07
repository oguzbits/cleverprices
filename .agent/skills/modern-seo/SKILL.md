---
name: modern-seo
description: >
  Comprehensive SEO audit and optimization guidelines.
  TRIGGERS: Creating pages, writing meta tags, URL structures, or content optimization.
  Contains rules for keywords, on-page elements, and technical performance.
version: "2.0.0"
---

# Modern SEO Audit Guidelines

A modular set of rules to maximize search visibility and organic traffic.

## 🚫 BANNED (Never Use)

| Pattern                   | Why                   | Use Instead             |
| ------------------------- | --------------------- | ----------------------- |
| Duplicate titles          | Cannibalizes rankings | Unique title per page   |
| Missing meta descriptions | Poor CTR              | Action + UVP + CTA      |
| Generic H1s               | Low relevance         | Keyword-rich, unique H1 |

- **Stability Shield Compliance**: We have removed per-bot logic to favor **Shared Cache Stability**. Serving a 20m stale cache to Googlebot is mandatory to protect database performance while maintaining < 40ms TTFB. This follows the 20-minute Keepa price cycle.
- **Orphan pages (no internal links)**: Not crawled. Link from 3-5 related pages.

## ✅ REQUIRED

| Element     | Target        | Example                                                                    |
| ----------- | ------------- | -------------------------------------------------------------------------- | -------------- | ----------------- |
| Title       | < 65 chars    | `Samsung 990 Pro 2TB                                                       | Preisvergleich | cleverprices.com` |
| Description | 150-160 chars | `Vergleiche Preise für Samsung 990 Pro 2TB. Bis zu 30% sparen bei Amazon.` |
| H1          | One per page  | `Samsung 990 Pro 2TB SSD Preisvergleich`                                   |
| LCP         | < 2.5s        | Use Next/Image, preload fonts                                              |

---

## Rules

### 1. Strategy

- [Keywords](rules/seo-01-keywords.md) - Define Primary, Transactional, Long-tail

### 2. On-Page

- [Titles](rules/seo-02-title-tags.md) - Max 65 chars, [Name] | [Hook] | Brand
- [Descriptions](rules/seo-03-meta-descriptions.md) - Action Verb + UVP + Hook
- [Structure](rules/seo-04-structure.md) - One H1, logical H2/H3s

### 3. Technical

- [Internal Linking](rules/seo-05-internal-linking.md) - Link to 3-5 related pages
- [Performance](rules/seo-06-perf-ux.md) - LCP < 2.5s. Use **Static-First Rendering** for PDPs to ensure sub-10ms TTFB and visual stability.

---

## CleverPrices-Specific

### Global SEO (Brand Authority)

- **JSON-LD Schema**: Always include `GlobalSchema` and `BreadcrumbStructuredData`. This ensures Google understands the site hierarchy and displays rich snippets.
- **Internal Linking**: Maintain a list of top categories in the Footer. This helps distribute link equity and reduces crawl depth.

```tsx
// Required meta structure
export function generateMetadata({ params }) {
  return {
    title: truncateTitle(`${product.title} | Preisvergleich | ${BRAND_DOMAIN}`),
    description: `${product.title} günstig kaufen. Bis zu 30% sparen. Aktueller Bestpreis: ${price}€.`,
    openGraph: {
      type: 'product',
      ...
    }
  }
}
```

- Include brand + capacity in title where relevant
- Add structured data for product lists

### 4. Canonical Strategy (Idealo-style)

- **Universal Hub Parity (900M+ Strategy)**: 
  - **Single Source of Truth**: All public-facing product links **must** exclusively serve canonical Hub URLs using the `900,000,000` prefix.
  - **Redirect Enforcement**: Any product ID < 900M (e.g., raw IDs or 200M+ variant IDs) encountered in a request must be permanently redirected (301) to its 900M+ Hub equivalent.
  - **Link Generation**: All internal links in components (PDP, Category, Widgets) must use the `getProductPath(id, slug)` utility from `@/lib/utils/url`, which automatically promotes legacy IDs to the 900M+ space.
- **Variation Collapsing**: To avoid duplicate content penalties, all variants (colors, sizes, storage) must point to a single **Hub Page**.
- **Hub Representatives**: The Hub page uses the cheapest or primary variant as its content source but maintains a stable `900M` serial ID prefix.
- **Slug Parity**:
  - The sitemap generation (Lite Mode) and product rendering (Full Mode) must use identical `IDENTITY_KEYS` for slug generation.
  - Never include individual variants in the sitemap; only the Hub should be indexed.
- **Canonical ID Stability**: Hub URLs must be generated using the family's global minimum ID to ensure stable, non-redirecting canonical links.
- **Rich Titles for Premium Categories**:
  - While slugs are clean, the `displayTitle` and `fullModel` for high-value categories like `prozessoren` must preserve trademark symbols (®, ™). This signals authority to both users and Search Engines (GEO/AEO).

## 🤖 Generative Engine Optimization (GEO/AEO)

To ensure the site is cited by Perplexity, ChatGPT, and Google AI Overviews:

### 1. AI Bot Management (robots.txt)

Always allow these specialized agents to crawl product data:

- `GPTBot`, `PerplexityBot`, `Google-Extended`, `anthropic-ai`, `Claude-Web`

### 2. Citation-First Content

- **Answer-First**: Place a concise summary/verdict at the top of category and product pages.
- **Data Densification**: Use tables for price-per-unit and specs. AI agents prioritize structured tabular data for summaries.
- **FAQ Schema**: Use `FAQPage` JSON-LD for common hardware queries (e.g., "Best SSD under 100€").

### 3. Structured Data Requirements

- **ItemList**: For categories to show product rankings.
- **Product**: For PDPs with high-frequency price updates.
- **BreadcrumbList**: Using `SITE_URL` for absolute URI consistency.
