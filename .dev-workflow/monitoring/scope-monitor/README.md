# Scope Monitor - Automated Scope Adherence Tracking

This monitoring system helps track project scope adherence and provides executive summaries every 10 minutes as requested.

## Quick Start

### Option 1: Automated Monitoring (Recommended)
```bash
# Run the setup script
./setup-monitoring.sh

# Choose option:
# 1 - Cron (Linux/Unix)
# 2 - LaunchAgent (macOS)
# 3 - Manual loop
# 4 - Show commands
```

### Option 2: Manual Checks
```bash
# Single check
./scope-monitor.sh check

# View status
./scope-monitor.sh status

# View history
./scope-monitor.sh history

# View latest report
cat latest-report.md
```

### Option 3: Background Loop
```bash
# Start in background
while true; do ./scope-monitor.sh check; sleep 600; done &

# Stop background process
# Find process: ps aux | grep scope-monitor
# Kill process: kill [PID]
```

## What It Monitors

1. **Recent Changes**: Files modified in last 10 minutes
2. **Active Epics**: Current development focus and scope adherence
3. **Scope Boundaries**: Validates changes against defined boundaries
4. **UI Violations**: Detects any UI changes when backend-only scope is active

## Report Structure

Each report includes:
- Recent changes analysis
- Active epic monitoring
- Current focus areas
- Scope boundaries verification
- Executive summary with status (ON TRACK / SCOPE RISK)

## File Locations

- **Monitor Script**: `scope-monitor.sh`
- **Setup Script**: `setup-monitoring.sh`
- **Reports**: `reports/scope-report-[timestamp].md`
- **Latest Report**: `latest-report.md`
- **State File**: `state.json`
- **Logs**: `monitor.log`

## Stopping Monitoring

### If using cron:
```bash
# View current cron jobs
crontab -l

# Remove scope monitor job
crontab -l | grep -v scope-monitor.sh | crontab -
```

### If using LaunchAgent (macOS):
```bash
launchctl unload ~/Library/LaunchAgents/com.proceed.scopemonitor.plist
rm ~/Library/LaunchAgents/com.proceed.scopemonitor.plist
```

### If using manual loop:
Press Ctrl+C in the terminal where it's running

## Customization

Edit `scope-monitor.sh` to:
- Change monitoring frequency (default: 10 minutes)
- Add custom scope checks
- Modify report format
- Add email notifications

## Integration with Dev-Agent

This monitoring system is designed to work alongside the dev-agent workflow:
- Monitors epic boundaries defined in `.dev-workflow/epics/`
- Tracks adherence to scope defined in epic requirements
- Provides executive summaries suitable for stakeholders

## Troubleshooting

1. **Permission Denied**: Run `chmod +x *.sh` on the scripts
2. **Command Not Found**: Use full path to scripts or add to PATH
3. **No Reports Generated**: Check `monitor.log` for errors
4. **Cron Not Working**: Ensure cron service is running (`service cron status`)

---

Created as part of the daily achievement enhancement epic to ensure scope adherence.
Last updated: August 5, 2025