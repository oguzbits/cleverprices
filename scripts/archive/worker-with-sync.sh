#!/bin/bash
# Start Keepa Worker with Auto Cloud Sync
# This script runs the worker and syncs to cloud every 12 hours
# Usage: ./scripts/worker-with-sync.sh [--silent|-s]

SILENT=false

# Simple argument parsing
for arg in "$@"
do
    case $arg in
        -s|--silent)
        SILENT=true
        shift
        ;;
    esac
done

function notify {
    local message="$1"
    if [ "$SILENT" = false ]; then
        osascript -e "display notification \"$message\" with title \"CleverPrices Worker\" sound name \"Glass\""
    fi
}

echo "🚀 Starting Keepa Worker with auto cloud sync..."
echo "📍 Working directory: $(pwd)"
echo "⏰ Started at: $(date)"
echo "💡 Press Ctrl+C to stop"
if [ "$SILENT" = true ]; then
    echo "🔕 Silent mode: Notifications disabled"
else
    echo "🔔 Notifications enabled (use --silent to disable)"
fi
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

# Trap for graceful shutdown of the wrapper script
trap 'notify "Worker wrapper process stopped."; exit 0' INT TERM EXIT

while true; do
    echo "$(date) - [Worker] Starting process (Internal sync enabled)..." | tee -a "$LOG_FILE"
    
    # Run the worker
    ARGS="-c"
    if [ "$SILENT" = true ]; then
        ARGS="$ARGS --silent"
    fi
    bun run worker:run $ARGS 2>&1 | tee -a "$LOG_FILE"
    
    # If we get here, the worker crashed or stopped
    echo "$(date) - [Worker] Warning: Worker crashed. Restarting in 30s..." | tee -a "$LOG_FILE"
    
    notify "Worker stopped unexpectedly. Restarting in 30s..."
    
    sleep 30
done
