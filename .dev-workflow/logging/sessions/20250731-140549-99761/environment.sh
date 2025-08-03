#!/bin/bash
# Dev-Agent Logging Environment
# Source this file to enable logging in your session

export DEV_AGENT_SESSION_ID="20250731-140549-99761"
export DEV_AGENT_PROJECT="proceed-dashboard"
export DEV_AGENT_LOG_LEVEL="info"
export DEV_AGENT_LOG_DIR=".dev-workflow/logging/sessions/20250731-140549-99761/logs"
export DEV_AGENT_SESSION_START="2025-07-31T14:06:50+03:00"
export DEV_AGENT_SESSION_DIR=".dev-workflow/logging/sessions/20250731-140549-99761"

# Auto-source logging library if available
if [ -f ".claude/commands/dev-agent-logging-lib.sh" ]; then
    source ".claude/commands/dev-agent-logging-lib.sh"
fi

echo "[LOG-START] Logging environment loaded for session: 20250731-140549-99761"
