---
description: Maintain and refresh data models using built-in scripts
---

# 🧹 Maintenance Operations

This workflow groups the scripts required to ensure product attributes, links, slugs, and categories stay healthy over time.

## 1. Category Audit

Run this script to validate if current products align correctly with our Amazon Browse Nodes.
// turbo

```bash
bun run category:audit
```

## 2. Source Data Audit (SIF)

Verify the primary source of truth data (Scraping Information Feeds/Keepa updates).
// turbo

```bash
bun run sif:audit
```

## 3. SEO Slugs Fix

If product identifiers get misaligned or if titles change, regenerate the normalized slugs.

```bash
bun run slugs:fix
```

## 4. Quality Reporting

Generate a comprehensive quality report detailing orphaned products or corrupted variants.
// turbo

```bash
bun run quality:report
```

## Execution Policy

These scripts should be run manually (or proposed by an AI agent) whenever there are widespread data issues or before a major marketing launch.
