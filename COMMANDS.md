# 🛠 CleverPrices Command Center

This guide explains the most important commands for your workflow.

## 🏠 1. Local Development (Daily)

| Command                 | Description                                                                                            |
| :---------------------- | :----------------------------------------------------------------------------------------------------- |
| `bun run dev`           | Starts the Next.js website at http://localhost:3000                                                    |
| `bun run worker:local`  | **Recommended.** Runs the price-updater in the background. Does not sync to Turso Cloud (saves quota). |
| `bun run worker:enrich` | Fetches 1-year history for products that don't have charts yet.                                        |
| `bun run db:studio`     | Opens a GUI to view and edit your local database.                                                      |

## 🤖 2. Autonomous Workflows (GitHub Actions)

These workflows run automatically in GitHub to keep the site fresh without manual effort.

| Workflow       | Frequency | Description                                                         |
| :------------- | :-------- | :------------------------------------------------------------------ |
| **Price Sync** | Hourly    | Fetches Keepa prices, enriches products, and writes to Turso Cloud. |

## 🚀 3. Self-Hosting (Hetzner + Dokploy)

**Server IP:** `46.225.72.57`
**Domain:** `cleverprices.com`
**Dokploy Dashboard:** `http://46.225.72.57:3000`

### Deploy & Updates

| Command                    | Action          | Description                                                                                               |
| :------------------------- | :-------------- | :-------------------------------------------------------------------------------------------------------- |
| **`bun run db:push-prod`** | **Push Data**   | Uploads local `cleverprices.db` to the production server via SCP. **Run this to update prices/products.** |
| **`git push`**             | **Deploy Code** | Pushing to `main` triggers a Dokploy build. The build is "DB-Safe" (ignores missing DB during build).     |

### 🛠️ Troubleshooting

**1. SSH Access**

```bash
ssh root@46.225.72.57
```

**2. Check App Logs**

```bash
# In SSH:
docker service logs cleverprices-mlaii0 --tail 50
```

_(Note: Service name `cleverprices-mlaii0` might change if you recreate the app. Use `docker service ls` to check.)_

**3. Check Database on Server**

```bash
# In SSH:
ls -lh /etc/dokploy/volumes/cleverprices/data/
```

**4. Restart Application**
Go to Dokploy Dashboard -> Applications -> CleverPrices -> Stop / Start.

## 🔧 4. Data Management

| Command                                          | Description                                                                                     |
| :----------------------------------------------- | :---------------------------------------------------------------------------------------------- |
| `bun run scripts/import-from-csv.ts <file>`      | Imports/Updates products from a Keepa CSV export. Logic prioritizes Amazon structured data.     |
| `bun run scripts/validate-categories.ts`         | Audits the database for categorization errors (e.g. Headphones in SSDs) and reports violations. |
| `bun run sif:audit <category>`                   | **New.** Audits a category for Source Integrity violations (Bleed/Pollution).                   |
| `bun run quality:report`                         | **New.** Generates a Data Quality & Coverage report for all categories.                         |
| `bun scripts/enrichment/ebay-enricher.ts <N>`    | Fetches high-quality technical specs from eBay (Limit N units). Stays under daily API quotas.   |
| `bun scripts/enrichment/smart-variant-syncer.ts` | Propagates clean specs from "Lead" products to all variants in the same ASIN family.            |

## 💡 Troubleshooting

- **Search fails in Production?** Ensure FTS5 index exists (run `bun run db:optimize`).
- **Data out of date?** Check if `bun run db:push-prod` ran successfully.
- **Database "Locked"?** If local, restart the worker. If production, ensured `WAL` mode is used.
- **Charts Empty?** Ensure the `price-updater` action is running and writing to Turso Cloud.
- **Wrong Database?** Always run commands from the **project root**. Running from subdirectories can lead to configuration issues or the creation of unwanted `local.db` files.
