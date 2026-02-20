---
description: Perform quality assurance and testing to prevent regressions
---

# 🧪 QA & Testing

This workflow defines the quality barriers for CleverPrices.

## 1. Unit Tests (Functionality)

The core helper functions and data parsers (like `src/lib/utils/product-identity.ts`) must pass before a deploy.
// turbo

```bash
bun test src
```

## 2. End-to-End Testing (E2E)

Critical user flows, specifically the Idealo-style category page filtering, are tested via Playwright.

```bash
bun run test:e2e
```

## 3. Visual & UI Regression

If there are design changes to product detail pages (PDPs) or category list items:

- Use the **Browser Subagent tool** to load `localhost:3000`.
- Provide instructions like: _"Navigate to `/kategorie/3d-printers`, click a product, verify if the Keepa price chart loads, and capture a screenshot."_
- Ensure Mobile Views are also tested since `TTFB` and `LCP` on mobile are primary business goals.

## 4. Validating the "No-Database-Build"

Run a dummy build inside Docker to ensure no SQLite `table does not exist` errors happen. This verifies the `generateStaticParams` safeguards.

```bash
bun run docker:build
```
