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

# Trap for graceful shutdown
trap 'kill $WORKER_PID; exit 0' INT TERM

while true; do
    echo "$(date) - [Worker] Starting process (Internal sync enabled)..." | tee -a "$LOG_FILE"
    bun run worker:run -c 2>&1 | tee -a "$LOG_FILE"
    
    echo "$(date) - [Worker] Warning: Worker crashed. Restarting in 30s..." | tee -a "$LOG_FILE"
    sleep 30
done
