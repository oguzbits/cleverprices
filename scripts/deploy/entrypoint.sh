#!/bin/sh
set -e

# Load environment variables from /app/.env if it exists (for local debugging)
if [ -f /app/.env ]; then
  export $(grep -v '^#' /app/.env | xargs)
fi

# Determine if Litestream should be used
if [ -n "$LITESTREAM_BUCKET" ] && [ -n "$LITESTREAM_ACCESS_KEY_ID" ]; then
    echo "[Litestream] 🚀 Starting replication for cleverprices.db..."
    # Start Litestream in the background and run the app
    # We use 'exec' to ensure the app receives signals (like SIGTERM)
    exec litestream replicate -config /app/litestream.yml -- bun server.js
else
    echo "[Entrypoint] ⚠️ Litestream not configured (missing bucket or credentials). Starting app directly."
    exec bun server.js
fi
