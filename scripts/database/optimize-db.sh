#!/bin/bash

# Exit on error
set -e

echo "🚀 Optimizing CleverPrices Database..."

# 1. Verify DB exists
if [ ! -f "data/cleverprices.db" ]; then
    echo "❌ Error: Database 'data/cleverprices.db' not found!"
    exit 1
fi

# 2. Ensure Search Index Exists (FTS5)
echo "🔍 Ensuring FTS5 Search Index..."
sqlite3 data/cleverprices.db "CREATE VIRTUAL TABLE IF NOT EXISTS products_search USING fts5(id UNINDEXED, title, brand, category, content='products', content_rowid='id');"

# 3. Optimize and Rebuild Search Cache
echo "🧹 Optimizing database and rebuilding search index..."
sqlite3 data/cleverprices.db "PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; INSERT INTO products_search(products_search) VALUES('rebuild'); VACUUM; PRAGMA optimize;"

echo "📊 Database Size:"
ls -lh data/cleverprices.db

echo "✅ Optimization complete!"
