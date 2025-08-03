# Session Design Specification

## Directory Structure
.dev-workflow/logging/sessions/20250731-140549-99761/
├── session.json          # Session metadata
├── logging-config.md     # Configuration details
├── integration-requirements.md
├── session-design.md
├── logs/                 # All log files
│   ├── main.log         # Main session log
│   ├── commands/        # Per-command logs
│   └── errors.log       # Error aggregation
└── state/               # Session state tracking

## Log Format
- Timestamp: ISO 8601
- Level: DEBUG|INFO|WARN|ERROR
- Component: Command name or system
- Message: Log content

## Session Lifecycle
1. Initialization (current)
2. Active (logging enabled)
3. Completed (graceful end)
4. Abandoned (timeout/error)
