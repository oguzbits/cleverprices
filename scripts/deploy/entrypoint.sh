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
if [ -n "$LITESTREAM_BUCKET" ] && [ -n "$LITESTREAM_ACCESS_KEY_ID" ]; then
    echo "[Entrypoint] 🚀 Starting Litestream replication..."
    # Correct Litestream syntax for executing a subpoenaed process
    exec litestream replicate -config /app/litestream.yml -exec "node server.js"
else
    echo "[Entrypoint] ⚠️ Starting app directly with node (no Litestream)..."
    # Ensure server.js exists before running
    if [ -f "server.js" ]; then
        exec node server.js
    else
        echo "[ERROR] server.js not found in $(pwd)"
        ls -R /app
        exit 1
    fi
fi
