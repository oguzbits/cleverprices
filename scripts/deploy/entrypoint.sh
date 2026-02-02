#!/bin/sh
set -e

echo "[Entrypoint] 🔍 RUNNING DIAGNOSTICS..."
echo "[Entrypoint] Script Args: $@"
echo "[Entrypoint] Litestream Version: $(litestream version || echo 'unknown')"

# Clear arguments to prevent them from leaking into the litestream command
# This is crucial because anything after 'replicate -config ...' is seen as a replica URL
echo "[Entrypoint] Clearing arguments: $@"
set --

echo "[Entrypoint] Current User: $(id)"
echo "[Entrypoint] Working Directory: $(pwd)"

echo "[Entrypoint] Filesystem check:"
ls -F || echo "ls failed"

echo "[Entrypoint] Environment check (Safe keys only):"
env | grep -vE "PASSWORD|TOKEN|SECRET|KEY" || true

# Start the app
if [ -n "$LITESTREAM_BUCKET" ] && [ -n "$LITESTREAM_ACCESS_KEY_ID" ]; then
    echo "[Entrypoint] 🚀 Starting Litestream replication..."
    # Call directly to avoid space expansion issues in variables
    litestream replicate -config /app/litestream.yml -exec "node server.js" || {
        EXIT_CODE=$?
        echo "[Entrypoint] ❌ LITESTREAM/APP CRASHED with exit code $EXIT_CODE"
        echo "[Entrypoint] 🔍 Keeping container alive for diagnostic access..."
        sleep 1800
        exit $EXIT_CODE
    }
else
    echo "[Entrypoint] ⚠️ Starting app directly with node (no Litestream)..."
    if [ -f "server.js" ]; then
        node server.js || {
            EXIT_CODE=$?
            echo "[Entrypoint] ❌ APP CRASHED with exit code $EXIT_CODE"
            sleep 1800
            exit $EXIT_CODE
        }
    else
        echo "[ERROR] server.js not found in $(pwd)"
        ls -R /app
        sleep 1800
        exit 1
    fi
fi
