#!/bin/bash

# Exit on error
set -e

echo "🚀 Preparing 'CleverPrices Lite' deployment..."

# 1. Verify Master DB exists
if [ ! -f "data/cleverprices.db" ]; then
    echo "❌ Error: Master database 'data/cleverprices.db' not found!"
    exit 1
fi

# 2. Copy Master to Lite
echo "📦 Creating Lite database copy..."
cp data/cleverprices.db data/cleverprices-lite.db

# 3. Prune History, Heavy Text Columns & Vacuum
echo "🧹 Pruning history, raw_data, features, description and optimizing..."
sqlite3 data/cleverprices-lite.db "PRAGMA journal_mode = DELETE; PRAGMA synchronous = OFF; DELETE FROM price_history; UPDATE products SET raw_data = NULL, features = NULL, description = NULL; INSERT INTO products_search(products_search) VALUES('rebuild'); VACUUM;"

# 4. Show Size Comparison
echo "📊 Database Size Comparison:"
ls -lh data/cleverprices.db data/cleverprices-lite.db

# 5. Git Stage
echo "git add data/cleverprices-lite.db..."
git add -f data/cleverprices-lite.db

echo "✅ Ready to commit and push!"
