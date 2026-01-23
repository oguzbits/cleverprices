#!/bin/bash
# Start Keepa Worker (Production/Background) with Auto Cloud Sync
# This script runs the worker and syncs to cloud every 12 hours
# Usage: ./scripts/start-worker-sync.sh [--silent|-s]

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

echo "🚀 Starting Keepa Worker in background with auto cloud sync..."
mkdir -p logs

LOG_FILE="logs/worker-bg-$(date +%Y-%m-%d).log"

# Trap for graceful shutdown of the wrapper script
trap 'notify "Worker wrapper process stopped."; exit 0' INT TERM EXIT

while true; do
    echo "$(date) - [Worker] Starting process (Internal sync enabled)..." >> "$LOG_FILE"
    
    # Run the worker
    ARGS="-c"
    if [ "$SILENT" = true ]; then
        ARGS="$ARGS --silent"
    fi
    bun run worker:run $ARGS >> "$LOG_FILE" 2>&1
    
    # If we get here, the worker crashed or stopped
    echo "$(date) - [Worker] Warning: Worker crashed. Restarting in 30s..." >> "$LOG_FILE"
    
    notify "Worker stopped unexpectedly. Restarting in 30s..."
    
    sleep 30
done
