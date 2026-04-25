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

## 5. Symbol Consistency

We follow a **Clean Slugs, Rich Titles** policy.

- **Slugs**: Must be sanitized (no ®, ™, or special characters).
- **Titles**: Must be rich for certain categories (e.g., `prozessoren`). Ensure trademark symbols (® and ™) are preserved in the `displayTitle` and `fullModel` fields.
- **Verification**: Run `bun test src/lib/utils/product-identity-regressions.test.ts` to ensure no regressions in symbol preservation.
