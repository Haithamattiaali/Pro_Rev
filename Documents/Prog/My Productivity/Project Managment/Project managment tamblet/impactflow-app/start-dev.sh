#!/bin/bash

# Start Development Server with Auto-Restart
echo "🚀 Starting ImpactFlow Pro Development Server..."
echo "📁 Project: $(pwd)"
echo "🔄 Auto-restart enabled with nodemon"
echo ""
echo "Available options:"
echo "  1) Next.js only (with auto-restart)"
echo "  2) Next.js + Socket.io (with auto-restart)"
echo "  3) Next.js only (standard)"
echo "  4) Exit"
echo ""
read -p "Select option (1-4): " option

case $option in
  1)
    echo "Starting Next.js with auto-restart..."
    npm run dev:watch
    ;;
  2)
    echo "Starting Next.js + Socket.io with auto-restart..."
    npm run dev:all
    ;;
  3)
    echo "Starting standard Next.js..."
    npm run dev
    ;;
  4)
    echo "Exiting..."
    exit 0
    ;;
  *)
    echo "Invalid option. Starting default (Next.js with auto-restart)..."
    npm run dev:watch
    ;;
esac