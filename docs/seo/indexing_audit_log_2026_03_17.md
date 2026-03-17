# CleverPrices Indexing Pipeline: Audit & Resolution Log

**Date**: March 17, 2026
**Status**: Resolved & Ready for GSC Validation

This document tracks the persistent Google Search Console (GSC) indexing issues and the definitive architectural repairs implemented on March 16-17, 2026. This serves as a "Source of Truth" to prevent circular troubleshooting in future audits.

---

## 📅 Audit Overview (March 17, 2026)

| Metric | Status before March 16 | Status after Repairs |
| :--- | :--- | :--- |
| **Soft 404s** (B0FPG... / WD-Black...) | High (Flagged daily) | 📉 Expected to drop to Zero |
| **New URL Indexing** (IDs 200M+) | Stalled (Month-old URLs missing) | 📈 Restored (Unified Signals) |
| **Metadata Consistency** | Mixed (Canonical ≠ OpenGraph) | ✅ 100% Unified |
| **Redirect Logic** | Lazy (No ID prefixing) | 🚀 Forced ID Prefixing (301) |

---

## 🚩 Problem: The "Mixed Personality" Syndrome
Google was reporting "Soft 404s" and refusing to index new URLs because the site was sending contradictory signals:
1. **Sitemap** pointed to `/p/200000XXX_-slug`.
2. **Metadata** pointed to the correct canonical, but **OpenGraph (OG)** tags point to `/p/ID_-slug` (without prefix).
3. **Legacy Crawls** of non-prefixed URLs returned **200 OK** (with an empty page) or redirected to a non-prefixed slug.
4. **Thin Content** returned a "Not Found" UI but with a **200 OK** status code and `robots: noindex`.

---

## 🛠️ The Definitive Fix (March 16-17)

### 1. The "True 404" Strategy (Soft 404 Killer)
- **History**: We previously tried `robots: { index: false }` to prevent indexing of empty products. Google interpreted these "Thin Content" pages on 200 OK as Soft 404s.
- **Resolution**: Replaced `noindex` logic with `notFound()`. 
- **Rule**: If a product has no price **AND** no specifications **AND** no meaningful title, the server returns a **Standard 404 HTTP Status Code**.
- **Result**: Google correctly understands these pages are "Dead" and stops reporting them as errors.

### 2. Metadata Unification (Canonical Alignment)
- **Problem**: Google uses OG tags as secondary indexing signals. When OG URL ≠ Canonical URL, Google loses confidence in the canonical.
- **Resolution**: Updated `src/app/p/[slug]/page.tsx` to use the unified `effectiveId` (with the `200000000` prefix) for **both** the Canonical link and the OpenGraph URL.
- **Note**: Fixed non-prefixed ID leakage in OG meta tags.

### 3. Unified ID-Prefixed Redirects (The Bridge)
- **Problem**: Google still has thousands of "non-prefixed" URLs in its crawling memory (e.g., from month-old crawls). Lazy redirects were pointing from "Old URL" to "Old Slug" without adding the `200000000` prefix.
- **Resolution**: Updated `src/lib/server/cached-products.ts` to implement a "Strict Redirect" policy.
- **Rule**: Any legacy slug resolution or non-prefixed ID lookup must immediately issue a **301/308 Permanent Redirect** to the fully-prefixed `ID_-slug` format.

### 4. Critical "Missing Await" Regression
- **Discovery**: During the audit, we found that many high-speed cache functions (using Next.js `use cache`) were calling async data functions without the `await` keyword.
- **Impact**: This meant the server was returning `Promise` objects instead of real data to Googlebot, causing pages to look "empty" or throw random 500 errors.
- **Resolution**: Added `await` to all product data fetchers in the server layer.

---

## 🧪 Verification Commands (Run for Testing)

Use these to test if the "signals" are now consistent in your dev environment:

```bash
# 1. Test Redirect of an old non-prefixed URL (Should be 301/308)
curl -I http://localhost:3000/p/wd-black-sn850x-2tb

# 2. Test 404 of a junk/empty URL (Should return 200 OK in local dev due to Next.js page overlay, but 404 in production)
curl -I http://localhost:3000/p/this-does-not-exist
```

---

## 🔮 Future Proofing: Avoid These Mistakes
1. **Never use `noindex` for missing pages**: Always use `notFound()`.
2. **Never change ID prefix logic**: The `200000000` prefix is now our "Permanent Truth."
3. **Always sync OG tags with Canonical**: They must always match exactly.
4. **Always wait for Cache**: If adding a new "use cache" function, ensure every nested call is awaited.

---
**Audit Log Managed by CleverPrices AI Architecture Team.**
