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

# Determine if Litestream should be used
if [ -n "$LITESTREAM_BUCKET" ] && [ -n "$LITESTREAM_ACCESS_KEY_ID" ]; then
    echo "[Entrypoint] 🚀 Starting Litestream replication..."
    exec litestream replicate -config /app/litestream.yml -- node server.js
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
