#!/bin/bash
# Start Keepa Worker with Auto Cloud Sync
# This script runs the worker and syncs to cloud every 12 hours

echo "🚀 Starting Keepa Worker with auto cloud sync..."
echo "📍 Working directory: $(pwd)"
echo "⏰ Started at: $(date)"
echo "💡 Press Ctrl+C to stop"
echo ""

# Create logs directory if it doesn't exist
mkdir -p logs

# Get today's log file
LOG_FILE="logs/worker-$(date +%Y-%m-%d).log"

echo "📝 Logging to: $LOG_FILE"
echo "☁️  Auto-sync to cloud: Every 12 hours"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Track last sync time
LAST_SYNC=$(date +%s)
SYNC_INTERVAL=$((12 * 60 * 60))  # 12 hours in seconds

# Function to sync to cloud
sync_to_cloud() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "☁️  Syncing to Turso cloud at $(date)..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    ./scripts/sync-to-cloud.sh 2>&1 | tee -a "$LOG_FILE"
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Cloud sync complete. Next sync in 12 hours."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    LAST_SYNC=$(date +%s)
}

# Function to check if sync is needed
check_sync() {
    CURRENT_TIME=$(date +%s)
    TIME_SINCE_SYNC=$((CURRENT_TIME - LAST_SYNC))
    
    if [ $TIME_SINCE_SYNC -ge $SYNC_INTERVAL ]; then
        sync_to_cloud
    fi
}

# Trap Ctrl+C to exit gracefully
trap 'echo ""; echo "🛑 Stopping worker..."; exit 0' INT TERM

# Run worker and monitor for sync in background
echo "▶️  Starting worker..."
echo ""

# We run the worker directly so we can see output, but we run the monitor loop in background
bun run worker:run -c 2>&1 | tee -a "$LOG_FILE" &
WORKER_PID=$!

# Monitor loop - check for sync every 5 minutes
while kill -0 $WORKER_PID 2>/dev/null; do
    sleep 300  # Check every 5 minutes
    check_sync
done

echo "Worker stopped."
