#!/bin/bash

# Setup script for automated scope monitoring every 10 minutes

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../../../" && pwd)"
MONITOR_SCRIPT="$SCRIPT_DIR/scope-monitor.sh"

echo "=== SCOPE MONITOR SETUP ==="
echo ""
echo "This will set up automated scope monitoring every 10 minutes."
echo "Project directory: $PROJECT_DIR"
echo ""

# Function to add cron job
setup_cron() {
    local CRON_CMD="*/10 * * * * cd '$PROJECT_DIR' && '$MONITOR_SCRIPT' check >> '$SCRIPT_DIR/monitor.log' 2>&1"
    
    # Check if cron job already exists
    if crontab -l 2>/dev/null | grep -q "scope-monitor.sh"; then
        echo "⚠️  Cron job already exists for scope monitoring"
        echo "To view: crontab -l"
        echo "To remove: crontab -l | grep -v scope-monitor.sh | crontab -"
    else
        # Add to crontab
        (crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -
        echo "✅ Cron job added successfully!"
        echo "Monitoring will run every 10 minutes."
    fi
}

# Function to use launchd on macOS
setup_launchd() {
    local PLIST_FILE="$HOME/Library/LaunchAgents/com.proceed.scopemonitor.plist"
    
    cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.proceed.scopemonitor</string>
    <key>ProgramArguments</key>
    <array>
        <string>$MONITOR_SCRIPT</string>
        <string>check</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$PROJECT_DIR</string>
    <key>StartInterval</key>
    <integer>600</integer>
    <key>StandardOutPath</key>
    <string>$SCRIPT_DIR/monitor.log</string>
    <key>StandardErrorPath</key>
    <string>$SCRIPT_DIR/monitor-error.log</string>
</dict>
</plist>
EOF
    
    launchctl load "$PLIST_FILE" 2>/dev/null
    echo "✅ LaunchAgent created and loaded!"
    echo "To stop: launchctl unload $PLIST_FILE"
}

# Function for manual monitoring loop
manual_monitor() {
    echo "Starting manual monitoring loop (Ctrl+C to stop)..."
    echo ""
    
    while true; do
        cd "$PROJECT_DIR"
        "$MONITOR_SCRIPT" check
        echo ""
        echo "=== Waiting 10 minutes until next check... ==="
        sleep 600
    done
}

# Menu options
echo "Choose monitoring setup method:"
echo "1. Cron (Unix/Linux standard)"
echo "2. LaunchAgent (macOS recommended)"
echo "3. Manual loop (run in terminal)"
echo "4. Show monitoring commands (DIY)"
echo ""
read -p "Select option (1-4): " choice

case $choice in
    1)
        setup_cron
        ;;
    2)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            setup_launchd
        else
            echo "LaunchAgent is only available on macOS. Using cron instead."
            setup_cron
        fi
        ;;
    3)
        manual_monitor
        ;;
    4)
        echo ""
        echo "=== Manual Monitoring Commands ==="
        echo ""
        echo "Single check:"
        echo "  cd '$PROJECT_DIR' && '$MONITOR_SCRIPT' check"
        echo ""
        echo "View status:"
        echo "  cd '$PROJECT_DIR' && '$MONITOR_SCRIPT' status"
        echo ""
        echo "View history:"
        echo "  cd '$PROJECT_DIR' && '$MONITOR_SCRIPT' history"
        echo ""
        echo "Watch mode (updates every 10 min):"
        echo "  watch -n 600 \"cd '$PROJECT_DIR' && '$MONITOR_SCRIPT' check\""
        echo ""
        echo "Background loop:"
        echo "  while true; do cd '$PROJECT_DIR' && '$MONITOR_SCRIPT' check; sleep 600; done &"
        ;;
    *)
        echo "Invalid option"
        exit 1
        ;;
esac

echo ""
echo "=== MONITORING COMMANDS ==="
echo "Check now:     $MONITOR_SCRIPT check"
echo "View status:   $MONITOR_SCRIPT status"  
echo "View history:  $MONITOR_SCRIPT history"
echo "Latest report: cat $SCRIPT_DIR/latest-report.md"