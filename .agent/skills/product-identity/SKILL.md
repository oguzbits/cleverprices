---
name: product-identity
description: >
  Core logic for extracting brands, models, and traits from product titles.
  TRIGGERS: Any change to src/lib/utils/product-identity.ts or title rendering logic.
  CRITICAL: This project follows the "Clean Slugs, Rich Titles" pattern.
version: "1.0.0"
---

# Product Identity Skill

This skill defines the logic for normalizing product data into SEO-friendly identifiers while maintaining rich user-facing titles.

## 核心原则: Clean Slugs, Rich Titles

We separate the **Indexing Identity** (Slugs) from the **Display Identity** (Rich Titles).

### 1. Indexing Identity (Slugs)

- **Goal**: SEO-friendly, stable URLs.
- **Rule**: Standard normalization (ASCII only). Remove trademarks (®, ™), commas, and noise.
- **Implementation**: The `model` field in `ProductIdentity` must be clean.

### 2. Display Identity (Rich Titles)

- **Goal**: Premium, authoritative look-and-feel.
- **Rule**: Preserve trademark symbols for high-value categories (e.g., `prozessoren`).
- **Implementation**: The `displayTitle` and `fullModel` fields in `ProductIdentity` must be rich.

## Category-Specific Rules

### CPUs (`prozessoren`)

- **Required**: Must include Brand, Family (e.g., Core Ultra 7), Model (e.g., 265K), Cores, and Clock Speed if available.
- **Symbols**: Always preserve `®` and `™` in the display output.

## Regression Prevention

Always run the identity regression suite after any change:

```bash
bun test src/lib/utils/product-identity-regressions.test.ts
```
