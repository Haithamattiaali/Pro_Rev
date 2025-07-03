#!/bin/bash

echo "🔐 Admin Auto-Login Setup Verification"
echo "====================================="
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "✅ .env.local file exists"
    echo ""
    echo "Current settings:"
    grep "NEXT_PUBLIC_AUTO_LOGIN" .env.local
    echo ""
else
    echo "❌ .env.local file not found"
fi

# Check if dev server is running
if lsof -i:3001 > /dev/null 2>&1; then
    echo "✅ Dev server is running on http://localhost:3001"
else
    echo "⚠️  Dev server is not running. Start it with: npm run dev:watch"
fi

echo ""
echo "📋 Quick Test Checklist:"
echo "1. Open http://localhost:3001 in your browser"
echo "2. You should see a yellow banner showing 'Admin User (Admin)'"
echo "3. Navigate to http://localhost:3001/admin/users"
echo "4. All admin features should be accessible"
echo ""
echo "🔑 Admin Features Available:"
echo "- User Management (/admin/users)"
echo "- Full project access"
echo "- All permissions enabled"
echo "- No lock icons on buttons"
echo ""
echo "To disable auto-login, set NEXT_PUBLIC_AUTO_LOGIN=false in .env.local"