# Stability & Quality Guide (Golden Rules)

## 🎯 Objective

To maintain "Idealo-level" technical excellence and UX stability as the project scales. These rules are mandatory for all developers and AI agents.

## 🏆 The "Golden Rules" of Stability

### 1. The "Soft 404" Mandate (Link Equity Rule)

> [!IMPORTANT]
> **Never waste a backlink on a dead end.**
> Product catalogs change daily. If a product (`/p/[slug]`) is removed or missing from the database, the server MUST NOT deliver a 404 Page.

- **Action**: Identify the product's parent category and perform a **301 (Permanent)** or **307 (Temporary)** redirect to that category page.
- **Why**: This preserves "link equity" (SEO juice) and prevents users from hitting a "Dead End" page, lowering bounce rates.

### 2. The "SEO Triad" Consistency Rule

> [!WARNING]
> **Inconsistent URLs kill indexing speed.**
> If the Canonical URL, Sitemap URL, and JSON-LD URL differ by even a character, Google treats them as different "untrustworthy" entities.

- **Requirement**: All product URL generation MUST use the centralized utility at `src/lib/utils/url.ts`.
- **Banned**: Manual string concatenation for paths like `/p/` or `/[category]`.
- **Triad Components**:
  1.  `<link rel="canonical" ...>`
  2.  `sitemap.xml` entries
  3.  `JSON-LD` (`schema.org`) Product `url` field.

### 3. The "Variant Consensus" Rule

> [!NOTE]
> **Families must share a single technical identity.**
> In many data sources (Keepa/Amazon), sibling variants (e.g., iPhone Red vs iPhone Black) have inconsistent specifications or brand names.

- **Requirement**: Use `scripts/enrichment/smart-variant-syncer.ts` or equivalent logic to propagate high-confidence "Lead" specifications to all family members.
- **Invariant Fields**: `Brand`, `Model`, `Official Title`, `Processor Family`.

### 4. The "Zero Layout Shift" Rule (CLS Guardrail)

> [!CAUTION]
> **Layout shifts degrade the premium feel of the site.**
> Users should never have content "jump" under their cursor as images or charts load.

- **Images**: Always provide strict `width` and `height` or use `aspect-ratio` containers.
- **Charts/Widgets**: Use a **Skeleton Loader** or a grey placeholder box with the exact final height (e.g., `min-h-[300px]` for price history).
- **Interactive**: The variant picker and price grid must have reserved space to prevent the footer from jumping.

---

## 🛠️ Verification Checklist

Before submitting any change, verify against these rules:

- [ ] Does this page redirect to a category if the data is missing? (Rule 1)
- [ ] Is the URL generated via `getAbsoluteProductUrl()`? (Rule 2)
- [ ] Are dynamic components wrapped in height-stabilized containers? (Rule 4)
