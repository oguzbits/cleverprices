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

### RAM (`arbeitsspeicher`)

- **Naming Pattern**: `[Brand] [Series] [Total Capacity] [DDR]-[Speed] [CL] [MPN]`
- **Consolidation Rule**: Always compute the **Total Capacity** by prioritizing title-encoded kit patterns (e.g., `2x16GB` or `(2x8GB)`) or embedded model names (e.g., `VENGEANCELPX32GB`) over the database spec field, which may only list the per-stick capacity.
- **Advanced Extractions**:
  - **Speed**: Handles `MHz` and `MT/s`. Includes fallback for lone 4-digit speeds (e.g., `6000`) if they map to typical RAM frequencies.
  - **Latency**: Supports `CL30` and `C30` notations, or trailing timing values like `16-18-18-36`.
  - **Branding**: Aggressively strips MPNs (even if in brackets `[MPN]`), form factors (`DIMM`, `SODIMM`), and category noise (`Kit`, `Module`, `Dual`, `RGB`) from the series name to prevent redundancy.
- **Series Extraction**: Strip embedded capacity and kit specifiers from the series name to prevent redundancy (e.g., `VENGEANCELPX32GB` → `VENGEANCELPX`).
- **Clean Suffix**: The `variantSuffix` should contain only the MPN to ensure clean Hub vs. Variant differentiation.
- **Cache Dependency**: Any change to RAM identity logic **MUST** be accompanied by a global cache version bump in `cached-products.ts` and `category-products.ts` to prevent slug mismatch and redirects.

### Category Hub Sorting (`Hub Cards`)

- **Ranking Strategy**: Hub cards must dynamically adopt the "best" relevant metric (e.g., lowest price, highest popularity) of their individual variants.
- **Tie-breakers**: When a variant and its parent Hub card share the exact same metric, the Hub card _always_ wins the tiebreaker and appears immediately above its variant cohort.
- **Canonical ID Stability (Redirect Prevention)**: Hub card links must always use the family's GLOBAL canonical ID (minimum ID across all variants in the DB) via `getCanonicalFamilyId`. This prevents redirects and ensures stable IDs even if price-leading variants change.
- **Spec-Source Consistency**: To prevent title mismatch between Category and PDP, both pages must fetch the same representative `specificationsSource`. If the Category page uses a different representative than the Hub entry, titles will flip-flop.

## Display Consistency (Single Source of Truth)

To ensure a professional and unified user experience, all product titles across the platform (Category Grids, Lists, PDP, Meta Titles, and Schema) must use the `getProductIdentity` engine.

### 1. Unified Components

- **`identity.modelTitle`**: Use for the primary product name (e.g., "AMD Ryzen 7 9800X3D" or "Apple iPhone 17 Pro").
- **`identity.variantSuffix`**: Use for variant-specific traits (e.g., "4.7 GHz" or "Tiefblau 256 GB").
- **`identity.displayTitle`**: The full cleaned title. Use for List items and Meta/SEO titles.

### 2. Rendering Pattern

- **Hub View**: Show only `modelTitle`.
- **Variant View**: Show `modelTitle` + `variantSuffix` (usually styled with different weights/colors).
- **SEO/Meta**: Use `displayTitle` for specific variants to capture search intent; use `modelTitle` for Hubs.

## Regression Prevention

Always run the identity regression suite after any change:

```bash
bun test src/lib/utils/product-identity-regressions.test.ts
```
