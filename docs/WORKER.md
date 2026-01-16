# 🤖 CleverPrices Worker Guide

The **CleverPrices Worker** is an intelligent, self-healing background process that manages:

1.  **Price Updates**: Keeping product prices fresh (Every ~15 mins).
2.  **Cloud Sync**: Pushing local database updates to Turso (Every ~12 hours).
3.  **Token Management**: Respecting Keepa API limits.

---

## ⚡ Quick Start

### Run Interactively (Recommended)

This runs the worker in "Continuous Mode" with smart sleeping.

```bash
bun run worker:run -c
```

### Run Silently (No Notifications)

If you don't want desktop notifications when the worker stops or errors:

```bash
bun run worker:run -c --silent
```

### Run Once (Single Pass)

Useful for cron jobs or one-off updates.

```bash
bun run worker:run
```

---

## 🧠 Intelligent Features

### 1. Smart Sleep & Scheduling

The worker is not a dumb infinite loop. It calculates the exact time until the next task is required.

- **Standard Cycle (Price Updates)**: Runs every **15 minutes**.
- **Cloud Sync (Database Deploy)**: Runs every **12 hours** (configurable via `SYNC_INTERVAL_MS`).

At the end of a cycle, it will log:

> 💤 Cycle complete. Sleeping 12m until next Standard Cycle at 5:45:00 PM...

### 2. State Persistence

The worker remembers when it last ran, even if you restart your computer.
It stores its state in `logs/worker-state.json`:

```json
{
  "lastRun": 1705423000000,
  "lastRunHuman": "1/16/2026, 5:36:40 PM",
  "lastCloudSync": 1705423000000,
  "lastCloudSyncHuman": "1/16/2026, 5:36:40 PM"
}
```

- **Benefit**: If you stop the worker and start it 5 minutes later, it won't immediately hammer the API. It sees it just ran and checks the schedule.

### 3. Token Safety

- The worker constantly monitors Keepa API tokens.
- **Circuit Breaker**: If tokens drop below **20**, it immediately aborts the current batch to prevent API exhaustion and waits for the next cycle.

### 4. Desktop Notifications

- **On Crash**: You get a notification if the worker crashes.
- **On Stop**: You get a notification if you manually stop it (Ctrl+C) or close the terminal window.
- **Silence**: Use `--silent` or `-s` to disable this.

---

## 🛠 Advanced Usage

### Manual Import

To add _new_ products from a CSV file (not just update existing ones):

```bash
bun run scripts/import-from-csv.ts path/to/file.csv
```

### Force Enrichment

To manually forcing a metadata update (features, descriptions):

```bash
bun run scripts/enrich-products.ts
```

### Manual Cloud Sync

To force push the local database to the cloud immediately:

```bash
bun run db:deploy
```

---

## 📊 Monitoring

### Check Status

Simply look at the `logs/worker-state.json` file to see the last successful run times.

### Logs

The worker logs heavily to stdout:

- `⚖️ Phase 1`: Price Updates
- `🧪 Phase 2`: Metadata Enrichment
- `☁️ Phase 3`: Cloud Sync
- `💤`: Sleep/Schedule

---

## ⚠️ Troubleshooting

**"Worker stuck sleeping?"**
It's just respecting the schedule. Check `logs/worker-state.json`. If you want to force a run, delete that file.

**"No Notification on Close?"**
Notifications rely on the terminal process. If you force-quit the terminal (SIGKILL), the OS might kill the worker before it can notify. Standard closing (Cmd+W) usually works.

**"Database locked?"**
Ensure only one worker instance is running at a time.
