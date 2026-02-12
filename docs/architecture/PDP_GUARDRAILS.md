# PDP Architecture & Performance Guardrails

This document defines the mandatory architectural patterns for Product Detail Pages (PDP) in CleverPrices. These rules ensure sub-10ms TTFB and visual stability (Zero CLS), which are critical for both User Experience and Google Search Console (GSC) performance.

## 🛑 The "Anti-Regress" Rules

### 1. No Awaits in Critical Path

- **Rule**: `src/app/p/[slug]/page.tsx` MUST NOT `await` any dynamic data (prices, live offers, charts).
- **Reason**: Any `await` in the root page component blocks the initial HTML response (TTFB), causing the "blank page" effect.
- **Verification**: Ensure `mergeLivePrices` is only called inside `<Suspense>` boundaries.

### 2. Static-First Rendering

- **Rule**: Product Metadata (Title, Gallery, Breadcrumbs, Specifications) MUST render in the initial chunk.
- **Reason**: Googlebot needs these for indexing. Users need these for instant feedback.
- **Verification**: These components should NOT be wrapped in the same `Suspense` boundary as prices.

### 3. Focused Streaming Boundaries

- **Rule**: Only wrap price-dependent components in `Suspense`.
- **Mandatory Boundaries**:
  - `<LivePriceHeader>`
  - `<LiveSavingsBadge>`
  - `<PriceChartBoundary>`
  - `<LivePriceBoundary>` (for Offers)

## 🔍 QA Checklist for PDP Changes

Before committing changes to `IdealoProductPage.tsx` or related components, verify the following:

- [ ] **TTFB Check**: Inspect the "Network" tab in DevTools. The "Doc" request should have a "Waiting (TTFB)" of < 50ms locally (ideally < 15ms).
- [ ] **No Layout Shift**: Throttle network to "Slow 3G". Navigating to a PDP should show the title and image immediately without the footer jumping.
- [ ] **SEO Check**: View Page Source (`Ctrl+U`). The product title and description MUST be present in the raw HTML.
- [ ] **Data Separation**: Confirm that `mergeLivePrices` is not accidentally being called in a way that blocks the static shell.

## 📈 VPS Performance Note

Current VPS (2.5GB RAM) is sufficient for this architecture because streaming offloads the heavy lifting from the main thread. If memory usage exceeds 1.5GB consistently, consider upgrading CPU rather than RAM, as builds are currently the primary bottleneck.
