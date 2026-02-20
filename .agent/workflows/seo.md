---
description: Ensure visibility on search engines and semantic optimization
---

# 🔍 SEO Workflow

This workflow is critical to driving organic traffic to CleverPrices. Follow the `modern-seo` skill whenever generating or modifying pages.

## 1. Content and Metadata Verification

Use the established AI skill to review pages:

- Enforce the `modern-seo` skill rules.
- Validate `generateMetadata` exports in Next.js.
- Ensure only one `<h1>` tag exists and describes the target keyword exactly.

## 2. Sitemap Generation

Sitemaps map our extensive product catalog. Ensure outdated or blacklisted URLs (`/produkt/old-slug`) are excluded from `sitemap.xml`.

- **Review:** Make sure redirect lists in `next.config.ts` or routing middleware properly 301.

## 3. Ideation / SEO Niche Generation

If searching for new content areas:

```bash
bun run seo:generate
```

This script helps map out profitable niches based on our product database.

## 4. Performance Tie-in

Remember that Google heavily weights **Core Web Vitals**. Execute the `/performance` workflow alongside any SEO improvements to ensure LCP/CLS metrics are in the green.
