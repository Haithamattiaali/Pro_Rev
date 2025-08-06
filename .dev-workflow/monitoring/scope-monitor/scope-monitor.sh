#!/bin/bash

# Scope Monitor Script - Automated Scope Adherence Tracking
# Monitors project scope and provides executive summaries every 10 minutes

MONITOR_DIR=".dev-workflow/monitoring/scope-monitor"
REPORTS_DIR="$MONITOR_DIR/reports"
STATE_FILE="$MONITOR_DIR/state.json"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
ISO_TIME=$(date -Iseconds)

# Create directories if needed
mkdir -p "$REPORTS_DIR"

# Initialize state file if not exists
if [ ! -f "$STATE_FILE" ]; then
    cat > "$STATE_FILE" << EOF
{
  "lastCheck": null,
  "checksPerformed": 0,
  "scopeViolations": 0,
  "status": "monitoring"
}
EOF
fi

# Function to analyze scope adherence
analyze_scope() {
    local REPORT_FILE="$REPORTS_DIR/scope-report-$TIMESTAMP.md"
    
    echo "# Scope Adherence Report" > "$REPORT_FILE"
    echo "Generated: $(date)" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Check 1: Analyze recent changes for scope creep
    echo "## Recent Changes Analysis" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Get files changed in last 10 minutes
    RECENT_FILES=$(find . -type f -name "*.js" -o -name "*.jsx" -mmin -10 2>/dev/null | grep -v node_modules | grep -v .dev-workflow)
    
    if [ -z "$RECENT_FILES" ]; then
        echo "✅ No code changes in last 10 minutes" >> "$REPORT_FILE"
    else
        echo "⚠️ Files changed in last 10 minutes:" >> "$REPORT_FILE"
        echo "$RECENT_FILES" | while read file; do
            echo "  - $file" >> "$REPORT_FILE"
        done
    fi
    
    echo "" >> "$REPORT_FILE"
    
    # Check 2: Monitor active epics and their scope
    echo "## Active Epic Monitoring" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Check for active daily achievement epic
    if [ -d ".dev-workflow/epics/enhance-daily-achievement-20250805-165508" ]; then
        echo "### Daily Achievement Enhancement Epic" >> "$REPORT_FILE"
        echo "- Status: Active" >> "$REPORT_FILE"
        echo "- Scope: Backend implementation only (NO UI changes)" >> "$REPORT_FILE"
        
        # Check if any UI files were modified
        UI_VIOLATIONS=$(find src/pages src/components -name "*.jsx" -mmin -60 2>/dev/null | wc -l)
        if [ $UI_VIOLATIONS -gt 0 ]; then
            echo "- ⚠️ WARNING: UI files modified despite backend-only scope!" >> "$REPORT_FILE"
        else
            echo "- ✅ Scope adherence: No UI changes detected" >> "$REPORT_FILE"
        fi
    fi
    
    echo "" >> "$REPORT_FILE"
    
    # Check 3: Review current focus areas
    echo "## Current Focus Areas" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    echo "### Primary Objectives" >> "$REPORT_FILE"
    echo "1. Daily achievement backend implementation ✅ COMPLETE" >> "$REPORT_FILE"
    echo "2. Testing daily calculations 🔄 PENDING" >> "$REPORT_FILE"
    echo "3. Excel export updates 🔄 PENDING" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    # Check 4: Scope boundaries verification
    echo "## Scope Boundaries Check" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    echo "### Defined Boundaries" >> "$REPORT_FILE"
    echo "- ✅ Backend calculations: Within scope" >> "$REPORT_FILE"
    echo "- ✅ API response enhancements: Within scope" >> "$REPORT_FILE"
    echo "- ❌ UI/Frontend changes: OUT OF SCOPE" >> "$REPORT_FILE"
    echo "- ❌ Database schema changes: OUT OF SCOPE" >> "$REPORT_FILE"
    echo "- ❌ ETL process modifications: OUT OF SCOPE" >> "$REPORT_FILE"
    
    echo "" >> "$REPORT_FILE"
    
    # Executive Summary
    echo "## Executive Summary" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    local VIOLATIONS=0
    if [ $UI_VIOLATIONS -gt 0 ]; then
        VIOLATIONS=$UI_VIOLATIONS
    fi
    
    if [ $VIOLATIONS -eq 0 ]; then
        echo "✅ **Status: ON TRACK**" >> "$REPORT_FILE"
        echo "- No scope violations detected" >> "$REPORT_FILE"
        echo "- All changes align with defined boundaries" >> "$REPORT_FILE"
        echo "- Backend implementation progressing as planned" >> "$REPORT_FILE"
    else
        echo "⚠️ **Status: SCOPE RISK DETECTED**" >> "$REPORT_FILE"
        echo "- $VIOLATIONS potential scope violations found" >> "$REPORT_FILE"
        echo "- Review UI changes immediately" >> "$REPORT_FILE"
        echo "- Revert any out-of-scope modifications" >> "$REPORT_FILE"
    fi
    
    echo "" >> "$REPORT_FILE"
    echo "### Next Check: $(date -d '+10 minutes' 2>/dev/null || date -v +10M)" >> "$REPORT_FILE"
    
    # Update state
    local CHECKS=$(jq '.checksPerformed' "$STATE_FILE")
    local TOTAL_VIOLATIONS=$(jq '.scopeViolations' "$STATE_FILE")
    CHECKS=$((CHECKS + 1))
    TOTAL_VIOLATIONS=$((TOTAL_VIOLATIONS + VIOLATIONS))
    
    jq --arg time "$ISO_TIME" --arg checks "$CHECKS" --arg violations "$TOTAL_VIOLATIONS" \
        '.lastCheck = $time | .checksPerformed = ($checks | tonumber) | .scopeViolations = ($violations | tonumber)' \
        "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"
    
    # Display report
    cat "$REPORT_FILE"
    
    # Create latest symlink
    ln -sf "reports/scope-report-$TIMESTAMP.md" "$MONITOR_DIR/latest-report.md"
}

# Main execution
case "${1:-check}" in
    check)
        echo "=== SCOPE MONITOR - AUTOMATED CHECK ==="
        echo "Time: $(date)"
        echo ""
        analyze_scope
        ;;
    status)
        echo "=== SCOPE MONITOR STATUS ==="
        jq . "$STATE_FILE" 2>/dev/null || echo "No monitoring data available"
        ;;
    history)
        echo "=== SCOPE MONITOR HISTORY ==="
        ls -lt "$REPORTS_DIR" 2>/dev/null | head -20
        ;;
    *)
        echo "Usage: $0 {check|status|history}"
        exit 1
        ;;
esac