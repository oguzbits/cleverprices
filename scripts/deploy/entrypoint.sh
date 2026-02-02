#!/bin/sh
set -e

echo "[Entrypoint] 🔍 RUNNING DIAGNOSTICS..."
echo "[Entrypoint] Current User: $(id)"
echo "[Entrypoint] Working Directory: $(pwd)"
echo "[Entrypoint] Filesystem check (Recursive):"
ls -F -R /app

echo "[Entrypoint] Environment check (Filtered):"
env | grep -v "PASSWORD" | grep -v "TOKEN" | grep -v "SECRET" | grep -v "KEY"

# Determine if Litestream should be used
if [ -n "$LITESTREAM_BUCKET" ] && [ -n "$LITESTREAM_ACCESS_KEY_ID" ]; then
    echo "[Entrypoint] 🚀 Starting Litestream replication..."
    # Start Litestream and the app
    exec litestream replicate -config /app/litestream.yml -- node server.js
else
    echo "[Entrypoint] ⚠️ Starting app directly with node (no Litestream)..."
    exec node server.js
fi
