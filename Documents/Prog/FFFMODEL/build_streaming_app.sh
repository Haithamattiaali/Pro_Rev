#!/bin/bash

# Build and Run Complete Streaming App
# Demonstrates Foundation Models streaming patterns

echo "🚀 Building Complete AI Streaming App..."
echo "======================================="

# Navigate to the streaming app directory
cd "$(dirname "$0")/CompleteStreamingApp"

# Check if we're in the right directory
if [ ! -f "Package.swift" ]; then
    echo "❌ Error: Package.swift not found. Make sure you're in the correct directory."
    exit 1
fi

echo "📦 Resolving Swift package dependencies..."
swift package resolve

echo "🔨 Building the streaming app..."
swift build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🎭 Starting AI Story Generator with streaming patterns..."
    echo "Features demonstrated:"
    echo "  • Foundation Models @Generable schemas"
    echo "  • Progressive UI updates with animations"
    echo "  • Streaming snapshots (not deltas)"
    echo "  • Reactive SwiftUI components"
    echo "  • Character network visualization"
    echo "  • Story timeline and emotional arcs"
    echo ""
    echo "Press Ctrl+C to stop the app"
    echo "======================================="
    
    # Run the app
    swift run CompleteStreamingApp
else
    echo "❌ Build failed. Please check the error messages above."
    exit 1
fi