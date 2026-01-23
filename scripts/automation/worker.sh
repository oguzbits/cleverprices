#!/bin/bash
# Consolidated Keepa Worker Wrapper
# Runs the background worker process with auto-restart and logging.
# Usage: ./scripts/automation/worker.sh [--silent]

SILENT=false
for arg in "$@"; do
    case $arg in
        -s|--silent) SILENT=true ;;
    esac
done

function notify {
    if [ "$SILENT" = false ]; then
        osascript -e "display notification \"$1\" with title \"CleverPrices Worker\" sound name \"Glass\"" 2>/dev/null || true
    fi
}

# Change to project root
cd "$(dirname "$0")/../.." || exit 1
mkdir -p logs

LOG_FILE="logs/worker-$(date +%Y-%m-%d).log"
echo "🚀 Starting worker... Logging to $LOG_FILE"

# Trap for graceful shutdown
trap 'notify "Worker process stopped."; exit 0' INT TERM EXIT

while true; do
    echo "[$(date)] Starting worker process..." >> "$LOG_FILE"
    
    # Run the worker via bun script
    # -c flag for "continuous" if supported by your keepa-worker.ts
    ARGS="-c de"
    if [ "$SILENT" = true ]; then ARGS="$ARGS --silent"; fi
    
    bun run worker:run $ARGS >> "$LOG_FILE" 2>&1
    
    echo "[$(date)] Worker stopped/crashed. Restarting in 30s..." >> "$LOG_FILE"
    notify "Worker stopped unexpectedly. Restarting..."
    sleep 30
done
