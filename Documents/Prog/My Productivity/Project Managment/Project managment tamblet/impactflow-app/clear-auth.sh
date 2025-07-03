#!/bin/bash

echo "🔄 Clearing authentication cache..."
echo ""
echo "To refresh your admin permissions, run this in your browser console:"
echo ""
echo "localStorage.removeItem('impactflow_auth'); location.reload();"
echo ""
echo "This will trigger auto-login with updated permissions."
echo ""
echo "Alternative: Open DevTools > Application > Local Storage > Clear 'impactflow_auth'"