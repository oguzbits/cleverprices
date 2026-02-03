#!/bin/sh
# Dokploy Price Update Task
# This script runs inside the production container to update prices.

echo "--- 🚀 PRICE UPDATE START: $(date) ---"

# 1. Resolve Container ID
# We look for the container running the production app
CONTAINER_ID=$(docker ps --format '{{.Names}}' | grep 'cleverprices-mlaii0' | head -n 1)

if [ -z "$CONTAINER_ID" ]; then
    echo "❌ ERROR: Production container (cleverprices-mlaii0) not found."
    echo "Check if the application is running in Dokploy."
    exit 1
fi

echo "✅ Target Container: $CONTAINER_ID"

# 2. Execute the Worker
# We use Bun which is now installed in the production image.
# The 'de' argument specifies the country, and '-c' is for continuous (optional).
echo "📦 Running keepa-worker.ts..."

docker exec "$CONTAINER_ID" /root/.bun/bin/bun run scripts/automation/keepa-worker.ts de

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "--- ✅ PRICE UPDATE COMPLETE: $(date) ---"
else
    echo "--- ❌ PRICE UPDATE FAILED (Exit Code: $EXIT_CODE): $(date) ---"
    exit $EXIT_CODE
fi
