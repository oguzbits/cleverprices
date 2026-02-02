#!/bin/sh
set -e

# Load environment variables from /app/.env if it exists (for local debugging)
if [ -f /app/.env ]; then
  export $(grep -v '^#' /app/.env | xargs)
fi

# Determine if Litestream should be used
if [ -n "$LITESTREAM_BUCKET" ] && [ -n "$LITESTREAM_ACCESS_KEY_ID" ]; then
    echo "[Entrypoint] 🚀 Starting Litestream replication..."
    # Start Litestream and the app
    exec litestream replicate -config /app/litestream.yml -- node server.js
else
    echo "[Entrypoint] ⚠️ Starting app directly with node (no Litestream)..."
    exec node server.js
fi
