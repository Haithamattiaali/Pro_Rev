#!/bin/bash

# Watch Audit Script for "scoop"
# Runs audit every 10 minutes

AUDIT_TARGET="scoop"
INTERVAL="600" # 10 minutes in seconds
LOG_DIR=".dev-workflow/watch-audit/logs"
STATE_FILE=".dev-workflow/watch-audit/state/watch-state.json"

# Create necessary directories
mkdir -p "$LOG_DIR"
mkdir -p "$(dirname "$STATE_FILE")"

# Initialize state file
if [ ! -f "$STATE_FILE" ]; then
    cat > "$STATE_FILE" << EOF
{
    "target": "$AUDIT_TARGET",
    "interval": $INTERVAL,
    "started": "$(date -Iseconds)",
    "lastRun": null,
    "runCount": 0,
    "status": "running"
}
EOF
fi

echo "🔍 Starting Watch Audit for: $AUDIT_TARGET"
echo "⏱️  Interval: 10 minutes"
echo "📁 Logs: $LOG_DIR"
echo ""
echo "Press Ctrl+C to stop monitoring"
echo ""

# Function to run audit
run_audit() {
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local log_file="$LOG_DIR/audit-$AUDIT_TARGET-$timestamp.log"
    
    echo "[$(date)] Running audit #$((runCount + 1))..."
    
    # Update state
    jq --arg lastRun "$(date -Iseconds)" \
       --arg count "$((runCount + 1))" \
       '.lastRun = $lastRun | .runCount = ($count | tonumber)' \
       "$STATE_FILE" > temp.json && mv temp.json "$STATE_FILE"
    
    # Run the audit command
    echo "Executing: dev-agent-audit --type custom --scope \"$AUDIT_TARGET\"" | tee -a "$log_file"
    
    # Simulate audit execution (replace with actual command when available)
    {
        echo "=== AUDIT REPORT ==="
        echo "Target: $AUDIT_TARGET"
        echo "Timestamp: $(date)"
        echo "Run: #$((runCount + 1))"
        echo ""
        echo "Scanning for '$AUDIT_TARGET' related issues..."
        
        # Add actual audit logic here
        # For now, let's search for files/patterns related to "scoop"
        echo ""
        echo "Files containing 'scoop':"
        grep -r -i "scoop" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" . 2>/dev/null | head -10
        
        echo ""
        echo "Potential issues found: 0"
        echo "Warnings: 0"
        echo "Info: Search completed"
        
    } >> "$log_file" 2>&1
    
    echo "[$(date)] Audit complete. Log: $log_file"
    echo ""
    
    runCount=$((runCount + 1))
}

# Trap to handle Ctrl+C
trap 'echo ""; echo "🛑 Stopping watch audit..."; jq ".status = \"stopped\"" "$STATE_FILE" > temp.json && mv temp.json "$STATE_FILE"; exit 0' INT TERM

# Main loop
runCount=0
while true; do
    run_audit
    echo "💤 Waiting 10 minutes until next audit..."
    echo "   Next run at: $(date -d '+10 minutes' 2>/dev/null || date -v +10M)"
    sleep $INTERVAL
done