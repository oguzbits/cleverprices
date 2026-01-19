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

| Pattern                          | Why                   | Use Instead                 |
| -------------------------------- | --------------------- | --------------------------- |
| Duplicate titles                 | Cannibalizes rankings | Unique title per page       |
| Missing meta descriptions        | Poor CTR              | Action + UVP + CTA          |
| Generic H1s                      | Low relevance         | Keyword-rich, unique H1     |
| Orphan pages (no internal links) | Not crawled           | Link from 3-5 related pages |

## ✅ REQUIRED

| Element     | Target        | Example                                                                    |
| ----------- | ------------- | -------------------------------------------------------------------------- | ------------- |
| Title       | 50-60 chars   | `Samsung 990 Pro 2TB SSD - Best Price                                      | CleverPrices` |
| Description | 150-160 chars | `Compare prices for Samsung 990 Pro 2TB. Save up to 30% across Amazon DE.` |
| H1          | One per page  | `Samsung 990 Pro 2TB SSD Preisvergleich`                                   |
| LCP         | < 2.5s        | Use Next/Image, preload fonts                                              |

---

## Rules

### 1. Strategy

- [Keywords](rules/seo-01-keywords.md) - Define Primary, Transactional, Long-tail

### 2. On-Page

- [Titles](rules/seo-02-title-tags.md) - 50-60 chars, Keyword + Hook + Brand
- [Descriptions](rules/seo-03-meta-descriptions.md) - Action Verb + UVP + CTA
- [Structure](rules/seo-04-structure.md) - One H1, logical H2/H3s

### 3. Technical

- [Internal Linking](rules/seo-05-internal-linking.md) - Link to 3-5 related pages
- [Performance](rules/seo-06-perf-ux.md) - LCP < 2.5s

---

## CleverPrices-Specific

### Product Pages

```tsx
// Required meta structure
export function generateMetadata({ params }) {
  return {
    title: `${product.title} - Preisvergleich | CleverPrices`,
    description: `${product.title} ab ${price}€. Vergleiche Preise und spare bis zu ${savings}%.`,
    openGraph: {
      type: 'product',
      ...
    }
  }
}
```

### Category Pages

- Include brand + capacity in title where relevant
- Add structured data for product lists
