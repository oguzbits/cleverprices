# Indexing Maintenance & GSC Migration Guide

This document defines the strategy for resolving "Stale URL" issues in Google Search Console (GSC) and maintaining a healthy search index for CleverPrices.

## 🚨 The Current Problem: GSC Stagnation

As of March 2026, GSC was showing impressions for old URLs from >1 month ago, even though the site has been completely refactored. This "stagnation" happened because:

1.  **Sitemap Gap**: Only 20% of the live catalog was in the sitemap.
2.  **Weak Redirects**: Legacy aliases were using `307 Temporary` redirects, which does not signal an authority transfer to Googlebot.

---

## 🏗️ The "Flood then Prune" Strategy

To fix this, we have moved into a **Tactical Flooding Phase**.

### Phase 1: The Flood (Active)

- **Goal**: Force Googlebot to discover the entire new URL structure (`/p/ID_-SLUG`).
- **Action**: Include `scavenged` products and `generic` slugs in `src/app/sitemap.ts`.
- **Result**: Sitemap URL count increased from ~1,900 to ~7,000.
- **Why**: Google needs to see the new URLs for every product it "knew" in the old version to understand that a full migration has occurred.

### Phase 2: The Prune (Future)

- **Trigger**: Once GSC "Coverage" report shows the new German slugs as the primary indexed URLs.
- **Action**: Revert `sitemap.ts` to only include `optimized` and `processed` products.
- **Why**: Protects crawl budget by focusing Googlebot on high-authority, high-converting pages.

---

## 🔗 Redirect Policy (301 vs 307)

**CRITICAL RULE**: All migrations must use **301 (Moved Permanently)**.

### Why 301 is Mandatory for Migrations

- **307 (Temporary)**: Tells Google: _"I'm just visiting here briefly. Keep my old URL in the index."_ (Used for maintenance or temporary overrides).
- **301 (Permanent)**: Tells Google: _"The old URL is dead. Transfer all its rankings, history, and history to this new URL."_

### Implementation in Next.js

Use `permanentRedirect()` from `next/navigation`:

```tsx
// Correct (SEO-Friendly Migration)
if (visitedAliasUrl) {
  permanentRedirect(canonicalSlugPath); // Returns 301 status
}
```

---

## 📈 Monitoring GSC Health

When checking Google Search Console, look for these signals:

1.  **Sitemaps**: Ensure `sitemap.xml` shows "Success" and the "Discovered URLs" match your database count (~7,000).
2.  **URL Inspection**: Take an old URL (e.g., from January) and inspect it. It should show:
    - **Page is not indexed** (or indexed as a redirect).
    - **User-declared canonical**: The new German URL.
    - **Google-selected canonical**: The new German URL (This is the "Success" signal).
3.  **Core Web Vitals**: Ensure the expanded sitemap doesn't degrade performance. Large sitemaps can slightly increase crawler load on the database.

## 🛠️ Maintenance Check

After any major change to the category tree or product slug logic, run:

```bash
# Check if the sitemap still renders without errors
curl -I https://cleverprices.com/sitemap.xml
```
