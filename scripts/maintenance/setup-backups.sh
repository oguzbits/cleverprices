#!/bin/bash
# PROD BACKUP SETUP
# Run this script on your production server (SSH) to enable daily SQLite backups.

echo "Setting up daily backups for CleverPrices..."

# 1. Create the backup directory
mkdir -p /etc/dokploy/volumes/cleverprices/backups

# 2. Create the backup script
cat << 'EOF' > /usr/local/bin/backup-cleverprices.sh
#!/bin/bash
# Daily SQLite Backup for CleverPrices
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="/etc/dokploy/volumes/cleverprices/backups"
DB_FILE="/etc/dokploy/volumes/cleverprices/data/cleverprices.db"
BACKUP_FILE="$BACKUP_DIR/cleverprices_$DATE.db"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "cleverprices_*.db" -mtime +7 -delete

# Perform safe backup using sqlite3 (handles WAL mode)
if [ -f "$DB_FILE" ]; then
    echo "[$(date)] Backing up to $BACKUP_FILE..."
    sqlite3 "$DB_FILE" ".backup '$BACKUP_FILE'"
    echo "[$(date)] Backup complete."
else
    echo "[$(date)] ERROR: Database file not found at $DB_FILE"
fi
EOF

# 3. Make it executable
chmod +x /usr/local/bin/backup-cleverprices.sh

# 4. Add to Crontab (Runs daily at 3:00 AM)
# Checks if the cron job already exists to avoid duplicates
(crontab -l 2>/dev/null | grep -F "/usr/local/bin/backup-cleverprices.sh" > /dev/null)
if [ $? -ne 0 ]; then
    (crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/backup-cleverprices.sh >> /var/log/backup-cleverprices.log 2>&1") | crontab -
    echo "Cron job added: Runs daily at 3:00 AM."
else
    echo "Cron job already exists. Skipping."
fi

echo "Setup complete. You can test the backup manually by running: /usr/local/bin/backup-cleverprices.sh"
echo "Backup logs: /var/log/backup-cleverprices.log"
echo "Backup files: /etc/dokploy/volumes/cleverprices/backups/"
