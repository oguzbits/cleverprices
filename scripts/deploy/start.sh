#!/bin/sh
set -e

echo "[Start] 🔍 RUNNING ISOLATED STARTUP..."
echo "[Start] Ignored arguments: $@"

# Diagnostics
echo "[Start] User: $(id)"
echo "[Start] Directory: $(pwd)"
ls -F

# Explicitly clear internal positional parameters just in case
set --

if [ -n "$LITESTREAM_BUCKET" ] && [ -n "$LITESTREAM_ACCESS_KEY_ID" ]; then
    echo "[Start] 🚀 Starting Litestream replication..."
    # We use explicit flags and NO positional arguments for Litestream
    # The app command is passed via -exec
    litestream replicate -config /app/litestream.yml -exec "node server.js" || {
        EXIT_CODE=$?
        echo "[Start] ❌ LITESTREAM/APP CRASHED with code $EXIT_CODE"
        echo "[Start] 🔍 Sleeping for 30m for diagnostic access..."
        sleep 1800
        exit $EXIT_CODE
    }
else
    echo "[Start] ⚠️ Starting Node directly (No Litestream)..."
    node server.js || {
        EXIT_CODE=$?
        echo "[Start] ❌ APP CRASHED with code $EXIT_CODE"
        echo "[Start] 🔍 Sleeping for 30m for diagnostic access..."
        sleep 1800
        exit $EXIT_CODE
    }
fi
