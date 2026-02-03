#!/bin/sh
echo "[DEBUG] Starting Backup Wrapper..." >> /app/data/backup.log
date >> /app/data/backup.log

# Ensure we are in the app directory
cd /app

# Ensure node is in path
export PATH=$PATH:/usr/bin:/usr/local/bin

# Run the backup and capture both success and error
node scripts/backup-db.mjs >> /app/data/backup.log 2>&1

echo "[DEBUG] Backup Wrapper Finished with code $?" >> /app/data/backup.log
echo "-------------------" >> /app/data/backup.log
