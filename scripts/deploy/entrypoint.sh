#!/bin/sh
set -e

echo "[Entrypoint] 🔍 RUNNING DIAGNOSTICS..."
echo "[Entrypoint] Current User: $(id)"
echo "[Entrypoint] Working Directory: $(pwd)"

echo "[Entrypoint] Filesystem check:"
ls -F || echo "ls failed"

echo "[Entrypoint] Environment check (Safe keys only):"
# Prevent grep from killing the script if no matches are found
env | grep -vE "PASSWORD|TOKEN|SECRET|KEY" || true

# Start the app
START_CMD="node server.js"
if [ -n "$LITESTREAM_BUCKET" ] && [ -n "$LITESTREAM_ACCESS_KEY_ID" ]; then
    echo "[Entrypoint] 🚀 Starting Litestream replication..."
    START_CMD="litestream replicate -config /app/litestream.yml -- $START_CMD"
fi

echo "[Entrypoint] 🏁 Executing: $START_CMD"

# Execute and catch failure to keep container alive for debugging
# Note: we don't use 'exec' here so we can catch the exit code
$START_CMD || {
    EXIT_CODE=$?
    echo "[Entrypoint] ❌ APPLICATION CRASHED with exit code $EXIT_CODE"
    echo "[Entrypoint] 🔍 Keeping container alive for 30 minutes for diagnostic access..."
    echo "[Entrypoint] Run: docker exec -it <container_id> sh"
    sleep 1800
    exit $EXIT_CODE
}
