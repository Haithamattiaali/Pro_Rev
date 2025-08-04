#!/bin/bash

# Netlify Direct CLI Deployment Script
# This deploys directly to production without using GitHub

set -e  # Exit on error

echo "🚀 Netlify CLI Direct Deployment"
echo "================================"
echo "Site: proceed-revenue-dashboard-1750804938"
echo "URL: https://proceed-revenue-dashboard-1750804938.netlify.app"
echo ""

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found!"
    echo "Please install it with: npm install -g netlify-cli"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Not in project root directory!"
    echo "Please run from: /Users/haithamdata/Documents/Prog/PROCEED/Pro Rev/proceed-dashboard"
    exit 1
fi

# Build the project
echo "📦 Building project..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Deploy to Netlify
echo "🌐 Deploying to Netlify production..."
netlify deploy --prod \
    --dir=dist \
    --site=proceed-revenue-dashboard-1750804938 \
    --message="Direct CLI deployment - $(date +%Y-%m-%d\ %H:%M)"

echo ""
echo "✅ Deployment complete!"
echo "🔗 Live URL: https://proceed-revenue-dashboard-1750804938.netlify.app"
echo ""

# Show deployment info
echo "📊 Deployment Details:"
netlify status --site=proceed-revenue-dashboard-1750804938

echo ""
echo "🎉 Success! Your changes are now live in production."