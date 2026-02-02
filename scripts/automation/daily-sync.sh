#!/bin/bash
# Daily Sync Job
# Recommended Crontab: 0 4 * * * /path/to/cleverprices/scripts/automation/daily-sync.sh

# Change to project root
cd "$(dirname "$0")/../.." || exit 1

# Load environment variables if they exist
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

mkdir -p logs
LOG_FILE="logs/daily-sync-$(date +%Y-%m).log"

echo "=== [$(date)] Daily Sync Started ===" >> "$LOG_FILE"

# 1. Update Prices from Keepa
bun run update-prices >> "$LOG_FILE" 2>&1

# 2. Deploy updated data to Turso Cloud
bun run db:deploy --delta --force >> "$LOG_FILE" 2>&1

# 3. Warm the production cache (Optional)
bun run warm-cache >> "$LOG_FILE" 2>&1

echo "=== [$(date)] Daily Sync Finished ===" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
