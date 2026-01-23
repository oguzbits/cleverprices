#!/bin/bash
# Sync Local Database to Turso Cloud
# Run this daily or when you want to deploy updates

echo "☁️  Syncing local database to Turso cloud..."
echo "⏰ Started at: $(date)"
echo ""

# Check if local database exists
if [ ! -f "./data/cleverprices.db" ]; then
    echo "❌ Error: Local database not found at ./data/cleverprices.db"
    exit 1
fi

# Check if Turso credentials are set
if [ -z "$TURSO_DATABASE_URL" ] || [ -z "$TURSO_AUTH_TOKEN" ]; then
    echo "❌ Error: TURSO_DATABASE_URL or TURSO_AUTH_TOKEN not set"
    echo "💡 Set them in your .env.local file or export them:"
    echo "   export TURSO_DATABASE_URL='your_url'"
    echo "   export TURSO_AUTH_TOKEN='your_token'"
    exit 1
fi

# Get database stats before sync
echo "📊 Local Database Stats:"
echo "   Size: $(du -h ./data/cleverprices.db | cut -f1)"
echo "   Products: $(sqlite3 ./data/cleverprices.db 'SELECT COUNT(*) FROM products;')"
echo "   Prices: $(sqlite3 ./data/cleverprices.db 'SELECT COUNT(*) FROM prices;')"
echo ""

# Run the deploy script
echo "🚀 Running deployment..."
bun run db:deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Sync completed successfully at $(date)"
    echo "🌐 Your Vercel site will now show the updated data"
else
    echo ""
    echo "❌ Sync failed at $(date)"
    exit 1
fi
