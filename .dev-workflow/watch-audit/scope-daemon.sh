#!/bin/bash

# Scope Deviation Daemon
# Runs in background and monitors for scope deviations

DAEMON_NAME="scope-deviation-daemon"
PID_FILE=".dev-workflow/watch-audit/state/daemon.pid"
LOG_FILE=".dev-workflow/watch-audit/logs/daemon.log"
MONITOR_SCRIPT=".dev-workflow/watch-audit/scope-deviation-monitor.sh"

# Ensure directories exist
mkdir -p "$(dirname "$PID_FILE")"
mkdir -p "$(dirname "$LOG_FILE")"

case "$1" in
    start)
        if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
            echo "❌ Daemon is already running (PID: $(cat $PID_FILE))"
            exit 1
        fi
        
        echo "🚀 Starting $DAEMON_NAME..."
        
        # Start the monitor in background
        nohup "$MONITOR_SCRIPT" >> "$LOG_FILE" 2>&1 &
        PID=$!
        echo $PID > "$PID_FILE"
        
        echo "✅ Daemon started (PID: $PID)"
        echo "📁 Logs: $LOG_FILE"
        echo ""
        echo "Use './scope-daemon.sh status' to check status"
        echo "Use './scope-daemon.sh stop' to stop monitoring"
        ;;
        
    stop)
        if [ ! -f "$PID_FILE" ]; then
            echo "❌ Daemon is not running"
            exit 1
        fi
        
        PID=$(cat "$PID_FILE")
        if kill -0 $PID 2>/dev/null; then
            echo "🛑 Stopping $DAEMON_NAME (PID: $PID)..."
            kill $PID
            rm -f "$PID_FILE"
            echo "✅ Daemon stopped"
        else
            echo "⚠️  Daemon not found, cleaning up PID file"
            rm -f "$PID_FILE"
        fi
        ;;
        
    status)
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            if kill -0 $PID 2>/dev/null; then
                echo "✅ Daemon is running (PID: $PID)"
                echo ""
                # Show last few lines of log
                echo "Recent activity:"
                tail -5 "$LOG_FILE"
            else
                echo "❌ Daemon is not running (stale PID file)"
                rm -f "$PID_FILE"
            fi
        else
            echo "❌ Daemon is not running"
        fi
        ;;
        
    restart)
        $0 stop
        sleep 2
        $0 start
        ;;
        
    logs)
        if [ -f "$LOG_FILE" ]; then
            tail -f "$LOG_FILE"
        else
            echo "No logs found"
        fi
        ;;
        
    *)
        echo "Usage: $0 {start|stop|status|restart|logs}"
        echo ""
        echo "  start   - Start the scope deviation monitor daemon"
        echo "  stop    - Stop the daemon"
        echo "  status  - Check if daemon is running"
        echo "  restart - Restart the daemon"
        echo "  logs    - Follow the daemon logs"
        exit 1
        ;;
esac