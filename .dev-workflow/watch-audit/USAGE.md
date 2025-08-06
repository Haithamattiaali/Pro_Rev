# Scope Deviation Watch Audit

## What It Does

The scope deviation monitor watches for when your development work drifts away from the intended session goals. It checks every 10 minutes for:

1. **Session Goal Alignment** - Is current work matching the stated goal?
2. **Recent Activity** - What files have been modified?
3. **Scope Boundaries** - Are you working within defined boundaries?
4. **Epic Alignment** - Does work match the current epic?
5. **Scope Creep Indicators** - New dependencies, directories, unrelated files
6. **TODO List Progress** - Are you completing planned tasks?

## How to Use

### Option 1: Interactive Mode (Foreground)
```bash
./.dev-workflow/watch-audit/scope-deviation-monitor.sh
```
- Shows real-time output
- Press Ctrl+C to stop

### Option 2: Daemon Mode (Background)
```bash
# Start the daemon
./.dev-workflow/watch-audit/scope-daemon.sh start

# Check status
./.dev-workflow/watch-audit/scope-daemon.sh status

# View logs
./.dev-workflow/watch-audit/scope-daemon.sh logs

# Stop the daemon
./.dev-workflow/watch-audit/scope-daemon.sh stop
```

## Current Session Context

Based on your current session:
- **Goal**: Validate ETL process and fix days validation for edge cases
- **Scope**: ETL service, validation, calculations, edge case fixes
- **Boundaries**: Backend only, no frontend, no new features

## Example Output

```
=== SCOPE DEVIATION CHECK ===
1. SESSION SCOPE CHECK:
   Current Session Goal: Validate ETL process and fix days validation

2. RECENT ACTIVITY CHECK:
   Files modified in last 10 minutes:
   ./backend/services/etl.service.js ✅ (aligned with goal)
   ./backend/scripts/test-etl-bypass.js ✅ (aligned with goal)

5. SCOPE CREEP INDICATORS:
   ⚠️  Multiple new directories created: 7
   (This was from creating the watch audit system itself)

=== SUMMARY ===
✅ No scope deviations detected (or warnings if found)
```

## When to Use

- During long development sessions
- When working on complex features
- To maintain focus on current goals
- To prevent scope creep
- For time tracking and productivity

## Integration

The monitor integrates with:
- `.dev-workflow/help-sessions/current-session.json` - Current goals
- `.dev-workflow/scope-guard/` - Scope boundaries
- `.dev-workflow/epics/` - Active epics
- `.dev-workflow/todos/` - Task tracking

## Logs

All checks are logged to:
`.dev-workflow/watch-audit/logs/scope-deviation-TIMESTAMP.log`

Review logs to see patterns of when you tend to drift from scope.