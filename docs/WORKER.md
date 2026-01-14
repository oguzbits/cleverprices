# 🤖 CleverPrices Worker Guide

This guide covers everything you need to manage your Keepa data worker and cloud synchronization.

---

## ⚡ Quick Start: One-Time Setup

If you haven't already, run this command once to automate everything (Daily Syncs, Backups, and Auto-start):

```bash
./scripts/setup-automation.sh
```

---

## 🛠 Daily Usage: How to Run the Worker

| Mode            | Command               | Best For...                                                                            |
| :-------------- | :-------------------- | :------------------------------------------------------------------------------------- |
| **Live Logs**   | `bun run worker:live` | **Development:** Seeing everything in real-time. Includes 12h cloud sync.              |
| **Background**  | `bun run worker`      | **Production:** Set it and forget it. Auto-restarts on crash. Includes 12h cloud sync. |
| **Manual Sync** | `bun run db:deploy`   | **On-demand:** Pushing local updates to the cloud immediately.                         |

---

## 📅 The Automation Schedule

The system automatically handles the following via your Mac's `crontab`:

- **3:00 AM:** Database Backup (Saved to `data/backups/`)
- **4:00 AM:** Cloud Sync (Local → Turso Cloud)
- **4:00 PM:** Cloud Sync (Local → Turso Cloud)

---

## 📊 Monitoring & Maintenance

### Check Logs

Logs are automatically rotated by date in the `/logs` folder.

```bash
# Watch the latest worker logs
tail -f logs/worker-$(date +%Y-%m-%d).log
```

### Check Database Stats

```bash
sqlite3 data/cleverprices.db "SELECT count(*) FROM products;"
```

---

## 🆘 Troubleshooting & Constraints

### Keepa Token Limits

- **Rate:** 20 tokens/minute.
- **Behavior:** The worker will automatically "nap" when tokens are low and resume when they refill. **Do not stop the worker for "Low Token" logs.**

### Sync Issues

- If the cloud doesn't update, verify your environment variables in `.env.local`:
  - `TURSO_DATABASE_URL`
  - `TURSO_AUTH_TOKEN`
  - `KEEPA_API_KEY`

### Worker is Stuck

```bash
# Stop all worker processes
pkill -f keepa-worker
# Then restart with your choice of command above.
```

---

_For deep architectural details, refer to the original implementation plan or source code in `/scripts`._
