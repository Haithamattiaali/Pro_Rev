#!/bin/bash

# Scope Deviation Monitor
# Watches for deviations from session scope every 10 minutes

INTERVAL="600" # 10 minutes in seconds
LOG_DIR=".dev-workflow/watch-audit/logs"
STATE_FILE=".dev-workflow/watch-audit/state/scope-deviation-state.json"
SCOPE_FILE=".dev-workflow/scope-guard/definitions/SCOPE.md"
SESSION_FILE=".dev-workflow/help-sessions/current-session.json"

# Create necessary directories
mkdir -p "$LOG_DIR"
mkdir -p "$(dirname "$STATE_FILE")"

# Initialize state file
if [ ! -f "$STATE_FILE" ]; then
    cat > "$STATE_FILE" << EOF
{
    "monitor": "scope-deviation",
    "interval": $INTERVAL,
    "started": "$(date -Iseconds)",
    "lastCheck": null,
    "checkCount": 0,
    "deviationsFound": 0,
    "status": "running"
}
EOF
fi

echo "🎯 Starting Scope Deviation Monitor"
echo "⏱️  Check Interval: 10 minutes"
echo "📁 Logs: $LOG_DIR"
echo ""
echo "Monitoring for deviations from:"
echo "  - Session goals"
echo "  - Project scope boundaries"
echo "  - Current epic objectives"
echo ""
echo "Press Ctrl+C to stop monitoring"
echo ""

# Function to check for scope deviations
check_scope_deviation() {
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local log_file="$LOG_DIR/scope-deviation-$timestamp.log"
    local deviations=0
    
    echo "[$(date)] Running scope check #$((checkCount + 1))..."
    
    {
        echo "=== SCOPE DEVIATION CHECK ==="
        echo "Timestamp: $(date)"
        echo "Check #$((checkCount + 1))"
        echo ""
        
        # 1. Check current work against session goals
        echo "1. SESSION SCOPE CHECK:"
        if [ -f "$SESSION_FILE" ]; then
            SESSION_GOAL=$(jq -r '.goal // "Not defined"' "$SESSION_FILE" 2>/dev/null)
            echo "   Current Session Goal: $SESSION_GOAL"
        else
            echo "   ⚠️  No active session found"
        fi
        
        # 2. Check recent file modifications
        echo ""
        echo "2. RECENT ACTIVITY CHECK:"
        echo "   Files modified in last 10 minutes:"
        find . -type f -mmin -10 -not -path "./.git/*" -not -path "./node_modules/*" | head -10
        
        # 3. Check for out-of-scope patterns
        echo ""
        echo "3. SCOPE BOUNDARY CHECK:"
        
        # Check if working on files outside defined scope
        if [ -f "$SCOPE_FILE" ]; then
            echo "   Checking against defined scope boundaries..."
            # Extract scope boundaries from SCOPE.md
            grep -E "^- " "$SCOPE_FILE" 2>/dev/null | head -5
        fi
        
        # 4. Check current epic/task alignment
        echo ""
        echo "4. EPIC ALIGNMENT CHECK:"
        CURRENT_EPIC=$(ls -t .dev-workflow/epics/ 2>/dev/null | grep -E "^(enhance|bugfix|refactor)" | head -1)
        if [ -n "$CURRENT_EPIC" ]; then
            echo "   Current Epic: $CURRENT_EPIC"
            if [ -f ".dev-workflow/epics/$CURRENT_EPIC/epic.json" ]; then
                EPIC_GOAL=$(jq -r '.description // .goal // "Not defined"' ".dev-workflow/epics/$CURRENT_EPIC/epic.json" 2>/dev/null)
                echo "   Epic Goal: $EPIC_GOAL"
            fi
        else
            echo "   No active epic found"
        fi
        
        # 5. Check for potential scope creep indicators
        echo ""
        echo "5. SCOPE CREEP INDICATORS:"
        
        # New dependencies added?
        if [ -f "package.json" ]; then
            NEW_DEPS=$(git diff HEAD~1 package.json 2>/dev/null | grep "^+" | grep -v "^+++" | wc -l)
            if [ "$NEW_DEPS" -gt 0 ]; then
                echo "   ⚠️  New dependencies detected: $NEW_DEPS"
                ((deviations++))
            fi
        fi
        
        # New directories created?
        NEW_DIRS=$(find . -type d -mmin -10 -not -path "./.git/*" -not -path "./node_modules/*" | wc -l)
        if [ "$NEW_DIRS" -gt 2 ]; then
            echo "   ⚠️  Multiple new directories created: $NEW_DIRS"
            ((deviations++))
        fi
        
        # Working on unrelated files?
        UNRELATED_FILES=$(find . -name "*.md" -mmin -10 -not -path "./.dev-workflow/*" | wc -l)
        if [ "$UNRELATED_FILES" -gt 3 ]; then
            echo "   ⚠️  Multiple documentation files modified: $UNRELATED_FILES"
            ((deviations++))
        fi
        
        echo ""
        echo "6. TODO LIST ALIGNMENT:"
        if [ -f ".dev-workflow/todos/current-todos.json" ]; then
            PENDING_TODOS=$(jq '[.[] | select(.status == "pending")] | length' .dev-workflow/todos/current-todos.json 2>/dev/null || echo "0")
            IN_PROGRESS=$(jq '[.[] | select(.status == "in_progress")] | length' .dev-workflow/todos/current-todos.json 2>/dev/null || echo "0")
            echo "   Pending TODOs: $PENDING_TODOS"
            echo "   In Progress: $IN_PROGRESS"
        fi
        
        echo ""
        echo "=== SUMMARY ==="
        if [ "$deviations" -eq 0 ]; then
            echo "✅ No scope deviations detected"
        else
            echo "⚠️  Potential deviations found: $deviations"
            echo ""
            echo "RECOMMENDATIONS:"
            echo "1. Review current work against session goals"
            echo "2. Check if new work aligns with project scope"
            echo "3. Consider updating scope if expansion is necessary"
            echo "4. Use 'dev-agent-scope-guard check' for detailed analysis"
        fi
        
    } | tee "$log_file"
    
    # Update state
    jq --arg lastCheck "$(date -Iseconds)" \
       --arg count "$((checkCount + 1))" \
       --arg devs "$(($(jq -r '.deviationsFound' "$STATE_FILE") + deviations))" \
       '.lastCheck = $lastCheck | .checkCount = ($count | tonumber) | .deviationsFound = ($devs | tonumber)' \
       "$STATE_FILE" > temp.json && mv temp.json "$STATE_FILE"
    
    echo ""
    checkCount=$((checkCount + 1))
}

# Trap to handle Ctrl+C
trap 'echo ""; echo "🛑 Stopping scope deviation monitor..."; jq ".status = \"stopped\"" "$STATE_FILE" > temp.json && mv temp.json "$STATE_FILE"; exit 0' INT TERM

# Main loop
checkCount=0
while true; do
    check_scope_deviation
    echo "💤 Waiting 10 minutes until next check..."
    echo "   Next check at: $(date -d '+10 minutes' 2>/dev/null || date -v +10M)"
    echo "   Press Ctrl+C to stop"
    echo ""
    sleep $INTERVAL
done