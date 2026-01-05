# Amazon PA API Integration (LEGACY)

## ⚠️ This folder is now superseded by the Multi-Source Architecture

The PA API integration has been moved and refactored into the new unified data source layer:

**New location:** `src/lib/data-sources/`

**Files:**

- `amazon-paapi.ts` - Updated PA API client implementing DataSourceProvider interface
- `keepa.ts` - Keepa API client (price history + backup data)
- `ebay.ts` - eBay Finding API client (used/refurbished alternatives)
- `static-data.ts` - Fallback static JSON source
- `index.ts` - Unified data aggregator
- `types.ts` - Shared type definitions

**See also:**

- `/MULTI_SOURCE_STRATEGY.md` - Complete multi-source strategy documentation

---

## Legacy Files (Can be deleted)

The files in this folder are the original, non-refactored versions:

| File                          | Status      | New Location                              |
| ----------------------------- | ----------- | ----------------------------------------- |
| `amazon-paapi.ts`             | ✅ Migrated | `src/lib/data-sources/amazon-paapi.ts`    |
| `price-sync.ts`               | ⏳ Pending  | Needs updating for new architecture       |
| `price-cache.ts`              | ⏳ Pending  | Types merged into `types.ts`              |
| `PriceFreshnessIndicator.tsx` | ⏳ Pending  | Will move to `src/components/` when ready |

## To fully migrate

Once you have PA API access:

1. Delete this legacy folder
2. Add credentials to `.env.local`
3. The new architecture will automatically pick up the PA API source

```bash
# Clean up legacy folder (optional)
rm -rf .future/pa-api-integration
```
