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

## 2. Sitemap & Crawl Hygiene

Maintain a clean "Crawl Budget" to ensure bots focus on high-value pages.

- **Quality Filtering**: Only include `optimized` or `processed` products in `sitemap.xml`. Exclude raw `scavenged` data.
- **Validation Scripts**: Run these tools before every major deployment:

  ```bash
  # Check for dead links and soft 404s in sitemap (10% sample)
  bun scripts/maintenance/sitemap-validator.ts --prod --limit=50 --fast

  # Check if robots.txt correctly blocks crawl traps and allows assets
  bun scripts/maintenance/robots-validator.ts --prod
  ```

- **Noise Blocking**: Ensure `robots.txt` disallows `/monitoring/` and `/*?_rsc=` parameters.
- **AI Bot Audit**: Periodically verify that new AI agents (e.g. `PerplexityBot`) are explicitly allowed in `robots.txt` to ensure GEO visibility.
- **Redirects**: Avoid "Redirect Loops" or "Soft 404s" in `next.config.ts`.

## 3. Ideation / SEO Niche Generation

If searching for new content areas:

```bash
bun run seo:generate
```

This script helps map out profitable niches based on our product database.

## 4. Performance Tie-in

Remember that Google heavily weights **Core Web Vitals**. Execute the `/performance` workflow alongside any SEO improvements to ensure LCP/CLS metrics are in the green.
