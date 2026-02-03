#!/bin/sh
# Dokploy Host Backup Script
echo "[Backup] Starting Host-side Backup..."

# 1. Environment (Absolute paths for Host execution)
export R2_ACCESS_KEY_ID="1002247d9102d7ca09874e07b5fe30d2"
export R2_SECRET_ACCESS_KEY="f6b10ad6baeeb38bbad8398b7557b2efd83e83f38e13ba85db5f94d8a2b4fc56"
export R2_BUCKET="cleverprices-backups"
export R2_ENDPOINT="https://1016e27361b079eda5116734500cca28.r2.cloudflarestorage.com"

# 2. Paths
DB_PATH="/etc/dokploy/volumes/cleverprices/data/cleverprices.db"
BACKUP_DIR="/tmp/cleverprices-backups"
mkdir -p $BACKUP_DIR

TIMESTAMP=$(date +%Y-%m-%d-%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/backup-$TIMESTAMP.db.gz"

# 3. Check if DB exists
if [ ! -f "$DB_PATH" ]; then
    echo "❌ Database not found at $DB_PATH"
    exit 1
fi

# 4. Compress
echo "📦 Compressing $DB_PATH..."
gzip -c "$DB_PATH" > "$BACKUP_FILE"

# 5. Push to R2 (Using the main app container just for the AWS tools)
echo "☁️ Uploading to R2 via main app container..."
# We use the 'Production' app container because it is ALWAYS running
CONTAINER_ID=$(docker ps -q -f name=cleverprices-mlaii0)

if [ -z "$CONTAINER_ID" ]; then
    echo "❌ Production container not found. Is the website up?"
    exit 1
fi

# Copy the compressed file into the living container and run the upload
docker cp "$BACKUP_FILE" "$CONTAINER_ID:/tmp/backup.db.gz"
docker exec -e R2_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
            -e R2_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
            -e R2_BUCKET="$R2_BUCKET" \
            -e R2_ENDPOINT="$R2_ENDPOINT" \
            "$CONTAINER_ID" \
            node -e "
const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const fs = require('fs');
const s3 = new S3Client({ 
    region: 'auto', 
    endpoint: '$R2_ENDPOINT', 
    credentials: { accessKeyId: '$R2_ACCESS_KEY_ID', secretAccessKey: '$R2_SECRET_ACCESS_KEY' } 
});
new Upload({
    client: s3,
    params: { Bucket: '$R2_BUCKET', Key: 'backup-$TIMESTAMP.db.gz', Body: fs.createReadStream('/tmp/backup.db.gz') }
}).done().then(() => console.log('✅ Upload Success')).catch(e => { console.error(e); process.exit(1); });
"

echo "🧹 Cleaning up..."
rm "$BACKUP_FILE"
echo "✅ Backup sequence complete!"
