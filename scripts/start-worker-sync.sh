#!/bin/bash
# Start Keepa Worker (Production/Background) with Auto Cloud Sync
# This script runs the worker and syncs to cloud every 12 hours

echo "🚀 Starting Keepa Worker in background with auto cloud sync..."
mkdir -p logs

LOG_FILE="logs/worker-bg-$(date +%Y-%m-%d).log"
LAST_SYNC=$(date +%s)
SYNC_INTERVAL=$((12 * 60 * 60))

sync_to_cloud() {
    echo "$(date) - [Sync] Starting cloud sync..." >> "$LOG_FILE"
    ./scripts/sync-to-cloud.sh >> "$LOG_FILE" 2>&1
    LAST_SYNC=$(date +%s)
}

# Trap for graceful shutdown
trap 'kill $WORKER_PID; exit 0' INT TERM

while true; do
    echo "$(date) - [Worker] Starting process..." >> "$LOG_FILE"
    bun run worker:run -c >> "$LOG_FILE" 2>&1 &
    WORKER_PID=$!
    
    # Monitor and Sync loop
    while kill -0 $WORKER_PID 2>/dev/null; do
        sleep 300
        CURRENT_TIME=$(date +%s)
        if [ $((CURRENT_TIME - LAST_SYNC)) -ge $SYNC_INTERVAL ]; then
            sync_to_cloud
        fi
    done
    
    echo "$(date) - [Worker] Warning: Worker crashed. Restarting in 30s..." >> "$LOG_FILE"
    sleep 30
done
