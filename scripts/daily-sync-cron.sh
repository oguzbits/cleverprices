#!/bin/bash
# Daily Cron Job - Sync to Cloud
# Add this to your crontab to run daily at 4 AM:
# 0 4 * * * /path/to/cleverprices/scripts/daily-sync-cron.sh

# Change to project directory
cd "$(dirname "$0")/.." || exit 1

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Create logs directory
mkdir -p logs

# Run sync and log output
echo "=== Daily Sync Started at $(date) ===" >> logs/daily-sync.log
./scripts/sync-to-cloud.sh >> logs/daily-sync.log 2>&1
echo "=== Daily Sync Finished at $(date) ===" >> logs/daily-sync.log
echo "" >> logs/daily-sync.log
