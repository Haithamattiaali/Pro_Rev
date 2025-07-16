#!/bin/bash

# Quick deployment script - minimal interaction required

echo "🚀 Quick Deploy - Proceed Revenue Dashboard"
echo "=========================================="

# Push to GitHub (triggers Render auto-deploy)
echo "📤 Pushing to GitHub..."
git push origin master || { echo "❌ Git push failed"; exit 1; }

# Build frontend
echo "🔨 Building frontend..."
npm run build || { echo "❌ Build failed"; exit 1; }

# Deploy to Netlify
echo "☁️  Deploying to Netlify..."
netlify deploy --prod --dir=dist || { echo "❌ Netlify deploy failed"; exit 1; }

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "📋 Verify deployment:"
echo "   Frontend: Check Netlify URL above"
echo "   Backend:  https://proceed-revenue-backend.onrender.com"
echo ""
echo "🔍 Test endpoints:"
echo "   curl https://proceed-revenue-backend.onrender.com/api/health"