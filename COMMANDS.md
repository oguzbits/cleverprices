# 🛠 CleverPrices Command Center

This guide explains the most important commands for your workflow.

## 🏠 1. Local Development (Daily)

| Command                 | Description                                                                                            |
| :---------------------- | :----------------------------------------------------------------------------------------------------- |
| `npm run dev`           | Starts the Next.js website at http://localhost:3000                                                    |
| `npm run worker:local`  | **Recommended.** Runs the price-updater in the background. Does not sync to Turso Cloud (saves quota). |
| `npm run worker:enrich` | Fetches 1-year history for products that don't have charts yet.                                        |
| `npm run db:studio`     | Opens a GUI to view and edit your local database.                                                      |

## 🚀 2. Deployment & Cloud

| Command                    | Description                                                                                    |
| :------------------------- | :--------------------------------------------------------------------------------------------- |
| `npm run db:lite`          | **Step 1.** Creates the `cleverprices-lite.db` (stripped of raw JSON and history) for testing. |
| `npm run deploy`           | **Step 2.** Runs the lite preparation, commits everything, and pushes to Production.           |
| `npm run db:migrate:cloud` | Pushes your latest schema changes to the Turso production database.                            |

## 📥 3. Data Ingestion

| Command           | Description                                                    |
| :---------------- | :------------------------------------------------------------- |
| `npm run import`  | Imports new products from `data/keepa_export.csv`.             |
| `npm run db:pull` | Downloads the Production Turso database to your local machine. |

## 💡 Troubleshooting

- **Database "Locked"?** The system now uses WAL mode, so this should rarely happen. If it does, stop the worker and restart it.
- **Charts Empty?** Run `npm run worker:enrich`. Note: it takes tokens, so use it sparingly.
