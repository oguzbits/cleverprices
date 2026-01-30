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

# 2.5 Ensure Search Index Exists (FTS5)
echo "🔍 Ensuring FTS5 Search Index..."
sqlite3 data/cleverprices-lite.db "CREATE VIRTUAL TABLE IF NOT EXISTS products_search USING fts5(id UNINDEXED, title, brand, category, content='products', content_rowid='id');"

# 3. Optimize and Rebuild Search Cache
echo "🧹 Optimizing Lite database and rebuilding search index..."
sqlite3 data/cleverprices-lite.db "PRAGMA journal_mode = DELETE; PRAGMA synchronous = OFF; INSERT INTO products_search(products_search) VALUES('rebuild'); VACUUM;"

# 4. Show Size Comparison
echo "📊 Database Size Comparison:"
ls -lh data/cleverprices.db data/cleverprices-lite.db

# 5. Git Stage
# echo "git add data/cleverprices-lite.db..."
# git add -f data/cleverprices-lite.db
echo "⚠️ Skipping git add for lite DB (managed via Vercel Blob)"

echo "✅ Ready to commit and push!"
