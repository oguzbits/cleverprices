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

| Workflow         | Frequency | Description                                                                       |
| :--------------- | :-------- | :-------------------------------------------------------------------------------- |
| **Price Sync**   | Hourly    | Fetches Keepa prices, enriches products, and writes to Turso Cloud.               |
| **Lite DB Sync** | 2x Daily  | Builds `lite.db`, uploads to Vercel Blob, and triggers a fresh Vercel deployment. |

## 🔧 3. Data Management

| Command                                     | Description                                                                                     |
| :------------------------------------------ | :---------------------------------------------------------------------------------------------- |
| `bun run scripts/import-from-csv.ts <file>` | Imports/Updates products from a Keepa CSV export. Logic prioritizes Amazon structured data.     |
| `bun run scripts/validate-categories.ts`    | Audits the database for categorization errors (e.g. Headphones in SSDs) and reports violations. |

## 💡 Troubleshooting

- **Search fails in Production?** Ensure `cleverprices-lite.db` was prepared with `DELETE` journal mode (run `bun run db:lite`).
- **Data out of date?** Check: 1) GitHub Actions tab (is `Lite DB Sync` running?), 2) Vercel Cron Jobs (is it deploying?), 3) Vercel Blob (is the file there?).
- **Database "Locked"?** If local, restart the worker. If production, ensure `journal_mode=DELETE` was applied.
- **Charts Empty?** Ensure the `price-updater` action is running and writing to Turso Cloud.
- **Blob 404?** The `LITE_DB_BLOB_URL` or `BLOB_READ_WRITE_TOKEN` might be missing or incorrect.
