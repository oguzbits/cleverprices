#!/bin/bash
# One-Time Setup for Complete Automation
# Run this once to set up everything

set -e  # Exit on error

echo "🚀 Setting up complete automation for CleverPrices worker..."
echo ""

# Get the absolute path to the project directory
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
echo "📁 Project directory: $PROJECT_DIR"
echo ""

# Step 1: Create necessary directories
echo "📂 Creating directories..."
mkdir -p "$PROJECT_DIR/logs"
mkdir -p "$PROJECT_DIR/data/backups"
echo "   ✅ Created logs/ and data/backups/"
echo ""

# Step 2: Make scripts executable
echo "🔧 Making scripts executable..."
chmod +x "$PROJECT_DIR/scripts/start-worker-sync.sh"
chmod +x "$PROJECT_DIR/scripts/sync-to-cloud.sh"
chmod +x "$PROJECT_DIR/scripts/daily-sync-cron.sh"
echo "   ✅ Scripts are now executable"
echo ""

# Step 3: Check environment variables
echo "🔐 Checking environment variables..."
if [ -f "$PROJECT_DIR/.env.local" ]; then
    echo "   ✅ Found .env.local"
    
    # Source the env file
    export $(cat "$PROJECT_DIR/.env.local" | grep -v '^#' | xargs)
    
    # Check required variables
    MISSING_VARS=()
    
    if [ -z "$TURSO_DATABASE_URL" ]; then
        MISSING_VARS+=("TURSO_DATABASE_URL")
    fi
    
    if [ -z "$TURSO_AUTH_TOKEN" ]; then
        MISSING_VARS+=("TURSO_AUTH_TOKEN")
    fi
    
    if [ -z "$KEEPA_API_KEY" ]; then
        MISSING_VARS+=("KEEPA_API_KEY")
    fi
    
    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        echo "   ⚠️  Missing environment variables:"
        for var in "${MISSING_VARS[@]}"; do
            echo "      - $var"
        done
        echo ""
        echo "   Please add them to .env.local before continuing."
        echo ""
    else
        echo "   ✅ All required environment variables are set"
        echo ""
    fi
else
    echo "   ⚠️  .env.local not found"
    echo "   Please create it with:"
    echo "      TURSO_DATABASE_URL=your_url"
    echo "      TURSO_AUTH_TOKEN=your_token"
    echo "      KEEPA_API_KEY=your_key"
    echo ""
fi

# Step 4: Set up cron job for daily sync
echo "⏰ Setting up daily sync cron job..."
echo ""
echo "   This will add a cron job to sync your database to Turso at 4 AM daily."
echo ""
read -p "   Do you want to set up the cron job? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Check if cron job already exists
    CRON_CMD="0 4 * * * $PROJECT_DIR/scripts/daily-sync-cron.sh"
    
    if crontab -l 2>/dev/null | grep -q "daily-sync-cron.sh"; then
        echo "   ℹ️  Cron job already exists, skipping..."
    else
        # Add cron job
        (crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -
        echo "   ✅ Cron job added successfully!"
        echo ""
        echo "   Your crontab now includes:"
        crontab -l | grep "daily-sync-cron.sh"
    fi
else
    echo "   ⏭️  Skipped cron job setup"
    echo ""
    echo "   To set it up manually later, run:"
    echo "      crontab -e"
    echo "   And add this line:"
    echo "      0 4 * * * $PROJECT_DIR/scripts/daily-sync-cron.sh"
fi
echo ""

# Step 5: Set up optional database backup cron
echo "💾 Setting up daily database backup..."
echo ""
read -p "   Do you want to set up daily database backups at 3 AM? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    BACKUP_CMD="0 3 * * * cp $PROJECT_DIR/data/cleverprices.db $PROJECT_DIR/data/backups/cleverprices-\$(date +\\%Y\\%m\\%d).db"
    
    if crontab -l 2>/dev/null | grep -q "cleverprices-backup"; then
        echo "   ℹ️  Backup cron job already exists, skipping..."
    else
        # Add backup cron job
        (crontab -l 2>/dev/null; echo "# CleverPrices daily backup"; echo "$BACKUP_CMD") | crontab -
        echo "   ✅ Backup cron job added!"
    fi
else
    echo "   ⏭️  Skipped backup setup"
fi
echo ""

# Step 6: Create a launchd plist for auto-starting worker on boot (macOS)
echo "🔄 Setting up worker auto-start on boot..."
echo ""
read -p "   Do you want the worker to start automatically when your Mac boots? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    PLIST_FILE="$HOME/Library/LaunchAgents/com.cleverprices.worker.plist"
    
    cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.cleverprices.worker</string>
    <key>ProgramArguments</key>
    <array>
        <string>$PROJECT_DIR/scripts/start-worker-sync.sh</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$PROJECT_DIR</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$PROJECT_DIR/logs/worker-launchd.log</string>
    <key>StandardErrorPath</key>
    <string>$PROJECT_DIR/logs/worker-launchd-error.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$HOME/.bun/bin</string>
    </dict>
</dict>
</plist>
EOF
    
    # Load the plist
    launchctl unload "$PLIST_FILE" 2>/dev/null || true
    launchctl load "$PLIST_FILE"
    
    echo "   ✅ Worker will now start automatically on boot!"
    echo "   📝 LaunchAgent created at: $PLIST_FILE"
    echo ""
    echo "   To manage the worker:"
    echo "      Stop:  launchctl unload $PLIST_FILE"
    echo "      Start: launchctl load $PLIST_FILE"
else
    echo "   ⏭️  Skipped auto-start setup"
fi
echo ""

# Step 7: Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 What's configured:"
echo ""
echo "   ✅ Directory structure created"
echo "   ✅ Scripts made executable"

if crontab -l 2>/dev/null | grep -q "daily-sync-cron.sh"; then
    echo "   ✅ Daily sync at 4 AM (automated)"
fi

if crontab -l 2>/dev/null | grep -q "cleverprices-backup"; then
    echo "   ✅ Daily backup at 3 AM (automated)"
fi

if [ -f "$HOME/Library/LaunchAgents/com.cleverprices.worker.plist" ]; then
    echo "   ✅ Worker auto-start on boot (enabled)"
fi

echo ""
echo "🎯 Next steps:"
echo ""

if [ -f "$HOME/Library/LaunchAgents/com.cleverprices.worker.plist" ]; then
    echo "   1. Restart your Mac (or start worker manually once)"
    echo "      The worker will start automatically on boot"
else
    echo "   1. Start the worker:"
    echo "      ./scripts/start-worker-sync.sh"
fi

echo ""
echo "   2. Monitor the logs:"
echo "      tail -f logs/worker-\$(date +%Y-%m-%d).log"
echo ""
echo "   3. Everything else is automatic! 🎉"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Documentation:"
echo "   - Full guide: WORKER_GUIDE.md"
echo "   - Quick ref:  QUICK_REFERENCE.md"
echo ""
echo "🆘 Need help? Check the logs in ./logs/"
echo ""
