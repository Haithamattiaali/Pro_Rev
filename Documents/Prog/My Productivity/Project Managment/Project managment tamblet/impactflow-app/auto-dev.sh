#!/bin/bash

# Auto Development Script - Runs in background and restarts on file changes
cd "$(dirname "$0")"

echo "🚀 ImpactFlow Pro - Auto Development Mode"
echo "==========================================="
echo ""
echo "The server will automatically restart when you make changes to:"
echo "  - TypeScript/JavaScript files (*.ts, *.tsx, *.js, *.jsx)"
echo "  - CSS files (*.css)"
echo "  - JSON files (*.json)"
echo ""
echo "Server running at: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Kill any existing processes on port 3001
lsof -ti:3001 | xargs kill -9 2>/dev/null

# Start the development server with auto-restart
npm run dev:watch