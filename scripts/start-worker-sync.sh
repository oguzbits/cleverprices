#!/bin/bash
# Start Keepa Worker (Production/Background) with Auto Cloud Sync
# This script runs the worker and syncs to cloud every 12 hours

echo "🚀 Starting Keepa Worker in background with auto cloud sync..."
mkdir -p logs

LOG_FILE="logs/worker-bg-$(date +%Y-%m-%d).log"

# Trap for graceful shutdown
trap 'kill $WORKER_PID; exit 0' INT TERM

while true; do
    echo "$(date) - [Worker] Starting process (Internal sync enabled)..." >> "$LOG_FILE"
    bun run worker:run -c >> "$LOG_FILE" 2>&1
    
    echo "$(date) - [Worker] Warning: Worker crashed. Restarting in 30s..." >> "$LOG_FILE"
    sleep 30
done
