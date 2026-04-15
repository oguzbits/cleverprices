# 🛠️ Performance Architecture: Sitemap & Bulk Product Generation

To maintain the project's **40ms delivery goal**, the Sitemap must generate instantly even on a "cold start" (cache miss).

## 🚀 The SLO (Service Level Objective)

- **Sitemap Generation**: Must be `< 2s` (Production) and `< 5s` (Local).
- **Per-product mapping cost**: Must be `< 0.2ms` for bulk operations.

## 🏗️ The Architectural Guardrail: `fastMode`

The project's regular identifier logic is **Consensus-aware**. This is powerful but expensive because it:

1.  Fetches full JSON specifications and price histories.
2.  Runs complex regex-based identity extraction for every sibling in a product family.
3.  Calculates a shared identity across multiple variants.

While essential for a single Product Page (PDP), this logic is **prohibitively slow** (20s+) for 6,000+ products.

### ✅ Correct Pattern: Use `fastMode` for Sitemaps

Always pass `fastMode: true` to `getAllProductSlugs()` when generating files with more than 1,000 items.

```typescript
// 🛡️ GOOD: Instant sitemap (uses DB slugs directly)
const products = await getAllProductSlugs(undefined, false, true);

// ❌ BAD: Slow sitemap (re-calculates every identity)
const products = await getAllProductSlugs(undefined, false);
```

## 🔍 Continuous Validation (The Safety Net)

Performance and SEO consistency are now enforced by Two project-wide guardrails:

### 1. Performance SLO (`sitemap:check`)

```bash
bun run sitemap:check
```

If a code change (like "mapping bloat") pushes sitemap generation over **5 seconds (local)** or **2 seconds (prod)**, this command will exit with an error (Code 1), blocking deployment in CI.

### 2. URL Fingerprinting (`test:urls`)

```bash
bun run test:urls
```

This protects against the **Aggressive Path Rename** mistake. It compares your current routes against `scripts/tests/url-baseline.json`. If core German paths (like `/datenschutz`) or canonical product structures change, the test will fail, ensuring you don't accidentally break SEO indexing.
