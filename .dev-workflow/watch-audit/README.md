# Watch Audit System

## Overview
The watch audit system continuously monitors your codebase for specific patterns or issues at regular intervals.

## Current Configuration

### Active Watch: "scoop"
- **Interval**: Every 10 minutes
- **Type**: Custom audit
- **Scope**: Monitoring for scoop-related patterns and issues

## Usage

### Start Watch Audit
```bash
./.dev-workflow/watch-audit/watch-audit-scoop.sh
```

### View Logs
```bash
ls -la .dev-workflow/watch-audit/logs/
cat .dev-workflow/watch-audit/logs/audit-scoop-*.log
```

### Check Status
```bash
cat .dev-workflow/watch-audit/state/watch-state.json | jq
```

### Stop Watch Audit
Press `Ctrl+C` in the terminal running the watch script.

## Configuration

Edit `watch-config.json` to:
- Change interval (in seconds)
- Add patterns to search for
- Modify directories to scan
- Adjust audit parameters

## Log Files

Logs are stored in `.dev-workflow/watch-audit/logs/` with timestamps:
- `audit-scoop-20250805-183000.log`
- `audit-scoop-20250805-184000.log`
- etc.

## What It Monitors

The "scoop" audit looks for:
1. Files containing "scoop" patterns
2. Scope-related function calls
3. Potential scope management issues
4. Dependencies using scope patterns

## Integration with dev-agent

This watch audit can be integrated with:
- `dev-agent-audit` for detailed analysis
- `dev-agent-bugfix` to fix found issues
- `dev-agent-report` to generate summaries