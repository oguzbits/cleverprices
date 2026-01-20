# 🛠 CleverPrices Command Center

This guide explains the most important commands for your workflow.

## 🏠 1. Local Development (Daily)

| Command                 | Description                                                                                            |
| :---------------------- | :----------------------------------------------------------------------------------------------------- |
| `bun run dev`           | Starts the Next.js website at http://localhost:3000                                                    |
| `bun run worker:local`  | **Recommended.** Runs the price-updater in the background. Does not sync to Turso Cloud (saves quota). |
| `bun run worker:enrich` | Fetches 1-year history for products that don't have charts yet.                                        |
| `bun run db:studio`     | Opens a GUI to view and edit your local database.                                                      |

## 🚀 2. Deployment & Cloud

| Command                    | Description                                                                                                           |
| :------------------------- | :-------------------------------------------------------------------------------------------------------------------- |
| `bun run db:lite`          | **Step 1.** Creates `cleverprices-lite.db`. Strips heavy columns & sets `DELETE` journal mode (mandatory for Vercel). |
| `bun run deploy`           | **Step 2.** Runs the lite preparation, commits everything, and pushes to Production.                                  |
| `bun run db:migrate:cloud` | Pushes your latest schema changes to the Turso production database.                                                   |

## 📥 3. Data Ingestion

| Command           | Description                                                    |
| :---------------- | :------------------------------------------------------------- |
| `bun run import`  | Imports new products from `data/keepa_export.csv`.             |
| `bun run db:pull` | Downloads the Production Turso database to your local machine. |

## 💡 Troubleshooting

- **Search fails in Production but works locally?** This is usually because `cleverprices-lite.db` was not prepared correctly. Run `bun run deploy` instead of just a raw `git push`.
- **Database "Locked"?** If local, restart the worker. If production, ensure `journal_mode=DELETE` was applied by `db:lite`.
- **Charts Empty?** Run `bun run worker:enrich`. Note: it takes tokens, so use it sparingly.
