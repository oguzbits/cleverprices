# 🛡️ Data Integrity & Quality Assurance

CleverPrices implements a multi-layered **Data Integrity Firewall** to ensure that only accurate, high-quality technical specifications are displayed to users. This system is critical for maintaining trust in a price comparison platform.

---

## 1. Source Integrity Firewall (SIF)

The SIF is a low-level guard that audits raw data imports for "Pollution" and "Metadata Bleed".

### Common Pollution Signals

- **Translation Bleed**: German keywords appearing in technical fields of English imports (e.g., "Farbe: Schwarz" in an MPN field).
- **Stopword Detection**: Fields containing marketing jargon like "hast", "bestellen", or "versand".
- **Cross-Category Violations**: Products appearing in categories where they clearly don't belong (e.g., "AirPods" in the "SSDs" category).

### UI Safeguards

If a product fails the SIF audit:

1. It is flagged in the database as `enrichmentStatus = 'untrusted_source'`.
2. **UI Block**: The `SpecificationsTable` and `IdealoProductPage` will automatically hide all technical data for this product.
3. **Fallback**: Users see a clean "Keine technischen Daten verfügbar" message instead of a table full of garbage.
4. **Debug Visibility**: In `useDebugMode`, a red **Untrusted Source (Blocked)** badge is visible to developers.

---

## 2. Golden Schemas (DQA Suite)

The **Data Quality Assurance (DQA)** suite uses "Golden Schemas" to enforce industry-standard data density for core categories.

### Supported Categories & Thresholds

Each category has a `minRequiredScore` before it is considered "Healthy":

| Category        | Min Score | Core Attributes (Examples)         |
| :-------------- | :-------- | :--------------------------------- |
| **Smartphones** | 70        | RAM, Storage, Screen Size, OS      |
| **Notebooks**   | 70        | CPU, RAM, GPU, Screen Tech         |
| **TVs**         | 60        | Resolution, Smart-TV, Refresh Rate |
| **Tablets**     | 60        | Processor, Storage, OS             |
| **SSDs / HDDs** | 80        | Capacity, Interface, Form Factor   |

### Scoring Algorithm

- **Weighting**: Required fields (e.g., "Marke") carry more weight than optional ones (e.g., "Color").
- **Regex Validation**: Values are validated against patterns (e.g., Capacities must end in `GB` or `TB`).
- **Health Guard**: Products with scores below the threshold are suppressed from "Hub" views to prevent poor user experience.

---

## 3. Maintenance Workflows

### Audit Commands

Use these commands to verify the integrity of the database:

```bash
# Audit a specific category for SIF violations
bun run scripts/maintenance/bulk-source-audit.ts tablets

# Generate a global Data Quality & Coverage Report
bun run quality:report

# Run cross-category keyword violation check
bun run category:audit
```

### Correction Pipeline

1. **Identify**: Use `quality:report` to find categories with low "Avg Keys".
2. **Enrich**: Run `scripts/import/enrich-products.ts` to fetch missing data.
3. **Verify**: Re-run the audit scripts to ensure the new data meets the Golden Schema standards.
